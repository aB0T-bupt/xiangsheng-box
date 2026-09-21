# UniApp 5.26 成组升级记录

更新时间：2026-09-21；触发场景：X4 地方站验收构建。

## 决策

5.24 checked build 开始输出 5.26 正式版本提示。构建告警门禁明确禁止把工具链更新提示加入白名单，因此按 DCloud 官方 Vue 3 Vite 模板，将全部 DCloud 编译器、运行时和目标平台包整批升级到 `3.0.0-5020620260917001`。

没有混用 5.24 与 5.26 包，也没有放宽 `build-with-warning-audit.mjs`。`@dcloudio/types`、Vue、Vite 和 Rollup 保持仓库现有锁定版本；`@dcloudio/uni-ui` 是独立组件库，不随编译器批次变更。

参考：

- [DCloud uni-app CLI 工程文档](https://en.uniapp.dcloud.io/quickstart-cli.html)
- [DCloud 官方 Vue 3 Vite 模板 package.json](https://github.com/dcloudio/uni-preset-vue/blob/vite/package.json)

## 锁定矩阵

| 分组 | 版本 |
| --- | --- |
| `@dcloudio/uni-*` 编译器、运行时与平台包 | `3.0.0-5020620260917001` |
| `@dcloudio/types` | `3.4.31` |
| Vue | `3.4.21` |
| Vite | `5.2.8` |
| Rollup | `4.63.3` |

## 回归结论

- `npm run lint` 通过。
- 完整前端单测通过：83 个文件、535 项测试。
- H5 checked build 通过，编译器报告 5.26，告警审计为零。
- 微信小程序 checked build 通过，编译器报告 5.26，告警审计为零。
- X4 的 390×844 浅色站点、旧链接承接、暗色站点三条视觉旅程通过并完成人工复核。
- Yarn 安装阶段仍只有官方 `uni-automator` 未使用的 Jest 27 peer 提示；它不进入当前 Vitest、H5 或微信小程序运行路径。

产物文件数、字节数和关键样式哈希记录在 [`BUILD_WARNINGS.md`](BUILD_WARNINGS.md)。
