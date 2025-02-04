// app/api/check-duplicate/route.ts
import { NextResponse } from "next/server"
import sql from "../../../lib/db"

export async function POST(req: Request) {
    try {
        const { questionId, answer } = await req.json()

        // Validación de entrada
        if (!questionId || answer === undefined) {
            return NextResponse.json(
                { error: "Question ID and answer are required" },
                { status: 400 }
            )
        }

        // Primero verificamos si la pregunta existe y requiere validación de duplicados
        const [question] = await sql`
        SELECT is_unique 
        FROM questions 
        WHERE id = ${questionId}
    `

        if (!question) {
            return NextResponse.json(
                { error: "Question not found" },
                { status: 404 }
            )
        }

        // Si la pregunta no requiere validación de duplicados, retornamos false
        if (!question.is_unique) {
            return NextResponse.json({ isDuplicate: false })
        }

        // Buscar respuestas duplicadas
        const [existingResponse] = await sql`
        SELECT id 
        FROM responses 
        WHERE question_id = ${questionId} 
        AND answer = ${answer}
        LIMIT 1
    `

        return NextResponse.json({
            isDuplicate: !!existingResponse,
            message: existingResponse
                ? "Esta respuesta ya existe"
                : "Respuesta válida"
        })

    } catch (error) {
        console.error("Error checking duplicate response:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
