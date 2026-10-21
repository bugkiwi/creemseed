# Creemseed 文档

Creemseed 是默认英文、MIT 许可的 Next.js 付费产品模板，组合了 Better Auth、Postgres、Drizzle、Creem 收款、用户工作台和管理员操作后台。

选择开始方式：

- [查看功能说明](/docs/features)
- [通过命令行安装](/docs/manual-install)
- [通过 AI 编码助手安装](/docs/ai-install)
- [配置所有环境变量](/docs/environment)
- [设置 Creem 商品和 Webhook](/docs/creem)
- [部署完整应用到 Vercel](/docs/vercel)

公开 Vercel 网站是功能演示。点击 [GitHub 模板](https://github.com/bugkiwi/creemseed/generate)可创建自己的代码仓库。Deploy 按钮创建的是无需凭据的独立演示副本；若要运行完整应用，请按 Vercel 指南继续配置。

## 先选择实际场景

安装时需要选择登录方式、数据库、邮件服务、计费模式、可选分析服务和部署目标。默认面向包含月付与年付订阅的完整应用。数据库可以使用 Docker 本地 Postgres，也可以连接已有的私有 Postgres。

CLI 和 AI 安装共用同一份配置结构与安装脚本。它们会创建本地项目配置，但不会代替你创建第三方服务账号，也不会擅自启用正式收款。服务密钥保存在被 Git 忽略的 `.env` 或部署平台的 secret manager 中。

## 项目范围

Creemseed 面向个人账户付费的产品，包含用户账户区、周期订阅、可选一次性收费，以及供管理员检查和恢复收款事件的工具。它不包含团队、席位、按量计费或后台任务平台。

继续阅读[功能说明](/docs/features)，或开始[手动安装](/docs/manual-install)。
