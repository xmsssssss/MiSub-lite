# MiSub-lite

Self-hosted subscription manager (Express + SQLite).  
Fork / derived from [MiSub](https://github.com/imzyb/MiSub).

中文：[README-zh.md](README-zh.md)

---

## Overview

MiSub-lite is a **local** panel for managing proxy subscriptions and nodes. You collect airport feeds and manual nodes, group them into profiles, process them (filter / rename / sort / dedupe), and serve client-ready subscription links.

| Layer | Stack |
|-------|--------|
| Frontend | Vue 3 · Vite · Pinia · Tailwind |
| Backend | Node.js Express (reuses business modules under `functions/`) |
| Storage | Local SQLite (`data/misub.sqlite`) |
| Config | `config.yaml` or first-run setup wizard |

**Not required:** Cloudflare Pages / Workers / KV / D1.

Typical flow: add subscriptions or nodes → create a profile → optional operator chain → copy Clash / Sing-Box / Surge / … links.

---

## Deploy

### Node.js

```bash
git clone https://github.com/xmsssssss/MiSub-lite.git
cd MiSub-lite
npm install
npm run build
npm run start
```

Open `http://127.0.0.1:8787`  
Config: `copy config.example.yaml config.yaml`

### Docker

```bash
docker compose up -d --build
```

Open `http://127.0.0.1:8787`

---

## Credits

- Based on [MiSub](https://github.com/imzyb/MiSub) by imzyb  
- Upstream lineage: [CF-Workers-SUB](https://github.com/cmliu/CF-Workers-SUB)

---

## License

[MIT](LICENSE)
