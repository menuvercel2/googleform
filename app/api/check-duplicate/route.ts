// app/api/check-duplicate/route.ts
import { NextResponse } from "next/server"
import sql from "../../../lib/db"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        console.log('Received body:', body) // Para debugging

        const { questionId, answer } = body

        // Validación explícita de los campos
        if (questionId === undefined || questionId === null) {
            return NextResponse.json(
                { error: "questionId es requerido" },
                { status: 400 }
            )
        }

        if (!answer && answer !== '') {
            return NextResponse.json(
                { error: "answer es requerido" },
                { status: 400 }
            )
        }

        // Asegúrate de que los tipos sean correctos
        const query = await sql`
            SELECT 1
            FROM answers
            WHERE question_id = ${Number(questionId)}
            AND answer = ${String(answer)}
            LIMIT 1
        `

        console.log('Query result:', query) // Para debugging

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
