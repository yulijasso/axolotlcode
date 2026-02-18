import { neon } from "@neondatabase/serverless";

// Lazy singleton — only initialised on first real API request, not at build time
let _sql = null;
export function getDb() {
    if (!_sql) _sql = neon(process.env.DATABASE_URL);
    return _sql;
}

export function fromRow(row) {
    return {
        id: row.id,
        name: row.name,
        languageId: row.language_id,
        flavor: row.flavor,
        languageName: row.language_name,
        code: row.code,
        stdin: row.stdin,
        compilerOptions: row.compiler_options,
        cmdArguments: row.cmd_arguments,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
    };
}
