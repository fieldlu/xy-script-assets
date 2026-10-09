#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
xy-convert-server.py — 小雅辅助工具·本机文档转换服务
====================================================

用途
----
为浏览器用户脚本「小雅辅助工具」的下载区「转 PDF 打包」功能提供
Office→PDF 转换能力。服务只监听 127.0.0.1，不暴露公网。

转换引擎（自动选择，均无需注册表操作）
------------------------------------
1. LibreOffice headless（soffice）——若已安装，优先使用，全格式通吃
2. MS Office COM 自动化（Word / PowerPoint / Excel）——机器装有 Office 时
   按扩展名分发（通过 PowerShell 调用，输出矢量 PDF）

接口
----
GET  /health                  → {"status":"ok","soffice":"...","com":{"word":true,...}}
POST /office2pdf?name=a.docx  → body 为文件原始字节，返回 PDF 字节流
                                失败返回 4xx/5xx + JSON 错误说明

依赖
----
- Python 3.8+
- LibreOffice 与 MS Office 至少其一（都没有则 /office2pdf 返回 503）

启动
----
    python xy-convert-server.py            # 默认端口 18790
    python xy-convert-server.py --port 18800
    python xy-convert-server.py --soffice "C:\\Program Files\\LibreOffice\\program\\soffice.exe"

Windows 开机自启（可选）
------------------------
    schtasks /Create /TN XyConvertServer /SC ONLOGON /TR "python C:\\path\\to\\xy-convert-server.py" /F
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, unquote

HOST = "127.0.0.1"
PORT = 18790
MAX_BODY = 200 * 1024 * 1024          # 单文件上限 200MB
CONVERT_TIMEOUT = 150                  # 单文件转换超时（秒）
LOCK = threading.Lock()                # 转换引擎串行化（soffice/COM 均不宜并发）

# soffice 常见安装位置
_SOFFICE_CANDIDATES = [
    r"C:\Program Files\LibreOffice\program\soffice.exe",
    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    os.path.expanduser(r"~\AppData\Local\Programs\LibreOffice\program\soffice.exe"),
    "/usr/bin/soffice",
    "/usr/local/bin/soffice",
    "/opt/libreoffice/program/soffice",
]

# 引擎-扩展名映射
WORD_EXTS = (".doc", ".docx", ".wps", ".rtf", ".odt", ".txt")
PPT_EXTS = (".ppt", ".pptx", ".odp")
XLS_EXTS = (".xls", ".xlsx", ".csv", ".ods")
SUPPORTED_EXTS = WORD_EXTS + PPT_EXTS + XLS_EXTS

SOFFICE = None
COM_AVAILABLE = {"word": False, "powerpoint": False, "excel": False, "kwps": False}


def find_soffice():
    env = os.environ.get("XY_SOFFICE")
    if env and os.path.isfile(env):
        return env
    for c in _SOFFICE_CANDIDATES:
        if os.path.isfile(c):
            return c
    return shutil.which("soffice")


def _run_powershell(script: str, timeout: int = CONVERT_TIMEOUT) -> str:
    """执行 PowerShell 片段，返回 stdout（utf-8）；非零退出抛异常。"""
    b64 = base64_utf16(script)
    proc = subprocess.run(
        ["powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
         "-EncodedCommand", b64],
        capture_output=True, timeout=timeout,
        creationflags=(subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0),
    )
    out = (proc.stdout or b"").decode("utf-8", "ignore").strip()
    if proc.returncode != 0:
        err = (proc.stderr or b"").decode("utf-8", "ignore").strip()[-300:]
        raise RuntimeError("PowerShell 失败: " + (err or ("returncode=" + str(proc.returncode))))
    return out


def base64_utf16(text: str) -> str:
    import base64
    return base64.b64encode(text.encode("utf-16-le")).decode("ascii")


def detect_com():
    """启动时探测 MS Office COM 组件可用性（快速打开-退出）。"""
    global COM_AVAILABLE
    probes = {
        "word": "try{ $w=New-Object -ComObject Word.Application -ErrorAction Stop; $w.Quit(); 'OK' }catch{ 'NO' }",
        "powerpoint": "try{ $p=New-Object -ComObject PowerPoint.Application -ErrorAction Stop; $p.Quit(); 'OK' }catch{ 'NO' }",
        "excel": "try{ $x=New-Object -ComObject Excel.Application -ErrorAction Stop; $x.Quit(); 'OK' }catch{ 'NO' }",
        # WPS 文字组件（兼容 Word VBA 对象模型），作为 .doc/.docx 的降级引擎
        "kwps": "try{ $k=New-Object -ComObject KWPS.Application -ErrorAction Stop; $k.Quit(); 'OK' }catch{ 'NO' }",
    }
    for key, script in probes.items():
        try:
            COM_AVAILABLE[key] = _run_powershell(script, timeout=40) == "OK"
        except Exception:  # noqa: BLE001
            COM_AVAILABLE[key] = False


