# OpenCode 插件市场调研（2026-11）

调研人：Devin + terry2010。目的：决定要不要做、做成什么形态。
本文是开发前的决策依据归档，不是产品文档。

---

## 1. 一句话结论

**这是一个"位置期权"不是"现金生意"**：前十 AI 编程 harness 里，opencode 是唯一"体量大 + 市场真空"的组合；但全品类目前没有盈利先例。值得用自动化把持有成本压到最低去占位的，只有认可期权逻辑的人。

---

## 2. opencode 体量（决定了机会有多大）

- GitHub **223,747★** / 30K forks——**开源编程 agent 第一名**
- npm `opencode-ai`：~500 万下载/周，~1300 万/月
- MAU ~**1300 万**（6月底；官方5月报 10M），DAU ~100 万，token 吞吐 5-7 万亿/天
- OpenCode Go：$10/月；5月 $11M ARR，6月推算年化 $31-40M
- Discord 50K；**中国区占 17%（最大地区）**
- 插件生态仅几百个（npm keyword `opencode-plugin` 2876 条，去水后真实有效约几百）——**生态严重落后用户规模**

## 3. 前十 harness 的市场格局

按 Stack Overflow 2026 调查采用率：Claude Code 65.5% > Copilot 58.7% > Codex 29.5% > Cursor 25.5% > Antigravity 16% > Gemini 14.6% > **OpenCode 13.6%** > JetBrains 12.8% > Windsurf 6.5% > Warp 5.2%

| 生态 | 市场现状 |
|---|---|
| Claude Code | 官方双目录（official 自动注册 + community），marketplace.json 开放格式 |
| Codex | 官方目录 openai/plugins（180 件，与 ChatGPT 共用）+ 第三方三家（全 $0） |
| Gemini CLI | 官方 gallery（topic 爬虫自动收录） |
| Kiro | 官方 powers registry |
| Cursor/Windsurf | IDE 扩展生态（Open VSX）+ 第三方 skills 市场 |
| JetBrains/Cline/Continue/Warp | 自带市场或 hub |
| **opencode** | **唯一真空**——官方无，第三方全是半成品 |
| DSH | dsh-market（fkysly 个人维护） |

关键：**opencode 是前十里最后一个市场空位**。

## 4. 两个现存竞争者的尸检

### opencode.cafe（R44VC0RP）
- 社区投稿制市场（Next.js+Convex+Clerk），官方 docs 有链接
- 收录 **55 条**，全生命周期 6 个 PR，**2026-05 后未更新（半弃坑）**
- 收入 $0，无盈利结构
- 死因：**内容饿死**——投稿制没人投，没覆盖就没流量，死循环

### opencode.im（Appzon = Appzone Dijital Hizmetler A.Ş.，土耳其 App 工厂）
- 收录 146 条，Featured 空、榜单无数据、Stripe 未配置——**半成品**
- 赞助价 $49/月，**收入证据为 0**
- 母公司靠 iOS AI 套壳 App 挣钱（Chat AI 916K 下载），目录是副业实验
- 手工收录+人工审核 → 覆盖度追不上自动管线

## 5. 盈利真相（核心调研结论）

```
免费目录 + 广告/赞助：    6 个样本全部 $0
  - opencode.cafe / opencode.im / codex-harness(898条)
    / codex-marketplace(426条) / CodexStacks(1068条,自认无流量)
    / dsh-market
付费交易（Agensi）：      唯一有流水但仅 $38 MRR（3 个订阅，
                          累计 GMV $3.8K，"16K skills"是营销注水）
官方市场（各家）：        全部免费——是卖订阅的配套投资，不是收入产品
付费插件本身：            不存在——最火的 oh-my-opencode 70K★ 也免费
唯一跑通的变现：          插件当漏斗 → 后端 SaaS/API 收费
                          （Morph、Supermemory、RevenueCat 模式）
```

**整个品类当下没人挣钱**。原因不是做错，是付费市场还没长出来。

## 6. 风险清单

| 风险 | 评估 | 对策 |
|---|---|---|
| 官方市场落地（Sherlock） | **高**——issue #28696 开着，dobord unified marketplace PR 在设计评审中 | catalog 做格式中立 source，UI 做薄 |
| 官方禁止第三方市场 | ≈0——开源 MIT、无签名闸、技术上做不到 | — |
| 没人用 | 中——cafe 尸体在前 | 自动管线解决内容饿死；网站只是外壳 |
| opencode 自己死了 | 中——AI 公司死亡率 | 目录做成跨 agent 格式，数据可平移 |
| 收入为零 | **基本确定** | 接受期权逻辑或不做 |
| 安全投毒（装恶意插件验证） | 真实 | 沙箱化：GitHub Actions 一次性 runner，不放凭据 |

