// app/api/check-duplicate/route.ts
import { NextResponse } from "next/server"
import sql from "../../../lib/db"

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        const existingResponse = await sql`
        SELECT DISTINCT session_id
        FROM answers
        WHERE email = ${email}
        LIMIT 1
    `

        return NextResponse.json({
            exists: existingResponse.length > 0,
            session_id: existingResponse[0]?.session_id
        })
    } catch (error) {
        console.error("Error checking duplicate response:", error)
        return NextResponse.json(
            { error: "Error al verificar respuesta duplicada" },
            { status: 500 }
        )
    }
}
