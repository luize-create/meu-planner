"use client"

import { useState, useEffect, useRef } from "react"
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
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

function fmtMin(m: number) {
  if (m === 0) return "0m"
  if (m < 60) return `${m}m`
  const min = m % 60
  return min > 0 ? `${Math.floor(m / 60)}h ${min}m` : `${Math.floor(m / 60)}h`
}

export default function Foco() {
  const { data, setSessoesFoco, adicionarXP } = usePlanner()
  const sessoesFoco = data.sessoesFoco as any[]

  const [modo,        setModo]        = useState<Modo>("foco")
  const [tempoCustom, setTempoCustom] = useState(getTempoInicial)
  const [segundos,    setSegundos]    = useState(getSegundosRestantes)
  const [rodando,     setRodando]     = useState(getRodandoInicial)
  const [objetivo,    setObjetivo]    = useState("")
  const [concluida,   setConcluida]   = useState(false)
  const [imersao,     setImersao]     = useState(false)
  const [customAberto,setCustomAberto]= useState(false)
  const [customInput, setCustomInput] = useState(getTempoInicial)
  const [metaSemanal, setMetaSemanal] = useState(() => {
    try { return Number(localStorage.getItem("foco-meta-semanal") || 600) } catch { return 600 }
  })
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null)

  const hoje = new Date().toISOString().slice(0, 10)
  const inicioSemana = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay())
    return d.toISOString().slice(0, 10)
  })()

  const sessoesHoje   = sessoesFoco.filter((s: any) => s.data === hoje)
  const sessoesSemana = sessoesFoco.filter((s: any) => s.data >= inicioSemana)
  const hojeMin       = sessoesHoje.reduce((a: number, s: any) => a + (s.minutos || 0), 0)
  const semanaMin     = sessoesSemana.reduce((a: number, s: any) => a + (s.minutos || 0), 0)
  const minDecorridos = rodando ? Math.floor((tempoCustom * 60 - segundos) / 60) : 0
  const hojeTotal     = hojeMin + minDecorridos
  const semanaTotal   = semanaMin + minDecorridos
  const pctMeta       = metaSemanal > 0 ? Math.min(100, Math.round(semanaTotal / metaSemanal * 100)) : 0

  const cor  = MODOS[modo].cor
  const raio = 140
  const circ = 2 * Math.PI * raio
  const pct  = tempoCustom > 0 ? (tempoCustom * 60 - segundos) / (tempoCustom * 60) : 0

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
    setSessoesFoco([{
      id: Date.now(), tipo: MODOS[modo].label,
      tarefa: objetivo || "Sessão de foco",
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      minutos, data: hoje, concluida: completa,
    }, ...sessoesFoco].slice(0, 100) as any)
    if (completa) adicionarXP(50)
  }

  function iniciarOuPausar() {
    if (concluida) return
    if (!rodando) {
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
    setRodando(false); setImersao(false); setSegundos(tempoCustom * 60)
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
    setTempoCustom(t); setSegundos(t * 60); setCustomInput(t)
    localStorage.setItem("foco-rodando", "false")
    localStorage.removeItem("foco-iniciou")
    localStorage.setItem("foco-tempo-custom", String(t))
    localStorage.setItem("foco-duracao", String(t * 60))
  }

  function resetar() {
    setRodando(false); setSegundos(tempoCustom * 60)
    setConcluida(false); setImersao(false)
    localStorage.setItem("foco-rodando", "false")
    localStorage.removeItem("foco-iniciou")
  }

  function aplicarCustom() {
    if (customInput > 0) selecionarPreset(customInput)
  }

  const TimerCircle = ({ size = 320 }: { size?: number }) => {
    const r = size === 320 ? 140 : 130
    const c = 2 * Math.PI * r
    return (
      <div style={{ position: "relative", width: size, height: size }}>
        <div style={{ position: "absolute", inset: "-8%", borderRadius: "50%", background: `radial-gradient(circle, ${cor}18, transparent 65%)`, filter: "blur(28px)", pointerEvents: "none" }} />
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0 }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a2e" strokeWidth="3" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cor} strokeWidth="3"
            strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: "stroke-dasharray .5s", filter: `drop-shadow(0 0 6px ${cor}80)` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <div style={{ fontSize: size > 300 ? 68 : 56, fontWeight: 200, letterSpacing: 4, color: concluida ? cor : "#e2e8f0", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {concluida ? "✓" : fmt(segundos)}
          </div>
          <div style={{ fontSize: 11, color: "#4a4a6a" }}>
            {concluida ? "+50 XP 🎉" : rodando ? "em andamento" : "restante"}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── MODO IMERSÃO ── */}
      {imersao && (
        <div style={{ position: "fixed", inset: 0, background: "#07070f", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
          <style>{`@keyframes fi{from{opacity:0}to{opacity:1}}`}</style>
          <div style={{ animation: "fi .5s ease" }}>
            {objetivo && (
              <p style={{ textAlign: "center", fontSize: 14, color: "#4a4a6a", fontStyle: "italic", marginBottom: 32 }}>
                {objetivo}
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
              <TimerCircle size={320} />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={pausarDeImersao} style={{ padding: "12px 28px", borderRadius: 12, background: "#1a1a2e", border: "1px solid #2e2e4e", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>
                ⏸ Pausar
              </button>
              <button onClick={encerrar} style={{ padding: "12px 28px", borderRadius: 12, background: "transparent", border: "1px solid #1a1a2e", color: "#4a4a6a", fontSize: 13, cursor: "pointer" }}>
                Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PÁGINA ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", minHeight: "100vh", color: "#e2e8f0" }}>

        {/* Central */}
        <div style={{ padding: "32px 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Header */}
          <div style={{ width: "100%", maxWidth: 500, marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 4px" }}>Foco</h1>
            <p style={{ fontSize: 12, color: "#4a4a6a", margin: 0 }}>Menos distração, mais você.</p>
          </div>

          {/* Modo tabs */}
          <div style={{ display: "flex", gap: 2, background: "#0a0a14", border: "1px solid #1a1a2e", borderRadius: 14, padding: 4, marginBottom: 28 }}>
            {(Object.keys(MODOS) as Modo[]).map(m => (
              <button key={m} onClick={() => mudarModo(m)} style={{ padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: modo === m ? MODOS[m].cor + "25" : "transparent", color: modo === m ? MODOS[m].cor : "#4a4a6a", transition: "all .2s" }}>
                {MODOS[m].label}
              </button>
            ))}
          </div>

          {/* Objetivo */}
          <div style={{ width: "100%", maxWidth: 500, marginBottom: 24 }}>
            <input
              value={objetivo}
              onChange={e => setObjetivo(e.target.value)}
              placeholder="Qual é o foco da sua sessão?"
              style={{ width: "100%", background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 12, padding: "13px 18px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onFocus={e => (e.target.style.borderColor = cor)}
              onBlur={e => (e.target.style.borderColor = "#1a1a2e")}
            />
          </div>

          {/* Timer */}
          <div style={{ marginBottom: 24 }}>
            <TimerCircle size={320} />
          </div>

          {/* Botão principal */}
          <button onClick={iniciarOuPausar} disabled={concluida} style={{ width: "100%", maxWidth: 320, padding: "15px 0", borderRadius: 14, border: rodando ? `1px solid ${cor}` : "none", background: concluida ? "#059669" : rodando ? "#0f0f1c" : cor, color: "#fff", fontSize: 15, fontWeight: 600, cursor: concluida ? "default" : "pointer", boxShadow: !rodando && !concluida ? `0 4px 20px ${cor}40` : "none", transition: "all .2s", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {concluida ? "✓ Sessão concluída" : rodando ? "⏸ Pausar" : "▶ Iniciar foco"}
          </button>

          {rodando && (
            <button onClick={encerrar} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>
              Encerrar sessão
            </button>
          )}

          {/* Presets */}
          {!concluida && !rodando && (
            <div style={{ width: "100%", maxWidth: 500, marginTop: 8 }}>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {presets.map(p => {
                  const ativo = tempoCustom === p && !customAberto
                  return (
                    <button key={p} onClick={() => selecionarPreset(p)} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 60, height: 60, borderRadius: 14, border: `1px solid ${ativo ? cor : "#1a1a2e"}`, background: ativo ? cor + "20" : "#0f0f1c", cursor: "pointer", transition: "all .2s", boxShadow: ativo ? `0 0 10px ${cor}25` : "none" }}>
                      <span style={{ fontSize: 16, fontWeight: ativo ? 600 : 400, color: ativo ? cor : "#6b6b8a", marginTop: 14 }}>{p}</span>
                      <span style={{ fontSize: 9, color: ativo ? cor + "aa" : "#3a3a5a", marginTop: 1 }}>min</span>
                    </button>
                  )
                })}
                <button onClick={() => setCustomAberto(!customAberto)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 60, height: 60, borderRadius: 14, border: `1px solid ${customAberto ? cor : "#1a1a2e"}`, background: customAberto ? cor + "20" : "#0f0f1c", cursor: "pointer", transition: "all .2s" }}>
                  <span style={{ fontSize: 16, color: customAberto ? cor : "#6b6b8a" }}>+</span>
                  <span style={{ fontSize: 8, color: customAberto ? cor + "aa" : "#3a3a5a", marginTop: 2 }}>custom</span>
                </button>
              </div>

              {customAberto && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 12, padding: "12px 16px" }}>
                  <span style={{ flex: 1, fontSize: 12, color: "#6b6b8a" }}>Personalizado</span>
                  <input type="number" min={1} max={480} value={customInput} onChange={e => setCustomInput(Number(e.target.value))} style={{ width: 56, background: "#12121f", border: `1px solid ${cor}40`, borderRadius: 8, padding: "6px 10px", color: "#e2e8f0", fontSize: 14, outline: "none", textAlign: "center" }} />
                  <span style={{ fontSize: 12, color: "#4a4a6a" }}>min</span>
                  <button onClick={aplicarCustom} style={{ background: cor, border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", fontSize: 12, cursor: "pointer" }}>Ok</button>
                </div>
              )}

              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button onClick={resetar} style={{ background: "none", border: "none", color: "#3a3a5a", cursor: "pointer", fontSize: 11 }}>↺ Redefinir</button>
              </div>
            </div>
          )}

          {concluida && (
            <button onClick={resetar} style={{ marginTop: 16, background: "#7c3aed18", border: "1px solid #7c3aed30", borderRadius: 10, padding: "9px 22px", color: "#a855f7", cursor: "pointer", fontSize: 13 }}>
              Nova sessão →
            </button>
          )}
        </div>

        {/* Sidebar direita */}
        <div style={{ background: "#08080f", borderLeft: "1px solid #0f0f22", padding: "32px 16px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 11, color: "#4a4a6a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18 }}>Resumo</div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { icone: "⏱", label: "Foco de hoje",      valor: fmtMin(hojeTotal) },
              { icone: "📅", label: "Foco desta semana", valor: fmtMin(semanaTotal) },
              { icone: "🎯", label: "Meta semanal",      valor: fmtMin(metaSemanal) },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 0", borderBottom: i < 2 ? "1px solid #0f0f22" : "none" }}>
                <span style={{ fontSize: 14 }}>{item.icone}</span>
                <span style={{ flex: 1, fontSize: 12, color: "#6b6b8a" }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{item.valor}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "#4a4a6a" }}>Progresso semanal</span>
              <span style={{ fontSize: 11, color: cor }}>{pctMeta}%</span>
            </div>
            <div style={{ background: "#1a1a2e", borderRadius: 20, height: 4 }}>
              <div style={{ background: cor, height: 4, borderRadius: 20, width: `${pctMeta}%`, transition: "width .4s", boxShadow: `0 0 6px ${cor}60` }} />
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: 32 }}>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 18, color: cor, opacity: 0.5 }}>✦</span>
            </div>
            <p style={{ fontSize: 12, color: "#4a4a6a", lineHeight: 1.8, textAlign: "center", fontStyle: "italic", margin: "0 0 20px" }}>
              "A consistência de hoje<br />cria a clareza de amanhã."
            </p>
            <svg width="100%" viewBox="0 0 220 70" style={{ opacity: 0.25 }}>
              <defs>
                <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cor} stopOpacity="0.7" />
                  <stop offset="100%" stopColor={cor} stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <polygon points="0,70 55,18 110,45 165,8 220,70" fill="url(#mg)" />
              <polygon points="0,70 35,38 75,55 110,28 148,50 185,22 220,70" fill={cor} opacity="0.12" />
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}