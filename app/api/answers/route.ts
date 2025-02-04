// app/api/answers/route.ts
import { NextResponse } from "next/server"
import sql from "../../../lib/db"

// Definir la interfaz para una respuesta individual
interface Answer {
  question_id: number
  answer_text: string
  email: string
  session_id: string
}

// Endpoint GET
export async function GET() {
  try {
    const answers = await sql`
      SELECT 
        a.*,
        q.text as question_text,
        q.type as question_type
      FROM answers a
      LEFT JOIN questions q ON a.question_id = q.id
      ORDER BY a.created_at DESC
    `
    return NextResponse.json(answers)
  } catch (error) {
    console.error("Error fetching answers:", error)
    return NextResponse.json(
      { error: "Error al obtener las respuestas" },
      { status: 500 }
    )
  }
}

// Endpoint POST
export async function POST(req: Request) {
  try {
    const { answers }: { answers: Answer[] } = await req.json()
    
    // Insertar todas las respuestas con el mismo session_id
    const result = await sql`
      INSERT INTO answers ${sql(
        answers.map((answer: Answer) => ({
          question_id: answer.question_id,
          answer_text: answer.answer_text,
          email: answer.email,
          session_id: answer.session_id
        }))
      )}
      RETURNING *
    `

    return NextResponse.json({ success: true, answers: result })
  } catch (error) {
    console.error("Error saving answers:", error)
    return NextResponse.json(
      { error: "Error al guardar las respuestas" },
      { status: 500 }
    )
  }
}
