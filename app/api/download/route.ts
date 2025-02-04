import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
    try {
        // Ruta al documento (fuera de public)
        const filePath = path.join(process.cwd(), 'private', 'solicitud.docx')
        const fileBuffer = fs.readFileSync(filePath)

        // Configurar headers para forzar la descarga
        const headers = new Headers()
        headers.set('Content-Disposition', 'attachment; filename="solicitud.docx"')
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')

        return new NextResponse(fileBuffer, {
            status: 200,
            headers,
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'Error al descargar el archivo' },
            { status: 500 }
        )
    }
}
