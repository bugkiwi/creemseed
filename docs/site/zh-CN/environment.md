# 环境变量与第三方服务配置

本指南逐项说明 `.env.example`、安装向导生成的本地变量，以及 Vercel 自动提供的值。也可以切换到 [English](/docs/environment?lang=en)，默认显示英文。

## 开始前

先在 `starter.config.json` 选择应用形态：登录方式、邮件服务、计费方式、可选分析服务和部署目标。单独填写某个密钥并不会启用对应功能。例如，只有在 `auth` 中选择 `google` 才会使用 Google 凭据；PostHog 还需要启用功能开关；收款则需要 `BILLING_ENABLED=true` 且商品目录校验通过。

交互式安装会询问这些选择：

```sh
node scripts/setup.mjs
```

AI 安装也会先询问相同的场景，并调用同一份安装脚本。无人值守安装见[手动安装指南](/docs/manual-install)，部署步骤见 [Vercel 部署指南](/docs/vercel)。

### 环境要隔离

本地开发、Vercel Preview 和 Vercel Production 使用各自的凭据，最好也使用各自的数据库。Creem Test 的密钥、商品和 Webhook 端点要配套；Live 的密钥、商品和端点也要配套。不要在 Preview 使用 Live 密钥，也不要在 Production 使用 Test Webhook secret。

| 应用运行环境      | `DEMO_MODE`                                    | Creem                             | 数据库                    |
| ----------------- | ---------------------------------------------- | --------------------------------- | ------------------------- |
| 公开演示站        | `true`                                         | 不使用，保持关闭                  | 不需要                    |
| 本地开发          | `false`                                        | 初始使用 Test，配置完成前关闭支付 | 本地或开发数据库          |
| Vercel Preview    | 真实测试应用使用 `false`                       | 仅 Test                           | 独立的 Preview/测试数据库 |
| Vercel Production | 上线批准前使用 Test；准备真实收款后才切换 Live | 生产数据库                        |

公开演示站默认 `DEMO_MODE=true`、`BILLING_ENABLED=false`。完整应用需要自己的数据库、认证密钥、发件人域名和服务凭据。

## 在 Vercel 中填写

1. 打开 **Vercel Dashboard → 你的项目 → Settings → Environment Variables**。
2. 按下面的准确名称新增变量，并明确选择 **Development**、**Preview**、**Production** 中哪些环境可以使用它。Preview 不要连接生产数据或使用 Live 支付凭据。
3. 保存后创建一次新部署。环境变量变化不会修改已经生成的部署。
4. 本地使用时，先在仓库目录执行 `vercel link`，再只下载 Development 环境变量到被 Git 忽略的文件：

   ```sh
   vercel env pull .env.local
   ```

   Next.js 会读取 `.env.local`。使用 `dotenv` 的项目脚本（例如数据库迁移）需要显式指向相同文件：

   ```sh
   DOTENV_CONFIG_PATH=.env.local pnpm db:migrate
   DOTENV_CONFIG_PATH=.env.local pnpm env:check
   ```

   安装向导则会写入 `.env`。不要将生产环境变量导出覆盖本地配置，也不要提交这两个文件。

通过 Vercel 后台或 CLI 输入密钥。不要把密钥粘贴到 GitHub、issue、聊天提示词、截图或公开配置中。`NEXT_PUBLIC_*` 会进入浏览器构建产物，只能放公开值。

## 应用基础设置

