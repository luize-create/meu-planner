"use client"

import { useState } from "react"
import { usePlanner, Tarefa } from "../context/PlannerContext"

const coresCat: Record<string, string> = {
  "IA": "#7c3aed", "Programação": "#2563eb", "Estudos": "#0891b2",
  "Saúde": "#dc2626", "Pessoal": "#d97706", "Trabalho": "#059669", "Projetos": "#a855f7",
}
const coresPri: Record<string, string> = {
  "Alta": "#7c3aed", "Média": "#d97706", "Baixa": "#475569"
}

function getDiasSemana(): { data: string; label: string; curto: string; isHoje: boolean }[] {
  const dias = []
  const hoje = new Date()
  const nomeDia = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]
  const nomeDiaLongo = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]
  for (let i = 0; i < 7; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    const dataStr = d.toISOString().slice(0, 10)
    const diaN = d.getDay()
    const diaNum = d.getDate()
    dias.push({
      data: dataStr,
      label: `${nomeDiaLongo[diaN]} · ${diaNum}`,
      curto: `${nomeDia[diaN]} · ${diaNum}`,
      isHoje: i === 0,
    })
  }
  return dias
}

export default function AgendaSemana() {
  const { data, setTarefas, adicionarXP } = usePlanner()
  const { tarefas } = data
  const dias = getDiasSemana()

  const [inputAberto, setInputAberto] = useState<string | null>(null)
  const [textoNovo, setTextoNovo] = useState("")

  function toggleTarefa(id: number) {
    const t = tarefas.find(t => t.id === id)
    if (t && !t.feita) adicionarXP(20)
    setTarefas(tarefas.map(t => t.id === id ? { ...t, feita: !t.feita } : t))
  }

  function adicionarRapido(data: string) {
    if (!textoNovo.trim()) return
    const nova: Tarefa = {
      id: Date.now(),
      texto: textoNovo.trim(),
      descricao: "",
      categoria: "Pessoal",
      prioridade: "Média",
      hora: "",
      feita: false,
      data,
    }
    setTarefas([...tarefas, nova])
    setTextoNovo("")
    setInputAberto(null)
  }

  return (
    <div style={{ background: "#0f0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: 28 }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <p style={{ fontSize: 11, color: "#6b6b8a", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: ".06em" }}>semana</p>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#e2e0f0", margin: 0 }}>
            {dias[0].curto.split("·")[1]?.trim()}–{dias[6].curto.split("·")[1]?.trim()} de {new Date().toLocaleString("pt-BR", { month: "short" })}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {dias.map(({ data, label, isHoje }) => {
          const tarefasDia = tarefas.filter(t => t.data === data)
          const feitas = tarefasDia.filter(t => t.feita).length
          const pendentes = tarefasDia.filter(t => !t.feita)
          const concluidasLista = tarefasDia.filter(t => t.feita)
          const aberto = inputAberto === data

          return (
            <div key={data} style={{ marginBottom: 16 }}>

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0 6px" }}>
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  color: isHoje ? "#a855f7" : "#6b6b8a",
                  minWidth: 80,
                }}>
                  {isHoje ? `hoje · ${label.split("·")[1]?.trim()}` : label}
                </span>
                <div style={{ flex: 1, height: "0.5px", background: "#1e1e35" }} />
                {tarefasDia.length > 0 && (
                  <span style={{ fontSize: 11, color: "#4a4a6a" }}>{feitas}/{tarefasDia.length}</span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {pendentes.map(t => (
                  <div key={t.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", background: "#12101e",
                    border: "1px solid #1e1e35", borderRadius: 8,
                  }}>
                    <div
                      onClick={() => toggleTarefa(t.id)}
                      style={{
                        width: 16, height: 16, borderRadius: 4,
                        border: "1.5px solid #2e2e4e", flexShrink: 0,
                        cursor: "pointer",
                      }}
                    />
                    <span style={{ fontSize: 13, color: "#d4d4e8", flex: 1 }}>{t.texto}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      {t.hora && <span style={{ fontSize: 10, color: "#4a4a6a" }}>{t.hora}</span>}
                      {t.categoria && (
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: (coresCat[t.categoria] || "#7c3aed") + "20", color: coresCat[t.categoria] || "#a855f7" }}>
                          {t.categoria}
                        </span>
                      )}
                      {t.prioridade && (
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: (coresPri[t.prioridade] || "#475569") + "20", color: coresPri[t.prioridade] || "#94a3b8" }}>
                          {t.prioridade}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {concluidasLista.map(t => (
                  <div key={t.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", background: "#0a0a14",
                    border: "1px solid #12121e", borderRadius: 8, opacity: 0.5,
                  }}>
                    <div
                      onClick={() => toggleTarefa(t.id)}
                      style={{
                        width: 16, height: 16, borderRadius: 4,
                        background: "#7c3aed", flexShrink: 0,
                        cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 9, color: "#fff",
                      }}
                    >✓</div>
                    <span style={{ fontSize: 13, color: "#4a4a6a", textDecoration: "line-through", flex: 1 }}>{t.texto}</span>
                  </div>
                ))}

                {aberto ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      autoFocus
                      value={textoNovo}
                      onChange={e => setTextoNovo(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") adicionarRapido(data)
                        if (e.key === "Escape") { setInputAberto(null); setTextoNovo("") }
                      }}
                      placeholder="Nome da tarefa..."
                      style={{
                        flex: 1, background: "#12121f", border: "1px solid #7c3aed44",
                        borderRadius: 8, padding: "8px 12px", color: "#e2e8f0",
                        fontSize: 13, outline: "none",
                      }}
                    />
                    <button
                      onClick={() => adicionarRapido(data)}
                      style={{
                        background: "#7c3aed", border: "none", borderRadius: 8,
                        padding: "8px 14px", color: "#fff", cursor: "pointer", fontSize: 13,
                      }}
                    >+</button>
                    <button
                      onClick={() => { setInputAberto(null); setTextoNovo("") }}
                      style={{
                        background: "none", border: "1px solid #1e1e35", borderRadius: 8,
                        padding: "8px 10px", color: "#6b6b8a", cursor: "pointer", fontSize: 13,
                      }}
                    >✕</button>
                  </div>
                ) : (
                  <div
                    onClick={() => { setInputAberto(data); setTextoNovo("") }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 10px", background: "transparent",
                      border: "1px dashed #1a1a2e", borderRadius: 8,
                      color: "#4a4a6a", cursor: "pointer", fontSize: 12,
                    }}
                  >
                    <span>+</span> anotar tarefa para {label.split("·")[0].trim()}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}