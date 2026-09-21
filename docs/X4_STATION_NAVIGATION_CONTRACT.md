# X4 地方站小程序路由与上下文契约

> 范围：兴化语记·莆仙方言站的小程序入口、冷启动、通用听查录链路和返回规则。本契约不改变资源可见性、登录授权或语言事实。

## 1. 稳定路由

| 用途 | 路由 | 说明 |
| --- | --- | --- |
| 地方站首页 | `/pages/stations/index` | 必须带已登记的 `station` 或 `profile` |
| 旧链接承接 | `/pages/stations/legacy` | 只接受已登记 namespace、资料类型和正整数 ID |
| 搜索 | `/pages/search` | 复用通用 Entry 搜索 |
| 录音 | `/pages/recordings/create` | 复用通用 Recording 创建 |
| Entry 详情 | `/pages/entries/details` | 对象身份只由 `id` 决定 |
| Recording 详情 | `/pages/recordings/details` | 对象身份只由 `id` 决定 |

分享访客应直接落到 Entry / Recording 详情，不先跳地方站首页。

## 2. Query 白名单

| 参数 | 值 | 含义 | 不能用于 |
| --- | --- | --- | --- |
| `station` | 已登记 slug；当前为 `hinghwa` | 地方站分发入口 | 授权、可见性或资料归属 |
| `profile` | 必须与 station 登记值一致；当前为 `hinghwa-puxian` | 品牌 / Distribution Profile | 创建地方账户或专用模型 |
| `dialect_id` | 正整数 | 用户可见的默认筛选 / 录音初值 | 证明某内容属于某地区 |
| `return_to` | `station` 或 `home` | 冷启动、空页面栈的 fallback | 任意路径或外部 URL 跳转 |

未知 station/profile、不匹配的 station/profile、非法 ID 和任意 `return_to` 均不进入业务导航。页面不传递其他 query，因此不存在通配透传。

## 3. 来源上下文与数据筛选

- `station/profile` 只负责展示来源、“继续逛地方站”和返回路径。
- 地方站首页从服务端解析 `dialectQualifiedCode`，再使用返回的 `dialect_id + dialect_scope=subtree` 读取公开 Entry / Recording。
- 下游搜索和录音页可将 `dialect_id` 作为可见初值；用户可修改，服务端仍独立执行可见性与授权。
- Entry / Recording 的 `id`、Evidence、状态和使用地区不因 station/profile 改变。

## 4. 进入与返回

1. 有上一页时使用小程序真实页面栈 `navigateBack`。
2. 冷启动直达详情、页面栈为空时，仅使用已解析的 `return_to` fallback：
   - `station` → 对应地方站首页；
   - `home` → 乡声集盒首页。
3. 非法或缺失来源上下文一律 fallback 到乡声集盒首页。
4. 从详情点“继续逛”是显式前进导航，不冒充返回。

## 5. 旧链接

白名单为 `namespace=hinghwa`、`type=entry|recording`、`legacy_id=<正整数>`。解析后仍必须由可审计的服务端映射给出唯一目标。

`GET /legacy-links/resolve/` 只从迁移时写入的 `metadata.legacy` 审计元数据解析，并先按当前用户可见性过滤。返回状态只有：

- `resolved`：只有一个可见目标，客户端直接替换到通用详情；
- `unmapped`：没有可见目标，显示搜索和返回地方站动作；
- `conflict`：存在多个候选，停止跳转并诚实说明冲突。

禁止客户端按相似写法、同数字 ID 或首个结果猜测。

## 6. 状态矩阵

| 状态 | 用户看见什么 | 可执行动作 |
| --- | --- | --- |
| 正常 | 品牌关系、范围、真实 Entry / Recording | 查、听、录、进入详情 |
| 内容不足 | 明确说明资料不足 | 查词或录第一段，不填充假数据 |
| 查词维护 | 只标记查词不可用 | 继续听公开乡音 |
| 录音维护 | 只标记录音不可用 | 继续查和听 |
| 非法地方站参数 | 入口无法识别 | 返回乡声集盒 |
| 旧链接无映射 | “暂未找到”及不猜测说明 | 搜索或返回地方站 |

## 7. 第二地方站替换规则

新站只能在 `stationProfiles` 注册品牌名、关系文案、Dialect qualified code 和 legacy namespace。路由、搜索、录音、详情、账户与返回逻辑不得复制。自动化测试使用中性第二站 profile 证明解析和参数生成不依赖“兴化语记”字面量。

## 8. 未执行的外部操作

- 未切换生产域名、真实旧小程序入口或生产映射。
- 未将客户端参数作为服务端授权或 Evidence。
- 真机证据必须在可用小程序身份和测试环境中补录；构建通过不等于真机通过。
