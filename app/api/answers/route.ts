import { NextResponse } from "next/server"
import sql from "../../../lib/db"

export async function GET() {
  try {
    const answers = await sql`
      SELECT * FROM answers 
      ORDER BY created_at DESC
    `
    return NextResponse.json(answers)
  } catch (error) {
    console.error("Error fetching answers:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

