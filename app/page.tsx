"use client"

import { useState, useEffect } from "react"

const tarefasIniciais = [
  { id: 1, texto: "Estudar Python", feita: false },
  { id: 2, texto: "Trabalhar no planner", feita: false },
  { id: 3, texto: "Academia", feita: false },
]

export default function Home() {
  const [tarefas, setTarefas] = useState(() => {
    if (typeof window === "undefined") return tarefasIniciais
    const salvas = localStorage.getItem("tarefas")
    return salvas ? JSON.parse(salvas) : tarefasIniciais
  })

  const [novaTarefa, setNovaTarefa] = useState("")

  useEffect(() => {
    localStorage.setItem("tarefas", JSON.stringify(tarefas))
  }, [tarefas])

  function toggleTarefa(id: number) {
    setTarefas(tarefas.map(t =>
      t.id === id ? { ...t, feita: !t.feita } : t
    ))
  }

  function adicionarTarefa() {
    if (!novaTarefa.trim()) return
    setTarefas([...tarefas, { id: Date.now(), texto: novaTarefa, feita: false }])
    setNovaTarefa("")
  }

  function deletarTarefa(id: number) {
    setTarefas(tarefas.filter(t => t.id !== id))
  }

  const feitas = tarefas.filter(t => t.feita).length

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Meu Planner</h1>
      <p className="text-sm text-gray-400 mb-3">
        {feitas} de {tarefas.length} tarefas concluídas
      </p>

      <div className="w-full max-w-lg bg-gray-100 rounded-full h-2 mb-6">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${tarefas.length === 0 ? 0 : Math.round((feitas / tarefas.length) * 100)}%` }}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-lg mb-4">
        <h2 className="text-base font-medium text-gray-700 mb-4">Tarefas de hoje</h2>

        <ul className="space-y-3 mb-4">
          {tarefas.map(t => (
            <li key={t.id} className="flex items-center gap-3 group">
              <input
                type="checkbox"
                checked={t.feita}
                onChange={() => toggleTarefa(t.id)}
                className="w-4 h-4 accent-green-500"
              />
              <span
                className={`text-sm flex-1 cursor-pointer ${t.feita ? "line-through text-gray-300" : "text-gray-600"}`}
                onClick={() => toggleTarefa(t.id)}
              >
                {t.texto}
              </span>
              <button
                onClick={() => deletarTarefa(t.id)}
                className="text-gray-200 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            placeholder="Nova tarefa..."
            value={novaTarefa}
            onChange={e => setNovaTarefa(e.target.value)}
            onKeyDown={e => e.key === "Enter" && adicionarTarefa()}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-400"
          />
          <button
            onClick={adicionarTarefa}
            className="text-sm bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            + Adicionar
          </button>
        </div>
      </div>
    </main>
  )
}