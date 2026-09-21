# 前端构建告警门禁

更新时间：2026-09-05；跟踪 Issue：#352。

## 目标

构建成功不等于构建日志健康。CI 对 H5 与微信小程序分别执行带审计的构建，未登记的 warning、deprecation、Browserslist 数据过期提示或 Vite `(!)` 提示都会使任务失败。

```bash
cd frontend
yarn build:h5:checked
yarn build:mp-weixin:checked
```

审计器位于 `frontend/scripts/build-with-warning-audit.mjs`。允许项按精确指纹和所属 Issue 匹配，不能用宽泛字符串屏蔽同类新告警。

## 当前登记项

| 指纹 | 平台 | 归属 | 退出条件 |
| --- | --- | --- | --- |
| 无 | — | — | 当前 checked build 不允许任何已知告警 |

正式 5.26 编译器在 H5 与微信小程序构建中仍保留 Vue SFC 适配层的 Sass legacy JS API 兼容静默。项目 Sass 已完成模块化迁移，因此 `vite.config.mjs` 仅对 `legacy-js-api` 这一条上游弃用提示使用 Sass 官方 `silenceDeprecations`；后续正式编译器确认不再触发该告警后必须删除此配置。

## #353 已清理项

- 全部 DCloud 编译器与平台包已按官方 Vue 3 模板对齐到正式 5.24 批次。
- Vite、Rollup 和 Vue 已固定为官方模板版本，测试依赖不能再解析出另一套构建器。
- H5 与微信小程序不再输出 UniApp 新版本提示；对应允许规则已删除，今后再出现会直接触发构建门禁。

## #367 已清理项

- themeFault、themeApi、themeAnalytics、themeCenter 与 themeSchema 已通过显式运行时适配器解除反向动态依赖。
- H5 不再输出 themeApi.js、themeCenter.js、themeSchema.js 无法拆分 chunk 的三条提示；#328 允许规则已删除。
- 主题服务依赖图与适配器注册/恢复已有单元测试，不能靠重新加入动态 import 或循环静态 import 绕开边界。设计与体积/时延基线见 [`THEME_RUNTIME_BOUNDARY.md`](THEME_RUNTIME_BOUNDARY.md)。

## #352 已清理项

- `App.vue` 的 Sass `@import` 已迁移为 `@use`。
- `tokens.scss` 的全局 `map-get` 已迁移为 `sass:map` 的 `map.get`。
- H5 Sass 改用 Vite `modern-compiler` API。
- `caniuse-lite` 从 `1.0.30001765` 更新到 `1.0.30001810`。
- Vitest 配置改用 `.mjs` 并使用现代 Sass API，不再触发 Vite CJS Node API 与 Sass legacy JS API 弃用提示。

## #352 语法迁移基线

语法迁移前后使用同一提交、同一依赖树构建，产物保持一致：

| 目标 | 文件数 | 磁盘占用 | 关键样式 SHA-1 |
| --- | ---: | ---: | --- |
| H5 | 115 | 1816 KiB | `index-CLQK1Xn6.css`: `100a02e7123976c1195f14d88336c82a17e4a2c2` |
| 微信小程序 | 365 | 2336 KiB | `app.wxss`: `59ba1e02cb1affb4e4affdd602272c4e31299687` |

文件数、体积与关键 CSS 内容哈希在迁移前后完全相同；任何后续差异都需要在对应 PR 中解释并重新做明暗主题视觉检查。

## #353 UniApp 5.24 基线

下表使用实际文件字节数，比较 #352 依赖树和正式 5.24 依赖树：

| 目标 | 文件数 | 总字节数 | 关键样式 SHA-1 |
| --- | ---: | ---: | --- |
| H5（升级前） | 115 | 1,594,005 | `index-CLQK1Xn6.css`: `100a02e7123976c1195f14d88336c82a17e4a2c2` |
| H5（5.24） | 115 | 1,612,647 | `index-B-YtsvcJ.css`: `88f0b24564deff69f819ea5803cf8700b40c44ea` |
| 微信小程序（升级前） | 365 | 1,340,682 | `app.wxss`: `59ba1e02cb1affb4e4affdd602272c4e31299687` |
| 微信小程序（5.24） | 369 | 1,358,716 | `app.wxss`: `59ba1e02cb1affb4e4affdd602272c4e31299687` |

H5 总体积增加 18,642 字节（1.17%），主 CSS 增加 125 字节。格式化比较后只有 UniApp 内置 Toast 文本截断和系统地图名称截断两处上游规则变化，390×844 浅色、暗色检查未见业务布局偏移。微信小程序总体积增加 18,034 字节（1.35%），业务 `app.wxss` 内容不变；新增四个文件均为页面已引用的 `uni-load-more` 组件产物。

## X4 验收使用的 UniApp 5.26 基线

2026-09-21 因 5.24 开始输出正式版本更新提示，按官方 Vue 3 Vite 模板将全部 DCloud 编译器、运行时和平台包整批对齐到 `3.0.0-5020620260917001`，没有为更新提示增加白名单。升级后的 H5 与微信小程序 checked build 均报告 5.26，告警审计为零；完整前端单测为 83 个文件、535 项。

当前 X4 工作树（包含地方站功能，不能与 5.24 历史基线直接做纯编译器体积归因）的产物记录如下：

| 目标 | 文件数 | 总字节数 | 关键样式 SHA-1 |
| --- | ---: | ---: | --- |
| H5（5.26 + X4） | 140 | 1,831,032 | `index--YXvTgDW.css`: `d83500c68a2ac037d3ae04d0e8cfb9c32227f027` |
| 微信小程序（5.26 + X4） | 474 | 1,598,343 | `app.wxss`: `edf84c52cc2f8fb61a66ccf9728af6054b241757` |
