import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyConfigToProcessEnv, loadLocalConfigFile } from './config-loader.js';
import { createLocalEnv, resolveDbPath, resolveStaticDir } from './env.js';
import { isUsingDefaultPassword } from '../functions/modules/utils.js';

const loadedConfig = loadLocalConfigFile();
applyConfigToProcessEnv(loadedConfig.data || {});

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
// 全局请求体上限：readJsonWithLimit 只保护会解析 JSON 的端点，
// 这里在适配层兜底，防止向任意路径 POST 超大 body 打爆内存。
const MAX_REQUEST_BODY_BYTES = 10 * 1024 * 1024;

function nodeHeadersToWeb(headers) {
    const out = new Headers();
    for (const [key, value] of Object.entries(headers || {})) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
            for (const item of value) out.append(key, String(item));
        } else {
            out.set(key, String(value));
        }
    }
    return out;
}

function buildRequestUrl(req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    return `${proto}://${host}${req.originalUrl || req.url}`;
}

async function expressToFetchRequest(req) {
    const method = req.method || 'GET';
    const headers = nodeHeadersToWeb(req.headers);
    const init = { method, headers };

    if (!['GET', 'HEAD'].includes(method.toUpperCase())) {
        const contentLength = Number(req.headers['content-length'] || 0);
        if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
            const error = new Error('Request body too large');
            error.status = 413;
            throw error;
        }
        const chunks = [];
        let total = 0;
        for await (const chunk of req) {
            total += chunk.length;
            if (total > MAX_REQUEST_BODY_BYTES) {
                const error = new Error('Request body too large');
                error.status = 413;
                throw error;
            }
            chunks.push(chunk);
        }
        const body = Buffer.concat(chunks);
        if (body.length > 0) {
            init.body = body;
            init.duplex = 'half';
        }
    }

    return new Request(buildRequestUrl(req), init);
}

async function sendFetchResponse(res, response) {
    res.status(response.status);
    const setCookies =
        typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];

    response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') return;
        res.setHeader(key, value);
    });
    if (setCookies.length > 0) {
        res.setHeader('set-cookie', setCookies);
    }

    if (response.body == null || reqMethodIsHead(res.req)) {
        res.end();
        return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
}

function reqMethodIsHead(req) {
    return String(req?.method || '').toUpperCase() === 'HEAD';
}

function createStaticFetcher(staticDir) {
    return {
        async fetch(request) {
            const url = new URL(request.url);
            let pathname;
            try {
                pathname = decodeURIComponent(url.pathname);
            } catch {
                // 形如 /x%zz.js 的非法编码：按 404 处理而不是抛 500
                return new Response('Not Found', { status: 404 });
            }
            if (pathname === '/') pathname = '/index.html';
            if (pathname.includes('\0')) {
                return new Response('Not Found', { status: 404 });
            }

            const staticRoot = path.normalize(staticDir);
            const candidate = path.normalize(path.join(staticRoot, pathname));
            // [安全] 前缀比较必须带分隔符，否则 dist-old/ 这类同级目录也能通过检查
            if (candidate !== staticRoot && !candidate.startsWith(staticRoot + path.sep)) {
                return new Response('Forbidden', { status: 403 });
            }

            if (!fs.existsSync(candidate) || fs.statSync(candidate).isDirectory()) {
                return new Response('Not Found', { status: 404 });
            }

            const data = fs.readFileSync(candidate);
            const ext = path.extname(candidate).toLowerCase();
            const typeMap = {
                '.html': 'text/html; charset=utf-8',
                '.js': 'application/javascript; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.json': 'application/json; charset=utf-8',
                '.svg': 'image/svg+xml',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.ico': 'image/x-icon',
                '.woff': 'font/woff',
                '.woff2': 'font/woff2',
                '.map': 'application/json',
            };

            return new Response(data, {
                status: 200,
                headers: {
                    'Content-Type': typeMap[ext] || 'application/octet-stream',
                    'Cache-Control':
                        ext === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
                },
            });
        },
    };
}

async function loadOnRequest() {
    const entryPath = path.resolve(process.cwd(), 'functions', '[[path]].js');
    const mod = await import(pathToFileURL(entryPath).href);
    if (typeof mod.onRequest !== 'function') {
        throw new Error('functions/[[path]].js does not export onRequest');
    }
    return mod.onRequest;
}

async function main() {
    const onRequest = await loadOnRequest();
    const staticDir = resolveStaticDir();
    const env = createLocalEnv({ staticDir, configLoaded: loadedConfig });
    env.ASSETS = createStaticFetcher(staticDir);

    // [安全] 仍使用默认密码 admin 时，生成一次性 Setup Token 并打印到控制台。
    // POST /api/setup 必须携带该 token，防止公网部署后被人扫描抢占初始化。
    try {
        if (await isUsingDefaultPassword(env)) {
            const setupToken = crypto.randomUUID().replace(/-/g, '');
            env.MISUB_SETUP_TOKEN = setupToken;
            console.log('');
            console.log(
                '[MiSub-lite] ============================================================'
            );
            console.log('[MiSub-lite]  ⚠ 当前使用默认管理员密码 admin（首次启动未配置）');
            console.log('[MiSub-lite]  🔑 首次初始化 Setup Token（向导页需要，请勿泄露）:');
            console.log(`[MiSub-lite]     ${setupToken}`);
            console.log(
                '[MiSub-lite] ============================================================'
            );
            console.log('');
        }
    } catch (error) {
        console.warn('[MiSub-lite] Setup Token 生成检查失败:', error?.message || error);
    }

    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', true);

    app.use(async (req, res) => {
        try {
            const request = await expressToFetchRequest(req);
            const context = {
                request,
                env,
                next: async () => env.ASSETS.fetch(request),
                waitUntil(promise) {
                    Promise.resolve(promise).catch((error) => {
                        console.error('[waitUntil]', error);
                    });
                },
                passThroughOnException() {},
            };

            const response = await onRequest(context);
            await sendFetchResponse(res, response);
        } catch (error) {
            if (error?.status === 413) {
                res.status(413).json({ error: 'Request body too large' });
                return;
            }
            console.error('[Local Server Error]', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error?.message || String(error),
            });
        }
    });

    app.listen(PORT, HOST, () => {
        const hasPwd = !!(
            env.ADMIN_PASSWORD ||
            loadedConfig.data?.adminPassword ||
            loadedConfig.data?.password
        );
        const displayHost = HOST === '0.0.0.0' ? '127.0.0.1' : HOST;
        console.log(`[MiSub-lite] listen ${HOST}:${PORT}  →  http://${displayHost}:${PORT}`);
        console.log(`[MiSub-lite] sqlite: ${resolveDbPath()}`);
        console.log(
            `[MiSub-lite] config: ${loadedConfig.path || '(none, copy config.example.yaml → config.yaml or use setup wizard)'}`
        );
        console.log(
            `[MiSub-lite] admin password source: ${hasPwd ? 'config/env' : 'default(admin) — open setup wizard'}`
        );
        console.log(
            `[MiSub-lite] static: ${staticDir}${fs.existsSync(staticDir) ? '' : ' (missing, run npm run build)'}`
        );
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
