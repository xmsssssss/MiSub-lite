import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function buildConfigCandidates() {
    const list = [];
    if (process.env.MISUB_CONFIG_PATH) {
        list.push(process.env.MISUB_CONFIG_PATH);
    }
    list.push(path.join(ROOT, 'config.yaml'));
    list.push(path.join(ROOT, 'data', 'config.yaml'));
    return list;
}

/** config field → process.env key */
export const CONFIG_ENV_MAP = {
    port: 'PORT',
    listenPort: 'PORT',
    host: 'HOST',
    listenIp: 'HOST',
    adminPassword: 'ADMIN_PASSWORD',
    cookieSecret: 'COOKIE_SECRET',
    publicUrl: 'MISUB_PUBLIC_URL',
    callbackUrl: 'MISUB_CALLBACK_URL',
    corsOrigins: 'CORS_ORIGINS',
    dbPath: 'MISUB_DB_PATH',
    dataDir: 'MISUB_DATA_DIR',
    staticDir: 'MISUB_STATIC_DIR',
    enableCron: 'ENABLE_CRON',
    cronType: 'CRON_TYPE',
    cronMaxSyncCount: 'CRON_MAX_SYNC_COUNT',
    cronSyncTimeout: 'CRON_SYNC_TIMEOUT',
    cronEnableParallel: 'CRON_ENABLE_PARALLEL',
    telegramBotToken: 'TELEGRAM_BOT_TOKEN',
    telegramChatId: 'TELEGRAM_CHAT_ID',
    telegramPushBotToken: 'TELEGRAM_PUSH_BOT_TOKEN',
    telegramPushWebhookSecret: 'TELEGRAM_PUSH_WEBHOOK_SECRET',
    telegramPushAllowedUsers: 'TELEGRAM_PUSH_ALLOWED_USERS',
    errorReportUrl: 'VITE_ERROR_REPORT_URL',
    repoUrl: 'MISUB_REPO_URL'
};

function stripBom(raw) {
    return String(raw || '')
        .replace(/^\uFEFF/, '')
        .replace(/[\u200B-\u200D\u2060]/g, '');
}

function readConfigFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const raw = stripBom(fs.readFileSync(filePath, 'utf8'));
        if (!raw.trim()) return {};
        const parsed = yaml.load(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        console.warn(`[Config] Failed to read ${filePath}:`, error?.message || error);
        return null;
    }
}

export function resolveAdminPasswordFromConfig(config = {}) {
    const candidates = [
        config.adminPassword,
        config.password,
        config.admin_password,
        config.ADMIN_PASSWORD
    ];
    for (const value of candidates) {
        if (value === undefined || value === null) continue;
        const text = String(value)
            .replace(/\uFEFF/g, '')
            .replace(/[\u200B-\u200D]/g, '')
            .trim()
            .replace(/^['"]|['"]$/g, '');
        if (text) return text;
    }
    return null;
}

/**
 * Load config.yaml (or MISUB_CONFIG_PATH).
 * Priority: env vars > config file > defaults
 */
export function loadLocalConfigFile() {
    for (const candidate of buildConfigCandidates()) {
        if (!fs.existsSync(candidate)) continue;
        const data = readConfigFile(candidate);
        if (data) {
            return { path: candidate, data, format: 'yaml' };
        }
    }
    return { path: null, data: {}, format: 'yaml' };
}

function stringifyConfigValue(value) {
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
}

export function applyConfigToProcessEnv(config = {}) {
    const normalized = {
        ...config,
        host: config.host ?? config.listenIp ?? config.listenIP,
        port: config.port ?? config.listenPort
    };

    for (const [configKey, envKey] of Object.entries(CONFIG_ENV_MAP)) {
        let value = normalized[configKey];
        if (configKey === 'adminPassword') {
            value = resolveAdminPasswordFromConfig(normalized);
        }
        if (configKey === 'listenIp' || configKey === 'listenPort') continue;
        if (value === undefined || value === null || value === '') continue;
        if (process.env[envKey]) continue;
        process.env[envKey] = stringifyConfigValue(value);
    }
}

export function readAdminPasswordFromDisk() {
    const loaded = loadLocalConfigFile();
    return resolveAdminPasswordFromConfig(loaded.data || {});
}

export function buildInitialSettingsFromConfig(config = {}) {
    const settings = {};

    if (config.siteName) settings.FileName = String(config.siteName).trim();
    if (config.subscriptionToken) settings.mytoken = String(config.subscriptionToken).trim();
    if (config.profileToken) settings.profileToken = String(config.profileToken).trim();
    if (config.customLoginPath) settings.customLoginPath = String(config.customLoginPath).trim().replace(/^\/+/, '');
    if (typeof config.enablePublicPage === 'boolean') settings.enablePublicPage = config.enablePublicPage;
    if (typeof config.enableAccessLog === 'boolean') settings.enableAccessLog = config.enableAccessLog;

    // Local runtime always uses SQLite via D1-compatible adapter.
    // Accept legacy "d1" in old configs; never seed "kv".
    settings.storageType = 'sqlite';

    return settings;
}

export function resolveConfigWritePath(existingPath = null) {
    if (existingPath) return existingPath;
    if (process.env.MISUB_CONFIG_PATH) {
        return path.resolve(process.env.MISUB_CONFIG_PATH);
    }
    return path.join(ROOT, 'config.yaml');
}

export function writeLocalConfigFile(partial = {}, existingPath = null) {
    const target = resolveConfigWritePath(existingPath);
    const current = readConfigFile(target) || {};
    const next = {
        ...current,
        ...partial
    };
    for (const key of Object.keys(next)) {
        if (next[key] === '' || next[key] === undefined || next[key] === null) {
            delete next[key];
        }
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const body = yaml.dump(next, {
        indent: 2,
        lineWidth: 100,
        noRefs: true,
        sortingKeys: false
    });
    fs.writeFileSync(target, body, 'utf8');
    return target;
}

export function hasConfiguredAdminPassword(config = {}, env = process.env) {
    if (env.ADMIN_PASSWORD && String(env.ADMIN_PASSWORD).trim() && String(env.ADMIN_PASSWORD).trim() !== 'admin') {
        return true;
    }
    const fromFile = resolveAdminPasswordFromConfig(config);
    return Boolean(fromFile && fromFile !== 'admin');
}
