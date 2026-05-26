"use client"

import { useState, useEffect, useRef } from "react"
import { usePlanner } from "./context/PlannerContext"
import { useRouter } from "next/navigation"

const humores = [
  { emoji: "😄", label: "Incrível", valor: 10 },
  { emoji: "🙂", label: "Bem",      valor: 7  },
  { emoji: "😐", label: "Ok",       valor: 5  },
  { emoji: "😞", label: "Difícil",  valor: 3  },
  { emoji: "😵‍💫", label: "Caótico", valor: 1  },
]
const energias = [
  { emoji: "⚡", label: "Alta",     valor: 9 },
  { emoji: "🔋", label: "Boa",      valor: 7 },
  { emoji: "🪫", label: "Baixa",    valor: 3 },
  { emoji: "😴", label: "Esgotada", valor: 1 },
]
const clarezas = [
  { emoji: "☀️",  label: "Cristalina",   valor: 9 },
  { emoji: "⛅",  label: "Clara",         valor: 7 },
  { emoji: "🌤️", label: "Turva",          valor: 3 },
  { emoji: "🌧️", label: "Confusa",        valor: 1 },
]

const frasesDia = [
  "Vamos construir um dia incrível.",
  "Pequenos passos ainda contam.",
  "Um dia de cada vez.",
  "Clareza antes de velocidade.",
  "Você já começou só por estar aqui.",
]

// ── SVGs ──────────────────────────────────────────────────
function HeroMountain() {
  return (
    <svg width="300" height="220" viewBox="0 0 300 220"
      style={{ position: "absolute", right: -10, top: 0, height: "100%", opacity: 0.9, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="hglow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hm1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="hm2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="hm3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b0764" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Atmospheric glow */}
      <ellipse cx="180" cy="90" rx="110" ry="80" fill="url(#hglow)" />
      {/* Back mountains */}
      <polygon points="120,220 220,60 300,220" fill="url(#hm3)" />
      <polygon points="50,220 170,40 290,220" fill="url(#hm2)" opacity="0.6" />
      {/* Main mountain */}
      <polygon points="10,220 150,10 290,220" fill="url(#hm1)" />
      {/* Snow cap */}
      <polygon points="150,10 170,50 130,50" fill="white" opacity="0.15" />
      {/* Winding path */}
      <path d="M 150 10 C 158 40, 162 70, 168 100 C 174 130, 178 160, 182 190 C 184 205, 186 215, 188 220"
        fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.55" />
      {/* Path dots */}
      {[{x:152,y:10},{x:160,y:45},{x:165,y:80},{x:170,y:115},{x:175,y:150}].map((p,i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#c4b5fd" opacity={0.85 - i*0.12} />
      ))}
      {/* Summit glow */}
      <circle cx="150" cy="10" r="16" fill="#a855f7" opacity="0.18" />
      <circle cx="150" cy="10" r="8"  fill="#c4b5fd" opacity="0.3" />
      {/* Flag */}
      <line x1="150" y1="10" x2="150" y2="-10" stroke="#e2e8f0" strokeWidth="1.5" opacity="0.9" />
      <polygon points="150,-10 168,-3 150,4" fill="#a855f7" opacity="1" />
      {/* Stars */}
      <circle cx="240" cy="25"  r="1.5" fill="#e2e8f0" opacity="0.5" />
      <circle cx="260" cy="50"  r="1"   fill="#c4b5fd" opacity="0.4" />
      <circle cx="215" cy="15"  r="1.2" fill="#e2e8f0" opacity="0.45" />
      <circle cx="280" cy="35"  r="1"   fill="#c4b5fd" opacity="0.35" />
      <circle cx="100" cy="30"  r="1"   fill="#c4b5fd" opacity="0.3" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: "radial-gradient(circle, #7c3aed35, transparent 65%)", filter: "blur(8px)" }} />
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="50" fill="none" stroke="#7c3aed25" strokeWidth="1.5" />
        <circle cx="55" cy="55" r="44" fill="#0d0d20" stroke="#7c3aed" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 6px #7c3aed60)" }} />
        <circle cx="55" cy="55" r="3" fill="#a855f7" />
        <line x1="55" y1="55" x2="55" y2="22" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 3px #a855f7)" }} />
        <line x1="55" y1="55" x2="78" y2="55" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" />
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i) => {
          const r = 38, rad = (deg - 90) * Math.PI / 180
          const x1 = 55 + r * Math.cos(rad), y1 = 55 + r * Math.sin(rad)
          const r2 = i % 3 === 0 ? 34 : 36
          const x2 = 55 + r2 * Math.cos(rad), y2 = 55 + r2 * Math.sin(rad)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i%3===0?"#7c3aed":"#2a2a4a"} strokeWidth={i%3===0?1.5:1} />
        })}
      </svg>
    </div>
  )
}

