// app/api/check-duplicate/route.ts
import { NextResponse } from "next/server"
import sql from "../../../lib/db"

export async function POST(req: Request) {
    try {
        const { questionId, answer } = await req.json()

        if (!questionId || !answer) {
            return NextResponse.json(
                { error: "questionId y answer son requeridos" },
                { status: 400 }
            )
        }

        const existingResponse = await sql`
            SELECT 1
            FROM answers
            WHERE question_id = ${questionId}
            AND answer = ${answer}
            LIMIT 1
        `

        return NextResponse.json({
            isDuplicate: existingResponse.length > 0
        })

    } catch (error) {
        console.error("Error checking duplicate response:", error)
        return NextResponse.json(
            { error: "Error al verificar respuesta duplicada" },
            { status: 500 }
        )
    }
}
