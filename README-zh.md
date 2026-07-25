# MiSub-lite

本地自托管订阅管理（Express + SQLite）。  
衍生自 [MiSub](https://github.com/imzyb/MiSub)。

English: [README.md](README.md)

---

## 简介

MiSub-lite 是一套**可本地运行**的代理订阅管理面板：汇总机场订阅与手动节点，按场景组成订阅组（Profile），经过滤 / 重命名 / 排序 / 去重等处理后，生成各客户端可用的订阅链接。

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 · Vite · Pinia · Tailwind |
| 后端 | Node.js Express（复用 `functions/` 业务模块） |
| 存储 | 本地 SQLite（`data/misub.sqlite`） |
| 配置 | `config.yaml` 或首次引导页 |

**不依赖** Cloudflare Pages / Workers / KV / D1。

常见流程：添加订阅或节点 → 创建订阅组 → 可选操作符链 → 复制 Clash / Sing-Box / Surge 等链接。

---

## 部署

### Node.js

```bash
git clone https://github.com/xmsssssss/MiSub-lite.git
cd MiSub-lite
npm install
npm run build
npm run start
```

浏览器打开 `http://127.0.0.1:8787`  
配置：`copy config.example.yaml config.yaml`

### Docker

```bash
docker compose up -d --build
```

浏览器打开 `http://127.0.0.1:8787`

---

## 引用 / 致谢

- 基于 [MiSub](https://github.com/imzyb/MiSub)（imzyb）  
- 上游渊源：[CF-Workers-SUB](https://github.com/cmliu/CF-Workers-SUB)

---

## 版权 / License

[MIT](LICENSE)
