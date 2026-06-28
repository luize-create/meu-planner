"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { usePlanner } from "../context/PlannerContext"

const MODOS = {
  foco:  { label: "Foco profundo", minutos: 25, cor: "#7c3aed" },
  curta: { label: "Pausa curta",   minutos: 5,  cor: "#059669" },
  longa: { label: "Pausa longa",   minutos: 15, cor: "#2563eb" },
}
type Modo = keyof typeof MODOS

const presets = [15, 25, 45, 60, 90]

function getSegundosRestantes(): number {
  try {
    const iniciou = localStorage.getItem("foco-iniciou")
    const duracao = Number(localStorage.getItem("foco-duracao") || 25 * 60)
    const rodando = localStorage.getItem("foco-rodando") === "true"
    if (iniciou && rodando) {
      const restante = duracao - Math.floor((Date.now() - Number(iniciou)) / 1000)
      return restante > 0 ? restante : 0
    }
    return duracao
  } catch { return 25 * 60 }
}

function getTempoInicial(): number {
  try { return Number(localStorage.getItem("foco-tempo-custom") || 25) } catch { return 25 }
}

function getRodandoInicial(): boolean {
  try {
    if (localStorage.getItem("foco-rodando") !== "true") return false
    const iniciou = localStorage.getItem("foco-iniciou")
    const duracao = Number(localStorage.getItem("foco-duracao") || 25 * 60)
    if (!iniciou) return false
    return Math.floor((Date.now() - Number(iniciou)) / 1000) < duracao
  } catch { return false }
}

function fmt(s: number) {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
}

function fmtMin(m: number) {
  if (m === 0) return "0m"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const min = m % 60
  return min > 0 ? `${h}h ${min}m` : `${h}h`
}

