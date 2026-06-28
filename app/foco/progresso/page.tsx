"use client"

import { useMemo } from "react"
import { usePlanner } from "../../context/PlannerContext"
import { useRouter } from "next/navigation"

interface FocusSession {
  id: string
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
  tipo?: string
  concluida?: boolean
}

interface Conquista {
  id: string
  titulo: string
  descricao: string
  icone: string
  desbloqueada: boolean
  progresso?: number
  meta?: number
  cor: string
}

function fmtMin(m: number) {
  if (m === 0) return "0m"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const min = m % 60
  return min > 0 ? `${h}h ${min}m` : `${h}h`
}

// ── Heatmap ───────────────────────────────────────────────
function Heatmap({ sessoes }: { sessoes: FocusSession[] }) {
  const SEMANAS = 26
  const hoje    = new Date().toISOString().slice(0, 10)

  const grid = useMemo(() => {
    const ref = new Date()
    const dow = ref.getDay()
    ref.setDate(ref.getDate() - ((dow + 6) % 7) - (SEMANAS - 1) * 7)
    return Array.from({ length: SEMANAS }, (_, s) =>
      Array.from({ length: 7 }, (_, d) => {
        const dia = new Date(ref)
        dia.setDate(ref.getDate() + s * 7 + d)
        const key = dia.toISOString().slice(0, 10)
        const mins = sessoes.filter(s => s.date === key).reduce((a, s) => a + s.durationMinutes, 0)
        return { key, mins, futuro: key > hoje }
      })
    )
  }, [sessoes, hoje])

  const mesesLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = []
    let lastMonth = -1
    grid.forEach((semana, s) => {
      const mes = new Date(semana[0].key + "T12:00:00").getMonth()
      if (mes !== lastMonth) {
        labels.push({
          label: new Date(semana[0].key + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" }),
          col: s,
        })
        lastMonth = mes
      }
    })
    return labels
  }, [grid])

  function corCelula(mins: number, futuro: boolean): string {
    if (futuro || mins === 0) return "#1a1a2e"
    if (mins < 20)  return "#4c1d9540"
    if (mins < 40)  return "#7c3aed55"
    if (mins < 60)  return "#7c3aed80"
    if (mins < 90)  return "#a855f7aa"
    return "#c4b5fd"
  }

  const diasLabel = ["S","T","Q","Q","S","S","D"]

  return (
    <div style={{ background: "#0a0a14", borderRadius: 16, padding: "18px 20px", overflowX: "auto" }}>
      <div style={{ display: "flex", marginBottom: 6, paddingLeft: 22, position: "relative", height: 16 }}>
        {mesesLabels.map((m, i) => (
          <span key={i} style={{ position: "absolute", left: 22 + m.col * 17, fontSize: 9, color: "#4a4a6a", whiteSpace: "nowrap" }}>
            {m.label}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 4, flexShrink: 0 }}>
          {diasLabel.map((d, i) => (
            <div key={i} style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#3a3a5a" }}>{d}</div>
          ))}
        </div>
        {grid.map((semana, si) => (
          <div key={si} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {semana.map((dia, di) => (
              <div key={di}
                title={dia.futuro ? "" : `${dia.key}: ${fmtMin(dia.mins)}`}
                style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, background: corCelula(dia.mins, dia.futuro), opacity: dia.futuro ? 0 : 1, transition: "background .1s", boxShadow: dia.mins >= 90 ? "0 0 4px #a855f760" : "none" }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 9, color: "#3a3a5a" }}>Menos</span>
        {["#1a1a2e","#4c1d9540","#7c3aed55","#7c3aed80","#a855f7aa","#c4b5fd"].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
        ))}
        <span style={{ fontSize: 9, color: "#3a3a5a" }}>Mais</span>
      </div>
    </div>
  )
}

// ── Badge de conquista ────────────────────────────────────
function BadgeConquista({ c }: { c: Conquista }) {
  return (
    <div style={{
      background: c.desbloqueada ? "#0d0d1c" : "#09090f",
      border: `1px solid ${c.desbloqueada ? c.cor + "40" : "#1a1a2e"}`,
      borderRadius: 16,
      padding: "16px 14px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      opacity: c.desbloqueada ? 1 : 0.5,
      transition: "all .2s",
      boxShadow: c.desbloqueada ? `0 0 16px ${c.cor}15` : "none",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: c.desbloqueada ? c.cor + "20" : "#1a1a2e",
        border: `2px solid ${c.desbloqueada ? c.cor + "60" : "#2a2a3a"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
        filter: c.desbloqueada ? "none" : "grayscale(1) brightness(0.4)",
        boxShadow: c.desbloqueada ? `0 0 12px ${c.cor}30` : "none",
      }}>
        {c.icone}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.desbloqueada ? "#e2e8f0" : "#3a3a5a", marginBottom: 3, lineHeight: 1.3 }}>
          {c.titulo}
        </div>
        <div style={{ fontSize: 10, color: c.desbloqueada ? "#6b6b8a" : "#2a2a3a", lineHeight: 1.4 }}>
          {c.descricao}
        </div>
      </div>

      {/* Barra de progresso para conquistas não desbloqueadas */}
      {!c.desbloqueada && c.progresso !== undefined && c.meta !== undefined && (
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: "#3a3a5a" }}>{c.progresso}</span>
            <span style={{ fontSize: 9, color: "#3a3a5a" }}>{c.meta}</span>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 20, height: 3 }}>
            <div style={{ background: "#3a3a5a", height: 3, borderRadius: 20, width: `${Math.min(100, Math.round(c.progresso / c.meta * 100))}%`, transition: "width .4s" }} />
          </div>
        </div>
      )}

      {c.desbloqueada && (
        <div style={{ fontSize: 9, color: c.cor, fontWeight: 600 }}>✓ Desbloqueada</div>
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function ProgressoFoco() {
  const { data } = usePlanner()
  const router   = useRouter()
  const sessoes  = (data.sessoesFoco || []) as FocusSession[]

  const hoje = new Date().toISOString().slice(0, 10)

  const inicioSemana = (() => {
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
  })()

  const stats = useMemo(() => {
    const total     = sessoes.reduce((a, s) => a + s.durationMinutes, 0)
    const hojeMin   = sessoes.filter(s => s.date === hoje).reduce((a, s) => a + s.durationMinutes, 0)
    const semanaMin = sessoes.filter(s => s.date >= inicioSemana).reduce((a, s) => a + s.durationMinutes, 0)
    const totalSessoes  = sessoes.length
    const sessoesHoje   = sessoes.filter(s => s.date === hoje).length
    const sessoesSemana = sessoes.filter(s => s.date >= inicioSemana).length

    // Streak
    let streak = 0
    const d = new Date()
    while (streak < 365) {
      const key = d.toISOString().slice(0, 10)
      if (sessoes.some(s => s.date === key)) { streak++; d.setDate(d.getDate() - 1) } else break
    }

    // Melhor streak histórico
    const diasComFoco = [...new Set(sessoes.map(s => s.date))].sort()
    let melhorStreak = 0, curStreak = 1
    for (let i = 1; i < diasComFoco.length; i++) {
      const diff = (new Date(diasComFoco[i]).getTime() - new Date(diasComFoco[i-1]).getTime()) / 86400000
      if (diff === 1) { curStreak++; if (curStreak > melhorStreak) melhorStreak = curStreak }
      else curStreak = 1
    }
    if (diasComFoco.length > 0 && melhorStreak === 0) melhorStreak = 1

    // Por dia
    const porDia: Record<string, number> = {}
    sessoes.forEach(s => { porDia[s.date] = (porDia[s.date] || 0) + s.durationMinutes })
    const melhorDia = Object.values(porDia).length > 0 ? Math.max(...Object.values(porDia)) : 0

    // Média diária últimos 30 dias
    const dias30 = Array.from({ length: 30 }, (_, i) => {
      const d2 = new Date(); d2.setDate(d2.getDate() - i)
      return d2.toISOString().slice(0, 10)
    })
    const mediaMin = Math.round(dias30.reduce((a, d2) => a + (porDia[d2] || 0), 0) / 30)

    return { total, hojeMin, semanaMin, totalSessoes, sessoesHoje, sessoesSemana, streak, melhorStreak, melhorDia, mediaMin }
  }, [sessoes, hoje, inicioSemana])

  // ── Conquistas ──
  const conquistas: Conquista[] = useMemo(() => {
    const totalHoras  = stats.total / 60
    const totalSessoes = stats.totalSessoes
    const streak       = stats.streak
    const melhorStreak = stats.melhorStreak

    return [
      {
        id: "primeira_sessao",
        titulo: "Primeira sessão",
        descricao: "Você iniciou sua jornada de foco.",
        icone: "🎯",
        cor: "#10b981",
        desbloqueada: totalSessoes >= 1,
        progresso: Math.min(totalSessoes, 1),
        meta: 1,
      },
      {
        id: "10_sessoes",
        titulo: "10 sessões",
        descricao: "Consistência começa a se formar.",
        icone: "🔥",
        cor: "#f59e0b",
        desbloqueada: totalSessoes >= 10,
        progresso: Math.min(totalSessoes, 10),
        meta: 10,
      },
      {
        id: "100_sessoes",
        titulo: "100 sessões",
        descricao: "Você é dedicado de verdade.",
        icone: "💎",
        cor: "#3b82f6",
        desbloqueada: totalSessoes >= 100,
        progresso: Math.min(totalSessoes, 100),
        meta: 100,
      },
      {
        id: "10h",
        titulo: "10 horas focadas",
        descricao: "10 horas de trabalho profundo.",
        icone: "⏱",
        cor: "#7c3aed",
        desbloqueada: totalHoras >= 10,
        progresso: Math.round(Math.min(totalHoras, 10) * 10) / 10,
        meta: 10,
      },
      {
        id: "100h",
        titulo: "100 horas focadas",
        descricao: "Cem horas de concentração real.",
        icone: "🏆",
        cor: "#f59e0b",
        desbloqueada: totalHoras >= 100,
        progresso: Math.round(Math.min(totalHoras, 100)),
        meta: 100,
      },
      {
        id: "500h",
        titulo: "500 horas focadas",
        descricao: "Nível de maestria.",
        icone: "👑",
        cor: "#ec4899",
        desbloqueada: totalHoras >= 500,
        progresso: Math.round(Math.min(totalHoras, 500)),
        meta: 500,
      },
      {
        id: "7_dias",
        titulo: "7 dias seguidos",
        descricao: "Uma semana inteira de consistência.",
        icone: "📅",
        cor: "#10b981",
        desbloqueada: melhorStreak >= 7,
        progresso: Math.min(streak, 7),
        meta: 7,
      },
      {
        id: "30_dias",
        titulo: "30 dias seguidos",
        descricao: "Um mês sem quebrar a corrente.",
        icone: "🌟",
        cor: "#a855f7",
        desbloqueada: melhorStreak >= 30,
        progresso: Math.min(streak, 30),
        meta: 30,
      },
      {
        id: "deep_work",
        titulo: "Deep Work Master",
        descricao: "5 sessões de 90min+ em uma semana.",
        icone: "🧠",
        cor: "#6366f1",
        desbloqueada: (() => {
          const dias7 = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - i)
            return d.toISOString().slice(0, 10)
          })
          return sessoes.filter(s => dias7.includes(s.date) && s.durationMinutes >= 90).length >= 5
        })(),
        progresso: Math.min(
          sessoes.filter(s => {
            const dias7 = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(); d.setDate(d.getDate() - i)
              return d.toISOString().slice(0, 10)
            })
            return dias7.includes(s.date) && s.durationMinutes >= 90
          }).length, 5
        ),
        meta: 5,
      },
      {
        id: "madrugador",
        titulo: "Madrugador",
        descricao: "10 sessões iniciadas antes das 8h.",
        icone: "🌅",
        cor: "#f59e0b",
        desbloqueada: sessoes.filter(s => {
          const h = parseInt((s.startTime || "12:00").split(":")[0])
          return h < 8
        }).length >= 10,
        progresso: Math.min(sessoes.filter(s => {
          const h = parseInt((s.startTime || "12:00").split(":")[0])
          return h < 8
        }).length, 10),
        meta: 10,
      },
      {
        id: "noturno",
        titulo: "Coruja",
        descricao: "10 sessões iniciadas após 22h.",
        icone: "🦉",
        cor: "#3b82f6",
        desbloqueada: sessoes.filter(s => {
          const h = parseInt((s.startTime || "12:00").split(":")[0])
          return h >= 22
        }).length >= 10,
        progresso: Math.min(sessoes.filter(s => {
          const h = parseInt((s.startTime || "12:00").split(":")[0])
          return h >= 22
        }).length, 10),
        meta: 10,
      },
      {
        id: "semana_perfeita",
        titulo: "Semana perfeita",
        descricao: "Foco todos os dias de uma semana.",
        icone: "✦",
        cor: "#c4b5fd",
        desbloqueada: melhorStreak >= 7,
        progresso: Math.min(streak, 7),
        meta: 7,
      },
    ]
  }, [stats, sessoes])

  const desbloqueadas = conquistas.filter(c => c.desbloqueada).length
  const recentes = [...sessoes].slice(0, 8)

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "36px 32px 80px", color: "#e2e8f0" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <button onClick={() => router.back()}
          style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, margin: "0 0 3px", color: "#f0eeff", letterSpacing: "-0.5px" }}>
            Progresso do Foco
          </h1>
          <p style={{ fontSize: 13, color: "#4a4a6a", margin: 0 }}>Suas sessões ao longo do tempo.</p>
        </div>
        <div style={{ background: "#7c3aed20", border: "1px solid #7c3aed30", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#a855f7" }}>
          {desbloqueadas}/{conquistas.length} conquistas
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total focado",   valor: fmtMin(stats.total),     sub: `${stats.totalSessoes} sessões`,  cor: "#7c3aed" },
          { label: "Hoje",           valor: fmtMin(stats.hojeMin),   sub: `${stats.sessoesHoje} sessões`,   cor: "#10b981" },
          { label: "Esta semana",    valor: fmtMin(stats.semanaMin), sub: `${stats.sessoesSemana} sessões`, cor: "#3b82f6" },
          { label: "Sequência atual",valor: `${stats.streak}d`,      sub: `melhor: ${stats.melhorStreak}d`, cor: "#f59e0b" },
          { label: "Melhor dia",     valor: fmtMin(stats.melhorDia), sub: "recorde pessoal",                cor: "#a855f7" },
          { label: "Média diária",   valor: fmtMin(stats.mediaMin),  sub: "últimos 30 dias",                cor: "#6366f1" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: "#3a3a5a", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.cor, letterSpacing: "-0.5px", marginBottom: 3 }}>{s.valor}</div>
            <div style={{ fontSize: 11, color: "#3a3a5a" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#2a2a45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
          Consistência — últimas 26 semanas
        </div>
        <Heatmap sessoes={sessoes} />
      </div>

      {/* Conquistas */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#2a2a45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Conquistas
          </div>
          <span style={{ fontSize: 11, color: "#4a4a6a" }}>{desbloqueadas} desbloqueadas</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {conquistas.map(c => <BadgeConquista key={c.id} c={c} />)}
        </div>
      </div>

      {/* Sessões recentes */}
      {recentes.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: "#2a2a45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
            Sessões recentes
          </div>
          <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, overflow: "hidden" }}>
            {recentes.map((s, i) => (
              <div key={s.id || i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < recentes.length - 1 ? "1px solid #0f0f1c" : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.concluida !== false ? "#7c3aed" : "#3a3a5a", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 2 }}>{s.tipo || "Sessão de foco"}</div>
                  <div style={{ fontSize: 11, color: "#4a4a6a" }}>
                    {new Date(s.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                    {s.startTime ? ` · ${s.startTime}` : ""}
                    {s.endTime ? ` – ${s.endTime}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#7c3aed" }}>{fmtMin(s.durationMinutes)}</div>
                  {s.concluida === false && <div style={{ fontSize: 10, color: "#4a4a6a" }}>interrompida</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessoes.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>⏱</div>
          <p style={{ fontSize: 14, color: "#2a2a45", margin: 0 }}>Nenhuma sessão registrada ainda.</p>
          <button onClick={() => router.back()}
            style={{ marginTop: 20, background: "#7c3aed18", border: "1px solid #7c3aed30", borderRadius: 10, padding: "8px 20px", color: "#a855f7", fontSize: 13, cursor: "pointer" }}>
            Iniciar primeira sessão
          </button>
        </div>
      )}
    </div>
  )
}