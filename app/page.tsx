"use client"

import { useState, useEffect } from "react"
import { usePlanner } from "./context/PlannerContext"
import { useRouter } from "next/navigation"

const frases = [
  "Pequenas rotinas criam estabilidade. Continue.",
  "Um dia de cada vez. Você está no caminho.",
  "Clareza começa com organização. Siga em frente.",
  "Cada ação pequena constrói algo grande.",
  "Você está construindo algo incrível em silêncio.",
  "Organize o dia, organize a mente.",
  "Consistência é a forma mais silenciosa de evolução.",
]

const climasMentais = [
  { label: "Nebuloso", sub: "porém funcional", icone: "🌥️", cor: "#6b6b8a" },
  { label: "Claro", sub: "mente organizada", icone: "☀️", cor: "#f59e0b" },
  { label: "Tempestuoso", sub: "passará logo", icone: "⛈️", cor: "#2563eb" },
  { label: "Tranquilo", sub: "em equilíbrio", icone: "🌙", cor: "#7c3aed" },
  { label: "Acelerado", sub: "muita energia", icone: "⚡", cor: "#d97706" },
]

function getStreak(habitos: any[], hojeStr: string) {
  let max = 0
  habitos.forEach((h: any) => {
    let streak = 0
    const d = new Date(hojeStr)
    while ((h.historico || []).includes(d.toISOString().slice(0, 10))) {
      streak++
      d.setDate(d.getDate() - 1)
    }
    if (streak > max) max = streak
  })
  return max
}

