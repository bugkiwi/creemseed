# 手动与 CLI 安装

本指南适合希望自己选择应用方案，并在本地运行安装脚本的用户。交互式向导会先询问项目场景，再修改项目文件。

## 1. 创建自己的代码仓库

在 [GitHub](https://github.com/bugkiwi/creemseed/generate) 点击 **Use this template**，创建自己的仓库。克隆新仓库并进入目录：

```sh
git clone https://github.com/你的账号/你的仓库.git
cd 你的仓库
```

也可以先克隆模板源代码进行体验：

```sh
git clone https://github.com/bugkiwi/creemseed.git
cd creemseed
```

## 2. 安装前置工具

- Node.js **22.18 或更高的 22.x 版本**，或 Node.js 24。
- pnpm **12.4.2**，版本已在 `package.json` 中固定。
- 仅选择 Docker 本地 Postgres 时需要 Docker Desktop 或 Docker Engine。

## 3. 运行交互式安装

```sh
node scripts/setup.mjs
```

向导会要求你选择：

| 配置   | 选项                                                       |
| ------ | ---------------------------------------------------------- |
| 项目   | 名称、简短描述和应用访问地址                               |
| 数据库 | Docker 本地 Postgres，或已有的私有 Postgres 数据库         |
| 登录   | 邮箱密码、Google、GitHub 或支持的组合                      |
| 邮件   | 本地终端输出或 Resend                                      |
| 计费   | 订阅、订阅加一次性收费，或仅一次性收费                     |
| 分析   | 关闭，或自由组合 PostHog、Vercel Analytics、Speed Insights |
| 部署   | Vercel 或独立 Node/Docker                                  |

脚本会安装依赖、更新 `starter.config.json`、将新的本地配置写入 Git 忽略的 `.env`，并可启动本地 Postgres 容器及应用迁移。已有 `.env` 会保留。脚本不会创建服务商账号、代填密钥、创建管理员或开启 Live 收款。

## 4. 在本地填写服务凭据

用本地编辑器打开 `.env`，只填写你所选功能需要的变量，并确保文件不会提交到 Git。如果选择已有 Postgres，请先把私有连接地址填入 `DATABASE_URL`，再执行迁移。

[环境变量指南](/docs/environment)逐项说明变量获取位置、OAuth callback 注册、Resend 与 Creem 配置，以及 Vercel 自动提供的变量。安装向导会先使用 Creem Test 环境并关闭计费。测试结账前请阅读 [Creem 指南](/docs/creem)。

## 5. 启动应用

```sh
pnpm dev
```

若使用 Docker 本地 Postgres，向导会启动数据库并应用已提交的迁移。选择已有数据库或跳过数据库配置时，填写 `DATABASE_URL` 后运行：

```sh
pnpm db:migrate
```

然后检查所选配置：

```sh
pnpm env:check
```

## 非交互 CLI 与创建另一份副本

自动化安装请准备一份不含 secret 的 JSON 配置，结构见 [`docs/setup.md`](https://github.com/bugkiwi/creemseed/blob/main/docs/setup.md#explicit-unattended-configuration)。脚本会拒绝缺少或未识别的配置；`--yes` 不会替你猜测实际场景。

```sh
node scripts/setup.mjs --config /absolute/path/to/choices.json --yes \
  --url http://localhost:3000
```

要将当前模板复制到一个新的空目录并在那里安装：

```sh
node bin/create.mjs ../my-app
```

命令只复制白名单中的模板文件。目标目录必须为空；`.env`、Git 历史、依赖、构建结果和本地素材不会被复制。可在目录参数后附加 setup 选项，详见 `node bin/create.mjs --help`。

## 部署前检查

创建自己的数据库和服务商应用；本地、Preview、Production 使用不同密钥。先用 Creem Test 凭据测试。在你自己的部署中验证结账、签名 Webhook、试用权益、取消和账户访问后，再启用 Live 收款。继续阅读 [Vercel 部署](/docs/vercel)。
