"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Minus } from "lucide-react"
import EmailInput from "./EmailInput"
import {
  MoreVertical,
  Download,
  Settings
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface Question {
  id: number
  text: string
  type: string
  required: boolean
  is_unique?: boolean
  options?: string[] | null
}


export default function FormComponent() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({})
  const [userEmail, setUserEmail] = useState<string>("")
  const router = useRouter()
  const [duplicateErrors, setDuplicateErrors] = useState<Record<number, string>>({})
  const [validationStatus, setValidationStatus] = useState<Record<number, {
    status: 'unique' | 'duplicate' | 'checking' | null,
    message: string
  }>>({})

  useEffect(() => {
    fetchQuestions()
    const savedEmail = localStorage.getItem("userEmail")
    if (savedEmail) {
      setUserEmail(savedEmail)
    }
  }, [])

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/download')
      if (!response.ok) throw new Error('Error en la descarga')

      // Obtener el blob de la respuesta
      const blob = await response.blob()

      // Crear URL temporal
      const url = window.URL.createObjectURL(blob)

      // Crear elemento temporal para la descarga
      const link = document.createElement('a')
      link.href = url
      link.download = 'solicitud.docx'

      // Simular clic y limpiar
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al descargar:', error)
      // Aquí puedes mostrar una notificación de error si lo deseas
    }
  }

  const validateUniqueAnswer = async (questionId: number, value: string) => {
    // Validación inicial
    if (!value.trim()) {
      setValidationStatus(prev => ({
        ...prev,
        [questionId]: { status: null, message: '' }
      }))
      return
    }

    // Establecer estado de verificación
    setValidationStatus(prev => ({
      ...prev,
      [questionId]: { status: 'checking', message: 'Verificando...' }
    }))

    try {
      // Asegúrate de que ambos valores estén definidos
      console.log('Enviando:', { questionId, answer: value }) // Para debugging

      const response = await fetch('/api/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: questionId,
          answer: value
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error en la verificación')
      }

      const data = await response.json()

      setValidationStatus(prev => ({
        ...prev,
        [questionId]: {
          status: data.isDuplicate ? 'duplicate' : 'unique',
          message: data.isDuplicate ? 'Duplicada' : 'Única'
        }
      }))
    } catch (error) {
      console.error('Error en validación:', error)
      setValidationStatus(prev => ({
        ...prev,
        [questionId]: { status: null, message: 'Error en la verificación' }
      }))
    }
  }



  const checkDuplicate = async (questionId: number, answer: string) => {
    try {
      const response = await fetch('/api/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId, answer }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      return data.isDuplicate
    } catch (error) {
      console.error('Error checking duplicate:', error)
      return false
    }
  }



  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/questions")
      if (!res.ok) throw new Error("Failed to fetch questions")
      const data = await res.json()
      const processedData = data.map((q: Question) => ({
        ...q,
        options: q.options ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options)) : [],
      }))
      setQuestions(processedData)
    } catch (error) {
      console.error("Error fetching questions:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userEmail) {
      alert("Por favor, ingresa tu correo electrónico antes de enviar el formulario.")
      return
    }

    // Verifica si hay errores de duplicados
    if (Object.keys(duplicateErrors).length > 0) {
      alert("Por favor, corrige las respuestas duplicadas antes de enviar.")
      return
    }

    // Genera un session_id único para este envío
    const sessionId = crypto.randomUUID()

    // Verifica todas las respuestas únicas antes de enviar
    for (const question of questions) {
      if (question.is_unique && (question.type === "short" || question.type === "paragraph")) {
        const answer = answers[question.id]
        if (typeof answer === 'string' && answer.trim()) {
          const isDuplicate = await checkDuplicate(question.id, answer)
          if (isDuplicate) {
            setDuplicateErrors(prev => ({
              ...prev,
              [question.id]: "Esta respuesta ya existe en la base de datos"
            }))
            alert("Se encontraron respuestas duplicadas. Por favor, revisa el formulario.")
            return
          }
        }
      }
    }

    // Prepara las respuestas con el formato correcto
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      question_id: parseInt(questionId),
      answer_text: Array.isArray(answer) ? JSON.stringify(answer) : answer,
      email: userEmail,
      session_id: sessionId
    }))

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: formattedAnswers,
          email: userEmail,
          session_id: sessionId
        }),
      })

      if (!res.ok) throw new Error("Failed to submit form")
      router.push("/thank-you")
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }



  const handleInputChange = async (questionId: number, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))

    const question = questions.find(q => q.id === questionId)
    if (question?.is_unique && typeof value === 'string') {
      // Debounce la validación para no hacer demasiadas llamadas
      const timeoutId = setTimeout(() => {
        validateUniqueAnswer(questionId, value)
      }, 500) // espera 500ms después de que el usuario deje de escribir

      return () => clearTimeout(timeoutId)
    }
  }


  const handleMultiTextChange = (questionId: number, index: number, value: string) => {
    setAnswers((prev) => {
      const currentAnswers = (prev[questionId] as string[]) || []
      const newAnswers = [...currentAnswers]
      newAnswers[index] = value
      return { ...prev, [questionId]: newAnswers }
    })
  }

  const addMultiTextField = (questionId: number) => {
    setAnswers((prev) => {
      const currentAnswers = (prev[questionId] as string[]) || []
      return { ...prev, [questionId]: [...currentAnswers, ""] }
    })
  }

  const removeMultiTextField = (questionId: number, index: number) => {
    setAnswers((prev) => {
      const currentAnswers = (prev[questionId] as string[]) || []
      return { ...prev, [questionId]: currentAnswers.filter((_, i) => i !== index) }
    })
  }

  return (
    <Card className="w-full max-w-3xl mx-auto my-6 relative">
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              <span>Descargar solicitud</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Administrar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold mb-6">Base de Datos de Lípidos Catiónicos e Ionizables</CardTitle>
        <EmailInput onEmailSubmit={setUserEmail} initialEmail={userEmail} />
        <p className="text-sm text-destructive mt-4">* Indica que la pregunta es obligatoria</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <Label htmlFor={`question-${question.id}`} className="text-base mb-2">
                  {question.text}
                  {question.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {(question.type === "short" || question.type === "paragraph") && (
                  <div className="space-y-2">
                    <Input
                      id={`question-${question.id}`}
                      required={question.required}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                      className={
                        validationStatus[question.id]?.status === 'duplicate'
                          ? "border-red-500"
                          : validationStatus[question.id]?.status === 'unique'
                            ? "border-green-500"
                            : ""
                      }
                    />
                    {question.is_unique && validationStatus[question.id] && (
                      <div className="flex items-center gap-2 mt-1">
                        {validationStatus[question.id].status === 'checking' && (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full" />
                            <p className="text-sm text-gray-500">
                              Verificando...
                            </p>
                          </>
                        )}
                        {validationStatus[question.id].status === 'unique' && (
                          <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Única
                          </p>
                        )}
                        {validationStatus[question.id].status === 'duplicate' && (
                          <p className="text-sm text-red-600 font-medium flex items-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Duplicada
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {question.type === "multiple" && question.options && (
                  <RadioGroup
                    onValueChange={(value) => handleInputChange(question.id, value)}
                    required={question.required}
                  >
                    {question.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`question-${question.id}-option-${index}`} />
                        <Label htmlFor={`question-${question.id}-option-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {question.type === "checkbox" && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`question-${question.id}-option-${index}`}
                          onCheckedChange={(checked) => {
                            const currentAnswers = (answers[question.id] as string[]) || []
                            if (checked) {
                              handleInputChange(question.id, [...currentAnswers, option])
                            } else {
                              handleInputChange(
                                question.id,
                                currentAnswers.filter((a) => a !== option),
                              )
                            }
                          }}
                        />
                        <Label htmlFor={`question-${question.id}-option-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </div>
                )}
                {question.type === "dropdown" && question.options && (
                  <Select onValueChange={(value) => handleInputChange(question.id, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map((option, index) => (
                        <SelectItem key={index} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {question.type === "multi_text" && (
                  <div className="space-y-2">
                    {((answers[question.id] as string[]) || [""]).map((value, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={value}
                          onChange={(e) => handleMultiTextChange(question.id, index, e.target.value)}
                          placeholder={`Respuesta ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => addMultiTextField(question.id)}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeMultiTextField(question.id, index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button type="submit" onClick={handleSubmit} disabled={!userEmail}>
          Enviar
        </Button>
      </CardFooter>
    </Card>
  )
}

