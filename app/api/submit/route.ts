// app/api/submit/route.ts
import { NextResponse } from "next/server"
import sql from "../../../lib/db"

export async function POST(req: Request) {
  try {
    const { answers } = await req.json()
    
    // Realizar inserciones individuales usando una transacción
    const result = await sql.begin(async (sql) => {
      const insertedAnswers = []
      for (const answer of answers) {
        const [inserted] = await sql`
          INSERT INTO answers (
            question_id,
            answer_text,
            email,
            session_id
          ) VALUES (
            ${answer.question_id},
            ${answer.answer_text},
            ${answer.email},
            ${answer.session_id}
          )
          RETURNING *
        `
        insertedAnswers.push(inserted)
      }
      return insertedAnswers
    })

    return NextResponse.json({ success: true, answers: result })
  } catch (error) {
    console.error("Error submitting answers:", error)
    return NextResponse.json(
      { error: "Error al guardar las respuestas" },
      { status: 500 }
    )
  }
}