function PlantSVG() {
  return (
    <svg width="120" height="140" viewBox="0 0 120 140"
      style={{ position: "absolute", right: 20, bottom: 0, opacity: 0.5, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="plantglow" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="120" rx="35" ry="15" fill="url(#plantglow)" />
      {/* Pot */}
      <path d="M35,120 L40,140 L80,140 L85,120 Z" fill="#2a1a4a" stroke="#7c3aed30" strokeWidth="1" />
      <rect x="32" y="115" width="56" height="8" rx="3" fill="#3b1a6a" stroke="#7c3aed30" strokeWidth="1" />
      {/* Stems */}
      <path d="M60,115 Q55,95 45,80 Q40,70 48,60" fill="none" stroke="#6d28d9" strokeWidth="2" />
      <path d="M60,115 Q65,90 70,75 Q75,62 68,52" fill="none" stroke="#6d28d9" strokeWidth="2" />
      <path d="M60,115 Q60,90 60,70 Q60,55 60,40" fill="none" stroke="#7c3aed" strokeWidth="2" />
      {/* Leaves */}
      <ellipse cx="45" cy="68" rx="16" ry="9" fill="#7c3aed" opacity="0.7" transform="rotate(-30 45 68)" />
      <ellipse cx="70" cy="60" rx="16" ry="9" fill="#a855f7" opacity="0.6" transform="rotate(25 70 60)" />
      <ellipse cx="60" cy="38" rx="14" ry="8" fill="#8b5cf6" opacity="0.65" />
      <ellipse cx="48" cy="55" rx="10" ry="6" fill="#9333ea" opacity="0.5" transform="rotate(-15 48 55)" />
      {/* Glow dots */}
      <circle cx="60" cy="38" r="2" fill="#c4b5fd" opacity="0.7" />
      <circle cx="70" cy="52" r="1.5" fill="#c4b5fd" opacity="0.5" />
    </svg>
  )
}

// ── Check-in group ────────────────────────────────────────
function CheckinGroup({ label, options, valor, onChange }: {
  label: string
  options: { emoji: string; label: string; valor: number }[]
  valor: number | null
  onChange: (v: number) => void
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 12 }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {options.map(opt => {
          const ativo = valor === opt.valor
          return (
            <button key={opt.valor} onClick={() => onChange(opt.valor)} title={opt.label} style={{
              width: 40, height: 40, borderRadius: 10, fontSize: 18,
              background: ativo ? "#7c3aed20" : "#13132a",
              border: `1px solid ${ativo ? "#7c3aed70" : "#1e1e35"}`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .15s",
              boxShadow: ativo ? "0 0 12px #7c3aed40" : "none",
              transform: ativo ? "scale(1.1)" : "scale(1)",
            }}>
              {opt.emoji}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function Central() {
  const { data, setTarefas, setHabitos, analise, inteligencia } = usePlanner()
  const router = useRouter()

  const tarefas     = (data.tarefas     || []) as any[]
  const habitos     = (data.habitos     || []) as any[]
  const sessoesFoco = (data.sessoesFoco || []) as any[]

  const hoje      = new Date().toISOString().slice(0, 10)
  const hora      = new Date().getHours()
  const saudacao  = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite"
  const emojiHora = hora < 12 ? "🌤️" : hora < 18 ? "☀️" : "🌙"
  const fraseDia  = frasesDia[new Date().getDay() % frasesDia.length]

  // State
  const [humor,          setHumor]          = useState<number | null>(null)
  const [energia,        setEnergia]        = useState<number | null>(null)
  const [clareza,        setClareza]        = useState<number | null>(null)
  const [tarefaSemana,   setTarefaSemana]   = useState("")
  const [progresso,      setProgresso]      = useState(0)
  const [contextoSemana, setContextoSemana] = useState("")
  const [semanaEditing,  setSemanaEditing]  = useState(false)
  const [semanaInput,    setSemanaInput]    = useState("")
  const [projetosList,   setProjetosList]   = useState<any[]>([])
  const [ideias,         setIdeias]         = useState<any[]>([])
  const [novaIdeia,      setNovaIdeia]      = useState("")
  const [nome,           setNome]           = useState("")

  useEffect(() => {
    try {
      const est = JSON.parse(localStorage.getItem(`estado-dia-${hoje}`) || "{}")
      if (est.humor)   setHumor(est.humor)
      if (est.energia) setEnergia(est.energia)
      if (est.clareza) setClareza(est.clareza)
    } catch {}

    const ts = localStorage.getItem("tarefa-semana-v1")
    if (ts) {
      try {
        const parsed = JSON.parse(ts)
        setTarefaSemana(parsed.texto || "")
        setProgresso(parsed.progresso || 0)
        setContextoSemana(parsed.contexto || "")
      } catch {}
    }

    const p = localStorage.getItem("projetos-v1")
    if (p) setProjetosList(JSON.parse(p).filter((pr: any) => pr.status === "Em andamento").slice(0, 4))

    const id = localStorage.getItem("ideias-v1")
    if (id) setIdeias(JSON.parse(id).slice(0, 5))

    const n = localStorage.getItem("usuario-nome")
    if (n) setNome(n)
  }, [hoje])

  function salvarEstado(campo: "humor" | "energia" | "clareza", valor: number) {
    if (campo === "humor")        setHumor(valor)
    else if (campo === "energia") setEnergia(valor)
    else                          setClareza(valor)
    const atual = JSON.parse(localStorage.getItem(`estado-dia-${hoje}`) || "{}")
    localStorage.setItem(`estado-dia-${hoje}`, JSON.stringify({ ...atual, [campo]: valor }))
  }

  function salvarTarefaSemana() {
    const obj = { texto: semanaInput.trim(), progresso, contexto: contextoSemana }
    setTarefaSemana(semanaInput.trim())
    localStorage.setItem("tarefa-semana-v1", JSON.stringify(obj))
    setSemanaEditing(false)
  }

  function toggleHabito(hid: number) {
    setHabitos(habitos.map((h: any) => {
      if (h.id !== hid) return h
      const hist  = h.historico || []
      const feito = hist.includes(hoje)
      return { ...h, historico: feito ? hist.filter((d: string) => d !== hoje) : [...hist, hoje] }
    }) as any)
  }

  function adicionarIdeia() {
    if (!novaIdeia.trim()) return
    const nova = { id: Date.now(), texto: novaIdeia.trim(), data: hoje }
    const lista = [nova, ...ideias].slice(0, 20)
    setIdeias(lista)
    localStorage.setItem("ideias-v1", JSON.stringify(lista))
    setNovaIdeia("")
  }

  function calcStreak(historico: string[]) {
    let s = 0; const d = new Date()
    while (s < 365) {
      if (historico.includes(d.toISOString().slice(0,10))) { s++; d.setDate(d.getDate()-1) }
      else break
    }
    return s
  }

  const sessoesHoje   = sessoesFoco.filter((s: any) => s.data === hoje)
  const minFocados    = sessoesHoje.reduce((a: number, s: any) => a + (s.minutos || 0), 0)
  const habitosFeitos = habitos.filter((h: any) => (h.historico || []).includes(hoje)).length
  const insight       = analise.padroes[0]?.observacao || inteligencia.insightPrincipal
    || "Você tem mais foco nos dias em que começa com uma tarefa importante."

  const fmtData = (d: string) => {
    const dt = new Date(d + "T12:00:00")
    const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]
    return `${dt.getDate()}/${meses[dt.getMonth()]}/${dt.getFullYear()}`
  }

  const corProgresso = progresso >= 80 ? "#10b981" : progresso >= 50 ? "#7c3aed" : "#f59e0b"

  return (
    <div style={{ padding: "32px 40px 80px", color: "#e2e8f0", minHeight: "100vh" }}>

      {/* ── Saudação ── */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 400, margin: "0 0 6px", color: "#f0eeff", letterSpacing: "-0.5px" }}>
            {saudacao}{nome ? `, ${nome}` : ""} {emojiHora}
          </h1>
          <p style={{ fontSize: 14, color: "#4a4a6a", margin: 0, fontStyle: "italic" }}>{fraseDia}</p>
        </div>
      </div>

      {/* ── Estado atual ── */}
      <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 18, padding: "22px 28px", marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500, marginBottom: 20 }}>Como você está se sentindo?</div>
        <div style={{ display: "flex", gap: 32 }}>
          <CheckinGroup label="Humor"          options={humores}  valor={humor}   onChange={v => salvarEstado("humor", v)} />
          <CheckinGroup label="Energia"        options={energias} valor={energia} onChange={v => salvarEstado("energia", v)} />
          <CheckinGroup label="Clareza mental" options={clarezas} valor={clareza} onChange={v => salvarEstado("clareza", v)} />
        </div>
      </div>

      {/* ── Tarefa da semana ── */}
      <div style={{ background: "linear-gradient(135deg, #0c0c22 0%, #0f0d28 50%, #130d2e 100%)", border: "1px solid #1e1a35", borderRadius: 18, padding: "32px 36px", marginBottom: 16, position: "relative", overflow: "hidden", minHeight: 200 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%, #7c3aed12, transparent 55%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "45%", background: "radial-gradient(ellipse at 70% 40%, #7c3aed18, transparent 60%)", pointerEvents: "none" }} />
        <HeroMountain />

        <div style={{ position: "relative", maxWidth: "55%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: "#a855f7", filter: "drop-shadow(0 0 4px #a855f7)" }}>✦</span>
            <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Tarefa da semana</span>
            {tarefaSemana && !semanaEditing && (
              <button onClick={() => { setSemanaEditing(true); setSemanaInput(tarefaSemana) }}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "#3a3a5a", cursor: "pointer", fontSize: 14 }}>✎</button>
            )}
          </div>

          {semanaEditing ? (
            <div>
              <input autoFocus value={semanaInput} onChange={e => setSemanaInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && salvarTarefaSemana()}
                placeholder="Qual é o foco desta semana?"
                style={{ width: "100%", background: "#ffffff08", border: "1px solid #7c3aed30", borderRadius: 12, padding: "12px 16px", color: "#f0eeff", fontSize: 22, fontWeight: 700, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#4a4a6a" }}>Progresso: {progresso}%</span>
                <input type="range" min={0} max={100} value={progresso}
                  onChange={e => setProgresso(Number(e.target.value))}
                  style={{ flex: 1, accentColor: "#7c3aed" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={salvarTarefaSemana} style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "9px 22px", color: "#fff", fontSize: 13, cursor: "pointer" }}>Salvar</button>
                <button onClick={() => setSemanaEditing(false)} style={{ background: "none", border: "1px solid #1e1e35", borderRadius: 10, padding: "9px 16px", color: "#4a4a6a", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              </div>
            </div>
          ) : tarefaSemana ? (
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 700, color: "#f0eeff", margin: "0 0 14px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
                {tarefaSemana}
              </h2>
              <p style={{ fontSize: 13, color: "#6b6b8a", margin: "0 0 24px", lineHeight: 1.7, fontStyle: "italic" }}>
                {contextoSemana || "Seu foco constante essa semana vai levar você mais longe do que imagina."}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1, background: "#1a1a2e", borderRadius: 20, height: 6 }}>
                  <div style={{ background: `linear-gradient(90deg, ${corProgresso}, ${corProgresso}aa)`, height: 6, borderRadius: 20, width: `${progresso}%`, boxShadow: `0 0 10px ${corProgresso}60`, transition: "width .4s" }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: corProgresso, flexShrink: 0 }}>{progresso}%</span>
              </div>
            </div>
          ) : (
            <button onClick={() => setSemanaEditing(true)} style={{ background: "none", border: "1px dashed #2a2a4a", borderRadius: 14, padding: "20px 24px", color: "#2a2a45", fontSize: 16, cursor: "pointer", width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed30"; e.currentTarget.style.color = "#4a4a6a" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a4a"; e.currentTarget.style.color = "#2a2a45" }}>
              <span style={{ opacity: 0.25 }}>✦</span> Definir tarefa da semana...
            </button>
          )}
        </div>
      </div>

      {/* ── 3 cards: Hábitos | Projetos | Ideias ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>

        {/* Hábitos */}
        <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 18, padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>✅</span>
              <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Hábitos</span>
            </div>
            <button onClick={() => router.push("/habitos")} style={{ background: "none", border: "none", color: "#7c3aed", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver todos</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            {habitos.length === 0 ? (
              <p style={{ fontSize: 12, color: "#2a2a45", fontStyle: "italic", margin: 0 }}>Nenhum hábito cadastrado.</p>
            ) : habitos.slice(0, 5).map((h: any) => {
              const feito  = (h.historico || []).includes(hoje)
              const streak = calcStreak(h.historico || [])
              return (
                <div key={h.id} onClick={() => toggleHabito(h.id)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${feito ? "#7c3aed" : "#2a2a4a"}`, background: feito ? "#7c3aed20" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {feito && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }} />}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: feito ? "#6b6b8a" : "#94a3b8", textDecoration: feito ? "line-through" : "none" }}>{h.nome}</span>
                  {streak > 0 && <span style={{ fontSize: 11, color: "#f59e0b" }}>🔥 {streak}</span>}
                </div>
              )
            })}
          </div>
          <button onClick={() => router.push("/habitos")} style={{ marginTop: 16, background: "none", border: "none", color: "#4a4a6a", fontSize: 12, cursor: "pointer", padding: 0 }}>+ Novo hábito</button>
        </div>

        {/* Projetos */}
        <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 18, padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>📁</span>
              <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Projetos</span>
            </div>
            <button onClick={() => router.push("/projetos")} style={{ background: "none", border: "none", color: "#7c3aed", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver todos</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
            {projetosList.length === 0 ? (
              <p style={{ fontSize: 12, color: "#2a2a45", fontStyle: "italic", margin: 0 }}>Nenhum projeto ativo.</p>
            ) : projetosList.map((p: any) => {
              const cor = p.cor || "#7c3aed"
              return (
                <div key={p.id} onClick={() => router.push(`/projetos/${p.id}`)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</span>
                    <span style={{ fontSize: 11, color: cor, fontWeight: 600, flexShrink: 0 }}>{p.progresso || 0}%</span>
                  </div>
                  <div style={{ background: "#1a1a2e", borderRadius: 20, height: 3, marginLeft: 16 }}>
                    <div style={{ background: cor, height: 3, borderRadius: 20, width: `${p.progresso || 0}%`, transition: "width .4s" }} />
                  </div>
                </div>
              )
            })}
          </div>
          <button onClick={() => router.push("/projetos")} style={{ marginTop: 16, background: "none", border: "none", color: "#4a4a6a", fontSize: 12, cursor: "pointer", padding: 0 }}>+ Novo projeto</button>
        </div>

        {/* Ideias rápidas */}
        <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 18, padding: "20px 22px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>💡</span>
              <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Ideias rápidas</span>
            </div>
            <button style={{ background: "none", border: "none", color: "#7c3aed", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver todas</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
            {ideias.slice(0, 4).map((id: any) => (
              <div key={id.id}>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, marginBottom: 3 }}>{id.texto}</div>
                <div style={{ fontSize: 10, color: "#2a2a45", display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#7c3aed40" }} />
                  {fmtData(id.data)}
                </div>
              </div>
            ))}
            {ideias.length === 0 && <p style={{ fontSize: 12, color: "#2a2a45", fontStyle: "italic", margin: 0 }}>Nenhuma ideia ainda.</p>}
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 6 }}>
            <input value={novaIdeia} onChange={e => setNovaIdeia(e.target.value)} onKeyDown={e => e.key === "Enter" && adicionarIdeia()}
              placeholder="Nova ideia..."
              style={{ flex: 1, background: "#13132a", border: "1px solid #1e1e35", borderRadius: 8, padding: "6px 10px", color: "#e2e8f0", fontSize: 12, outline: "none" }} />
            <button onClick={adicionarIdeia} style={{ background: "#7c3aed18", border: "1px solid #7c3aed30", borderRadius: 8, padding: "6px 10px", color: "#a855f7", fontSize: 14, cursor: "pointer" }}>+</button>
          </div>
        </div>
      </div>

      {/* ── Foco card ── */}
      <div style={{ background: "linear-gradient(135deg, #0c0c22, #0f0c28)", border: "1px solid #1e1a35", borderRadius: 18, padding: "32px 40px", marginBottom: 16, display: "flex", alignItems: "center", gap: 40, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%, #7c3aed0e, transparent 50%)", pointerEvents: "none" }} />
        <PlantSVG />
        <ClockIcon />
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Foco</div>
          <h3 style={{ fontSize: 26, fontWeight: 600, color: "#f0eeff", margin: "0 0 10px", letterSpacing: "-0.3px" }}>
            Pronto para uma sessão?
          </h3>
          <p style={{ fontSize: 13, color: "#6b6b8a", margin: "0 0 24px", lineHeight: 1.7, maxWidth: 380 }}>
            Entre em modo de concentração profunda e avance no que realmente importa.
          </p>
          <button onClick={() => router.push("/foco")} style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "none", borderRadius: 12, padding: "13px 28px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px #7c3aed50", display: "flex", alignItems: "center", gap: 8 }}>
            Abrir foco ›
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ textAlign: "center", padding: "20px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <span style={{ fontSize: 16, color: "#7c3aed", opacity: 0.5 }}>💜</span>
        <p style={{ fontSize: 13, color: "#3a3a5a", margin: 0, fontStyle: "italic" }}>
          Lembre-se: você não precisa fazer tudo, só o que importa hoje.
        </p>
      </div>
    </div>
  )
}