## 7. 架构决策（已定）

### 数据面：静态目录管线
```
npm/GitHub 爬取 → tarball 静态扫描 → GitHub Actions 沙箱实机验证
→ index.json → GitHub Pages 分发 + commit 回仓库
```
- 全部 GitHub Actions + Pages：**零服务器、执行可审计、runner 即一次性沙箱**
- 本地只用于开发调试，**绝不在本机跑陌生插件**

### 资产观：catalog 是本体，UI 是壳
- marketplace.json 式目录文件才是核心资产（Claude/Codex 同构）
- agent 时代真正消费者是 agent 不是人——索引价值在**验证数据**，收录只是壳
- schema 对齐 Claude/Codex 字段（name/source/category/policy），将来可进官方 source 或跨生态

### 安全层
- 静态扫描在前（不执行代码）：postinstall/网络端点/字面 IP/混淆
- 命中风险特征 → **强制人审**（AI 不能替代"计划外发现"）
- CI token 只读、无 secrets、出口可审计；AI 评估时全部投稿内容按不可信数据处理（防 prompt injection）

### 审核自动化（P5，可后置）
- CI 机械验证（装得上/加载通/报错抓全）→ AI 诊断起草 → **人终审点通过**
- 绿的可自动放，红的 AI 起草回复，灰的 quarantine 不阻塞

### 运营模型
- AI 接管 90-95%：定时 agent 巡检 CI、自动过干净件、自动拒恶意件
- 灰色件 quarantine 不阻塞；每周 digest 给人留心跳
- **目标：日常零人工，人在场降级为抽查**

### 变现设计原则
- 用户看得到的地方永远干净（插件内绝不做广告——必被讨伐且不值钱）
- 付费层长在别人看不见的地方：企业白名单 feed / 深度验证报告 / 独立商店
- 赞助与验证结论永远两轨（Agensi 规则：paid placement never earns a check badge）

## 8. 分阶段计划

```
P0 目录管线可行性（先做 spike 验证）：
   opencode 能否在 GitHub Actions 无头装插件+判定激活
   正样本 opencode-loop-recover / 负样本故意坏的包
   过不了 → 项目降级或终止（用户已定的门槛）

P1 爬虫+静态扫描+index.json+Pages   ~1.5-2 周
P2 沙箱装机验证管线                  ~1-2 周（含 spike）
P3 收录站（薄壳，Astro 静态）         ~1-2 周
P4 应用内市场插件                    缓做——看官方市场动向
P5 投稿审核自动化                    可后置
```

估时：MVP（P1-P3）兼职 ~4-6 周；Devin 全权开发 ~30-45h / 20-35M token。

## 9. 域名

- `opencode.market` 未注册，~$34-40/年（Cloudflare $34.20）
- 含完整商标有远期风险（先例 opencode.im/.cafe 未被告）
- 不急：先 github.io 跑，上线后定名

## 10. 已排除方向

- ❌ MCP 目录（红海：官方 registry + mcp.so 早占位）——只做 opencode 兼容性标注
- ❌ 纯投稿制社区站（cafe 死因）
- ❌ 广告模式（流量逻辑在 agent 时代失效 + 插件内广告必被讨伐）
- ❌ 卖 skill 抽成商店（Agensi $38 MRR 证明未跑通）
- ❌ 绑死 opencode 单一生态（宿主死亡风险 → 格式中立）

## 11. 关键参照系备忘

- **dsh-market**（fkysly）：1人全职 2.5月、130k 行含测试、1136 commits——完成度天花板，单人长期运营样本。架构可抄（离线目录+CDN分发+运行时兼容性判定），规模别照抄。
- **awesome-dsh-plugin**：CI 装机验证 + fkysly 人工诊断的混合审核——我们的目标是把它升级成"CI+AI诊断+人终审"。
- **Agent Plugins 1.0.0 规范**：Amazon/Cursor/Microsoft/OpenAI/Vercel 创始成员，格式在统一——目录 schema 要对齐它。
- **ocx**（kdcokenny）：shadcn 式扩展管理 CLI + registry，966 下载/周——品类需求的真实量级参照。
- **dobord 的 opencode unified marketplace PR**：设计是多 source + 适配 Claude/Codex catalog——落地后我们的 catalog 应能成为其 source。

---

*调研完毕。下一步：P0 spike（GitHub Actions 无头验证 opencode 插件装载）。*
