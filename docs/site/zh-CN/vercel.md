# 在 Vercel 部署完整应用

GitHub Deploy 按钮创建无需凭据的演示，默认 `DEMO_MODE=true`、`BILLING_ENABLED=false`。该模式下账户、结账、后台变更和 Webhook 均不可用。要运行自己的产品，请连接自己的代码仓库，并按以下步骤配置完整应用。

## 1. 导入代码仓库

在 Vercel 中从自己的 GitHub 仓库创建项目。保留自动识别的 Next.js 框架、仓库固定的 pnpm 版本和默认构建命令。在 **Settings → Domains** 添加正式域名，并确定供服务商 callback 使用的稳定 Preview 域名。

## 2. 创建私有 Postgres 数据库

使用 Neon 等服务创建 Postgres 数据库。选择靠近 Vercel Function 区域的节点；如服务商提供连接池，运行时优先使用池化连接地址。为 Preview 和测试单独创建数据库或分支。在 Vercel 添加 `DATABASE_URL`，不要将它放入 `NEXT_PUBLIC_*` 变量或构建参数。

## 3. 添加应用配置和服务凭据

打开 **Project → Settings → Environment Variables**。添加 `BETTER_AUTH_SECRET`、`DATABASE_URL`、`NEXT_PUBLIC_APP_URL`、`DEMO_MODE=false`、`TRUSTED_PROXY=vercel`，以及管理员邮箱列表 `ADMIN_EMAILS`（多个地址用逗号分隔）。`ADMIN_EMAILS` 仅供服务端使用，不要加 `NEXT_PUBLIC_` 前缀。`NEXT_PUBLIC_APP_URL` 填准确的 HTTPS 应用 origin。邮件、OAuth 和收款只添加实际选择的服务所需变量。

使用邮箱密码登录时，配置 Resend 并验证发件域名。使用 Google 或 GitHub 登录时，登记准确的正式环境回调地址：

```text
https://你的域名/api/auth/callback/google
https://你的域名/api/auth/callback/github
```

先使用 `CREEM_ENVIRONMENT=test`、`BILLING_ENABLED=false`。在独立测试环境创建 Test 商品、API key 和 Webhook signing secret，准备好后再开启测试收款。Webhook 地址是：

```text
https://你的域名/api/webhooks/creem
```

[环境配置指南](/docs/environment)详细说明所有变量的来源和保存方式，包括可选分析服务。

## 4. 应用数据库迁移

在可信的发布环境使用私有数据库地址，应用仓库中提交的 Drizzle 迁移：

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
```

让新部署接收流量前先应用所需 schema。迁移凭据保存在可信发布环境中，不能暴露给浏览器。

## 5. 部署与验证

只将变量授权给确实需要的 **Preview** 或 **Production** 环境。数据库、认证密钥、邮件、Creem key、Webhook secret 和商品 ID 应分别使用不同值。保存后创建新部署；更改 Vercel 环境变量不会修改已有部署。

在 Preview 中验证注册与验证邮件、选择的 OAuth provider、用户工作台、Test 结账、签名 Webhook、试用期和后台收款工具。`ADMIN_EMAILS` 中的邮箱完成验证后，首次访问 `/admin` 时会写入数据库管理员角色并记录审计日志。排查配置时，可在可信本地环境运行 `pnpm env:check` 和 `pnpm billing:catalog`。配置检查通过不等于端到端的第三方服务投递已验证。

在选择服务、于 `starter.config.json` 开启对应开关、配置访客同意并重新构建之前，保持可选分析功能关闭。PostHog 使用 `NEXT_PUBLIC_POSTHOG_KEY`，以及可选的 `NEXT_PUBLIC_POSTHOG_HOST`；Vercel Analytics 和 Speed Insights 使用 Vercel 项目开关及应用 feature flag，不需要环境 secret。

## Production 检查清单

- `DEMO_MODE=false`，设置明确的 `NEXT_PUBLIC_APP_URL` 和新生成的 `BETTER_AUTH_SECRET`。
- 私有 Production Postgres，且已应用仓库迁移。
- 部署邮箱密码登录前，验证邮件发件域名。
- OAuth callback 与 Production 域名完全一致。
- Test 流程验证通过后，单独配置 Creem Live 商品、key 与 Webhook。
- `ADMIN_EMAILS` 只包含预期的管理员邮箱；每个账号都必须先完成邮箱验证。
- 检查可选分析开关和访客同意流程。

Creem 订阅流程和 Live 环境见 [Creem 指南](/docs/creem)。开始真实收款前，请阅读[部署运维说明](https://github.com/bugkiwi/creemseed/blob/main/docs/deployment.md)和[发布检查清单](https://github.com/bugkiwi/creemseed/blob/main/docs/release-checklist.md)。
