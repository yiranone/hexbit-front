# HEXBIT 云计算管理控制台

基于 React、TypeScript、Vite、React Router、Go 和 MySQL 的可操作云控制台。应用直接进入控制台，实例、订单、网络、存储、用户、密钥、告警和账单均通过 Go API 持久化到 MySQL。

## 本地运行

要求 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

默认访问地址：`http://localhost:5173`。

前端生产构建默认通过当前域名的 `/api/v1` 访问后端，开发环境可通过 `VITE_API_BASE_URL=http://127.0.0.1:18080/api/v1` 指向本地 Go 服务。开发控制台自动使用测试账号 `admin` / `admin` 建立后端会话。

## 页面路由

- `/` 控制台首页
- `/compute` 云服务器产品
- `/instances/new` 创建云服务器
- `/instances` 实例管理
- `/instances/:instanceId` 实例详情
- `/network` 网络、子网、公网 IP 与安全组
- `/storage` 云盘管理
- `/resources` 资源组、标签、订阅与配额
- `/monitoring` 云监控与告警
- `/billing` 订单、账单、充值与成本分析
- `/users` 用户与权限
- `/api-keys` API 密钥
- `/help` 帮助中心

## 数据与安全

业务状态由 `src/store.tsx` 通过 `/api/v1/console/state` 读写 MySQL 的 `console_states` 表。每次写入携带 revision 执行乐观锁检查，数据库提交成功后前端才更新；冲突时重新加载数据库版本。每次成功写入还会在同一事务中向 `console_state_changes` 写入操作名称、revision 和状态 SHA-256，用于核对所有菜单的 CRUD 是否真正落库。

LocalStorage 仅保存后端访问令牌，不保存业务数据。API Key Secret 只在创建结果弹窗中完整显示一次，数据库状态只保留脱敏提示。实例登录密码仅用于前端校验，不会写入数据库。

左侧“恢复初始数据”会在二次确认后覆盖当前账号的数据库状态。

## 检查命令

```bash
npm run build
npm run lint
npm test
npx tsc --noEmit --incremental false
```

生产环境部署为标准 Vite SPA，Web 服务器需要将未知路由回退到 `index.html`：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

部署 workflow 会把归档和解包临时目录放在服务器 `/tmp`，然后将内容复制到 `DEPLOY_TARGET_DIR`。目标目录本身必须已存在且对 SSH 用户可写；不再创建 `${DEPLOY_TARGET_DIR}.previous`，因此不要求 SSH 用户拥有目标目录上级目录的写权限。
