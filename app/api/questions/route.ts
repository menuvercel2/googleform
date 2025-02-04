import { NextResponse } from "next/server"
import sql from "../../../lib/db"

export async function GET() {
  try {
    const questions = await sql`SELECT id, text, type, required, options FROM questions`
    return NextResponse.json(questions)
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { text, type, required, options } = await req.json()

  try {
    const result = await sql`
      INSERT INTO questions (text, type, required, options)
      VALUES (${text}, ${type}, ${required}, ${options ? JSON.stringify(options) : null})
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

