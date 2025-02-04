import { NextResponse } from "next/server"
import sql from "../../../lib/db"

export async function POST(req: Request) {
  const { answers, email } = await req.json()

  try {
    for (const [questionId, answerText] of Object.entries(answers)) {
      await sql`
        INSERT INTO answers (question_id, answer_text, email)
        VALUES (${questionId}, ${answerText}, ${email})
      `
    }
    return NextResponse.json({ message: "Answers submitted successfully" })
  } catch (error) {
    console.error("Error submitting answers:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

