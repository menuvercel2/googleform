import { NextResponse } from "next/server"
import sql from "../../../lib/db"

export async function POST(req: Request) {
  try {
    const { answers, email } = await req.json()
    const sessionId = crypto.randomUUID()

    // Prepara los valores para la inserción
    const values = Object.entries(answers).map(([questionId, answerText]) => ({
      question_id: parseInt(questionId),
      answer_text: Array.isArray(answerText) ? JSON.stringify(answerText) : String(answerText),
      email,
      session_id: sessionId
    }))

    // Realiza la inserción usando una consulta SQL explícita
    await sql`
      INSERT INTO answers (question_id, answer_text, email, session_id)
      SELECT * FROM json_to_recordset(${JSON.stringify(values)})
      AS t(question_id int, answer_text text, email text, session_id uuid)
    `

    return NextResponse.json({ 
      message: "Answers submitted successfully",
      session_id: sessionId 
    })
  } catch (error) {
    console.error("Error submitting answers:", error)
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    )
  }
}