// ── Heatmap ───────────────────────────────────────────────
function Heatmap({ sessoes }: { sessoes: any[] }) {
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
        const mins = sessoes.filter((s: any) => s.date === key).reduce((a: number, s: any) => a + s.durationMinutes, 0)
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
        labels.push({ label: new Date(semana[0].key + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" }), col: s })
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
              <div key={di} title={dia.futuro ? "" : `${dia.key}: ${fmtMin(dia.mins)}`}
                style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, background: corCelula(dia.mins, dia.futuro), opacity: dia.futuro ? 0 : 1, boxShadow: dia.mins >= 90 ? "0 0 4px #a855f760" : "none" }} />
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

// ── Conquistas ────────────────────────────────────────────
function Conquistas({ sessoes }: { sessoes: any[] }) {
  const hoje = new Date().toISOString().slice(0, 10)

  const totalMin    = sessoes.reduce((a: number, s: any) => a + s.durationMinutes, 0)
  const totalHoras  = totalMin / 60
  const totalSessoes = sessoes.length

  const diasComFoco = [...new Set(sessoes.map((s: any) => s.date))].sort()
  let melhorStreak = 0, curStreak = 1
  for (let i = 1; i < diasComFoco.length; i++) {
    const diff = (new Date(diasComFoco[i]).getTime() - new Date(diasComFoco[i-1]).getTime()) / 86400000
    if (diff === 1) { curStreak++; if (curStreak > melhorStreak) melhorStreak = curStreak } else curStreak = 1
  }
  if (diasComFoco.length > 0 && melhorStreak === 0) melhorStreak = 1

  let streak = 0
  const d = new Date()
  while (streak < 365) {
    const key = d.toISOString().slice(0, 10)
    if (sessoes.some((s: any) => s.date === key)) { streak++; d.setDate(d.getDate() - 1) } else break
  }

  const conquistas = [
    { id: "primeira",   titulo: "Primeira sessão",   icone: "🎯", cor: "#10b981", desc: "Você começou.",                     ok: totalSessoes >= 1,    prog: Math.min(totalSessoes,1),       meta: 1   },
    { id: "s10",        titulo: "10 sessões",         icone: "🔥", cor: "#f59e0b", desc: "Consistência começa.",              ok: totalSessoes >= 10,   prog: Math.min(totalSessoes,10),      meta: 10  },
    { id: "s100",       titulo: "100 sessões",        icone: "💎", cor: "#3b82f6", desc: "Você é dedicado.",                  ok: totalSessoes >= 100,  prog: Math.min(totalSessoes,100),     meta: 100 },
    { id: "h10",        titulo: "10h focadas",        icone: "⏱",  cor: "#7c3aed", desc: "10 horas de trabalho profundo.",    ok: totalHoras >= 10,     prog: Math.min(totalHoras,10),        meta: 10  },
    { id: "h100",       titulo: "100h focadas",       icone: "🏆", cor: "#f59e0b", desc: "Cem horas de concentração.",        ok: totalHoras >= 100,    prog: Math.min(totalHoras,100),       meta: 100 },
    { id: "h500",       titulo: "500h focadas",       icone: "👑", cor: "#ec4899", desc: "Nível de maestria.",                ok: totalHoras >= 500,    prog: Math.min(totalHoras,500),       meta: 500 },
    { id: "d7",         titulo: "7 dias seguidos",    icone: "📅", cor: "#10b981", desc: "Uma semana inteira.",               ok: melhorStreak >= 7,    prog: Math.min(streak,7),             meta: 7   },
    { id: "d30",        titulo: "30 dias seguidos",   icone: "🌟", cor: "#a855f7", desc: "Um mês sem quebrar.",               ok: melhorStreak >= 30,   prog: Math.min(streak,30),            meta: 30  },
    { id: "deepwork",   titulo: "Deep Work Master",   icone: "🧠", cor: "#6366f1", desc: "5 sessões de 90min+ em uma semana.",ok: (() => {
      const dias7 = Array.from({length:7},(_,i)=>{ const d2=new Date(); d2.setDate(d2.getDate()-i); return d2.toISOString().slice(0,10) })
      return sessoes.filter((s:any) => dias7.includes(s.date) && s.durationMinutes >= 90).length >= 5
    })(), prog: Math.min(sessoes.filter((s:any)=>{ const dias7=Array.from({length:7},(_,i)=>{ const d2=new Date(); d2.setDate(d2.getDate()-i); return d2.toISOString().slice(0,10) }); return dias7.includes(s.date) && s.durationMinutes>=90 }).length,5), meta: 5 },
  ]

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {conquistas.map(c => (
        <div key={c.id} style={{ background: c.ok ? "#0d0d1c" : "#09090f", border: `1px solid ${c.ok ? c.cor+"40" : "#1a1a2e"}`, borderRadius: 14, padding: "14px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, opacity: c.ok ? 1 : 0.5, boxShadow: c.ok ? `0 0 14px ${c.cor}15` : "none" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: c.ok ? c.cor+"20" : "#1a1a2e", border: `2px solid ${c.ok ? c.cor+"60" : "#2a2a3a"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, filter: c.ok ? "none" : "grayscale(1) brightness(0.4)", boxShadow: c.ok ? `0 0 10px ${c.cor}30` : "none" }}>
            {c.icone}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: c.ok ? "#e2e8f0" : "#3a3a5a", marginBottom: 2, lineHeight: 1.3 }}>{c.titulo}</div>
            <div style={{ fontSize: 9, color: c.ok ? "#6b6b8a" : "#2a2a3a", lineHeight: 1.4 }}>{c.desc}</div>
          </div>
          {!c.ok && (
            <div style={{ width: "100%" }}>
              <div style={{ background: "#1a1a2e", borderRadius: 20, height: 3 }}>
                <div style={{ background: "#3a3a5a", height: 3, borderRadius: 20, width: `${Math.min(100, Math.round((c.prog as number) / (c.meta as number) * 100))}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: 8, color: "#3a3a5a" }}>{Math.round(c.prog as number)}</span>
                <span style={{ fontSize: 8, color: "#3a3a5a" }}>{c.meta}</span>
              </div>
            </div>
          )}
          {c.ok && <div style={{ fontSize: 9, color: c.cor, fontWeight: 600 }}>✓ Desbloqueada</div>}
        </div>
      ))}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function Foco() {
  const { data, setSessoesFoco, adicionarXP } = usePlanner()
  const sessoesFoco = (data.sessoesFoco || []) as any[]

  const [aba,          setAba]          = useState<"foco" | "progresso">("foco")
  const [modo,         setModo]         = useState<Modo>("foco")
  const [tempoCustom,  setTempoCustom]  = useState(getTempoInicial)
  const [segundos,     setSegundos]     = useState(getSegundosRestantes)
  const [rodando,      setRodando]      = useState(getRodandoInicial)
  const [concluida,    setConcluida]    = useState(false)
  const [imersao,      setImersao]      = useState(false)
  const [customAberto, setCustomAberto] = useState(false)
  const [customHoras,  setCustomHoras]  = useState(0)
  const [customMins,   setCustomMins]   = useState(25)
  const [inicioSessao, setInicioSessao] = useState<Date | null>(null)
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null)

  const cor  = MODOS[modo].cor
  const circ = 2 * Math.PI * 130
  const pct  = tempoCustom > 0 ? (tempoCustom * 60 - segundos) / (tempoCustom * 60) : 0
  const hoje = new Date().toISOString().slice(0, 10)

  const inicioSemana = (() => {
    const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
  })()

  const stats = useMemo(() => {
    const total     = sessoesFoco.reduce((a: number, s: any) => a + s.durationMinutes, 0)
    const hojeMin   = sessoesFoco.filter((s: any) => s.date === hoje).reduce((a: number, s: any) => a + s.durationMinutes, 0)
    const semanaMin = sessoesFoco.filter((s: any) => s.date >= inicioSemana).reduce((a: number, s: any) => a + s.durationMinutes, 0)
    const totalS    = sessoesFoco.length
    const hojeS     = sessoesFoco.filter((s: any) => s.date === hoje).length
    const semanaS   = sessoesFoco.filter((s: any) => s.date >= inicioSemana).length

    let streak = 0
    const d = new Date()
    while (streak < 365) {
      const key = d.toISOString().slice(0, 10)
      if (sessoesFoco.some((s: any) => s.date === key)) { streak++; d.setDate(d.getDate() - 1) } else break
    }

    const porDia: Record<string, number> = {}
    sessoesFoco.forEach((s: any) => { porDia[s.date] = (porDia[s.date] || 0) + s.durationMinutes })
    const melhorDia = Object.values(porDia).length > 0 ? Math.max(...Object.values(porDia)) : 0
    const dias30    = Array.from({ length: 30 }, (_, i) => { const d2 = new Date(); d2.setDate(d2.getDate() - i); return d2.toISOString().slice(0, 10) })
    const mediaMin  = Math.round(dias30.reduce((a, d2) => a + (porDia[d2] || 0), 0) / 30)

    return { total, hojeMin, semanaMin, totalS, hojeS, semanaS, streak, melhorDia, mediaMin }
  }, [sessoesFoco, hoje, inicioSemana])

  useEffect(() => {
    if (rodando) {
      localStorage.setItem("foco-rodando", "true")
      localStorage.setItem("foco-duracao", String(tempoCustom * 60))
      localStorage.setItem("foco-tempo-custom", String(tempoCustom))
      if (!localStorage.getItem("foco-iniciou")) {
        localStorage.setItem("foco-iniciou", String(Date.now() - (tempoCustom * 60 - segundos) * 1000))
      }
      intervalo.current = setInterval(() => {
        const restante = getSegundosRestantes()
        setSegundos(restante)
        if (restante <= 0) {
          clearInterval(intervalo.current!)
          setRodando(false); setImersao(false)
          localStorage.setItem("foco-rodando", "false")
          localStorage.removeItem("foco-iniciou")
          if (modo === "foco") { salvarSessao(tempoCustom, true); setConcluida(true) }
        }
      }, 1000)
    } else {
      if (intervalo.current) clearInterval(intervalo.current)
    }
    return () => { if (intervalo.current) clearInterval(intervalo.current) }
  }, [rodando])

  function salvarSessao(minutos: number, completa: boolean) {
    const agora  = new Date()
    const inicio = inicioSessao || new Date(Date.now() - minutos * 60 * 1000)
    const nova   = {
      id:              Date.now().toString(),
      date:            hoje,
      startTime:       inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      endTime:         agora.toLocaleTimeString("pt-BR",  { hour: "2-digit", minute: "2-digit" }),
      durationMinutes: minutos,
      tipo:            MODOS[modo].label,
      concluida:       completa,
    }
    setSessoesFoco([nova, ...sessoesFoco].slice(0, 200) as any)
    if (completa) adicionarXP(50)
  }

  function iniciarOuPausar() {
    if (concluida) return
    if (!rodando) {
      setInicioSessao(new Date())
      localStorage.setItem("foco-iniciou", String(Date.now() - (tempoCustom * 60 - segundos) * 1000))
      setImersao(true)
    } else {
      localStorage.removeItem("foco-iniciou")
      localStorage.setItem("foco-rodando", "false")
      setImersao(false)
    }
    setRodando(!rodando)
  }

  function pausarDeImersao() {
    setRodando(false); setImersao(false)
    localStorage.setItem("foco-rodando", "false")
    localStorage.removeItem("foco-iniciou")
  }

  function encerrar() {
    const minFoco = Math.max(1, Math.floor((tempoCustom * 60 - segundos) / 60))
    salvarSessao(minFoco, false)
    setRodando(false); setImersao(false)
    setSegundos(tempoCustom * 60); setConcluida(true)
    localStorage.setItem("foco-rodando", "false")
    localStorage.removeItem("foco-iniciou")
  }

  function mudarModo(m: Modo) {
    setModo(m); setRodando(false); setConcluida(false); setImersao(false)
    const t = MODOS[m].minutos
    setTempoCustom(t); setSegundos(t * 60)
    localStorage.setItem("foco-rodando", "false")
    localStorage.removeItem("foco-iniciou")
    localStorage.setItem("foco-tempo-custom", String(t))
    localStorage.setItem("foco-duracao", String(t * 60))
  }

  function selecionarPreset(t: number) {
    setRodando(false); setConcluida(false); setCustomAberto(false)
    setTempoCustom(t); setSegundos(t * 60)
    localStorage.setItem("foco-rodando", "false")
    localStorage.removeItem("foco-iniciou")
    localStorage.setItem("foco-tempo-custom", String(t))
    localStorage.setItem("foco-duracao", String(t * 60))
  }

  function aplicarCustom() {
    const total = customHoras * 60 + customMins
    if (total > 0) selecionarPreset(total)
  }

  function resetar() {
    setRodando(false); setSegundos(tempoCustom * 60)
    setConcluida(false); setImersao(false)
    localStorage.setItem("foco-rodando", "false")
    localStorage.removeItem("foco-iniciou")
  }

  const TimerCircle = () => (
    <div style={{ position: "relative", width: 290, height: 290 }}>
      <div style={{ position: "absolute", inset: "-8%", borderRadius: "50%", background: `radial-gradient(circle, ${cor}18, transparent 65%)`, filter: "blur(30px)", pointerEvents: "none" }} />
      <svg width="290" height="290" viewBox="0 0 290 290" style={{ position: "absolute", inset: 0 }}>
        <circle cx="145" cy="145" r="130" fill="none" stroke="#1a1a2e" strokeWidth="2.5" />
        <circle cx="145" cy="145" r="130" fill="none" stroke={cor} strokeWidth="2.5"
          strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 145 145)"
          style={{ transition: "stroke-dasharray .5s", filter: `drop-shadow(0 0 6px ${cor}80)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div style={{ fontSize: tempoCustom >= 60 ? 52 : 64, fontWeight: 200, letterSpacing: 2, color: concluida ? cor : "#e2e8f0", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {concluida ? "✓" : fmt(segundos)}
        </div>
        <div style={{ fontSize: 11, color: "#4a4a6a" }}>
          {concluida ? "+50 XP 🎉" : rodando ? "em andamento" : "restante"}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Imersão */}
      {imersao && (
        <div style={{ position: "fixed", inset: 0, background: "#07070f", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <style>{`@keyframes fi{from{opacity:0}to{opacity:1}}`}</style>
          <div style={{ animation: "fi .5s ease", display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
            <TimerCircle />
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={pausarDeImersao} style={{ padding: "12px 28px", borderRadius: 12, background: "#1a1a2e", border: "1px solid #2e2e4e", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>⏸ Pausar</button>
              <button onClick={encerrar} style={{ padding: "12px 28px", borderRadius: 12, background: "transparent", border: "1px solid #1a1a2e", color: "#4a4a6a", fontSize: 13, cursor: "pointer" }}>Encerrar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 32px 80px", color: "#e2e8f0" }}>

        {/* Header com abas */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 400, margin: "0 0 20px", color: "#f0eeff", letterSpacing: "-0.5px" }}>Foco</h1>
          <div style={{ display: "flex", gap: 2, background: "#0a0a14", border: "1px solid #1a1a2e", borderRadius: 14, padding: 4 }}>
            {[
              { id: "foco",      label: "⏱  Timer"    },
              { id: "progresso", label: "📊 Progresso" },
            ].map(a => (
              <button key={a.id} onClick={() => setAba(a.id as any)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: aba === a.id ? "#7c3aed25" : "transparent", color: aba === a.id ? "#a855f7" : "#4a4a6a", transition: "all .2s" }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── ABA TIMER ── */}
        {aba === "foco" && (
          <div>
            {/* Modo tabs */}
            <div style={{ display: "flex", gap: 2, background: "#0a0a14", border: "1px solid #1a1a2e", borderRadius: 14, padding: 4, marginBottom: 36 }}>
              {(Object.keys(MODOS) as Modo[]).map(m => (
                <button key={m} onClick={() => mudarModo(m)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: modo === m ? MODOS[m].cor + "25" : "transparent", color: modo === m ? MODOS[m].cor : "#4a4a6a", transition: "all .2s" }}>
                  {MODOS[m].label}
                </button>
              ))}
            </div>

            {/* Timer */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
              <TimerCircle />
            </div>

            {/* Botão */}
            <button onClick={iniciarOuPausar} disabled={concluida}
              style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: rodando ? `1px solid ${cor}` : "none", background: concluida ? "#059669" : rodando ? "#0f0f1c" : cor, color: "#fff", fontSize: 15, fontWeight: 600, cursor: concluida ? "default" : "pointer", boxShadow: !rodando && !concluida ? `0 4px 20px ${cor}40` : "none", transition: "all .2s", marginBottom: 10 }}>
              {concluida ? "✓ Sessão registrada automaticamente" : rodando ? "⏸ Pausar" : "▶ Iniciar foco"}
            </button>

            {rodando && (
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <button onClick={encerrar} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 12 }}>Encerrar sessão</button>
              </div>
            )}

            {/* Presets */}
            {!concluida && !rodando && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  {presets.map(p => {
                    const ativo = tempoCustom === p && !customAberto
                    const label = p >= 60 ? `${p/60}h` : `${p}`
                    const sub   = p >= 60 ? "" : "min"
                    return (
                      <button key={p} onClick={() => selecionarPreset(p)}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 58, height: 58, borderRadius: 14, border: `1px solid ${ativo ? cor : "#1a1a2e"}`, background: ativo ? cor + "20" : "#0f0f1c", cursor: "pointer", transition: "all .2s", boxShadow: ativo ? `0 0 10px ${cor}25` : "none" }}>
                        <span style={{ fontSize: 15, fontWeight: ativo ? 600 : 400, color: ativo ? cor : "#6b6b8a", marginTop: 14 }}>{label}</span>
                        {sub && <span style={{ fontSize: 9, color: ativo ? cor + "aa" : "#3a3a5a" }}>{sub}</span>}
                      </button>
                    )
                  })}
                  <button onClick={() => setCustomAberto(!customAberto)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 58, height: 58, borderRadius: 14, border: `1px solid ${customAberto ? cor : "#1a1a2e"}`, background: customAberto ? cor + "20" : "#0f0f1c", cursor: "pointer" }}>
                    <span style={{ fontSize: 15, color: customAberto ? cor : "#6b6b8a" }}>+</span>
                    <span style={{ fontSize: 8, color: customAberto ? cor + "aa" : "#3a3a5a", marginTop: 2 }}>custom</span>
                  </button>
                </div>

                {customAberto && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: "16px 20px", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: "#6b6b8a", flex: 1 }}>Personalizado</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {[
                        { val: customHoras, set: setCustomHoras, max: 8,  step: 1, label: "horas" },
                        { val: customMins,  set: setCustomMins,  max: 55, step: 5, label: "min"   },
                      ].map((f, fi) => (
                        <div key={fi} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <button onClick={() => f.set((v: number) => Math.min(f.max, v + f.step))} style={{ background: "#1a1a2e", border: "none", borderRadius: 4, width: 24, height: 20, color: "#6b6b8a", cursor: "pointer", fontSize: 10 }}>▲</button>
                          <div style={{ width: 44, height: 38, background: "#12121f", border: `1px solid ${cor}30`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 20, fontWeight: 300, color: "#e2e8f0", fontVariantNumeric: "tabular-nums" }}>{String(f.val).padStart(2,"0")}</span>
                          </div>
                          <button onClick={() => f.set((v: number) => Math.max(0, v - f.step))} style={{ background: "#1a1a2e", border: "none", borderRadius: 4, width: 24, height: 20, color: "#6b6b8a", cursor: "pointer", fontSize: 10 }}>▼</button>
                          <span style={{ fontSize: 9, color: "#3a3a5a" }}>{f.label}</span>
                        </div>
                      ))}
                      <span style={{ fontSize: 22, color: "#4a4a6a", marginBottom: 18 }}>:</span>
                    </div>
                    <button onClick={aplicarCustom} style={{ background: cor, border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 12, cursor: "pointer" }}>Ok</button>
                  </div>
                )}

                <div style={{ textAlign: "center" }}>
                  <button onClick={resetar} style={{ background: "none", border: "none", color: "#3a3a5a", cursor: "pointer", fontSize: 11 }}>↺ Redefinir</button>
                </div>
              </div>
            )}

            {concluida && (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
                <button onClick={resetar} style={{ background: "#7c3aed18", border: "1px solid #7c3aed30", borderRadius: 10, padding: "9px 22px", color: "#a855f7", cursor: "pointer", fontSize: 13 }}>Nova sessão</button>
                <button onClick={() => setAba("progresso")} style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 10, padding: "9px 22px", color: "#6b6b8a", cursor: "pointer", fontSize: 13 }}>Ver progresso →</button>
              </div>
            )}
          </div>
        )}

        {/* ── ABA PROGRESSO ── */}
        {aba === "progresso" && (
          <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Total focado",    valor: fmtMin(stats.total),     sub: `${stats.totalS} sessões`,  cor: "#7c3aed" },
                { label: "Hoje",            valor: fmtMin(stats.hojeMin),   sub: `${stats.hojeS} sessões`,   cor: "#10b981" },
                { label: "Esta semana",     valor: fmtMin(stats.semanaMin), sub: `${stats.semanaS} sessões`, cor: "#3b82f6" },
                { label: "Sequência atual", valor: `${stats.streak}d`,      sub: "dias consecutivos",        cor: "#f59e0b" },
                { label: "Melhor dia",      valor: fmtMin(stats.melhorDia), sub: "recorde pessoal",          cor: "#a855f7" },
                { label: "Média diária",    valor: fmtMin(stats.mediaMin),  sub: "últimos 30 dias",          cor: "#6366f1" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, color: "#3a3a5a", marginBottom: 7 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.cor, letterSpacing: "-0.5px", marginBottom: 2 }}>{s.valor}</div>
                  <div style={{ fontSize: 10, color: "#3a3a5a" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Heatmap */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#2a2a45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
                Consistência — últimas 26 semanas
              </div>
              <Heatmap sessoes={sessoesFoco} />
            </div>

            {/* Conquistas */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#2a2a45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
                Conquistas
              </div>
              <Conquistas sessoes={sessoesFoco} />
            </div>

            {/* Sessões recentes */}
            {sessoesFoco.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: "#2a2a45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
                  Sessões recentes
                </div>
                <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, overflow: "hidden" }}>
                  {sessoesFoco.slice(0, 8).map((s: any, i: number) => (
                    <div key={s.id || i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < Math.min(sessoesFoco.length, 8) - 1 ? "1px solid #0f0f1c" : "none" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.concluida !== false ? "#7c3aed" : "#3a3a5a", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 2 }}>{s.tipo || "Sessão de foco"}</div>
                        <div style={{ fontSize: 11, color: "#4a4a6a" }}>
                          {new Date(s.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
                          {s.startTime ? ` · ${s.startTime}` : ""}
                          {s.endTime   ? ` – ${s.endTime}`   : ""}
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

            {sessoesFoco.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>⏱</div>
                <p style={{ fontSize: 14, color: "#2a2a45", margin: "0 0 16px" }}>Nenhuma sessão ainda.</p>
                <button onClick={() => setAba("foco")} style={{ background: "#7c3aed18", border: "1px solid #7c3aed30", borderRadius: 10, padding: "8px 20px", color: "#a855f7", fontSize: 13, cursor: "pointer" }}>
                  Iniciar primeira sessão
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}