import { NextResponse } from "next/server"
import sql from "../../../../lib/db"

export async function POST(req: Request) {
  const { order } = await req.json()

  try {
    // Actualizar el orden de las preguntas en la base de datos
    for (let i = 0; i < order.length; i++) {
      await sql`
        UPDATE questions
        SET order_index = ${i}
        WHERE id = ${order[i]}
      `
    }

    return NextResponse.json({ message: "Question order updated successfully" })
  } catch (error) {
    console.error("Error updating question order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
