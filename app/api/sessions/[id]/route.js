import { auth } from "@clerk/nextjs/server";
import { getDb, fromRow } from "../../../../lib/db.js";

export async function GET(req, { params }) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    const { id } = params;
    const [row] = await sql`
        SELECT * FROM sessions WHERE id = ${id} AND user_id = ${userId}
    `;
    if (!row) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(fromRow(row));
}

export async function PUT(req, { params }) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    const body = await req.json();
    const { id } = params;

    const [current] = await sql`
        SELECT * FROM sessions WHERE id = ${id} AND user_id = ${userId}
    `;
    if (!current) return Response.json({ error: "Not found" }, { status: 404 });

    const [row] = await sql`
        UPDATE sessions SET
            name             = ${body.name             ?? current.name},
            language_id      = ${body.languageId       ?? current.language_id},
            flavor           = ${body.flavor           ?? current.flavor},
            language_name    = ${body.languageName     ?? current.language_name},
            code             = ${body.code             ?? current.code},
            stdin            = ${body.stdin            ?? current.stdin},
            compiler_options = ${body.compilerOptions  ?? current.compiler_options},
            cmd_arguments    = ${body.cmdArguments     ?? current.cmd_arguments},
            updated_at       = NOW()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
    `;
    return Response.json(fromRow(row));
}

export async function DELETE(req, { params }) {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const sql = getDb();
    const { id } = params;
    await sql`DELETE FROM sessions WHERE id = ${id} AND user_id = ${userId}`;
    return new Response(null, { status: 204 });
}
