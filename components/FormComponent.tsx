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

interface Question {
  id: number
  text: string
  type: string
  required: boolean
  options?: string[] | null
}

export default function FormComponent() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({})
  const [userEmail, setUserEmail] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    fetchQuestions()
    const savedEmail = localStorage.getItem("userEmail")
    if (savedEmail) {
      setUserEmail(savedEmail)
    }
  }, [])

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
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, email: userEmail }),
      })
      if (!res.ok) throw new Error("Failed to submit form")
      router.push("/thank-you")
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  const handleInputChange = (questionId: number, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
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
    <Card className="w-full max-w-3xl mx-auto my-6">
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
                {question.type === "short" && (
                  <Input
                    id={`question-${question.id}`}
                    required={question.required}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                  />
                )}
                {question.type === "paragraph" && (
                  <textarea
                    id={`question-${question.id}`}
                    required={question.required}
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                  />
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
        <p className="text-sm text-muted-foreground">Nunca compartiremos sus respuestas con nadie</p>
      </CardFooter>
    </Card>
  )
}

