// app/api/check-duplicate/route.ts
import { NextResponse } from "next/server"
import sql from "../../../lib/db"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        console.log('Received body:', body)

        const { questionId, answer } = body

        if (!questionId || answer === undefined) {
            return NextResponse.json(
                { error: "questionId y answer son requeridos" },
                { status: 400 }
            )
        }

        // Consulta modificada para usar answer_text en lugar de answer
        const query = await sql`
            SELECT 1
            FROM answers
            WHERE question_id = ${questionId}
            AND answer_text = ${answer}
            LIMIT 1;
        `

        console.log('Query result:', query)

        return NextResponse.json({
            isDuplicate: query.length > 0
        })

    } catch (error) {
        console.error("Error detallado:", error)
        return NextResponse.json(
            { 
                error: "Error al verificar respuesta duplicada",
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