def convert_com(src_path: str, out_dir: str, ext: str, use_kwps: bool = False) -> str:
    """MS Office COM 转换：按扩展名分发到 Word(KWPS) / PowerPoint / Excel。"""
    name_pdf = os.path.splitext(os.path.basename(src_path))[0] + ".pdf"
    pdf_path = os.path.join(out_dir, name_pdf)
    src_ps = src_path.replace("\\", "\\\\")
    pdf_ps = pdf_path.replace("\\", "\\\\")
    if ext in WORD_EXTS:
        # Word 或 WPS 文字（KWPS 兼容 Word 对象模型）：17 = wdFormatPDF
        prog_id = "KWPS.Application" if use_kwps else "Word.Application"
        script = (
            "$ErrorActionPreference='Stop';"
            "$w=New-Object -ComObject %s;"
            "$w.Visible=$false;$w.DisplayAlerts=0;"
            "try{"
            "$d=$w.Documents.Open('%s',$false,$true);"
            "$d.SaveAs([ref]'%s',[ref]17);"
            "$d.Close($false);"
            "}finally{$w.Quit();}"
            "if(!(Test-Path '%s')){throw 'PDF 未生成'}"
            "'OK'" % (prog_id, src_ps, pdf_ps, pdf_ps)
        )
    elif ext in PPT_EXTS:
        # 32 = ppSaveAsPDF；WithWindow=false
        script = (
            "$ErrorActionPreference='Stop';"
            "$p=New-Object -ComObject PowerPoint.Application;"
            "try{"
            "$pres=$p.Presentations.Open('%s',$true,$false,$false);"
            "$pres.SaveAs('%s',32);"
            "$pres.Close();"
            "}finally{$p.Quit();}"
            "if(!(Test-Path '%s')){throw 'PDF 未生成'}"
            "'OK'" % (src_ps, pdf_ps, pdf_ps)
        )
    elif ext in XLS_EXTS:
        # Excel: ExportAsFixedFormat(xlTypePDF=0)
        script = (
            "$ErrorActionPreference='Stop';"
            "$x=New-Object -ComObject Excel.Application;"
            "$x.Visible=$false;$x.DisplayAlerts=0;"
            "try{"
            "$wb=$x.Workbooks.Open('%s',0,$true);"
            "$wb.ExportAsFixedFormat(0,'%s');"
            "$wb.Close($false);"
            "}finally{$x.Quit();}"
            "if(!(Test-Path '%s')){throw 'PDF 未生成'}"
            "'OK'" % (src_ps, pdf_ps, pdf_ps)
        )
    else:
        raise RuntimeError("COM 引擎不支持该扩展名: " + ext)
    _run_powershell(script)
    if not os.path.isfile(pdf_path):
        raise RuntimeError("COM 转换未产出 PDF")
    return pdf_path


def convert_soffice(src_path: str, out_dir: str) -> str:
    """LibreOffice headless 转换。-env:UserInstallation 独立配置目录避免与 GUI 冲突。"""
    profile = os.path.join(tempfile.gettempdir(), "xy-conv-profile-" + uuid.uuid4().hex[:8])
    cmd = [
        SOFFICE, "--headless", "--norestore", "--nolockcheck", "--silent",
        "-env:UserInstallation=" + profile,
        "--convert-to", "pdf", "--outdir", out_dir, src_path,
    ]
    proc = subprocess.run(
        cmd, capture_output=True, timeout=CONVERT_TIMEOUT,
        creationflags=(subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0),
    )
    shutil.rmtree(profile, ignore_errors=True)
    base = os.path.splitext(os.path.basename(src_path))[0] + ".pdf"
    pdf_path = os.path.join(out_dir, base)
    if proc.returncode != 0 or not os.path.isfile(pdf_path):
        tail = (proc.stderr or proc.stdout or b"").decode("utf-8", "ignore")[-300:]
        raise RuntimeError("LibreOffice 转换失败: " + (tail or ("returncode=" + str(proc.returncode))))
    return pdf_path


