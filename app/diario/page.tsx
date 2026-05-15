"use client"

import { useState, useEffect } from "react"

type Entrada = {
  id: number
  data: string
  hora: string
  titulo: string
  texto: string
  humor: string
  tags: string[]
}

const humores = [
  { emoji: "😄", label: "Ótimo" },
  { emoji: "🙂", label: "Bem" },
  { emoji: "😐", label: "Neutro" },
  { emoji: "😔", label: "Mal" },
  { emoji: "😤", label: "Estressada" },
  { emoji: "🤩", label: "Animada" },
  { emoji: "😴", label: "Cansada" },
  { emoji: "💪", label: "Produtiva" },
]

const tagsDisponiveis = ["Aprendizado", "Conquista", "Dificuldade", "Reflexão", "Gratidão", "Projeto", "IA", "Programação"]

export default function Diario() {
  const [entradas, setEntradas] = useState<Entrada[]>(() => {
    if (typeof window === "undefined") return []
    const salvas = localStorage.getItem("diario-v1")
    return salvas ? JSON.parse(salvas) : []
  })

  const [modo, setModo] = useState<"lista" | "nova">("lista")
  const [nova, setNova] = useState({ titulo: "", texto: "", humor: "😄", tags: [] as string[] })
  const [aberta, setAberta] = useState<number | null>(null)
  const [busca, setBusca] = useState("")

  useEffect(() => {
    localStorage.setItem("diario-v1", JSON.stringify(entradas))
  }, [entradas])

  function salvarEntrada() {
    if (!nova.texto.trim()) return
    const agora = new Date()
    setEntradas([{
      id: Date.now(),
      data: agora.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
      hora: agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      titulo: nova.titulo || "Entrada do diário",
      texto: nova.texto,
      humor: nova.humor,
      tags: nova.tags,
    }, ...entradas])
    setNova({ titulo: "", texto: "", humor: "😄", tags: [] })
    setModo("lista")
  }

  function deletarEntrada(id: number) {
    setEntradas(entradas.filter(e => e.id !== id))
    if (aberta === id) setAberta(null)
  }

  function toggleTag(tag: string) {
    setNova(n => ({
      ...n,
      tags: n.tags.includes(tag) ? n.tags.filter(t => t !== tag) : [...n.tags, tag]
    }))
  }

  const entradasFiltradas = entradas.filter(e =>
    e.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    e.texto.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ padding: 24, color: "#e2e8f0" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Diário</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>{entradas.length} entradas registradas</p>
        </div>
        <button onClick={() => setModo(modo === "nova" ? "lista" : "nova")} style={{
          background: modo === "nova" ? "#1e1e2e" : "#7c3aed",
          border: modo === "nova" ? "1px solid #2e2e3e" : "none",
          borderRadius: 8, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500
        }}>
          {modo === "nova" ? "← Voltar" : "+ Nova entrada"}
        </button>
      </div>

      {modo === "nova" ? (
        /* Editor */
        <div style={{ maxWidth: 680 }}>
          <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 16, padding: 24 }}>

            <input
              placeholder="Título (opcional)"
              value={nova.titulo}
              onChange={e => setNova({ ...nova, titulo: e.target.value })}
              style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #1e1e2e", padding: "8px 0", color: "#e2e8f0", fontSize: 18, fontWeight: 500, outline: "none", marginBottom: 20 }}
            />

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Como você está se sentindo?</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {humores.map(h => (
                  <button key={h.emoji} onClick={() => setNova({ ...nova, humor: h.emoji })} style={{
                    padding: "6px 12px", borderRadius: 20, border: "1px solid",
                    borderColor: nova.humor === h.emoji ? "#7c3aed" : "#1e1e2e",
                    background: nova.humor === h.emoji ? "#7c3aed22" : "transparent",
                    color: nova.humor === h.emoji ? "#a78bfa" : "#64748b",
                    cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 5
                  }}>
                    {h.emoji} {h.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="O que aconteceu hoje? O que você aprendeu? Como você se sentiu?..."
              value={nova.texto}
              onChange={e => setNova({ ...nova, texto: e.target.value })}
              rows={8}
              style={{ width: "100%", background: "#1e1e2e", border: "1px solid #2e2e3e", borderRadius: 10, padding: "12px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.7, marginBottom: 20 }}
            />

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Tags</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {tagsDisponiveis.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} style={{
                    padding: "4px 10px", borderRadius: 20, border: "1px solid",
                    borderColor: nova.tags.includes(tag) ? "#7c3aed" : "#1e1e2e",
                    background: nova.tags.includes(tag) ? "#7c3aed22" : "transparent",
                    color: nova.tags.includes(tag) ? "#a78bfa" : "#64748b",
                    cursor: "pointer", fontSize: 12
                  }}>{tag}</button>
                ))}
              </div>
            </div>

            <button onClick={salvarEntrada} style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, width: "100%" }}>
              Salvar entrada
            </button>
          </div>
        </div>
      ) : (
        /* Lista */
        <div>
          <input
            placeholder="Buscar no diário..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: "100%", maxWidth: 400, background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", marginBottom: 20 }}
          />

          {entradasFiltradas.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📓</div>
              <div style={{ fontSize: 14 }}>Nenhuma entrada ainda. Comece escrevendo!</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {entradasFiltradas.map(e => (
              <div key={e.id}>
                <div
                  onClick={() => setAberta(aberta === e.id ? null : e.id)}
                  style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: aberta === e.id ? "12px 12px 0 0" : 12, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{e.humor}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{e.titulo}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{e.data} às {e.hora}</div>
                    {e.tags.length > 0 && (
                      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        {e.tags.map(tag => (
                          <span key={tag} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#7c3aed22", color: "#a78bfa" }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#475569" }}>{aberta === e.id ? "▲" : "▼"}</span>
                    <button onClick={ev => { ev.stopPropagation(); deletarEntrada(e.id) }} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>✕</button>
                  </div>
                </div>
                {aberta === e.id && (
                  <div style={{ background: "#0a0a0f", border: "1px solid #1e1e2e", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "16px 20px" }}>
                    <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>{e.texto}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}