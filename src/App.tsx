import React, { useState, useEffect } from 'react';
import { PlusCircle, Loader2, CheckCircle2, XCircle, Pencil, Trash2 } from 'lucide-react';
import { Todo, ApiResponse } from './types';

const API_BASE = 'http://172.18.56.102:3000/api/todos';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE);
      const data: ApiResponse<Todo[]> = await response.json();
      if (data.success) {
        setTodos(data.data);
      }
    } catch (error: any) {
      setError('Failed to fetch todos');
      console.error('Error fetching todos:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo }),
      });
      const data: ApiResponse<Todo> = await response.json();
      if (data.success) {
        setTodos([data.data, ...todos]);
        setNewTodo('');
      }
    } catch (error: any) {
      setError('Failed to add todo');
      console.error('Error adding todo:', error.message);
    }
  };

  const toggleTodo = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/${id}/status`, {
        method: 'PATCH',
      });
      const data: ApiResponse<Todo> = await response.json();
      if (data.success) {
        setTodos(todos.map(todo => 
          todo.id === id ? data.data : todo
        ));
      }
    } catch (error: any) {
      setError('Failed to update todo status');
      console.error('Error updating todo status:', error.message);
    }
  };

  const updateTodoTitle = async (id: number) => {
    if (!editText.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/${id}/title`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editText }),
      });
      const data: ApiResponse<Todo> = await response.json();
      if (data.success) {
        setTodos(todos.map(todo => 
          todo.id === id ? data.data : todo
        ));
        setEditingId(null);
      }
    } catch (error: any) {
      setError('Failed to update todo title');
      console.error('Error updating todo title:', error.message);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setTodos(todos.filter(todo => todo.id !== id));
      }
    } catch (error: any) {
      setError('Failed to delete todo');
      console.error('Error deleting todo:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800/30 backdrop-blur-lg rounded-xl shadow-2xl border border-purple-500/10">
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 text-center">
            Quantum Tasks
          </h1>

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
                className="flex-1 px-4 py-3 rounded-lg bg-gray-900/50 border border-purple-500/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-gray-100 placeholder-gray-400 transition-all duration-200"
              />
              <button
                type="submit"
                disabled={!newTodo.trim()}
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
              {todos.map(todo => (
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
                          todo.completed ? 'text-green-500 hover:text-green-600' : 'text-gray-500 hover:text-gray-400'
                        }`}
                      >
                        <CheckCircle2 size={24} />
                      </button>
                      <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                        {todo.title}
                      </span>
                      <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            setEditingId(todo.id);
                            setEditText(todo.title);
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
              {todos.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg">No tasks yet.</p>
                  <p className="text-sm mt-2">Add your first task above!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;