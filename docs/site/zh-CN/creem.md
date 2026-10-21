# Creem 收款配置

模板集成 Creem 作为收款平台。周期订阅由服务端商品目录控制，结账由 Creem 托管。请先使用 Test 环境并连接独立测试数据库；Test 凭据和商品无法产生真实扣款。

## 选择计费模式

通过 CLI 或 `starter.config.json` 选择：

- `subscriptions`：月付和年付周期订阅。
- `hybrid`：月付、年付订阅，以及一次性终身权益。
- `onetime`：仅一次性终身权益。

默认订阅示例为每月 **$9.90 USD**、每年 **$99 USD**，均含 **7 天试用期**。`hybrid` 和 `onetime` 使用配置中的终身商品。这些金额是示例；若调整定价，请修改服务端商品目录并在 Creem 创建匹配商品。浏览器传入的金额不会被信任。

## 1. 创建 Test 商品

1. 登录 [Creem](https://www.creem.io)，切换到 **Test mode**。
2. 分别创建月付和年付周期商品。金额、美元币种、税费处理和 7 天试用期要与 `lib/billing/plans.ts` 相符。
3. 若选择 `hybrid` 或 `onetime`，再创建配置金额和币种相符的一次性商品。
4. 将商品 ID 填入本地 `.env` 中对应的 `CREEM_PRODUCT_PRO_MONTHLY`、`CREEM_PRODUCT_PRO_YEARLY`，以及所需的 `CREEM_PRODUCT_LIFETIME`。

修改商品目录时应保留历史商品映射；已有客户订阅后，不要把旧商品 ID 指向含义不同的新套餐。

## 2. 添加 API key 和 Webhook

在 Creem 后台进入 **Developers → API Keys**，将 Test API key 填入 `CREEM_API_KEY`。进入 **Developers → Webhooks**，创建以下端点：

```text
https://你的应用域名/api/webhooks/creem
```

将签名 secret 填入 `CREEM_WEBHOOK_SECRET`。订阅生命周期事件参考 [`docs/billing.md`](https://github.com/bugkiwi/creemseed/blob/main/docs/billing.md#webhook-coverage)，并添加 `checkout.completed`、`refund.created` 与 `dispute.created`。本地开发需要公网可达的 Test Webhook 端点，或 Creem 支持的转发工具。

填写目录配置期间保持 `CREEM_ENVIRONMENT=test`、`BILLING_ENABLED=false`。API key、商品和 Webhook secret 必须全部来自 Test 环境。

## 3. 校验商品并开启 Test 收款

在一个加载了 Test 配置的可信本地终端运行：

```sh
pnpm billing:catalog
```

只读检查会核对商品 ID、环境、币种、价格、周期、税费模式、试用期和不支持的按量收费。先修复所有不一致，再为独立测试部署设置 `BILLING_ENABLED=true` 并重新部署。

验证完整流程：创建账户、发起试用、收到签名 Webhook、检查试用权益、试用结束后的付费续订、周期末取消，并查看客户门户与后台事件记录。仅浏览器返回成功页不会授予权益；服务端必须验证 Creem 状态。

## 管理后台的收款工具

管理员可以查看客户、订阅和未解决的结账记录；检查 Webhook 投递历史；从 Creem 官方 API 同步订阅当前状态；重放符合条件的失败事件。后台操作要求已登录的管理员账户，并写入审计记录。通过文档所述 `pnpm admin:grant` 流程，只为你自己已验证的账户授予角色；公开注册不会创建管理员。

## 切换到 Live

在自己的 Vercel 或 Node 部署上验证 Test 完整流程后，单独创建 Live 商品、API key 和 Webhook 端点。只将这些值添加到目标 Production 环境，确认 `CREEM_ENVIRONMENT=live`、`BILLING_ENABLED=true` 和对应商品 ID，然后重新部署。不要复用 Test secret 或数据库凭据。开始真实收款前请核对[发布检查清单](https://github.com/bugkiwi/creemseed/blob/main/docs/release-checklist.md)。

变量名称与存储位置见[环境变量配置](/docs/environment)。Vercel 环境隔离见 [Vercel 部署](/docs/vercel)。
