import { auth } from "@clerk/nextjs/server";
import { getDb, fromRow } from "../../../lib/db.js";

export async function GET() {
    const { userId } = await auth();
    if (!userId) return Response.json([]);

    const sql = getDb();
    const rows = await sql`
        SELECT * FROM sessions
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
    `;
    return Response.json(rows.map(fromRow));
}

export async function POST(req) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    const body = await req.json();
    const [row] = await sql`
        INSERT INTO sessions (user_id, name, language_id, flavor, language_name, code, stdin, compiler_options, cmd_arguments)
        VALUES (
            ${userId},
            ${body.name || "Untitled Session"},
            ${body.languageId || null},
            ${body.flavor || "CE"},
            ${body.languageName || null},
            ${body.code || ""},
            ${body.stdin || ""},
            ${body.compilerOptions || ""},
            ${body.cmdArguments || ""}
        )
        RETURNING *
    `;
    return Response.json(fromRow(row), { status: 201 });
}
