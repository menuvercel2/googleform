// app/api/questions/route.ts
import { NextResponse } from "next/server"
import sql from "../../../lib/db"

const TYPES_WITH_OPTIONS = ['multi_text', 'checkbox', 'multiple']

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

    // Validación de options según el tipo
    if (TYPES_WITH_OPTIONS.includes(type)) {
      if (!options || !Array.isArray(options)) {
        return NextResponse.json(
          { error: `Questions of type ${type} must have options as an array` },
          { status: 400 }
        )
      }
    } else {
      if (options !== null) {
        return NextResponse.json(
          { error: `Questions of type ${type} must not have options` },
          { status: 400 }
        )
      }
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
        ${TYPES_WITH_OPTIONS.includes(type) ? JSON.stringify(options) : null},
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
