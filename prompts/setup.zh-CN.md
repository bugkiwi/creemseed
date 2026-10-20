# 使用 AI 安装 Creemseed

将以下内容交给能访问本地仓库的编码助手：

```text
请为我的新项目安装此 Creemseed 模板。源仓库是 https://github.com/bugkiwi/creemseed。
如果还没有本地副本，先询问目标空目录，再克隆仓库；已有副本则直接使用。

先阅读 AGENTS.md、SECURITY.md、docs/setup.md、scripts/setup-schema.mjs。
应用配置前，先询问以下实际场景，可合并简短问题，并说明选项的影响：

1. 项目名称、描述、本地或生产访问地址。
2. 数据库：Docker 本地 Postgres，还是已有的私有 Postgres？
3. 登录：邮箱密码、Google、GitHub，还是向导支持的组合？
4. 邮件：仅开发 localhost 的终端链接，还是 Resend？说明部署后的密码登录
   需要 Resend；仅社交登录时询问是否需要认证邮件。
5. 计费：默认订阅、订阅加一次性，还是仅一次性？确认套餐名称、金额、币种；
   默认包含月付、年付。
6. 分析：默认全部关闭，或 PostHog、Vercel Analytics、Speed Insights 的组合？
   选择 PostHog 时询问 EU/US/自定义采集地址。分析仍需访客同意。
7. 部署：Vercel，还是独立 Node/Docker？自托管时确认代理是否覆盖客户端 IP 头。

不要在对话中索取密钥。让我直接在本地 .env 或部署 secret 中填写 API key、
数据库 URL、OAuth secret、邮件设置和商品 ID；不要读取回显、打印、提交它们，
也不能写入选择 JSON。

我回答后，按共用 schema 生成完整、不含密钥的配置，并用 setup-schema.mjs 校验。
通过 node scripts/setup.mjs --config /absolute/path/to/choices.json --yes
--url <选择的地址> 应用；若我要求新目录，则使用 node bin/create.mjs <空目录>
和同样的参数。保留已有 .env，说明场景变化后需要我在本地更新的值。
缺少前置工具时用 --skip-install 或 --skip-db，并列出剩余的准确命令，
不要声称外部账号已经配置成功。

完整应用使用 DEMO_MODE=false；如果我只需要不接账号和支付的公开演示，则选择 DEMO_MODE=true。
初始保持 CREEM_ENVIRONMENT=test、BILLING_ENABLED=false。未经我明确指示，
不要创建正式商品、公开部署、授予管理员、发布 GitHub/npm 或真实收费。
说明如何为我已经验证的账户运行 admin:grant。

如果我要求不同价格，修改服务端目录并给出匹配的 Creem 商品设置。
试用、席位、按量计费不在模板范围，除非我明确要求实现；不能假装已有支持。

配置公开功能和文档中的环境变量占位项，安装后执行适当本地检查。
最后只报告实际执行和未执行的检查、启动命令、待完成的 Provider 配置，不暴露密钥。
```
