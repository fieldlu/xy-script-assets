# Third-Party Notices

本项目（小雅辅助工具）采用 **GPL-3.0** 协议开源（全文见 [LICENSE](LICENSE)），其中引用的部分代码来自以下第三方项目，按各项目的原始许可证归属与授权。

## 小雅爬爬爬 / 小雅做做做

- 作者：zygame1314
- 许可证：MIT License（全文见 [LICENSE-MIT](LICENSE-MIT)）
- 版权：归原作者所有

## 小雅自动刷

- 作者：Qy
- 许可证：Apache License 2.0（全文见 [LICENSE-APACHE](LICENSE-APACHE)）
- 版权：归原作者所有

## 小雅粘粘粘

- 作者：Qy
- 许可证：Apache License 2.0（全文见 [LICENSE-APACHE](LICENSE-APACHE)）
- 版权：归原作者所有

## 主脚本说明

主脚本为单文件脚本，其中引用或改编自上述项目的代码，在长期迭代中已深度整合，暂无法按行级标注来源，特此统一声明：这些代码按其原始许可证（MIT / Apache-2.0）授权，相应的版权、许可证与归属声明由本仓库随分发一并保留（Apache-2.0 项目如含 NOTICE 文件，其适用内容同样保留）。

若你是相关项目的作者，认为署名或许可证标注不准确，欢迎提交 Issue，我会及时更正。

## Markdown 转换模块（§16 xyMd，v3.7.4.0 起）

主脚本 §16 Markdown 转换模块按需加载以下 MIT 协议开源库（均在浏览器内运行），一并致谢：

### remark-docx（FrankLiu007 fork，上游 inokawa/remark-docx）

- 许可证：MIT License
- 用途：Markdown → docx 编译引擎；随脚本懒加载的打包产物 `dist/xy-md2docx.bundle.min.js` 内嵌了同许可依赖 docx（dolanmiu）、KaTeX（Khan Academy）、mathml2omml、unified-latex 等
- 特色：LaTeX → KaTeX MathML → Word 原生 OMML 公式（导出后可在 Word/WPS 中直接编辑）；默认段落样式显式左对齐（v3.7.4.3 起）

### KaTeX

- 作者：Khan Academy
- 许可证：MIT License
- 用途：随 `dist/xy-md2docx.bundle.min.js` 内嵌，LaTeX → MathML 中间表示（Word 公式链路）。v3.7.4.3 起 Markdown 导出 PDF（打印）功能已移除，原先打印窗口内的 KaTeX CDN 独立引用一并清理。

### pdf-lib

- 作者：Hopding
- 许可证：MIT License
- 用途：图片转单页 PDF（转 PDF 打包功能）

### fflate

- 作者：101arrowz
- 许可证：MIT License
- 用途：课件 ZIP 打包（转 PDF 打包功能）
