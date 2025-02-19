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
  session_id: string  // Añade esto
}

interface Session {
  sessionId: string
  timestamp: string
  email: string
  answers: Answer[]
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
]

export default function AdminPanel() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isUnique, setIsUnique] = useState(false)
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false)
  const [answersError, setAnswersError] = useState<string | null>(null)

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
        is_unique: q.is_unique ?? false // Asegúrate de que is_unique tenga un valor por defecto
      }))
      setQuestions(processedData)
    } catch (error) {
      console.error("Error fetching questions:", error)
    }
  }


  const fetchAnswers = async () => {
    setIsLoadingAnswers(true)
    setAnswersError(null)
    try {
      const res = await fetch("/api/answers")
      if (!res.ok) throw new Error("Failed to fetch answers")
      const data = await res.json()
      setAnswers(data)
    } catch (error) {
      console.error("Error fetching answers:", error)
      setAnswersError("No se pudieron cargar las respuestas")
    } finally {
      setIsLoadingAnswers(false)
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
        // Crea una copia del objeto con los campos necesarios
        const questionToSubmit = {
          ...editedQuestion,
          // Asegúrate de que is_unique se incluya explícitamente
          is_unique: editedQuestion.is_unique ?? false,
          // Maneja las opciones según el tipo
          options: ['multi_text', 'checkbox', 'multiple'].includes(editedQuestion.type)
            ? editedQuestion.options
            : null
        }

        console.log('Sending update:', questionToSubmit) // Para debugging

        const res = await fetch(`/api/questions/${editedQuestion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(questionToSubmit),
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.message || "Failed to edit question")
        }

        await fetchQuestions()
        setIsEditDialogOpen(false)
        setEditingQuestion(null)
      } catch (error) {
        console.error("Error editing question:", error)
        // Aquí podrías añadir una notificación de error para el usuario
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

  const groupAnswersBySession = useCallback(() => {
    const sessions: { [key: string]: Session } = {}

    answers.forEach((answer) => {
      if (!sessions[answer.session_id]) {
        sessions[answer.session_id] = {
          sessionId: answer.session_id,
          timestamp: answer.created_at,
          email: answer.email,
          answers: []
        }
      }
      sessions[answer.session_id].answers.push(answer)
    })

    // Convertir a array y ordenar por timestamp descendente
    return Object.values(sessions).sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
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
              <CardTitle>Sesiones de Respuestas</CardTitle>
            </CardHeader>
            <CardContent>
              {answers.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No hay respuestas todavía
                </p>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {groupAnswersBySession().map((session) => (
                    <AccordionItem key={session.sessionId} value={session.sessionId}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            {session.email}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(session.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pl-4">
                          {session.answers.map((answer) => {
                            const question = questions.find(
                              (q) => q.id === answer.question_id
                            )
                            return (
                              <Card key={answer.id}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">
                                        {question?.text || "Pregunta no encontrada"}
                                      </p>
                                      <div className="mt-2">
                                        {answer.answer_text && (
                                          <div className="text-muted-foreground">
                                            {question?.type === "multi_text" ? (
                                              <ul className="list-disc pl-5">
                                                {JSON.parse(answer.answer_text).map(
                                                  (text: string, index: number) => (
                                                    <li key={index}>{text}</li>
                                                  )
                                                )}
                                              </ul>
                                            ) : (
                                              <p>{answer.answer_text}</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  )
}

