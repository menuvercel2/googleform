import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ThankYouPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">¡Gracias por tu respuesta!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">Tu respuesta ha sido registrada.</p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

