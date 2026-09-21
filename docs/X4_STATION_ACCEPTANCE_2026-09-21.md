# X4 莆仙站小程序入口与导航验收记录

> 验证日期：2026-09-21｜范围：X4 Leaf｜环境：本地仓库与脱敏测试 fixture，未连接生产。

## 交付物

- 路由、query 白名单、进入与返回契约：[`X4_STATION_NAVIGATION_CONTRACT.md`](X4_STATION_NAVIGATION_CONTRACT.md)
- 稳定路由：`/pages/stations/index`
- 旧链接承接：`/pages/stations/legacy`
- 通用上下文实现：`frontend/src/services/stationContext.js`
- 可替换 profile 登记：`frontend/src/services/stationProfiles.js`
- 莆仙站页面与通用 Search / Recording / Entry / Recording Detail 导航接续
- 第二地方站中性 fixture 解析测试

## 自动化与构建证据

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| `npm run lint` | 通过 | ESLint 0 warning / 0 error |
| `npm run test:unit` | 通过 | 83 files，535 tests |
| X4 定向测试 | 通过 | StationContext / StationPage / LegacyStationPage / VisualRouteMatrix / PlaywrightConfig |
| `npm run build:h5:checked` | 通过 | UniApp 5.26；warning audit: tracked notices none |
| `npm run build:mp-weixin:checked` | 通过 | UniApp 5.26；warning audit: tracked notices none |
| 390×844 H5 地方站视觉回归 | 通过 | 最终旧链接解析接线后重跑；浅色地方站、旧链接承接、暗色地方站，3 tests |
| X4 后端解析接口定向测试 | 通过 | 唯一映射、冲突、不可见目标和非法白名单均通过 |
| 后端完整测试 | 通过 | 213 tests；为 Windows / Python 3.14 将环境文件用例改为关闭句柄后再由子进程读取 |

本地视觉证据：

- `output/playwright/v2-visual-review/routes/07-station-hinghwa-light-guest.png`
- `output/playwright/v2-visual-review/routes/08-station-legacy-missing-light-guest.png`
- `output/playwright/v2-visual-review/themes/station-hinghwa-dark-guest.png`

## X4 旅程结论

| 旅程 | 结论 | 说明 |
| --- | --- | --- |
| 站内 / 冷启动进入莆仙站 | 通过（自动化） | 只接受登记 station/profile，非法值安全降级 |
| 地方站进入查词 | 通过（自动化） | 传递来源和可见默认 Dialect，复用通用 Entry 搜索 |
| 地方站进入录音 | 通过（自动化） | 默认地区不代替用户选择或服务端授权 |
| Entry / Recording 详情继续逛地方站 | 通过（自动化） | 详情对象身份不因 profile 变化 |
| 页面栈存在时返回 | 通过（既有 PageShell 测试） | 使用真实 `navigateBack` |
| 空栈 / 冷启动返回 | 通过（单测） | 只有 `station` / `home` 语义目标，不接受任意 URL |
| 旧链接无映射 | 通过（页面与视觉回归） | 不猜测，保留搜索与返回动作 |
| 旧 ID 唯一映射 | 通过（后端 + 前端单测） | 只读取迁移审计元数据；0 / 1 / 多个可见目标分别返回 unmapped / resolved / conflict |
| 单项能力 / 单请求失败 | 通过（单测） | 查词失败时乡音仍可用，反之亦然 |
| 第二地方站替换 | 通过（单测） | 替换 profile 和 Dialect 即可，无需复制听查录或账户页 |

## 真机与发布边界

- 微信开发者工具导入、真实小程序冷启动、胶囊区、iOS / Android 页面栈：**未验证**。
- 生产旧入口、生产域名与真实旧 ID cutover：**未执行**。
- 因真机与生产 cutover 尚未执行，X4 当前结论是：**X4 自动化开发验收通过，不构成生产发布通过**。

## TODO（暂停后保留）

- [ ] 在微信开发者工具导入 `frontend/dist/build/mp-weixin`，验证冷启动、空页面栈返回、胶囊区与安全区。
- [ ] 至少完成 iOS 与 Android 各一轮真机录屏，覆盖站点 → 查词 → 词条 → 录音 → 详情 → 返回站点。
- [ ] 由 X3 确认来源参数只表达导航上下文，不参与授权或语言事实判定。
- [ ] 由 X5 确认分享链接保留来源字段及“继续逛地方站”文案。
- [ ] 审计生产迁移数据中的 `metadata.legacy` 唯一性后，再切换真实旧入口、域名与小程序入口；当前未做生产切换。
