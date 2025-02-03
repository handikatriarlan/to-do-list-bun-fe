import axios from "axios"
import type { Todo } from "./types"

const API_URL = "http://172.18.56.102:3000/api/todos"

export const fetchTodos = async (): Promise<Todo[]> => {
  const response = await axios.get(API_URL)
  return response.data.data
}

export const createTodo = async (title: string): Promise<Todo> => {
  const response = await axios.post(API_URL, { title })
  return response.data.data
}

export const updateTodoTitle = async (
  id: number,
  title: string
): Promise<Todo> => {
  const response = await axios.patch(`${API_URL}/${id}/title`, { title })
  return response.data.data
}

export const updateTodoStatus = async (id: number): Promise<Todo> => {
  const response = await axios.patch(`${API_URL}/${id}/status`)
  return response.data.data
}

export const deleteTodo = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`)
}
