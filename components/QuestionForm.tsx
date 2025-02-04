import React, { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface QuestionFormProps {
  initialQuestion: {
    id?: number
    text: string
    type: string
    required: boolean
    is_unique?: boolean  // Añade esta línea
    options?: string[]
  }
  onSubmit: (question: QuestionFormProps["initialQuestion"]) => Promise<void>
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  dialogTitle: string
}


const QUESTION_TYPES = [
  { value: "short", label: "Respuesta corta" },
  { value: "paragraph", label: "Párrafo" },
  { value: "multiple", label: "Opción múltiple" },
  { value: "checkbox", label: "Casillas de verificación" },
  { value: "dropdown", label: "Lista desplegable" },
  { value: "multi_text", label: "Múltiples campos de texto" },

]


const QuestionForm: React.FC<QuestionFormProps> = React.memo(
  ({ initialQuestion, onSubmit, isOpen, onOpenChange, dialogTitle }) => {
    const [question, setQuestion] = useState(initialQuestion)
    const [newOption, setNewOption] = useState("")

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setQuestion((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }, [])

    const handleTypeChange = useCallback((value: string) => {
      setQuestion((prev) => ({ ...prev, type: value }))
    }, [])

    const handleRequiredChange = useCallback((checked: boolean) => {
      setQuestion((prev) => ({ ...prev, required: checked }))
    }, [])

    const handleAddOption = useCallback(() => {
      if (newOption.trim()) {
        setQuestion((prev) => ({
          ...prev,
          options: [...(prev.options || []), newOption.trim()],
        }))
        setNewOption("")
      }
    }, [newOption])

    const handleRemoveOption = useCallback((index: number) => {
      setQuestion((prev) => ({
        ...prev,
        options: prev.options?.filter((_, i) => i !== index),
      }))
    }, [])

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(question)
      },
      [question, onSubmit],
    )

    const handleUniqueChange = useCallback((checked: boolean) => {
      setQuestion((prev) => ({ ...prev, is_unique: checked }))
    }, [])


    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              name="text"
              value={question.text}
              onChange={handleInputChange}
              placeholder="Texto de la pregunta"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select value={question.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de pregunta" />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={question.required}
                  onCheckedChange={handleRequiredChange}
                />
                <Label htmlFor="required">Obligatorio</Label>
              </div>
            </div>

            {(question.type === "short" || question.type === "paragraph") && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unique"
                  checked={question.is_unique || false}
                  onCheckedChange={handleUniqueChange}
                />
                <Label htmlFor="unique">
                  Respuesta única (no permitir duplicados)
                </Label>
              </div>
            )}

            {["multiple", "checkbox", "dropdown"].includes(question.type) && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Nueva opción"
                  />
                  <Button type="button" onClick={handleAddOption}>
                    Añadir Opción
                  </Button>
                </div>
                <ul className="space-y-2">
                  {question.options?.map((option, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span>{option}</span>
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveOption(index)}>
                        Eliminar
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button type="submit" className="w-full">
              {question.id ? "Guardar Cambios" : "Añadir Pregunta"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    )
  },
)

QuestionForm.displayName = "QuestionForm"

export default QuestionForm

