import { NextResponse } from "next/server"
import sql from "../../../../lib/db"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = params.id

  try {
    await sql`DELETE FROM questions WHERE id = ${id}`
    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const { text, type, required, options, is_unique } = await req.json()

  try {
    await sql`
      UPDATE questions
      SET 
        text = ${text}, 
        type = ${type}, 
        required = ${required}, 
        options = ${options ? JSON.stringify(options) : null},
        is_unique = ${is_unique ?? false}
      WHERE id = ${id}
    `
    return NextResponse.json({ message: "Question updated successfully" })
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
