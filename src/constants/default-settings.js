/**
 * Default settings constants.
 * @author MiSub Team
 */

import { DEFAULT_SUBCONVERTER_BACKEND } from './subconverter-backends.js';

export const DEFAULT_SETTINGS = {
    FileName: 'MiSub-lite',
    mytoken: 'auto',
    profileToken: 'profiles',
    transformConfigMode: 'builtin',
    transformConfig: '',
    ruleLevel: 'std',
    builtinSkipCertVerify: false,
    builtinEnableUdp: true,
    builtinLoonSkipCertVerify: false,
    enableAccessLog: false,
    accessLogPersistenceMode: 'light',
    mergeExpireStrategy: 'max',
    NotifyThresholdDays: 3,
    NotifyThresholdPercent: 90,
    enableTrafficNode: false,
    enableFlagEmoji: true,
    enablePublicPage: true,
    storageType: 'sqlite',
    autoUpdateInterval: 0, // 分钟，0表示禁用自动更新
defaultPrefixSettings: {
enableManualNodes: true,
enableSubscriptions: true,
manualNodePrefix: '\u624b\u52a8\u8282\u70b9',
subscriptionPrefix: '',
prependGroupName: false
},
    manualNodeGroupOrder: [], // 用户自定义的分组顺序
    defaultNodeTransform: {
        enabled: false,
        filter: {
            include: { enabled: false, rules: [] },
            exclude: { enabled: false, rules: [] },
            protocols: { enabled: false, values: [] },
            regions: { enabled: false, values: [] },
            script: { enabled: false, expression: '' },
            useless: { enabled: false }
        },
        rename: {
            regex: { enabled: false, rules: [] },
            script: { enabled: false, expression: '' },
            template: {
                enabled: false,
                template: '{emoji}{region}-{protocol}-{index}',
                indexStart: 1,
                indexPad: 2,
                indexScope: 'regionProtocol',
                regionAlias: {},
                protocolAlias: { hysteria2: 'hy2' }
            }
        },
        dedup: {
            enabled: false,
            mode: 'serverPort',
            includeProtocol: false,
            prefer: { protocolOrder: ['vless', 'trojan', 'vmess', 'hysteria2', 'ss', 'ssr'] }
        },
        sort: {
            enabled: false,
            nameIgnoreEmoji: true,
            keys: [
                { key: 'region', order: 'asc', customOrder: ['\u9999\u6e2f', '\u53f0\u6e7e', '\u65e5\u672c', '\u65b0\u52a0\u5761', '\u7f8e\u56fd', '\u97e9\u56fd', '\u82f1\u56fd', '\u5fb7\u56fd', '\u6cd5\u56fd', '\u52a0\u62ff\u5927'] },
                { key: 'protocol', order: 'asc', customOrder: ['vless', 'trojan', 'vmess', 'hysteria2', 'ss', 'ssr'] },
                { key: 'name', order: 'asc' }
            ]
        }
    },
    nodeTransformPresets: [],
    regionOverrides: [],
    // 公告设置
    announcement: {
        enabled: true,            // 是否启用公告
        title: '2.5 版本更新说明', // 公告标题
        content: 'MiSub-lite 为本地自托管版本（Express + SQLite）：<br><br>• 不依赖 Cloudflare Pages / KV / D1<br>• 内置订阅转换能力<br>• 数据保存在本地 <code>data/misub.sqlite</code><br>• 可用外部 Cron 调用 <code>/cron</code> 做定时刷新',
        type: 'info',             // 类型: 'info' | 'warning' | 'success'
        dismissible: true,        // 是否可关闭
        updatedAt: '2026-04-13T00:00:00.000Z' // 更新时间
    },
    // 留言板设置
    guestbook: {
        enabled: false,
        allowAnonymous: true
    },
    webdavBackup: {
        enabled: false,
        endpoint: '',
        username: '',
        password: '',
        remotePath: '/MiSub-lite',
        filenameTemplate: 'misub-backup-{datetime}.json',
        backupScope: 'dataOnly',
        autoBackup: false,
        interval: 'daily',
        retentionCount: 7,
        lastCheckedAt: null,
        lastBackupAt: null,
        lastBackupStatus: null,
        lastBackupMessage: '',
        lastBackupFile: ''
    },
    externalApi: {
        enabled: false,
        tokens: [
            {
                name: 'default',
                token: ''
            }
        ]
    },
    // 订阅转换设置
    subconverter: {
        engineMode: 'builtin',
        defaultBackend: DEFAULT_SUBCONVERTER_BACKEND,
        defaultOptions: {
            udp: true,
            emoji: true,
            scv: true,
            tfo: false,
            sort: false,
            list: false
        }
    },
    // 自定义公开页
    customPage: {
        enabled: false,
        type: 'html',
        content: '',
        css: '',
        iframeUrl: '',
        iframeHeight: '100vh',
        iframeFullWidth: true,
        iframeAllowFullscreen: true,
        iframeFillViewport: false,
        iframePaddingY: '0px',
        iframeRadius: '0px',
        iframeShadow: false,
        useDefaultLayout: true,
        allowExternalStylesheets: false,
        allowScripts: false,
        hideBranding: false,
        hideHeader: false,
        hideFooter: false
    }
};

export const DEFAULT_NODE_FORM = {
    name: '',
    url: '',
    enabled: true,
    fetchProxy: ''
};

export const DEFAULT_PROFILE_FORM = {
    name: '',
    customId: '',
    transformConfigMode: 'global',
    transformConfig: '',
    ruleLevel: '', // 为空表示跟随全局配置
    subscriptions: [],
    manualNodes: [],
    enabled: true,
prefixSettings: {
enableManualNodes: true,
enableSubscriptions: true,
manualNodePrefix: '\u624b\u52a8\u8282\u70b9',
subscriptionPrefix: '',
prependGroupName: null
},
    subconverter: {
        engineMode: '',
        backend: '',
        options: {
            udp: null,
            emoji: null,
            scv: null,
            sort: null,
            tfo: null,
            list: null
        }
    },
nodeTransform: null,
nodeTransformPresetId: ''
};
