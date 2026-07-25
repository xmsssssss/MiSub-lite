import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA_STATEMENTS = [
    `CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_subscriptions_updated_at ON subscriptions(updated_at);`,
    `CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);`,
    `CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON settings(updated_at);`
];

class D1PreparedStatement {
    constructor(db, sql) {
        this.db = db;
        this.sql = sql;
        this.params = [];
    }

    bind(...params) {
        this.params = params;
        return this;
    }

    #runInternal() {
        const stmt = this.db.prepare(this.sql);
        return stmt.run(...this.params);
    }

    #allInternal() {
        const stmt = this.db.prepare(this.sql);
        return stmt.all(...this.params);
    }

    #getInternal() {
        const stmt = this.db.prepare(this.sql);
        return stmt.get(...this.params);
    }

    async first(column) {
        const row = this.#getInternal() || null;
        if (!row) return null;
        if (column) return row[column] ?? null;
        return row;
    }

    async all() {
        const results = this.#allInternal();
        return {
            results: Array.isArray(results) ? results : [],
            success: true,
            meta: {}
        };
    }

    async run() {
        const info = this.#runInternal();
        return {
            success: true,
            meta: {
                changes: info?.changes ?? 0,
                last_row_id: info?.lastInsertRowid ?? 0
            }
        };
    }
}

/**
 * Minimal D1-compatible wrapper over Node's built-in SQLite.
 * Compatible with functions/storage-adapter.js D1StorageAdapter.
 */
export class SqliteD1Database {
    constructor(dbPath) {
        const dir = path.dirname(dbPath);
        fs.mkdirSync(dir, { recursive: true });
        this.db = new DatabaseSync(dbPath);
        this.db.exec('PRAGMA journal_mode = WAL;');
        this.db.exec('PRAGMA foreign_keys = ON;');
        for (const statement of SCHEMA_STATEMENTS) {
            this.db.exec(statement);
        }
    }

    prepare(sql) {
        return new D1PreparedStatement(this.db, sql);
    }

    async exec(sql) {
        this.db.exec(sql);
        return { success: true };
    }

    async batch(statements = []) {
        const results = [];
        this.db.exec('BEGIN');
        try {
            for (const statement of statements) {
                results.push(await statement.run());
            }
            this.db.exec('COMMIT');
            return results;
        } catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
    }

    close() {
        this.db.close();
    }
}

export function createSqliteD1(dbPath) {
    return new SqliteD1Database(dbPath);
}
