# Creemseed

**从一个小起点，做出值得付费的产品。**

默认英文、MIT 开源的 Next.js Web 模板，使用 Better Auth 管理身份、Creem 收款，内置用户工作台和管理员后台。

[在线演示](https://creemseed.vercel.app) · [使用此模板](https://github.com/bugkiwi/creemseed/generate) · [GitHub](https://github.com/bugkiwi/creemseed)

[![部署到 Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbugkiwi%2Fcreemseed&project-name=creemseed&repository-name=creemseed&env=DEMO_MODE%2CBILLING_ENABLED&envDefaults=%7B%22DEMO_MODE%22%3A%22true%22%2C%22BILLING_ENABLED%22%3A%22false%22%7D&envDescription=Public+demo+only.+Accounts%2C+billing%2C+and+webhooks+are+disabled.+Follow+the+deployment+guide+to+enable+your+own+application.&envLink=https%3A%2F%2Fgithub.com%2Fbugkiwi%2Fcreemseed%2Fblob%2Fmain%2Fdocs%2Fdeployment.md)

[English](./README.md) · [架构](./docs/architecture.md) · [计费设计](./docs/billing.md) · [安全](./SECURITY.md) · [AI 安装提示词](./prompts/setup.zh-CN.md)

## 包含什么

- **Next.js App Router、React、TypeScript、Tailwind 4**，兼容 shadcn 的组件约定。
- **Better Auth**：邮箱密码、邮箱验证、密码重置、可选 Google/GitHub 登录、服务端管理员权限。
- **优先支持 Creem 订阅**：月付、年付、托管结账、客户门户、续费、周期末取消、服务端权益检查。也可选一次性付费或混合计费。
- **管理后台**：带分页与搜索的用户、订阅、结账恢复、Webhook 记录、失败重放、订阅对账、管理员审计。
- **Postgres + Drizzle**：提交到仓库的迁移、持久化事件去重、按用户串行处理计费变更。
- **可选服务**：Resend、PostHog、Vercel Analytics、Speed Insights。分析默认全部关闭，启用后仍需访客同意，排除私有页面。
- **两种安装方式**：CLI 交互安装与 AI prompt 安装，共用同一份配置校验，均要求用户选择实际场景。
- Vercel 部署与独立 Node/Docker 输出，附 CI、依赖更新和公开仓库安全约定。

计费单位为个人账户。当前精简版不包含团队、席位、按量计费或任务平台。内置价格与 7 天试用是模板的示例配置，不代表本仓库正在销售某项服务。本项目是独立社区模板，并非 Creem 官方产品。

## 在线测试站与 Vercel

[在线测试站](https://creemseed.vercel.app)已接入 Better Auth 与 Creem **测试环境**，可注册、登录并进入托管订阅结账，不产生真实扣款。Google OAuth 应用仍处于测试状态，只有已加入测试用户的账号可用 Google 登录；邮箱登录使用已配置的发件域名。

部署按钮会创建**你自己的副本**，默认使用无需凭据的演示模式，只预填 `DEMO_MODE=true`、`BILLING_ENABLED=false` 两个公开开关；演示地址可从 Vercel 的生产域名元数据自动推导。运行完整应用时，设置 `DEMO_MODE=false`，在本地选择场景并配置独立的 Postgres、认证、邮件和 Creem 凭据，再按[部署指南](./docs/deployment.md)操作。切换模式后重新构建。

## 通过 CLI 开始

需要 **Node.js 22.18+ 或 24**、**pnpm 12.4.2**；选择本地 Postgres 时需要 Docker。

新建自己的仓库可直接点击[使用此模板](https://github.com/bugkiwi/creemseed/generate)。在本地体验时，克隆公开仓库并运行向导：

```sh
git clone https://github.com/bugkiwi/creemseed.git
cd creemseed
node scripts/setup.mjs
```

向导会询问：

| 选择     | 选项                                                      |
| -------- | --------------------------------------------------------- |
| 应用信息 | 名称、描述、访问地址                                      |
| 数据库   | Docker 本地 Postgres / 已有 Postgres                      |
| 登录方式 | 邮箱、Google、GitHub 或向导提供的组合                     |
| 邮件     | 仅限本地开发的终端输出 / Resend                           |
| 计费     | 订阅 / 订阅加一次性 / 仅一次性                            |
| 分析     | 全关 / PostHog、Vercel Analytics、Speed Insights 自由组合 |
| 部署     | Vercel / Node 或 Docker                                   |

脚本安装锁定依赖、生成独立随机密钥、写入忽略的 `.env`、启动本地数据库并迁移。本地端口从 54329 开始选择可用值。已有 `.env` 会保留。已有数据库的 URL 在本地 `.env` 填写，然后运行 `pnpm db:migrate`，不进入公开配置文件。

从本地模板一键创建另一个项目：

```sh
node bin/create.mjs ../my-app
```

只复制白名单中的模板文件，不复制密钥、素材、构建结果或 Git 历史；目标目录必须为空。无需已发布的 npm 安装器，本仓库不声称 `npx create-creemseed` 已可用。

完成后运行：

```sh
pnpm env:check
pnpm dev
```

打开 **http://localhost:3000**，注册并验证邮箱。本地 console 邮件模式的验证链接显示在开发终端；部署后的邮箱密码登录必须选择 Resend 并配置发件域名，生产环境不会输出验证链接。

```sh
pnpm admin:grant --email you@example.com
```

重新登录后访问 `/admin`。该命令仅接受已存在且已验证的账户，会撤销其现有会话并记录权限变更。没有默认管理员或共用密码；撤权使用 `pnpm admin:revoke --email you@example.com`。

## 通过 AI 安装

让编码助手阅读 [prompts/setup.zh-CN.md](./prompts/setup.zh-CN.md)，或直接使用：

> 阅读此仓库的 AGENTS.md 与 prompts/setup.zh-CN.md。修改配置前先询问我实际场景。通过共用 setup 脚本应用选择；不要让我在对话中粘贴密钥，保留已有 .env。保持测试环境，只有我在本地明确配置后才启用收款。

AI 需要先询问表格中的选择，包括仅社交登录、已有数据库、混合计费、PostHog 区域、自托管代理等场景，再生成**不含密钥的公开配置**并执行：

```sh
node scripts/setup.mjs --config /absolute/path/to/choices.json --yes
```

配置结构、无人值守安装与恢复见 [docs/setup.md](./docs/setup.md)。`--yes` 必须提供完整配置，不会静默决定计费或认证方式。可通过 `--skip-install`、`--skip-db` 推迟相应步骤。

## 接入 Creem

1. 在自己的 **Test 环境**创建商品。默认服务端目录为 Pro 月付 **9.90 美元**、年付 **99 美元**，循环扣费、含税、**7 天试用**、无按量收费。混合或一次性模式还包含 **299 美元**的一次性商品。调价或取消试用时修改 [lib/billing/plans.ts](./lib/billing/plans.ts) 并创建匹配商品。
2. 在本地或部署密钥设置中填写 `CREEM_API_KEY`、`CREEM_WEBHOOK_SECRET` 和选中的 `CREEM_PRODUCT_*`。保持 `CREEM_ENVIRONMENT=test`。
3. 将 `/api/webhooks/creem` 注册为 Webhook，订阅 `checkout.completed`、文档列出的 `subscription.*` 生命周期、`refund.created`、`dispute.created`。本地转发使用 [Creem 官方 CLI](https://docs.creem.io/code/cli) 和自己的测试账号。
4. 运行 `pnpm billing:catalog`；确认商品匹配后设置 `BILLING_ENABLED=true`，开始测试支付。
5. 完成[上线检查](./docs/release-checklist.md)。正式收款使用独立 Live 商品、密钥、Webhook secret 和数据库。

支付返回页不授予权益。签名通过的事件会读取 Creem API 的当前事实再同步；试用权益要求完成与账户绑定的结账，并核对 Creem 的试用订阅，到已验证的试用截止时间即结束，除非后续付款得到验证。正式付费权益要求已验证付款、允许的状态、未到期的服务周期以及没有付款冻结。逾期、未付、暂停、到期、取消均关闭权益；退款与争议采取保守冻结，需经营者检查。

身份认证使用 Better Auth，计费授权由服务端的小型 Creem 集成负责；不向浏览器开放通用客户或交易代理。客户 ID 从当前账户推导，订阅 ID 校验归属。并发、异常和限制见[计费设计](./docs/billing.md)。

## 定制与部署

- 公开身份和功能选择：`starter.config.json`，不得放密钥。
- 凭据：本地 `.env` 或部署平台 secret；`.env.example` 只登记变量和占位值。
- 商品目录：`lib/billing/plans.ts`。调整目录时保留历史商品映射。
- 产品功能：`app/dashboard`。每个付费操作的服务端边界调用 `lib/billing/access.ts` 中的 `requirePaidUser()`。
- 界面：`app/globals.css`、`components/ui`、`components/brand.tsx`、`app/icon.svg`。默认英文；中文 README 不代表增加运行时中文路由。
- 收款前用自己的政策和联系信息替换 `/terms`、`/privacy`、`/refunds`、`/contact` 占位页面。
- 分析关闭时不加载 SDK；启用后只在获得同意的公开白名单页面加载。URL 查询参数、认证、账户和后台页面不采集，录屏关闭。

[Vercel 与 Docker 部署](./docs/deployment.md)涵盖运行时密钥、公开构建设置、数据库迁移、代理信任和邮件/OAuth 回调。两种部署目标均使用 Node.js，不包含媒体或 worker 流水线。

## 命令

| 命令                                                         | 用途                       |
| ------------------------------------------------------------ | -------------------------- |
| `node scripts/setup.mjs`                                     | 交互安装                   |
| `node bin/create.mjs ../my-app`                              | 创建并安装干净项目         |
| `pnpm dev` / `pnpm build` / `pnpm start`                     | 开发、构建、运行           |
| `pnpm db:generate` / `pnpm db:migrate`                       | 生成、应用 Drizzle 迁移    |
| `pnpm db:studio`                                             | 本地数据库查看，勿公开端口 |
| `pnpm admin:grant --email …` / `pnpm admin:revoke --email …` | 显式授予、撤销权限         |
| `pnpm billing:catalog`                                       | 只读检查 Provider 商品     |
| `pnpm env:check`                                             | 配置、重复变量与缺失项检查 |
| `pnpm typecheck` / `pnpm test`                               | 类型与回归检查             |
| `pnpm security:check`                                        | 基础密钥及公开文件检查     |
| `pnpm audit --audit-level high`                              | 依赖安全公告               |

## 验证范围

包含计费策略、原始签名、安装配置验证测试，以及需显式启用的隔离 Postgres 集成测试。实际执行记录和限制见 [docs/verification.md](./docs/verification.md)。自动化 fixture 不代表真实 Creem 支付、外部邮件或 OAuth 已成功；上线前必须在自己的账号验证完整订阅生命周期。

## 代表项目

<a href="https://dearune.com">
  <img src="https://dearune.com/brand/dearune-mark.png" alt="Dearune" width="64" />
</a>

[Dearune](https://dearune.com)

公开发布为 GitHub 模板的步骤见 [docs/publishing.md](./docs/publishing.md)。

## 许可证

MIT。保留 [LICENSE](./LICENSE) 和 [NOTICE](./NOTICE)。Creem、Better Auth、Vercel 商标属于各自权利人。安全问题遵循 [SECURITY.md](./SECURITY.md) 私下报告。