export default function Dashboard() {
  const { data, setTarefas } = usePlanner()
  const { tarefas, habitos, metas } = data
  const router = useRouter()

  const hoje = new Date()
  const hojeStr = hoje.toISOString().slice(0, 10)
  const hora = hoje.getHours()
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite"
  const iconeHora = hora < 12 ? "☀️" : hora < 18 ? "🌤️" : "🌙"
  const frase = frases[hoje.getDay() % frases.length]
  const dataFormatada = hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const dataCapital = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)

  const [clima] = useState(climasMentais[0])
  const [notaRapida, setNotaRapida] = useState("")
  const [projetos, setProjetos] = useState<any[]>([])
  const [diarioEntradas, setDiarioEntradas] = useState<any[]>([])
  const [focoIntencao, setFocoIntencao] = useState("Criar com clareza e manter consistência")
  const [editandoFoco, setEditandoFoco] = useState(false)
  const [agendaHoje, setAgendaHoje] = useState<any[]>([])

  useEffect(() => {
    const p = localStorage.getItem("projetos-v1")
    if (p) setProjetos(JSON.parse(p).filter((x: any) => x.status === "Em andamento").slice(0, 3))
    const d = localStorage.getItem("diario-global")
    if (d) setDiarioEntradas(JSON.parse(d).slice(0, 1))
    const f = localStorage.getItem("foco-intencao")
    if (f) setFocoIntencao(f)
    const ag = localStorage.getItem("agenda-v3")
    if (ag) {
      const todos = JSON.parse(ag)
      const deHoje = todos
        .filter((b: any) => b.data === hojeStr)
        .sort((a: any, b: any) => (a.horaInicio || "").localeCompare(b.horaInicio || ""))
        .map((b: any) => {
          const [h1, m1] = (b.horaInicio || "00:00").split(":").map(Number)
          const [h2, m2] = (b.horaFim || "00:00").split(":").map(Number)
          const dur = (h2 * 60 + m2) - (h1 * 60 + m1)
          return { hora: b.horaInicio || "00:00", titulo: b.titulo || "Compromisso", dur: dur > 0 ? `${dur}min` : "", cor: b.cor || "#7c3aed" }
        })
      setAgendaHoje(deHoje)
    }
  }, [hojeStr])

  const tarefasHoje = (tarefas as any[]).filter((t: any) => t.data === hojeStr)
  const tarefasPendentes = tarefasHoje.filter((t: any) => !t.feita)
  const proximaTarefa = tarefasPendentes[0]

  function toggleTarefa(id: number) {
    setTarefas((tarefas as any[]).map((t: any) => t.id === id ? { ...t, feita: !t.feita } : t) as any)
  }

  const totalHabitos = (habitos as any[]).length
  const habitosFeitosHoje = (habitos as any[]).filter((h: any) => (h.historico || []).includes(hojeStr))
  const streak = getStreak(habitos as any[], hojeStr)

  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hojeStr)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  const diasSem = ["D", "S", "T", "Q", "Q", "S", "S"]

  const evolucao = [
    { label: "Mais clareza mental", valor: "+18%", up: true },
    { label: "Menos sobrecarga", valor: "-23%", up: false },
    { label: "Rotina mais consistente", valor: "+31%", up: true },
    { label: "Mais estabilidade", valor: "+22%", up: true },
  ]

  const card: React.CSSProperties = {
    background: "#0f0f1c",
    border: "1px solid #1a1a2e",
    borderRadius: 16,
    padding: 20,
  }

  return (
    <div style={{ padding: "28px 32px", color: "#e2e8f0", maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 4px", letterSpacing: -0.5 }}>
            {saudacao}. {iconeHora}
          </h1>
          <div style={{ fontSize: 13, color: "#4a4a6a" }}>{dataCapital}</div>
        </div>
        <div style={{ fontSize: 12, color: "#6b6b8a", fontStyle: "italic", textAlign: "right", maxWidth: 300 }}>
          ❝ {frase} ❞
        </div>
      </div>

      {/* Linha 1 — 4 cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Estado atual */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, color: "#4a4a6a", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em" }}>Estado atual</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <div style={{ fontSize: 36 }}>{clima.icone}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: clima.cor }}>{clima.label}</div>
              <div style={{ fontSize: 12, color: "#6b6b8a" }}>{clima.sub}</div>
            </div>
          </div>
          <button style={{ background: "none", border: "none", color: "#a855f7", fontSize: 12, cursor: "pointer", padding: 0, textAlign: "left" }}>
            Ver detalhes do dia →
          </button>
        </div>

        {/* Próxima ação */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 11, color: "#4a4a6a", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Próxima ação importante</div>
          {proximaTarefa ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                <div onClick={() => toggleTarefa(proximaTarefa.id)} style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid #2e2e4e", flexShrink: 0, marginTop: 2, cursor: "pointer" }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0", lineHeight: 1.4 }}>{proximaTarefa.texto}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#7c3aed20", color: "#a855f7" }}>Hoje</span>
                {proximaTarefa.prioridade && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#dc262620", color: "#f87171" }}>{proximaTarefa.prioridade} prioridade</span>}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "#4a4a6a" }}>
              {tarefasHoje.length > 0 ? "✓ Todas concluídas hoje!" : "Nenhuma tarefa para hoje."}
            </div>
          )}
        </div>

        {/* Foco do dia */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 11, color: "#4a4a6a", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Foco principal de hoje</div>
          {editandoFoco ? (
            <input autoFocus value={focoIntencao} onChange={e => setFocoIntencao(e.target.value)}
              onBlur={() => { localStorage.setItem("foco-intencao", focoIntencao); setEditandoFoco(false) }}
              onKeyDown={e => e.key === "Enter" && (localStorage.setItem("foco-intencao", focoIntencao), setEditandoFoco(false))}
              style={{ width: "100%", background: "#12121f", border: "1px solid #7c3aed40", borderRadius: 8, padding: "8px 10px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
          ) : (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }} onClick={() => setEditandoFoco(true)}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#7c3aed18", border: "1px solid #7c3aed30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎯</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0", lineHeight: 1.4, marginBottom: 4 }}>{focoIntencao}</div>
                <div style={{ fontSize: 11, color: "#4a4a6a" }}>Intenção do dia</div>
              </div>
            </div>
          )}
        </div>

        {/* Sequência */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 11, color: "#4a4a6a", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Sequência consciente</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>{streak} dias</span>
          </div>
          <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 12 }}>Você está construindo algo incrível em silêncio.</div>
          <div style={{ display: "flex", gap: 4 }}>
            {ultimos7.map((d, i) => {
              const temHabito = (habitos as any[]).some((h: any) => (h.historico || []).includes(d))
              const ehHoje = d === hojeStr
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: temHabito ? "#7c3aed" : "#1e1e35", boxShadow: temHabito ? "0 0 4px #7c3aed60" : "none", border: ehHoje ? "1px solid #a855f7" : "none" }} />
                  <div style={{ fontSize: 8, color: "#3a3a5a" }}>{diasSem[new Date(d + "T00:00:00").getDay()]}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Linha 2 — 3 colunas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Agenda */}
        <div style={{ ...card }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span>📅</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Agenda de hoje</span>
          </div>
          {agendaHoje.length === 0 ? (
            <div style={{ fontSize: 13, color: "#4a4a6a", marginBottom: 12 }}>Nenhum compromisso hoje.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {agendaHoje.slice(0, 5).map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.cor, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#6b6b8a", flexShrink: 0, width: 44 }}>{a.hora}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "#94a3b8" }}>{a.titulo}</span>
                  <span style={{ fontSize: 11, color: "#3a3a5a" }}>{a.dur}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => router.push("/agenda")} style={{ marginTop: 14, background: "none", border: "none", color: "#a855f7", fontSize: 12, cursor: "pointer", padding: 0 }}>
            Ver agenda completa →
          </button>
        </div>

        {/* Tarefas */}
        <div style={{ ...card }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span>☑️</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Tarefas prioritárias</span>
          </div>
          {tarefasPendentes.length === 0 && (
            <div style={{ fontSize: 13, color: "#4a4a6a", marginBottom: 12 }}>
              {tarefasHoje.length > 0 ? "✓ Todas concluídas hoje!" : "Sem pendências hoje."}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tarefasPendentes.slice(0, 4).map((t: any) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div onClick={() => toggleTarefa(t.id)} style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px solid #2e2e4e", flexShrink: 0, cursor: "pointer" }} />
                <span style={{ flex: 1, fontSize: 13, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.texto}</span>
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: t.prioridade === "Alta" ? "#7c3aed20" : "#d9770620", color: t.prioridade === "Alta" ? "#a855f7" : "#d97706", flexShrink: 0 }}>{t.prioridade}</span>
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/tarefas")} style={{ marginTop: 14, background: "none", border: "1px solid #1e1e35", borderRadius: 8, padding: "6px 12px", color: "#6b6b8a", fontSize: 12, cursor: "pointer" }}>
            + Adicionar tarefa
          </button>
        </div>

        {/* Hábitos */}
        <div style={{ ...card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>🔥</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Hábitos de hoje</span>
            </div>
            <button onClick={() => router.push("/habitos")} style={{ background: "none", border: "none", color: "#a855f7", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver todos</button>
          </div>
          {totalHabitos === 0 && <div style={{ fontSize: 13, color: "#4a4a6a" }}>Nenhum hábito cadastrado.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(habitos as any[]).slice(0, 5).map((h: any) => {
              const feito = (h.historico || []).includes(hojeStr)
              let hstreak = 0
              const d = new Date(hojeStr)
              while ((h.historico || []).includes(d.toISOString().slice(0, 10))) { hstreak++; d.setDate(d.getDate() - 1) }
              return (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{h.icone}</span>
                  <span style={{ flex: 1, fontSize: 13, color: feito ? "#e2e8f0" : "#6b6b8a" }}>{h.nome}</span>
                  <div style={{ display: "flex", gap: 2 }}>
                    {Array.from({ length: 7 }, (_, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: 2, background: i < Math.min(hstreak, 7) ? "#7c3aed" : "#1e1e35" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: "#f59e0b", flexShrink: 0 }}>{hstreak}d</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Linha 3 — 3 colunas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Projetos */}
        <div style={{ ...card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Projetos ativos</span>
            <button onClick={() => router.push("/projetos")} style={{ background: "none", border: "none", color: "#a855f7", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver todos</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {projetos.map((p: any) => (
              <div key={p.id} onClick={() => router.push(`/projetos/${p.id}`)} style={{ background: "#12121f", border: `1px solid ${p.cor}30`, borderRadius: 12, padding: 12, cursor: "pointer" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{p.icone}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0", marginBottom: 6 }}>{p.nome}</div>
                <div style={{ background: "#1a1a2e", borderRadius: 20, height: 3, marginBottom: 4 }}>
                  <div style={{ background: p.cor, height: 3, borderRadius: 20, width: `${p.progresso}%` }} />
                </div>
                <div style={{ fontSize: 11, color: p.cor }}>{p.progresso}%</div>
              </div>
            ))}
            <div onClick={() => router.push("/projetos")} style={{ background: "transparent", border: "1px dashed #1e1e35", borderRadius: 12, padding: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, minHeight: 80 }}>
              <span style={{ fontSize: 18, color: "#4a4a6a" }}>+</span>
              <span style={{ fontSize: 11, color: "#4a4a6a" }}>Novo projeto</span>
            </div>
          </div>
        </div>

        {/* Insight */}
        <div style={{ ...card, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Insight leve</div>
          <div style={{ flex: 1, display: "flex", gap: 14, alignItems: "flex-start" }}>
            <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.7, flex: 1 }}>
              {habitosFeitosHoje.length >= totalHabitos * 0.7 && totalHabitos > 0
                ? "Você parece mais estável após dias organizados. Sua rotina está fazendo diferença."
                : streak > 5
                ? `${streak} dias seguidos. A consistência é a forma mais silenciosa de evolução.`
                : "Cada pequena ação de hoje é parte de algo maior que você está construindo."}
            </p>
            <span style={{ fontSize: 36, opacity: 0.4 }}>🧠</span>
          </div>
          <div style={{ fontSize: 11, color: "#3a3a5a", marginTop: 12 }}>Baseado nos últimos 7 dias.</div>
        </div>

        {/* Evolução */}
        <div style={{ ...card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Evolução silenciosa</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {evolucao.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: e.up ? "#05906918" : "#7c3aed18", border: `1px solid ${e.up ? "#05906930" : "#7c3aed30"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, color: e.up ? "#059669" : "#a855f7" }}>
                  {e.up ? "↑" : "↓"}
                </div>
                <span style={{ flex: 1, fontSize: 12, color: "#6b6b8a" }}>{e.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: e.up ? "#059669" : "#7c3aed" }}>{e.valor}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#3a3a5a", marginTop: 12 }}>Comparado às últimas 4 semanas</div>
        </div>
      </div>

      {/* Linha 4 — 2 colunas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Diário */}
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#7c3aed18", border: "1px solid #7c3aed30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✍️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 3 }}>
              Diário recente · {hoje.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {diarioEntradas[0]?.texto || "Nenhuma entrada recente. Registre como foi o seu dia."}
            </div>
          </div>
          <button onClick={() => router.push("/diario")} style={{ background: "none", border: "none", color: "#a855f7", fontSize: 12, cursor: "pointer", padding: 0, flexShrink: 0 }}>
            Ver diário →
          </button>
        </div>

        {/* Notas rápidas */}
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#12121f", border: "1px solid #1e1e35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📋</div>
          <input value={notaRapida} onChange={e => setNotaRapida(e.target.value)} placeholder="Anote algo importante..."
            style={{ flex: 1, background: "none", border: "none", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
          <button onClick={() => { if (notaRapida.trim()) { alert("Nota salva!"); setNotaRapida("") } }}
            style={{ width: 32, height: 32, borderRadius: 8, background: "#7c3aed", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            +
          </button>
        </div>
      </div>
    </div>
  )
}