| 变量                  | 何时需要                             | 获取方式与设置步骤                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | 所有完整应用需要；无凭据演示站可省略 | 设置为你拥有的规范 origin，例如 `https://app.example.com`。还没有自定义域名时可用 Vercel 生产域名。不要添加路径、查询参数、用户名密码或尾部路由。本地开发用 `http://localhost:3000`。该值是公开信息，用来生成认证回调和规范链接。各部署环境的回调域名不同时，应分别配置对应 origin。                                               |
| `DEMO_MODE`           | 每个部署环境都应明确设置             | 只有完全不提供账户和收款的公开预览才选 `true`。自己的完整应用选 `false`。Vercel Deploy 按钮默认 `true`；CLI 安装向导创建完整应用。构建和运行环境都应设置此值，然后重新部署。演示模式下认证、支付、后台写操作和 Webhook API 都不可用。                                                                                              |
| `DATABASE_URL`        | 完整应用需要                         | 在 Neon 等数据库服务商创建 PostgreSQL 数据库，从服务商的 **Connect** 页面复制连接 URI。Vercel Serverless 运行时优先使用服务商提供的 pooled/pooler 连接串。保留用户名、密码、主机、端口和数据库名；凭据中如有保留字符，应进行 URL 编码。示例中的连接串是占位内容。                                                                  |
| `BETTER_AUTH_SECRET`  | 完整应用需要                         | 在本地生成一个新的随机值，例如运行 `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`。将结果直接保存到 Vercel 或本地密钥管理器。不要复用示例值、其他项目的值，也不要让无关项目共用同一个值。长度至少 32 个字符。                                                                                    |
| `ADMIN_EMAILS`        | 可选的管理员初始化名单               | 设置为逗号分隔的管理员邮箱列表，例如 `you@example.com,ops@example.com`。匹配的账号必须已注册并验证邮箱；首次访问 `/admin` 时会将管理员角色写入 Postgres 并记录审计日志。此变量仅供服务端使用，不能加 `NEXT_PUBLIC_` 前缀。删除邮箱并重新部署不会撤销已存储的角色；需先从列表移除、重新部署，再运行 `pnpm admin:revoke --email …`。 |
| `TRUSTED_PROXY`       | 本地可选；部署时按实际代理设置       | 确实通过 Vercel 接收请求时设置为 `vercel`。仅当代理会覆盖该请求头且应用不允许绕过代理直连时，才设置 `x-real-ip`。其他情况设为 `none`。此设置决定限流信任哪个客户端 IP 请求头，不能替代边缘限流规则。                                                                                                                               |

### 在 Vercel 上使用 Postgres

