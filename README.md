# vinext-starter

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.




## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
# AetherCPU 前端原型

## 自动构建与打包

在项目目录中运行：

```bash
npm run deploy
```

该命令会先构建前端，再生成可交付的部署包：

```text
release/aethercpu-deploy.tar.gz
```

此包包含生产构建产物和 Sites 部署配置。当前命令只完成本地自动打包；接入 Cloudflare、Docker、服务器 SSH 或 CI/CD 后，可在同一流程的最后一步加入实际发布。

## GitHub 自动部署

推送到 `main` 后，GitHub Actions 会自动安装依赖、构建 `dist`、压缩并通过 SSH 部署到服务器。首次启用前，在仓库的 **Settings → Secrets and variables → Actions** 配置：

| 类型 | 名称 | 内容 |
| --- | --- | --- |
| Variable | `DEPLOY_HOST` | 服务器域名或 IP |
| Variable | `DEPLOY_SSH_PORT` | SSH 端口，默认 `22` |
| Variable | `DEPLOY_TARGET_DIR` | 部署目录，例如 `/var/www/hexbit-front` |
| Secret | `DEPLOY_SSH_USER` | 服务器 SSH 用户名 |
| Secret | `DEPLOY_SSH_PRIVATE_KEY` | 对应用户的私钥全文 |

部署工作流先在服务器临时目录解压并校验，再切换到目标目录；旧版本只会在新版本就绪后删除。
