"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import QuestionForm from "./QuestionForm"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

interface Question {
  id: number
  text: string
  type: string
  required: boolean
  is_unique?: boolean  // Añade esta línea
  options?: string[] | null
}


interface Answer {
  id: number
  question_id: number
  answer_text: string
  email: string
  created_at: string
}

interface GroupedAnswers {
  [email: string]: {
    [date: string]: Answer[]
  }
}

const QUESTION_TYPES = [
  { value: "short", label: "Respuesta corta" },
  { value: "paragraph", label: "Párrafo" },
  { value: "multiple", label: "Opción múltiple" },
  { value: "checkbox", label: "Casillas de verificación" },
  { value: "dropdown", label: "Lista desplegable" },
  { value: "multi_text", label: "Múltiples campos de texto" },
  { value: "file", label: "Carga de archivos" },
  { value: "scale", label: "Escala lineal" },
  { value: "rating", label: "Calificación" },
  { value: "multiple_grid", label: "Cuadrícula de opción múltiple" },
  { value: "checkbox_grid", label: "Cuadrícula de casillas" },
  { value: "date", label: "Fecha" },
  { value: "time", label: "Hora" },
]

export default function AdminPanel() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isUnique, setIsUnique] = useState(false)

  useEffect(() => {
    fetchQuestions()
    fetchAnswers()
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

  const fetchAnswers = async () => {
    try {
      const res = await fetch("/api/answers")
      if (!res.ok) throw new Error("Failed to fetch answers")
      const data = await res.json()
      setAnswers(data)
    } catch (error) {
      console.error("Error fetching answers:", error)
    }
  }

  const handleAddQuestion = useCallback(
    async (newQuestion: Omit<Question, "id">) => {
      try {
        // Create a copy of the question to modify
        const questionToSubmit = { ...newQuestion };

        // Set options to null for types that don't need options
        if (!['multi_text', 'checkbox', 'multiple'].includes(questionToSubmit.type)) {
          questionToSubmit.options = null;
        }

        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionToSubmit),
        })
        if (!res.ok) throw new Error("Failed to add question")
        await fetchQuestions()
        setIsAddDialogOpen(false)
      } catch (error) {
        console.error("Error adding question:", error)
      }
    },
    [fetchQuestions]
  )


  const handleEditQuestion = useCallback(
    async (editedQuestion: Question) => {
      try {
        // Create a copy of the question to modify
        const questionToSubmit = { ...editedQuestion };

        // Set options to null for types that don't need options
        if (!['multi_text', 'checkbox', 'multiple'].includes(questionToSubmit.type)) {
          questionToSubmit.options = null;
        }

        const res = await fetch(`/api/questions/${questionToSubmit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionToSubmit),
        })
        if (!res.ok) throw new Error("Failed to edit question")
        await fetchQuestions()
        setIsEditDialogOpen(false)
        setEditingQuestion(null)
      } catch (error) {
        console.error("Error editing question:", error)
      }
    },
    [fetchQuestions]
  )


  const handleDeleteQuestion = useCallback(
    async (id: number) => {
      try {
        const res = await fetch(`/api/questions/${id}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error("Failed to delete question")
        await fetchQuestions()
      } catch (error) {
        console.error("Error deleting question:", error)
      }
    },
    [fetchQuestions], // Added fetchQuestions to dependencies
  )

  const groupAnswersByEmailAndDate = useCallback(() => {
    const grouped: GroupedAnswers = {}
    answers.forEach((answer) => {
      const date = new Date(answer.created_at).toLocaleDateString()
      if (!grouped[answer.email]) {
        grouped[answer.email] = {}
      }
      if (!grouped[answer.email][date]) {
        grouped[answer.email][date] = []
      }
      grouped[answer.email][date].push(answer)
    })

    // Sort dates for each email
    Object.keys(grouped).forEach((email) => {
      grouped[email] = Object.fromEntries(
        Object.entries(grouped[email]).sort(([dateA], [dateB]) => {
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        }),
      )
    })

    // Sort emails by the most recent answer
    return Object.entries(grouped).sort(([, answersA], [, answersB]) => {
      const dateA = Object.keys(answersA)[0]
      const dateB = Object.keys(answersB)[0]
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
  }, [answers])

  const handleDragEnd = useCallback(
    async (result: any) => {
      if (!result.destination) {
        return
      }

      const newQuestions = Array.from(questions)
      const [reorderedItem] = newQuestions.splice(result.source.index, 1)
      newQuestions.splice(result.destination.index, 0, reorderedItem)

      setQuestions(newQuestions)

      try {
        const res = await fetch("/api/questions/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: newQuestions.map((q) => q.id) }),
        })

        if (!res.ok) {
          throw new Error("Failed to update question order")
        }
      } catch (error) {
        console.error("Error updating question order:", error)
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    },
    [questions],
  )

  return (
    <div className="container mx-auto my-6 p-4">
      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="questions">Preguntas</TabsTrigger>
          <TabsTrigger value="responses">Respuestas</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <Button onClick={() => setIsAddDialogOpen(true)} className="w-full">
            Añadir Nueva Pregunta
          </Button>

          <QuestionForm
            initialQuestion={{
              text: "",
              type: "short",
              required: false,
              options: [],
              is_unique: false  // Añade esta línea
            }}
            onSubmit={handleAddQuestion}
            isOpen={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            dialogTitle="Añadir Nueva Pregunta"
          />


          <Card>
            <CardHeader>
              <CardTitle>Preguntas Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="questions">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {questions.map((question, index) => (
                        <Draggable key={question.id} draggableId={question.id.toString()} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <Card className="question-card">
                                <CardContent className="flex justify-between items-start p-4">
                                  <div>
                                    <h3 className="font-medium">{question.text}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      Tipo: {QUESTION_TYPES.find((t) => t.value === question.type)?.label}
                                    </p>
                                    {question.options && question.options.length > 0 && (
                                      <ul className="mt-2 space-y-1">
                                        {question.options.map((option, index) => (
                                          <li key={index} className="text-sm text-muted-foreground">
                                            • {option}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                  <div className="space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingQuestion(question)
                                        setIsEditDialogOpen(true)
                                      }}
                                    >
                                      Editar
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteQuestion(question.id)}
                                    >
                                      Eliminar
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>

          {editingQuestion && (
            <QuestionForm
              initialQuestion={editingQuestion}
              onSubmit={handleEditQuestion}
              isOpen={isEditDialogOpen}
              onOpenChange={(open) => {
                setIsEditDialogOpen(open)
                if (!open) setEditingQuestion(null)
              }}
              dialogTitle="Editar Pregunta"
            />
          )}
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Respuestas Recibidas</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {groupAnswersByEmailAndDate().map(([email, dateGroups]) => (
                  <AccordionItem key={email} value={email}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{email}</span>
                        <span className="text-sm text-muted-foreground">
                          {Object.values(dateGroups).flat().length} respuesta(s) - Última: {Object.keys(dateGroups)[0]}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 mt-2 pl-8">
                        {Object.values(dateGroups)
                          .flat()
                          .map((answer) => {
                            const question = questions.find((q) => q.id === answer.question_id)
                            return (
                              <Card key={answer.id}>
                                <CardContent className="p-4">
                                  <p className="font-medium">{question?.text}</p>
                                  {question?.type === "multi_text" ? (
                                    <ul className="list-disc pl-5 mt-2">
                                      {JSON.parse(answer.answer_text).map((text: string, index: number) => (
                                        <li key={index} className="text-muted-foreground">
                                          {text}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-muted-foreground mt-2">{answer.answer_text}</p>
                                  )}
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {new Date(answer.created_at).toLocaleString()}
                                  </p>
                                </CardContent>
                              </Card>
                            )
                          })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