在数据库服务商创建数据库，选择靠近 Vercel Functions 区域的位置，并将 pooled 连接串填入 `DATABASE_URL` 供 Vercel Serverless 运行时使用。为本地/Preview 准备独立数据库或分支；不要让 Preview 访问生产数据。切换新 schema 前，在可信的发布步骤里执行仓库内的迁移。Neon 用户可参阅 [Neon 连接指南](https://neon.com/docs/connect/connect-from-any-app) 和[连接池指南](https://neon.com/docs/connect/connection-pooling)。

## Creem 收款

先从 Test 环境开始。可用 Vercel Preview 测试，但必须连接测试数据库和 Test 凭据。模板内置订阅商品期望为 Pro **每月 9.90 美元**和**每年 99 美元**，USD、循环计费、含税且带 **7 天试用期**。`hybrid` 和 `onetime` 还需要一个 **299 美元的一次性**商品。如果修改了 `lib/billing/plans.ts`，Creem 后台商品也必须匹配。

| 变量                        | 何时需要                                 | 获取方式与设置步骤                                                                                                                                                                                                                                                                                                                                |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CREEM_ENVIRONMENT`         | 完整应用需要；初次配置用 `test`          | 只能选 `test` 或 `live`。该值决定 Creem API 环境，并会与 API key 和商品环境核对。Test 和 Live 完全隔离，不能交叉使用各自的 key。                                                                                                                                                                                                                  |
| `BILLING_ENABLED`           | 每个部署环境都应明确设置                 | 创建商品、配置 Webhook、检查凭据时保持 `false`。只有 `pnpm billing:catalog` 在目标环境通过，且测试过结账和 Webhook 后，才改为 `true`。演示模式必须保持 `false`。                                                                                                                                                                                  |
| `CREEM_API_KEY`             | 收款开启时需要                           | 在 [Creem 后台](https://www.creem.io)切换到正确的 Test 或 Production 模式，打开 **Developers → API Keys**，复制该环境的 API key。Test 和 Live key 不同。在 Vercel 中将其作为敏感变量保存。                                                                                                                                                        |
| `CREEM_WEBHOOK_SECRET`      | 收款开启时需要                           | 在 Creem 打开 **Developers → Webhooks**，创建端点 `https://你的域名/api/webhooks/creem`，复制该端点的签名 secret。事件选择[计费运维文档](https://github.com/bugkiwi/creemseed/blob/main/docs/billing.md#webhook-coverage)列出的订阅事件，以及 `checkout.completed`、`refund.created`、`dispute.created`。Test 和 Production 端点有各自的 secret。 |
| `CREEM_PRODUCT_PRO_MONTHLY` | `subscriptions` 或 `hybrid` 计费模式需要 | 在与 API key 相同的 Creem 环境创建月付订阅商品。金额、美元币种、税费模式和 7 天试用必须与代码商品目录相符。从商品详情页复制商品 ID（通常以 `prod_` 开头）。                                                                                                                                                                                       |
| `CREEM_PRODUCT_PRO_YEARLY`  | `subscriptions` 或 `hybrid` 计费模式需要 | 在相同环境创建年付订阅商品，确保金额、美元币种、税费模式和 7 天试用与代码一致，再复制商品 ID。                                                                                                                                                                                                                                                    |
| `CREEM_PRODUCT_LIFETIME`    | `hybrid` 或 `onetime` 计费模式需要       | 在相同环境创建一次性商品。金额、币种和税费配置应匹配 `lib/billing/plans.ts`，然后复制商品 ID。仅订阅模式不需要填写。                                                                                                                                                                                                                              |

商品和变量都配置好后，用目标环境的凭据在本地运行只读商品检查：

```sh
pnpm billing:catalog
```

它会核对商品 ID、环境、币种、周期、金额、税费、试用期和按量价格。通过后，才在对应 Vercel 环境启用支付并重新部署，然后用 Creem Test Mode 测试结账。浏览器返回成功页不等于完成付款；需要验证签名 Webhook。切换 Live 前阅读[发布检查清单](https://github.com/bugkiwi/creemseed/blob/main/docs/release-checklist.md)。

Creem 后台入口和 API key 位置见官方[后台指南](https://docs.creem.io/getting-started/dashboard-overview)、[Test Mode 指南](https://docs.creem.io/getting-started/test-mode)与 [Webhook 指南](https://docs.creem.io/code/webhooks)。

## Resend 邮件

本地开发可以使用 `console` 邮件模式。部署后的邮箱密码登录需要真实邮件服务；当前配置选择 Resend。仅社交登录且不发送其他事务邮件时，可以不配置 Resend。

| 变量             | 何时需要                                 | 获取方式与设置步骤                                                                                                                                                                                                                     |
| ---------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY` | `starter.config.json` 选择 Resend 时需要 | 创建或选择 Resend 项目，打开 **API Keys**，创建一把仅具备发送所需权限的 key。复制并保存为敏感密钥。不要把其他服务的个人 API key 填在这里。                                                                                             |
| `EMAIL_FROM`     | 选择 Resend 时需要                       | 在 Resend 的 **Domains** 中添加你拥有的域名；把 Resend 展示的 DNS 记录原样添加到域名 DNS 服务商，并等待验证完成。填写该已验证域名下的发件地址，例如 `My App <no-reply@mail.example.com>`。不要用未验证域名或公共邮箱域名作为发件地址。 |

参阅 Resend 官方 [API key 指南](https://resend.com/docs/dashboard/api-keys/introduction)和[已验证域名指南](https://resend.com/docs/dashboard/domains/introduction)。事务邮件可考虑使用独立子域名，以便隔离发信信誉。

## 可选 Google 与 GitHub 登录

只有在 `starter.config.json` 的 `auth` 数组中加入 `google` 或 `github` 并重新部署后，登录页才会显示对应登录方式。若本地和生产回调域名不同，建议分别创建 OAuth 应用或客户端。

### 创建 Google OAuth 应用

本模板使用 Better Auth 的服务端 OAuth 重定向流程。Google 会把用户送回下方准确的 callback 地址；项目没有使用 Google 浏览器端 JavaScript 登录 SDK。

1. **在应用中选择 Google 登录。** 运行 `node scripts/setup.mjs` 并选择 Google，或在 `starter.config.json` → `auth` 中加入 `google`。配置时，`NEXT_PUBLIC_APP_URL` 应是当前环境的 origin。
2. **创建或选择 Google Cloud 项目。** 打开 [Google Cloud Console](https://console.cloud.google.com/)，选择要用于此应用的项目，再进入 **Google Auth Platform**。如果平台要求注册应用，点击 **Get started**。
3. **在 Branding 中填写应用信息。** 使用用户能识别的产品名称，选择有人定期查看的支持邮箱，并填写你控制域名上的公开主页、隐私政策和服务条款链接。控制台要求时，在 **Authorized domains** 中添加相应域名。不要填写占位链接或无法验证归属的域名。
4. **选择受众。** 面向普通 Google 账号用户的产品选择 **External**。只有应用限定给自己 Google Workspace 组织内的成员时才选择 **Internal**。开发阶段保持 **Testing**，并在 **Audience → Test users** 中加入准备测试的 Google 账号。
5. **仅申请必要的数据权限。** 模板的 Google provider 只请求登录所需的标准身份范围：`openid`、`email` 和 `profile`。除非产品确实需要，否则不要增加 Drive、Gmail 或其他 Google API 权限。Google 当前说明：Testing 通常最多支持 100 个已登记测试用户；仅使用基础身份范围的标准 Sign in with Google 请求不受测试用户名单限制，也不会遇到七天授权过期规则。开发阶段仍建议登记测试账号。若增加其他 scope，应重新检查 Audience 和 Verification Center 的要求。
6. **创建 Web OAuth 客户端。** 进入 **Google Auth Platform → Clients → Create client**，选择 **Web application**，并取一个易于识别的名称，例如 `我的应用 – Production`。在 **Authorized redirect URIs** 中添加每个准确 callback：

   ```text
   http://localhost:3000/api/auth/callback/google
   https://你的正式域名/api/auth/callback/google
   ```

   将正式域名替换成 `NEXT_PUBLIC_APP_URL` 中的主机名。仅在 Preview 域名固定且已经登记时才添加对应 callback。本地 localhost 可以使用 HTTP，部署地址必须使用 HTTPS。协议、域名、端口和路径都必须完全一致。**Authorized JavaScript origins** 用于浏览器端 Google API/Identity Services 集成；当前服务端 Better Auth 登录流程不需要填写它。

7. **尽量为不同环境创建不同客户端。** 一个客户端可以登记多个准确 callback；分开创建 Local、Preview、Production 客户端更便于隔离凭据。不要使用通配域名，也不要把 client secret 放入浏览器代码。
8. **保存凭据。** 创建客户端后立即复制 Client ID 与 Client secret。Google 可能只在创建时显示完整 secret；若丢失，可在 Cloud Console 创建或轮换 secret。本地值填写在 Git 忽略的 `.env` 中：

   ```dotenv
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

   Vercel 中进入 **Project → Settings → Environment Variables**，为对应环境添加这两个变量，然后重新部署。

9. **验证 callback。** 在 `http://localhost:3000` 启动应用，从登录页完成 Google 登录；再到已登记的 HTTPS 部署环境测试一次。如果应用仍处于 Testing 且提示测试账号受限，请确认账号已加入 **Audience → Test users**。公开发布前通过 **Publish app** 切换到 Production，并完成 **Verification Center** 显示的事项；是否需要验证取决于应用品牌和请求的 scope。

`GOOGLE_CLIENT_ID` 用于标识 OAuth 客户端，不是密码。`GOOGLE_CLIENT_SECRET` 是仅供服务端使用的密钥：不要提交到 Git、放入 `NEXT_PUBLIC_*` 变量，或粘贴到 AI prompt。步骤会随 Google 控制台更新；请同时参考 Google 官方 [Google Auth Platform 入门](https://support.google.com/cloud/answer/15544987?hl=en)、[Web 客户端和 Branding 指南](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)、[Audience 与 Testing 状态说明](https://support.google.com/cloud/answer/15549945?hl=en)、[OAuth 客户端指南](https://support.google.com/cloud/answer/15549257?hl=en)和[应用验证说明](https://support.google.com/cloud/answer/13461325?hl=en)。

### OAuth 环境变量

| 变量                                        | 需要条件                 | 获取方式与设置步骤                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`                          | `auth` 中选择了 `google` | 从 **Google Auth Platform → Clients** 下对应的 Web 客户端复制。用于标识 OAuth 客户端，可以出现在浏览器端。                                                                                                                                                                                                                                                                                                       |
| `GOOGLE_CLIENT_SECRET`                      | `auth` 中选择了 `google` | 创建 Web 客户端时复制并保存到本地 `.env` 或 Vercel 敏感环境变量中。仅服务端使用；丢失或泄露时应轮换。                                                                                                                                                                                                                                                                                                            |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | `auth` 中选择了 `github` | 在 GitHub 打开 **Settings → Developer settings → OAuth Apps → New OAuth App**。Homepage URL 填应用 origin，Authorization callback URL 填 `https://你的域名/api/auth/callback/github`。本地或其他域名可另建 OAuth App。注册后生成 Client secret，将匹配值填入本地 `.env` 或 Vercel。参阅 GitHub 官方 [OAuth App 创建指南](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)。 |

OAuth origin 和 callback 必须完全匹配，包括协议、域名、端口。不要随意登记 Preview 地址，除非该地址固定且确实由你控制。

## 可选分析服务

分析默认关闭。设置变量本身不会启用分析：先在 `starter.config.json` 开启对应 feature flag，再重新构建。脚本只会在配置的公开营销页面加载；使用仍受你的用户同意流程约束。

| 变量                       | 获取方式与设置步骤                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_POSTHOG_KEY`  | 可选。在 PostHog 创建或选择项目，从项目设置复制项目写入 key。它是浏览器端采集 key，不是个人 API 密钥，但仍应只使用公开项目 key。然后设置 `starter.config.json` → `analytics.posthog` 为 `true`。 |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog 开启后可选。填写项目所在区域的 host（示例默认 `https://eu.i.posthog.com`；若项目在美国或自托管，应改成对应 host）。不要在此变量中填写 API key 或其他 secret。                            |

项目 key 和区域见 [PostHog 项目设置](https://posthog.com/docs/settings/projects)。Vercel Analytics 与 Speed Insights 不需要 `.env` 变量：只需在 `starter.config.json` 分别开启，并在 Vercel 项目里启用对应服务。所有分析服务均为可选。

## 本地 Docker 变量

这些值由交互式安装向导为本地 Postgres 容器生成，不应填写到 Vercel。

| 变量                      | 生成方式                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `LOCAL_POSTGRES_PASSWORD` | 向导为本地 Docker Postgres 随机生成的密码。留在被忽略的本地 `.env` 中，不要用于托管数据库。         |
| `POSTGRES_PORT`           | 向导选择的 loopback 端口；从 54329 开始，如果被占用就向上查找。生成的 `DATABASE_URL` 会使用该端口。 |
| `COMPOSE_PROJECT_NAME`    | 向导根据项目名标准化后加短哈希生成，避免不同目录的 Compose 资源冲突。交给向导管理即可。             |

若向导选择已有 Postgres，则不会生成 Docker 密码、端口和 Compose 项目名。

## Vercel 自动提供的值

Vercel 可能会向部署注入平台系统变量，它们不是需要从 `.env.example` 复制的配置：

- `VERCEL_PROJECT_PRODUCTION_URL`：开启系统变量后由 Vercel 注入。应用仅在无凭据演示模式下用它推导规范 URL。完整应用应明确填写 `NEXT_PUBLIC_APP_URL`。
- `VERCEL_OIDC_TOKEN`：启用 Secure Backend Access / OIDC 联邦时，可能由 Vercel 自动签发。不要自行创建、提交到 Git 或复制到支持请求中。普通运行不需要此变量。
- `NODE_ENV`、`VERCEL_ENV` 等是平台运行/构建元数据，不需要在这里手动配置。

## 检查配置

在项目根目录运行：

```sh
pnpm env:check
pnpm typecheck
```

`pnpm env:check` 会检查所选功能需要的变量、缺失值、URL 形状，以及 `.env` 中的重复/未知变量；它**不会**实际连接数据库、OAuth、邮件服务或 Creem。启用收款还要运行 `pnpm billing:catalog`。上线前应在非生产环境验证邮件收件、所选 OAuth 登录、结账、Webhook 投递、客户门户、续费/取消和后台事件记录。

更改 `starter.config.json`、`NEXT_PUBLIC_*`、OAuth provider、分析开关或演示模式后，重新构建并部署。更改 secret 或仅服务端变量后，也应创建新部署让新值生效。

## 安全清单

- 不要将 `.env`、`.env.local`、`.vercel/`、数据库导出或服务凭据提交到 Git。仓库中只有 `.env.example` 可以包含环境变量名称和空占位值。
- Preview 和 Production 使用不同配置，尤其数据库、认证密钥、Creem key、Webhook secret 和 Resend key。
- 只把 secret 授权给实际需要的 Vercel 环境。Preview 部署里的代码能访问分配给 Preview 的变量。
- 如果密钥被提交、粘贴到公开 issue 或出现在截图中，应在服务商后台撤销并轮换。仅从最新提交删除还不够。
- 不要把密钥交给 AI 助手。可以让助手修改变量名或检查配置形状，但密钥应由你直接输入服务商后台或本地终端。

## 常见问题

| 现象                             | 检查方法                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OAuth 报 `redirect_uri_mismatch` | 服务商登记的 callback 必须准确等于 `NEXT_PUBLIC_APP_URL` 加 `/api/auth/callback/google` 或 `/api/auth/callback/github`。检查协议、域名、端口和 OAuth 应用。 |
| Creem 报商品或 key 环境错误      | 确认 API key、Webhook、商品 ID 和 `CREEM_ENVIRONMENT` 属于同一个 Test 或 Live 环境，然后运行 `pnpm billing:catalog`。                                       |
| 结账不可用                       | 检查 `DEMO_MODE=false`、`BILLING_ENABLED=true`、当前计费模式需要的商品 ID，以及最新部署是否已加载这些值。                                                   |
| Vercel 修改后仍像旧值            | 确认变量已绑定到当前部署对应的环境，然后创建新部署。已有部署仍使用它构建时的变量。                                                                          |
| 密码重置/验证邮件没有到达        | 确认 `EMAIL_FROM` 使用已验证的 Resend 域名、API key 属于对应 Resend 项目、DNS 已验证，并检查服务商的发送日志。                                              |
