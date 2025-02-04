"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EmailInputProps {
  onEmailSubmit: (email: string) => void
  initialEmail?: string
}

export default function EmailInput({ onEmailSubmit, initialEmail }: EmailInputProps) {
  const [email, setEmail] = useState(initialEmail || "")
  const [isEditing, setIsEditing] = useState(!initialEmail)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && email.includes("@")) {
      localStorage.setItem("userEmail", email)
      onEmailSubmit(email)
      setIsEditing(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </div>
          <Button type="submit">Confirmar</Button>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <Label>Correo electrónico</Label>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Cambiar
          </Button>
        </div>
      )}
    </div>
  )
}

