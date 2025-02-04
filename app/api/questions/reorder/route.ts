import { NextResponse } from "next/server"
import sql from "../../../../lib/db"

export async function POST(req: Request) {
  try {
    const { orderedQuestions } = await req.json()

    if (!Array.isArray(orderedQuestions)) {
      return NextResponse.json(
        { error: "Invalid input: orderedQuestions must be an array" },
        { status: 400 }
      )
    }

    // Actualizar el order_index de cada pregunta
    for (let i = 0; i < orderedQuestions.length; i++) {
      const question = orderedQuestions[i]
      await sql`
        UPDATE questions 
        SET order_index = ${i} 
        WHERE id = ${question.id}
      `
    }

    // Obtener las preguntas actualizadas
    const updatedQuestions = await sql`
      SELECT * 
      FROM questions 
      ORDER BY order_index ASC
    `

    return NextResponse.json(updatedQuestions)
  } catch (error) {
    console.error("Error reordering questions:", error)
    return NextResponse.json(
      { error: "Failed to update question order" },
      { status: 500 }
    )
  }
}