def convert_to_pdf(src_path: str, out_dir: str, ext: str) -> str:
    """引擎分发：soffice 优先，否则 MS Office COM / WPS COM（按扩展名要求对应组件在线）。"""
    if SOFFICE:
        return convert_soffice(src_path, out_dir)
    if ext in WORD_EXTS:
        if COM_AVAILABLE.get("word"):
            return convert_com(src_path, out_dir, ext, use_kwps=False)
        if COM_AVAILABLE.get("kwps"):
            return convert_com(src_path, out_dir, ext, use_kwps=True)
        raise RuntimeError("没有可用转换引擎（LibreOffice 未安装，Word/KWPS COM 组件均不可用）")
    need = ("powerpoint" if ext in PPT_EXTS else
            "excel" if ext in XLS_EXTS else "")
    if need and COM_AVAILABLE.get(need):
        return convert_com(src_path, out_dir, ext)
    raise RuntimeError(
        "没有可用转换引擎（LibreOffice 未安装，MS Office %s 组件不可用）"
        % (need or "对应"))


class Handler(BaseHTTPRequestHandler):
    server_version = "XyConvertServer/1.1"

    def _json(self, code: int, obj: dict):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (time.strftime("%H:%M:%S"), fmt % args))

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/health":
            self._json(200, {
                "status": "ok", "service": "xy-convert-server",
                "soffice": SOFFICE or "", "com": dict(COM_AVAILABLE),
            })
        else:
            self._json(404, {"error": "not found"})

    def do_POST(self):
        url = urlparse(self.path)
        if url.path != "/office2pdf":
            self._json(404, {"error": "not found"})
            return
        qs = parse_qs(url.query)
        name = unquote(qs.get("name", ["file"])[0]) or "file"
        name = os.path.basename(name).replace("\\", "_").replace("/", "_") or "file"
        ext = os.path.splitext(name)[1].lower()
        if ext not in SUPPORTED_EXTS:
            self._json(415, {"error": "不支持的文件类型: " + (ext or "(无扩展名)")})
            return

        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            self._json(400, {"error": "请求体为空或超过 200MB 上限"})
            return

        work = os.path.join(tempfile.gettempdir(), "xy-conv-work-" + uuid.uuid4().hex[:8])
        out_dir = os.path.join(work, "out")
        os.makedirs(out_dir, exist_ok=True)
        src_path = os.path.join(work, name)
        try:
            remaining = length
            with open(src_path, "wb") as fh:
                while remaining > 0:
                    chunk = self.rfile.read(min(65536, remaining))
                    if not chunk:
                        break
                    fh.write(chunk)
                    remaining -= len(chunk)
            if remaining > 0:
                self._json(400, {"error": "请求体不完整"})
                return

            with LOCK:  # 引擎串行化
                pdf_path = convert_to_pdf(src_path, out_dir, ext)

            with open(pdf_path, "rb") as fh:
                data = fh.read()
            if len(data) < 100:
                self._json(500, {"error": "转换产物异常（过小）"})
                return
            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            sys.stderr.write("[%s] OK %s → PDF (%d bytes)\n" % (time.strftime("%H:%M:%S"), name, len(data)))
        except subprocess.TimeoutExpired:
            self._json(504, {"error": "转换超时（>%ds）" % CONVERT_TIMEOUT})
        except Exception as e:  # noqa: BLE001
            self._json(500, {"error": str(e)})
        finally:
            shutil.rmtree(work, ignore_errors=True)


def main():
    global SOFFICE, PORT
    args = sys.argv[1:]
    if "--port" in args:
        PORT = int(args[args.index("--port") + 1])
    if "--soffice" in args:
        os.environ["XY_SOFFICE"] = args[args.index("--soffice") + 1]
    SOFFICE = find_soffice()
    print("[..] 正在探测转换引擎…")
    detect_com()
    print("[OK] soffice:", SOFFICE or "未安装")
    print("[OK] MS Office COM:", COM_AVAILABLE)
    if not SOFFICE and not any(COM_AVAILABLE.values()):
        print("[警告] 未检测到任何转换引擎（LibreOffice / MS Office），")
        print("       /office2pdf 将返回 503。服务保持运行以便后续升级。")
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    print("[OK] 小雅转换服务已启动: http://%s:%d  （Ctrl+C 退出）" % (HOST, PORT))
    print("     健康检查: curl http://%s:%d/health" % (HOST, PORT))
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n[退出] 服务已停止")
        srv.server_close()


if __name__ == "__main__":
    main()
