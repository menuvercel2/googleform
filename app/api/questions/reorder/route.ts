// app/api/questions/route.ts
import { NextResponse } from "next/server"
import sql from "../../../../lib/db"

export async function POST(req: Request) {
  try {
    const { text, type, required, options, is_unique, order_index } = await req.json()

    // Validación de entrada
    if (!text || !type) {
      return NextResponse.json(
        { error: "Text and type are required" },
        { status: 400 }
      )
    }

    // Procesar options según el tipo
    let processedOptions = null
    if (['multiple', 'checkbox', 'dropdown'].includes(type)) {
      processedOptions = Array.isArray(options) ? options : []
    }

    const result = await sql`
      INSERT INTO questions (
        text, 
        type, 
        required, 
        options,
        order_index,
        is_unique
      )
      VALUES (
        ${text}, 
        ${type}, 
        COALESCE(${required}, false), 
        ${processedOptions ? JSON.stringify(processedOptions) : null},
        COALESCE(${order_index}, 0),
        COALESCE(${is_unique}, false)
      )
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const questions = await sql`
      SELECT *
      FROM questions
      ORDER BY order_index ASC
    `
    return NextResponse.json(questions)
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
