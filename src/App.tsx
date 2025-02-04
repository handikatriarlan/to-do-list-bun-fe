/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react"
import {
  PlusCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Settings2,
  AlertCircle,
} from "lucide-react"
import { Todo, ApiResponse, ApiConfig } from "./types"

const LOCAL_STORAGE_API_KEY = "to_do_list_bun"

const SuccessAlert = ({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) => {
  const [timeLeft, setTimeLeft] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    const closeTimer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => {
      clearInterval(timer)
      clearTimeout(closeTimer)
    }
  }, [onClose])

  return (
    <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200 relative flex items-center gap-3">
      <CheckCircle2 size={20} />
      <span className="flex-1">{message}</span>
      <span className="text-sm text-green-300/70">Closing in {timeLeft}s</span>
      <button
        onClick={onClose}
        className="ml-2 text-green-300 hover:text-green-100 transition-colors"
      >
        <XCircle size={20} />
      </button>
    </div>
  )
}

const ApiConfigModal = ({
  show,
  onClose,
  onSave,
  initialUrl = "",
}: {
  show: boolean
  onClose: () => void
  onSave: (url: string) => Promise<void>
  initialUrl?: string
}) => {
  const [apiUrl, setApiUrl] = useState(initialUrl)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setApiUrl(initialUrl)
    setError(null)
  }, [show, initialUrl])

  const handleSave = async () => {
    try {
      setTesting(true)
      setError(null)
      await onSave(apiUrl)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTesting(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-purple-500/20 w-full max-w-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          API Configuration
        </h2>

        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-purple-500/20">
          <h3 className="font-semibold mb-2 text-purple-300">
            Required API Endpoints:
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <code className="bg-gray-900 px-2 py-1 rounded">[BASE_URL]</code>{" "}
              - GET/POST for todos
            </li>
            <li>
              <code className="bg-gray-900 px-2 py-1 rounded">
                [BASE_URL]/:id
              </code>{" "}
              - DELETE todo
            </li>
            <li>
              <code className="bg-gray-900 px-2 py-1 rounded">
                [BASE_URL]/:id/status
              </code>{" "}
              - PATCH todo status
            </li>
            <li>
              <code className="bg-gray-900 px-2 py-1 rounded">
                [BASE_URL]/:id/title
              </code>{" "}
              - PATCH todo title
            </li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            <p className="font-medium">Connection Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="apiUrl"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              API Base URL
            </label>
            <input
              type="url"
              id="apiUrl"
              placeholder="https://your-api-url/"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-purple-500/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-gray-100 placeholder-gray-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!apiUrl || testing}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
            >
              {testing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Testing Connection...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  Test & Save
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_API_KEY)
    return saved ? JSON.parse(saved) : { baseUrl: "", isConfigured: false }
  })

  useEffect(() => {
    if (apiConfig.isConfigured) {
      fetchTodos()
    }
  }, [apiConfig.isConfigured])

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_API_KEY, JSON.stringify(apiConfig))
  }, [apiConfig])

  const testApiConnection = async (baseUrl: string) => {
    try {
      const response = await fetch(baseUrl)
      if (!response.ok) {
        throw new Error("Failed to connect to API")
      }
      const data = await response.json()
      if (!data.success) {
        throw new Error("Invalid API response format")
      }
      setApiConfig({ baseUrl, isConfigured: true })
      setSuccessMessage(
        "API connected successfully! You can now start managing your tasks."
      )
    } catch (error: any) {
      if (error.message.includes("<!doctype")) {
        throw new Error("Invalid API URL. Please check the URL and try again.")
      }
      throw error
    }
  }

  const fetchTodos = async () => {
    if (!apiConfig.isConfigured) return
    try {
      setLoading(true)
      const response = await fetch(apiConfig.baseUrl)
      const data: ApiResponse<Todo[]> = await response.json()
      if (data.success) {
        setTodos(data.data)
      }
    } catch (error: any) {
      setError("Failed to fetch todos")
      console.error("Error fetching todos:", error.message)
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim() || !apiConfig.isConfigured) return

    try {
      const response = await fetch(apiConfig.baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTodo }),
      })
      const data: ApiResponse<Todo> = await response.json()
      if (data.success) {
        setTodos([data.data, ...todos])
        setNewTodo("")
      }
    } catch (error: any) {
      setError("Failed to add todo")
      console.error("Error adding todo:", error.message)
    }
  }

  const toggleTodo = async (id: number) => {
    if (!apiConfig.isConfigured) return
    try {
      const response = await fetch(`${apiConfig.baseUrl}/${id}/status`, {
        method: "PATCH",
      })
      const data: ApiResponse<Todo> = await response.json()
      if (data.success) {
        setTodos(todos.map((todo) => (todo.id === id ? data.data : todo)))
      }
    } catch (error: any) {
      setError("Failed to update todo status")
      console.error("Error updating todo status:", error.message)
    }
  }

  const updateTodoTitle = async (id: number) => {
    if (!editText.trim() || !apiConfig.isConfigured) return
    try {
      const response = await fetch(`${apiConfig.baseUrl}/${id}/title`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editText }),
      })
      const data: ApiResponse<Todo> = await response.json()
      if (data.success) {
        setTodos(todos.map((todo) => (todo.id === id ? data.data : todo)))
        setEditingId(null)
      }
    } catch (error: any) {
      setError("Failed to update todo title")
      console.error("Error updating todo title:", error.message)
    }
  }

  const deleteTodo = async (id: number) => {
    if (!apiConfig.isConfigured) return
    try {
      const response = await fetch(`${apiConfig.baseUrl}/${id}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (data.success) {
        setTodos(todos.filter((todo) => todo.id !== id))
      }
    } catch (error: any) {
      setError("Failed to delete todo")
      console.error("Error deleting todo:", error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800/30 backdrop-blur-lg rounded-xl shadow-2xl border border-purple-500/10">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              To-Do List with Bun
            </h1>
            <button
              onClick={() => setShowConfig(true)}
              className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors duration-200"
              title="Configure API"
            >
              <Settings2 size={24} className="text-purple-400" />
            </button>
          </div>

          {successMessage && (
            <SuccessAlert
              message={successMessage}
              onClose={() => setSuccessMessage(null)}
            />
          )}

          {!apiConfig.isConfigured && (
            <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg text-yellow-200 flex items-start gap-3">
              <AlertCircle size={24} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">API not configured</p>
                <p className="text-sm mt-1">
                  Please configure your API endpoint to start using the
                  application.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 relative">
              {error}
              <button
                onClick={() => setError(null)}
                className="absolute top-4 right-4 text-red-300 hover:text-red-100 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
          )}

          <form onSubmit={addTodo} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="What needs to be done?"
                disabled={!apiConfig.isConfigured}
                className="flex-1 px-4 py-3 rounded-lg bg-gray-900/50 border border-purple-500/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-gray-100 placeholder-gray-400 transition-all duration-200 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newTodo.trim() || !apiConfig.isConfigured}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <PlusCircle size={20} />
                <span>Add Task</span>
              </button>
            </div>
          </form>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-purple-400" size={32} />
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="group p-4 rounded-lg bg-gray-900/30 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 backdrop-blur-sm"
                >
                  {editingId === todo.id ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-3 py-2 rounded bg-gray-800/50 border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-all duration-200"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateTodoTitle(todo.id)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors duration-200"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={`text-2xl transition-colors duration-200 ${
                          todo.completed
                            ? "text-green-500 hover:text-green-600"
                            : "text-gray-500 hover:text-gray-400"
                        }`}
                      >
                        <CheckCircle2 size={24} />
                      </button>
                      <span
                        className={`flex-1 ${
                          todo.completed ? "line-through text-gray-500" : ""
                        }`}
                      >
                        {todo.title}
                      </span>
                      <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            setEditingId(todo.id)
                            setEditText(todo.title)
                          }}
                          className="p-1 hover:text-purple-400 transition-colors duration-200"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="p-1 hover:text-red-400 transition-colors duration-200"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {todos.length === 0 && !loading && apiConfig.isConfigured && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg">No tasks yet.</p>
                  <p className="text-sm mt-2">Add your first task above!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <ApiConfigModal
        show={showConfig}
        onClose={() => setShowConfig(false)}
        onSave={testApiConnection}
        initialUrl={apiConfig.baseUrl}
      />
    </div>
  )
}

export default App
