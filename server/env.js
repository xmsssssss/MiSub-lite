import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSqliteD1 } from './sqlite-d1.js';
import {
    applyConfigToProcessEnv,
    buildInitialSettingsFromConfig,
    loadLocalConfigFile,
    readAdminPasswordFromDisk,
    resolveAdminPasswordFromConfig,
    writeLocalConfigFile
} from './config-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
export function resolveDataDir() {
    return process.env.MISUB_DATA_DIR
        ? path.resolve(process.env.MISUB_DATA_DIR)
        : path.join(ROOT, 'data');
}

export function resolveDbPath() {
    return process.env.MISUB_DB_PATH
        ? path.resolve(process.env.MISUB_DB_PATH)
        : path.join(resolveDataDir(), 'misub.sqlite');
}

export function resolveStaticDir() {
    return process.env.MISUB_STATIC_DIR
        ? path.resolve(process.env.MISUB_STATIC_DIR)
        : path.join(ROOT, 'dist');
}

async function seedSettingsIfEmpty(db, config = {}) {
    try {
        const row = await db.prepare('SELECT value FROM settings WHERE key = ?')
            .bind('main')
            .first();
        if (row?.value) return false;

        const initial = buildInitialSettingsFromConfig(config);
        if (!Object.keys(initial).length) {
            initial.storageType = 'd1';
            initial.FileName = 'MiSub-lite';
        }

        await db.prepare(`
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        `).bind('main', JSON.stringify(initial)).run();

        console.log('[MiSub-lite] seeded initial settings from config');
        return true;
    } catch (error) {
        console.warn('[MiSub-lite] seed settings skipped:', error?.message || error);
        return false;
    }
}

function pickEnv(name) {
    const value = process.env[name];
    if (value === undefined || value === null || String(value).trim() === '') return undefined;
    return String(value);
}

/**
 * Build a Cloudflare-like env object for existing functions/* code.
 */
export function createLocalEnv(options = {}) {
    const loaded = options.configLoaded || loadLocalConfigFile();
    applyConfigToProcessEnv(loaded.data || {});

    const dbPath = options.dbPath || resolveDbPath();
    const staticDir = options.staticDir || resolveStaticDir();
    const db = options.db || createSqliteD1(dbPath);
    const configPath = loaded.path;
    const configData = loaded.data || {};
    const fileAdminPassword = resolveAdminPasswordFromConfig(configData);

    // Fire-and-forget seed (sync enough for first request after listen, but run now)
    seedSettingsIfEmpty(db, configData);

    // Mark whether ADMIN_PASSWORD came from real OS env before config injection
    if (!process.env.ADMIN_PASSWORD_FROM_SYSTEM && process.env.ADMIN_PASSWORD && !fileAdminPassword) {
        process.env.ADMIN_PASSWORD_FROM_SYSTEM = '1';
    }

    return {
        MISUB_DB: db,
        MISUB_RUNTIME: 'node-local',
        MISUB_DB_PATH: dbPath,
        MISUB_STATIC_DIR: staticDir,
        MISUB_CONFIG_PATH: configPath || undefined,
        ADMIN_PASSWORD: fileAdminPassword || pickEnv('ADMIN_PASSWORD'),
        COOKIE_SECRET: pickEnv('COOKIE_SECRET'),
        CORS_ORIGINS: pickEnv('CORS_ORIGINS'),
        MISUB_PUBLIC_URL: pickEnv('MISUB_PUBLIC_URL'),
        MISUB_CALLBACK_URL: pickEnv('MISUB_CALLBACK_URL'),
        ENABLE_CRON: pickEnv('ENABLE_CRON'),
        CRON_TYPE: pickEnv('CRON_TYPE'),
        CRON_MAX_SYNC_COUNT: pickEnv('CRON_MAX_SYNC_COUNT'),
        CRON_SYNC_TIMEOUT: pickEnv('CRON_SYNC_TIMEOUT'),
        CRON_ENABLE_PARALLEL: pickEnv('CRON_ENABLE_PARALLEL'),
        TELEGRAM_BOT_TOKEN: pickEnv('TELEGRAM_BOT_TOKEN'),
        TELEGRAM_CHAT_ID: pickEnv('TELEGRAM_CHAT_ID'),
        TELEGRAM_PUSH_BOT_TOKEN: pickEnv('TELEGRAM_PUSH_BOT_TOKEN'),
        TELEGRAM_PUSH_WEBHOOK_SECRET: pickEnv('TELEGRAM_PUSH_WEBHOOK_SECRET'),
        TELEGRAM_PUSH_ALLOWED_USERS: pickEnv('TELEGRAM_PUSH_ALLOWED_USERS'),
        async readLocalAdminPassword() {
            return readAdminPasswordFromDisk();
        },
        async persistLocalAdminPassword(password) {
            writeLocalConfigFile({ adminPassword: password }, configPath);
            process.env.ADMIN_PASSWORD = password;
        },
        async persistLocalCookieSecret(secret) {
            writeLocalConfigFile({ cookieSecret: secret }, configPath);
            process.env.COOKIE_SECRET = secret;
        },
        async persistLocalConfig(partial = {}) {
            writeLocalConfigFile(partial, configPath);
            applyConfigToProcessEnv(partial);
        }
    };
}
