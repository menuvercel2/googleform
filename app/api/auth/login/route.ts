import { type NextRequest, NextResponse } from "next/server"

const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "admin123" // En producción, usa variables de entorno y hash las contraseñas

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
}

