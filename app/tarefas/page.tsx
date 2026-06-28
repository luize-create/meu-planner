"use client"

import { useState } from "react"
import { usePlanner } from "../context/PlannerContext"
import AgendaSemana from "../components/AgendaSemana"

const categorias = ["Estudos", "Programação", "IA", "Saúde", "Pessoal", "Trabalho", "Projetos"]
const prioridades = ["Alta", "Média", "Baixa"]

const coresCat: Record<string, string> = {
  "IA": "#7c3aed", "Programação": "#2563eb", "Estudos": "#0891b2",
  "Saúde": "#dc2626", "Pessoal": "#d97706", "Trabalho": "#059669", "Projetos": "#a855f7",
}

const coresPri: Record<string, string> = {
  "Alta": "#7c3aed", "Média": "#d97706", "Baixa": "#475569"
}

export default function Tarefas() {
  const { data, setTarefas, adicionarXP } = usePlanner()
  const { tarefas } = data
  const hoje = new Date().toISOString().slice(0, 10)

  const [filtro, setFiltro] = useState("Hoje")
  const [modal, setModal] = useState(false)
  const [nova, setNova] = useState({
    texto: "", descricao: "", categoria: "Estudos",
    prioridade: "Alta", hora: "", data: hoje
  })

  function toggleTarefa(id: number) {
    const t = tarefas.find(t => t.id === id)
    if (t && !t.feita) adicionarXP(20)
    setTarefas(tarefas.map(t => t.id === id ? { ...t, feita: !t.feita } : t))
  }

  function deletarTarefa(id: number) {
    setTarefas(tarefas.filter(t => t.id !== id))
  }

  function adicionarTarefa() {
    if (!nova.texto.trim()) return
    setTarefas([...tarefas, { ...nova, id: Date.now(), feita: false }])
    setNova({ texto: "", descricao: "", categoria: "Estudos", prioridade: "Alta", hora: "", data: hoje })
    setModal(false)
  }

  const amanha = new Date()
  amanha.setDate(amanha.getDate() + 1)
  const amanhaStr = amanha.toISOString().slice(0, 10)
  const semanaStr = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  const tarefasFiltradas = tarefas.filter(t => {
    if (filtro === "Hoje") return t.data === hoje
    if (filtro === "Amanhã") return t.data === amanhaStr
    if (filtro === "Semana") return t.data >= hoje && t.data <= semanaStr
    return true
  })

  const pendentes = tarefasFiltradas.filter(t => !t.feita)
  const concluidas = tarefasFiltradas.filter(t => t.feita)
  const total = tarefasFiltradas.length
  const pct = total === 0 ? 0 : Math.round(concluidas.length / total * 100)

  return (
    <div style={{ padding: "24px 28px", color: "#e2e8f0", maxWidth: 800 }}>

      <AgendaSemana />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: -0.5 }}>Minhas tarefas</h1>
          <p style={{ fontSize: 13, color: "#4a4a6a", margin: "4px 0 0" }}>
            {concluidas.length} de {total} concluídas · {pct}%
          </p>
        </div>
        <button onClick={() => setModal(true)} style={{
          background: "#7c3aed", border: "none", borderRadius: 8, padding: "8px 16px",
          color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500
        }}>
          + Nova tarefa
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {["Hoje", "Amanhã", "Semana", "Todas"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
            border: "1px solid", fontWeight: filtro === f ? 500 : 400,
            borderColor: filtro === f ? "#7c3aed" : "#1a1a2e",
            background: filtro === f ? "#7c3aed22" : "transparent",
            color: filtro === f ? "#a855f7" : "#6b6b8a",
          }}>{f}</button>
        ))}
      </div>

      <div style={{ background: "#1a1a2e", borderRadius: 20, height: 3, marginBottom: 20 }}>
        <div style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7)", height: 3, borderRadius: 20, width: `${pct}%`, transition: "width .4s" }} />
      </div>

      {total === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#4a4a6a" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
          <div style={{ fontSize: 14 }}>Nenhuma tarefa para este período</div>
          <button onClick={() => setModal(true)} style={{ marginTop: 12, background: "#7c3aed22", border: "1px solid #7c3aed44", borderRadius: 8, padding: "8px 16px", color: "#a855f7", cursor: "pointer", fontSize: 13 }}>
            + Adicionar tarefa
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {pendentes.map(t => (
          <div key={t.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
            background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 10,
          }}>
            <div onClick={() => toggleTarefa(t.id)} style={{
              width: 18, height: 18, borderRadius: 5, border: "1.5px solid #2e2e4e",
              flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", background: "transparent"
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#d4d4e8" }}>{t.texto}</div>
              {t.descricao && <div style={{ fontSize: 11, color: "#4a4a6a", marginTop: 2 }}>{t.descricao}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {t.hora && <span style={{ fontSize: 11, color: "#4a4a6a" }}>{t.hora}</span>}
              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: (coresCat[t.categoria] || "#7c3aed") + "20", color: coresCat[t.categoria] || "#a855f7" }}>{t.categoria}</span>
              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: coresPri[t.prioridade] + "20", color: coresPri[t.prioridade] }}>{t.prioridade}</span>
              <button onClick={() => deletarTarefa(t.id)} style={{ background: "none", border: "none", color: "#2e2e4e", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setModal(true)} style={{
        width: "100%", marginTop: 8, padding: "10px 14px", background: "transparent",
        border: "1px dashed #1a1a2e", borderRadius: 10, color: "#4a4a6a", cursor: "pointer",
        fontSize: 13, textAlign: "left", display: "flex", alignItems: "center", gap: 8
      }}>
        <span>+</span> Adicionar tarefa
      </button>

      {concluidas.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, color: "#4a4a6a", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Concluídas · {concluidas.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {concluidas.map(t => (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                background: "#0a0a14", border: "1px solid #12121e", borderRadius: 10, opacity: 0.6
              }}>
                <div onClick={() => toggleTarefa(t.id)} style={{
                  width: 18, height: 18, borderRadius: 5, background: "#7c3aed",
                  flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 10, color: "#fff"
                }}>✓</div>
                <div style={{ flex: 1, fontSize: 13, color: "#4a4a6a", textDecoration: "line-through" }}>{t.texto}</div>
                <button onClick={() => deletarTarefa(t.id)} style={{ background: "none", border: "none", color: "#2e2e4e", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 24, width: 420, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Nova tarefa</h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                autoFocus
                placeholder="O que precisa ser feito?"
                value={nova.texto}
                onChange={e => setNova({ ...nova, texto: e.target.value })}
                onKeyDown={e => e.key === "Enter" && adicionarTarefa()}
                style={{ background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none" }}
              />
              <input
                placeholder="Descrição (opcional)"
                value={nova.descricao}
                onChange={e => setNova({ ...nova, descricao: e.target.value })}
                style={{ background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <select value={nova.categoria} onChange={e => setNova({ ...nova, categoria: e.target.value })}
                  style={{ background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }}>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={nova.prioridade} onChange={e => setNova({ ...nova, prioridade: e.target.value })}
                  style={{ background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }}>
                  {prioridades.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input type="time" value={nova.hora} onChange={e => setNova({ ...nova, hora: e.target.value })}
                  style={{ background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
                <input type="date" value={nova.data} onChange={e => setNova({ ...nova, data: e.target.value })}
                  style={{ background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              </div>
              <button onClick={adicionarTarefa} style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none",
                borderRadius: 8, padding: "11px", color: "#fff", cursor: "pointer",
                fontSize: 14, fontWeight: 500, marginTop: 4
              }}>
                Criar tarefa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}