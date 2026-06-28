"use client"

import { useState, useMemo } from "react"
import { usePlanner } from "../context/PlannerContext"

type Habito = {
  id: number; nome: string; icone: string; meta: string
  tipo: "positivo" | "negativo"; historico: string[]
}

function getSemanaAtual(offset = 0): string[] {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function getStreak(hist: string[], hoje: string): number {
  if (!hist?.length) return 0
  let s = 0; const d = new Date(hoje)
  while (true) {
    const k = d.toISOString().slice(0, 10)
    if (hist.includes(k)) { s++; d.setDate(d.getDate() - 1) } else break
  }
  return s
}

function getMelhorStreak(hist: string[]): number {
  if (!hist?.length) return 0
  const sorted = [...hist].sort()
  let best = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i-1]).getTime()) / 86400000
    if (diff === 1) { cur++; if (cur > best) best = cur } else cur = 1
  }
  return best
}

function habitCor(icone: string, tipo?: string): string {
  if (tipo === "negativo") return "#f43f5e"
  const m: Record<string, string> = {
    "💧": "#3b82f6", "🏃": "#10b981", "📚": "#a855f7", "📖": "#a855f7",
    "🌙": "#f59e0b", "🧘": "#ec4899", "🍎": "#ef4444", "✍️": "#8b5cf6",
    "🎯": "#7c3aed", "🏋️": "#10b981", "🧠": "#a855f7", "🎵": "#ec4899",
    "🌿": "#22c55e", "💻": "#3b82f6", "🎨": "#f59e0b", "🥗": "#22c55e",
    "🌅": "#f59e0b", "💪": "#10b981", "📝": "#8b5cf6", "☀️": "#f59e0b",
  }
  return m[icone] || "#7c3aed"
}

function habitCategoria(nome: string, icone: string): "Saúde" | "Mente" | "Estilo de vida" {
  const saude = ["💧","🏃","🌙","🍎","🥗","🏋️","💪","😴","🌅","☀️"]
  const mente  = ["📖","📚","✍️","🧘","🎯","🧠","💻","🎨","🎵","📝","🙏"]
  if (saude.includes(icone) || /exerc|água|sono|dormir|corr|treino/i.test(nome)) return "Saúde"
  if (mente.includes(icone)  || /ler|leitura|medit|estud|foco/i.test(nome))        return "Mente"
  return "Estilo de vida"
}

// ── Componente de detalhe do hábito ──────────────────────
function HabitoDetalhe({ habito, onFechar }: { habito: Habito; onFechar: () => void }) {
  const hoje  = new Date().toISOString().slice(0, 10)
  const cor   = habitCor(habito.icone, habito.tipo)
  const isNeg = habito.tipo === "negativo"

  const SEMANAS = 26

  // Monta grid de 26 semanas × 7 dias
  const grid = useMemo(() => {
    const ref = new Date()
    const dow = ref.getDay()
    ref.setDate(ref.getDate() - ((dow + 6) % 7) - (SEMANAS - 1) * 7)
    return Array.from({ length: SEMANAS }, (_, s) =>
      Array.from({ length: 7 }, (_, d) => {
        const dia = new Date(ref)
        dia.setDate(ref.getDate() + s * 7 + d)
        const key = dia.toISOString().slice(0, 10)
        return { key, feito: (habito.historico || []).includes(key), futuro: key > hoje }
      })
    )
  }, [habito, hoje])

  // Labels de mês
  const mesesLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = []
    let lastMonth = -1
    grid.forEach((semana, s) => {
      const mes = new Date(semana[0].key).getMonth()
      if (mes !== lastMonth) { labels.push({ label: new Date(semana[0].key).toLocaleDateString("pt-BR", { month: "short" }), col: s }); lastMonth = mes }
    })
    return labels
  }, [grid])

  // Stats semanais para o gráfico
  const weeklyPct = grid.map(semana => {
    const dias = semana.filter(d => !d.futuro)
    if (!dias.length) return 0
    return Math.round(dias.filter(d => d.feito).length / dias.length * 100)
  })

  const totalFeitos  = (habito.historico || []).length
  const streak       = getStreak(habito.historico || [], hoje)
  const melhorStreak = getMelhorStreak(habito.historico || [])

  // Consistência do mês atual
  const mesAtual = hoje.slice(0, 7)
  const diaAtual = parseInt(hoje.slice(8))
  const diasMes  = Array.from({ length: diaAtual }, (_, i) => `${mesAtual}-${String(i+1).padStart(2,"0")}`)
  const pctMes   = diasMes.length > 0
    ? Math.round((habito.historico || []).filter(d => diasMes.includes(d)).length / diasMes.length * 100)
    : 0

  // Chart SVG
  const CW = 520, CH = 80, CP = 10
  const step = (CW - CP * 2) / (weeklyPct.length - 1)
  const pathPts = weeklyPct.map((v, i) => `${CP + i * step},${CH - CP - (v / 100) * (CH - CP * 2)}`)
  const lineD   = pathPts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt}`).join(" ")
  const areaD   = `${lineD} L ${CP + (weeklyPct.length - 1) * step} ${CH - CP} L ${CP} ${CH - CP} Z`

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000c0", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }}
      onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={{ background: "#0d0d1c", border: "1px solid #1e1a35", borderRadius: 22, padding: "28px 32px", width: 660, maxWidth: "95vw", maxHeight: "92vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: cor + "20", border: `1px solid ${cor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, boxShadow: `0 0 16px ${cor}20` }}>
            {habito.icone}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#f0eeff" }}>{habito.nome}</div>
            <div style={{ fontSize: 12, color: "#4a4a6a", marginTop: 2 }}>{habito.meta} · {isNeg ? "Hábito negativo" : "Hábito positivo"}</div>
          </div>
          <button onClick={onFechar} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>✕</button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 28 }}>
          {[
            { label: "Total",         valor: `${totalFeitos}×`,      cor },
            { label: "Sequência",     valor: `${streak}d`,           cor: "#f59e0b" },
            { label: "Melhor",        valor: `${melhorStreak}d`,     cor: "#10b981" },
            { label: "Este mês",      valor: `${pctMes}%`,           cor: "#a855f7" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#0a0a14", borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.cor, letterSpacing: "-0.5px" }}>{s.valor}</div>
              <div style={{ fontSize: 10, color: "#4a4a6a", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Heatmap title */}
        <div style={{ fontSize: 11, color: "#3a3a5a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          Frequência — últimas {SEMANAS} semanas
        </div>

        {/* Heatmap */}
        <div style={{ background: "#0a0a14", borderRadius: 14, padding: "16px 18px", marginBottom: 24, overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 3, marginBottom: 6, paddingLeft: 20 }}>
            {mesesLabels.map((m, i) => (
              <div key={i} style={{ position: "relative", left: `${m.col * 17}px`, fontSize: 9, color: "#4a4a6a", whiteSpace: "nowrap", marginRight: 0 }}>
                {m.label}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            {/* Day labels */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 4, flexShrink: 0 }}>
              {["S","T","Q","Q","S","S","D"].map((d, i) => (
                <div key={i} style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#3a3a5a" }}>{d}</div>
              ))}
            </div>
            {/* Cells */}
            {grid.map((semana, si) => (
              <div key={si} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {semana.map((dia, di) => (
                  <div key={di} title={`${dia.key}: ${dia.feito ? "✓ Concluído" : dia.futuro ? "—" : "Não feito"}`}
                    style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, background: dia.futuro ? "transparent" : dia.feito ? cor : "#1a1a2e", opacity: dia.futuro ? 0 : dia.feito ? 1 : 0.5, boxShadow: dia.feito && !dia.futuro ? `0 0 4px ${cor}50` : "none", transition: "background .1s", cursor: "default" }} />
                ))}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 9, color: "#3a3a5a" }}>Menos</span>
            {[0.2, 0.4, 0.6, 0.8, 1].map((o, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: cor, opacity: o }} />
            ))}
            <span style={{ fontSize: 9, color: "#3a3a5a" }}>Mais</span>
          </div>
        </div>

        {/* Chart title */}
        <div style={{ fontSize: 11, color: "#3a3a5a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          Consistência semanal
        </div>

        {/* Line chart */}
        <div style={{ background: "#0a0a14", borderRadius: 14, padding: "16px 18px" }}>
          <svg width="100%" viewBox={`0 0 ${CW} ${CH}`} style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id={`ca${habito.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={cor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 25, 50, 75, 100].map(v => (
              <g key={v}>
                <line x1={CP} y1={CH - CP - (v / 100) * (CH - CP * 2)} x2={CW - CP} y2={CH - CP - (v / 100) * (CH - CP * 2)} stroke="#1a1a2e" strokeWidth="1" />
                <text x={CP - 4} y={CH - CP - (v / 100) * (CH - CP * 2) + 3} textAnchor="end" fill="#3a3a5a" fontSize="7">{v}%</text>
              </g>
            ))}
            <path d={areaD} fill={`url(#ca${habito.id})`} />
            <polyline points={pathPts.join(" ")} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${cor}60)` }} />
            {/* Last point */}
            <circle cx={CP + (weeklyPct.length - 1) * step} cy={CH - CP - (weeklyPct[weeklyPct.length - 1] / 100) * (CH - CP * 2)} r="4" fill={cor} style={{ filter: `drop-shadow(0 0 6px ${cor})` }} />
          </svg>
          {/* X axis labels */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingLeft: 28, paddingRight: 8 }}>
            {[0, 5, 10, 15, 20, 25].map(i => {
              const d = grid[i]?.[0]?.key
              if (!d) return null
              return <span key={i} style={{ fontSize: 8, color: "#3a3a5a" }}>{new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</span>
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── SVGs ─────────────────────────────────────────────────
function PlantSVG() {
  return (
    <div style={{ position: "absolute", top: -10, right: 0, width: 280, height: 190, pointerEvents: "none", overflow: "hidden" }}>
      <svg width="280" height="190" viewBox="0 0 280 190">
        <defs>
          <radialGradient id="pg" cx="65%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="190" cy="75" rx="90" ry="80" fill="url(#pg)" />
        <path d="M 190 185 Q 188 145 190 110 Q 192 80 190 45" fill="none" stroke="#5b21b6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 190 130 Q 226 114 250 93 Q 237 121 190 130" fill="#6d28d9" opacity="0.75" />
        <path d="M 190 125 Q 156 109 133 88 Q 150 117 190 125" fill="#7c3aed" opacity="0.65" />
        <path d="M 190 104 Q 229 87 252 66 Q 239 96 190 104" fill="#5b21b6" opacity="0.7" />
        <path d="M 190 99 Q 153 82 131 61 Q 147 90 190 99" fill="#6d28d9" opacity="0.6" />
        <path d="M 190 75 Q 219 57 237 38 Q 226 62 190 75" fill="#7c3aed" opacity="0.85" />
        <path d="M 190 71 Q 162 53 145 34 Q 157 58 190 71" fill="#8b5cf6" opacity="0.8" />
        <path d="M 190 45 Q 204 28 217 14 Q 208 36 190 45" fill="#a855f7" opacity="0.9" />
        <circle cx="260" cy="56" r="1.5" fill="#c4b5fd" opacity="0.7" />
        <circle cx="136" cy="68" r="1.2" fill="#c4b5fd" opacity="0.55" />
        <circle cx="244" cy="20" r="1"   fill="#e9d5ff" opacity="0.65" />
      </svg>
    </div>
  )
}

function CloudSVG() {
  return (
    <svg width="100%" height="70" viewBox="0 0 200 70" style={{ marginTop: 12 }}>
      <defs>
        <radialGradient id="cg" cx="50%" cy="75%" r="60%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="54" rx="85" ry="26" fill="url(#cg)" />
      <ellipse cx="77"  cy="50" rx="34" ry="21" fill="#2d1b69" />
      <ellipse cx="112" cy="45" rx="30" ry="20" fill="#3b1f8c" />
      <ellipse cx="94"  cy="54" rx="40" ry="17" fill="#2d1b69" />
      <path d="M 48 28 L 49.3 25 L 50.6 28 L 53.8 29 L 50.6 30 L 49.3 33 L 48 30 L 44.8 29 Z" fill="#c4b5fd" opacity="0.65" />
      <circle cx="163" cy="41" r="1.2" fill="#c4b5fd" opacity="0.5" />
    </svg>
  )
}

function MountainCard() {
  return (
    <svg width="100%" height="80" viewBox="0 0 400 80"
      style={{ position: "absolute", right: 0, bottom: 0, pointerEvents: "none", opacity: 0.6 }}>
      <defs>
        <linearGradient id="mb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id="gl" cx="75%" cy="100%" r="35%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="315" cy="80" rx="88" ry="46" fill="url(#gl)" />
      <polygon points="180,80 267,18 354,80" fill="url(#mb)" />
      <polygon points="278,80 340,33 400,80" fill="#6d28d9" opacity="0.4" />
      <circle cx="267" cy="18" r="4.5" fill="#f59e0b" opacity="0.85" style={{ filter: "drop-shadow(0 0 8px #f59e0b)" }} />
    </svg>
  )
}

function Sparkline({ vals, cor }: { vals: number[]; cor: string }) {
  const W = 160, H = 36, p = 4
  if (vals.length < 2) return <div style={{ height: H, background: "#1a1a2e", borderRadius: 4, opacity: 0.3 }} />
  const max = Math.max(...vals, 1), min = Math.min(...vals, 0), range = max - min || 1
  const step = (W - p * 2) / (vals.length - 1)
  const pts  = vals.map((v, i) => `${p + i * step},${H - p - ((v - min) / range) * (H - p * 2)}`).join(" ")
  const lx = p + (vals.length - 1) * step
  const ly = H - p - ((vals[vals.length - 1] - min) / range) * (H - p * 2)
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 3px ${cor}50)` }} />
      <circle cx={lx} cy={ly} r="3" fill={cor} />
    </svg>
  )
}

const iconesPositivos = ["🧠","🏋️","📚","💻","💧","🌙","🎯","🧘","🥗","🎨","🎵","🏃","✍️","🌅","💪","📝","🙏","🌿","😴","📵","☀️"]
const iconesNegativos = ["🚬","🍺","💊","🍔","🎮","🍫","🥃","🛒","🍩","💬","📱","🍬","⏰","🛋️","⚡","👥","🎲","🍕","📺","🧁"]

// ── Main ─────────────────────────────────────────────────
export default function Habitos() {
  const { data, setHabitos } = usePlanner()
  const habitos = (data.habitos || []) as unknown as Habito[]

  const hoje       = new Date().toISOString().slice(0, 10)
  const diasLabel  = ["S","T","Q","Q","S","S","D"]
  const prefixoMes = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  const diasMes    = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const diaAtual   = parseInt(hoje.slice(8))

  const [filtro,           setFiltro]           = useState<"todos" | "positivo" | "negativo">("todos")
  const [modal,            setModal]            = useState(false)
  const [semanaOffset,     setSemanaOffset]     = useState(0)
  const [habitoDetalhe,    setHabitoDetalhe]    = useState<Habito | null>(null)
  const [novo, setNovo] = useState({ nome: "", icone: "🧠", meta: "", tipo: "positivo" as "positivo" | "negativo" })

  const semana = getSemanaAtual(semanaOffset)
  const labelSemana = semanaOffset === 0 ? "Esta semana" : semanaOffset === -1 ? "Semana passada" : `${Math.abs(semanaOffset)} sem. atrás`

  // ── Stats ──
  const stats = useMemo(() => {
    const pos = habitos.filter(h => h.tipo !== "negativo")
    const diasArr = Array.from({ length: diaAtual }, (_, i) => `${prefixoMes}-${String(i + 1).padStart(2, "0")}`)
    const totalPossivel = pos.length * diasArr.length
    const totalFeito    = pos.reduce((a, h) => a + diasArr.filter(d => (h.historico || []).includes(d)).length, 0)
    const consistencia  = totalPossivel > 0 ? Math.round(totalFeito / totalPossivel * 100) : 0

    const prevMes   = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    const prevPfx   = `${prevMes.getFullYear()}-${String(prevMes.getMonth() + 1).padStart(2, "0")}`
    const prevN     = new Date(prevMes.getFullYear(), prevMes.getMonth() + 1, 0).getDate()
    const prevArr   = Array.from({ length: prevN }, (_, i) => `${prevPfx}-${String(i + 1).padStart(2, "0")}`)
    const prevPoss  = pos.length * prevArr.length
    const prevFeito = pos.reduce((a, h) => a + prevArr.filter(d => (h.historico || []).includes(d)).length, 0)
    const consistenciaAnt = prevPoss > 0 ? Math.round(prevFeito / prevPoss * 100) : 0

    let melhorStreakVal = 0, melhorHabito = ""
    habitos.forEach(h => { const s = getMelhorStreak(h.historico || []); if (s > melhorStreakVal) { melhorStreakVal = s; melhorHabito = h.nome } })

    const diasPerfeitos = diasArr.filter(d => pos.length > 0 && pos.every(h => (h.historico || []).includes(d))).length
    const totalConcluido = pos.reduce((a, h) => a + diasArr.filter(d => (h.historico || []).includes(d)).length, 0)

    return { consistencia, consistenciaAnt, melhorStreakVal, melhorHabito, diasPerfeitos, totalConcluido, totalPossivel }
  }, [habitos, hoje, diaAtual, prefixoMes])

  const diffConsis = stats.consistencia - stats.consistenciaAnt
  const habitosFiltrados = habitos.filter(h =>
    filtro === "todos" ? true : filtro === "negativo" ? h.tipo === "negativo" : h.tipo !== "negativo"
  )

  function toggleDia(hid: number, dia: string) {
    if (dia > hoje) return
    setHabitos(habitos.map(h => {
      if (h.id !== hid) return h
      const hist = h.historico || []
      return { ...h, historico: hist.includes(dia) ? hist.filter(d => d !== dia) : [...hist, dia] }
    }) as any)
  }

  function adicionarHabito() {
    if (!novo.nome.trim()) return
    setHabitos([...(habitos as any), { id: Date.now(), nome: novo.nome.trim(), icone: novo.icone, meta: novo.meta.trim() || (novo.tipo === "negativo" ? "Todos os dias" : "1x por dia"), tipo: novo.tipo, historico: [] }] as any)
    setNovo({ nome: "", icone: "🧠", meta: "", tipo: "positivo" })
    setModal(false)
  }

  function deletar(id: number) { setHabitos(habitos.filter(h => h.id !== id) as any) }

  const ritual = useMemo(() => habitos.filter(h => h.tipo !== "negativo" && !(h.historico || []).includes(hoje)).slice(0, 4), [habitos, hoje])

  const categorias = useMemo(() => {
    const diasArr = Array.from({ length: diaAtual }, (_, i) => `${prefixoMes}-${String(i + 1).padStart(2, "0")}`)
    const cats: Record<string, { t: number; f: number; cor: string; icone: string }> = {
      "Saúde":          { t: 0, f: 0, cor: "#10b981", icone: "❤️" },
      "Mente":          { t: 0, f: 0, cor: "#a855f7", icone: "🧠" },
      "Estilo de vida": { t: 0, f: 0, cor: "#f59e0b", icone: "✨" },
    }
    habitos.filter(h => h.tipo !== "negativo").forEach(h => {
      const c = habitCategoria(h.nome, h.icone)
      cats[c].t += diasArr.length
      cats[c].f += diasArr.filter(d => (h.historico || []).includes(d)).length
    })
    return Object.entries(cats).map(([nome, v]) => ({ nome, cor: v.cor, icone: v.icone, pct: v.t > 0 ? Math.round(v.f / v.t * 100) : 0 }))
  }, [habitos, diaAtual, prefixoMes])

  const insight = useMemo(() => {
    if (!habitos.length) return "Continue registrando seus hábitos. Padrões começarão a aparecer aqui."
    const top = habitos.filter(h => h.tipo !== "negativo").map(h => ({ nome: h.nome, pct: Math.round(((h.historico || []).filter(d => d.startsWith(prefixoMes)).length / Math.max(1, diaAtual)) * 100) })).sort((a, b) => b.pct - a.pct)[0]
    if (top?.pct > 70) return `Você é mais consistente com "${top.nome}" — ${top.pct}% de consistência este mês.`
    if (stats.consistencia > 60) return `Com ${stats.consistencia}% de consistência este mês, você está construindo algo real.`
    return "Você é mais consistente nos dias em que dorme pelo menos 7 horas."
  }, [habitos, prefixoMes, diaAtual, stats.consistencia])

  const sparkConsis = useMemo(() => {
    const pos = habitos.filter(h => h.tipo !== "negativo")
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      const key = d.toISOString().slice(0, 10)
      if (!pos.length) return 0
      return Math.round(pos.filter(h => (h.historico || []).includes(key)).length / pos.length * 100)
    })
  }, [habitos])

  const iconesList = novo.tipo === "negativo" ? iconesNegativos : iconesPositivos

  return (
    <>
      {/* Modal detalhe */}
      {habitoDetalhe && <HabitoDetalhe habito={habitoDetalhe} onFechar={() => setHabitoDetalhe(null)} />}

      {/* Modal novo hábito */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "#000000b0", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
          <div style={{ background: "#0d0d1c", border: "1px solid #1e1a35", borderRadius: 22, padding: "28px", width: 460, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "#f0eeff" }}>Novo hábito</h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
              {[{ v: "positivo", label: "Hábito positivo", sub: "Marcar quando fizer", cor: "#7c3aed" }, { v: "negativo", label: "Hábito negativo", sub: "Marcar quando recair", cor: "#f43f5e" }].map(t => (
                <button key={t.v} onClick={() => setNovo({ ...novo, tipo: t.v as any, icone: t.v === "negativo" ? "🚬" : "🧠" })}
                  style={{ padding: "14px 10px", borderRadius: 14, border: `1.5px solid ${novo.tipo === t.v ? t.cor : "#1e1e35"}`, background: novo.tipo === t.v ? t.cor + "15" : "#12121f", cursor: "pointer" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: novo.tipo === t.v ? t.cor : "#6b6b8a", marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: novo.tipo === t.v ? t.cor + "aa" : "#3a3a5a" }}>{t.sub}</div>
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 10 }}>Ícone</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 7 }}>
                {iconesList.map(ic => {
                  const sel = novo.icone === ic; const cor = novo.tipo === "negativo" ? "#f43f5e" : "#7c3aed"
                  return <button key={ic} onClick={() => setNovo({ ...novo, icone: ic })} style={{ aspectRatio: "1", borderRadius: 12, border: `1px solid ${sel ? cor : "#1e1e35"}`, background: sel ? cor + "18" : "#12121f", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transform: sel ? "scale(1.1)" : "scale(1)" }}>{ic}</button>
                })}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 8 }}>Nome</div>
              <input autoFocus value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} placeholder="ex: Beber 2L de água" onKeyDown={e => e.key === "Enter" && adicionarHabito()}
                style={{ width: "100%", background: "#0f0f1c", border: "1px solid #1e1e35", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 8 }}>Subtexto (opcional)</div>
              <input value={novo.meta} onChange={e => setNovo({ ...novo, meta: e.target.value })} placeholder="ex: 2L por dia"
                style={{ width: "100%", background: "#0f0f1c", border: "1px solid #1e1e35", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={adicionarHabito} disabled={!novo.nome.trim()}
              style={{ width: "100%", background: !novo.nome.trim() ? "#1a1a2e" : novo.tipo === "negativo" ? "linear-gradient(135deg, #be123c, #f43f5e)" : "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 12, padding: "13px", color: novo.nome.trim() ? "#fff" : "#4a4a6a", fontSize: 14, fontWeight: 600, cursor: novo.nome.trim() ? "pointer" : "not-allowed" }}>
              Criar hábito
            </button>
          </div>
        </div>
      )}

      {/* Page */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", minHeight: "100vh", color: "#e2e8f0" }}>

        {/* Main */}
        <div style={{ padding: "32px 36px", overflowY: "auto" }}>

          {/* Header */}
          <div style={{ position: "relative", marginBottom: 32 }}>
            <PlantSVG />
            <h1 style={{ fontSize: 34, fontWeight: 400, margin: "0 0 8px", color: "#f0eeff", letterSpacing: "-0.5px" }}>Hábitos 🌱</h1>
            <p style={{ fontSize: 14, color: "#4a4a6a", margin: 0 }}>Pequenas ações, grandes transformações.</p>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "18px 16px" }}>
              <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 14 }}>✦ Consistência geral</div>
              <div style={{ position: "relative", width: 64, height: 64, marginBottom: 10 }}>
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="27" fill="none" stroke="#1a1a2e" strokeWidth="4.5" />
                  <circle cx="32" cy="32" r="27" fill="none" stroke="#7c3aed" strokeWidth="4.5"
                    strokeDasharray={`${2 * Math.PI * 27 * stats.consistencia / 100} ${2 * Math.PI * 27}`}
                    strokeLinecap="round" transform="rotate(-90 32 32)" style={{ filter: "drop-shadow(0 0 5px #7c3aed80)" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#a855f7" }}>{stats.consistencia}%</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: diffConsis >= 0 ? "#10b981" : "#fb923c" }}>{diffConsis >= 0 ? "+" : ""}{diffConsis}% vs mês passado</div>
            </div>
            <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "18px 16px" }}>
              <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 10 }}>🔥 Melhor sequência</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#f0eeff", margin: "0 0 2px", letterSpacing: "-1px" }}>{stats.melhorStreakVal}</div>
              <div style={{ fontSize: 12, color: "#6b6b8a", marginBottom: 5 }}>dias</div>
              <div style={{ fontSize: 11, color: "#4a4a6a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stats.melhorHabito || "—"}</div>
            </div>
            <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "18px 16px" }}>
              <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 10 }}>⭐ Dias perfeitos</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#f0eeff", margin: "0 0 2px", letterSpacing: "-1px" }}>{stats.diasPerfeitos}</div>
              <div style={{ fontSize: 12, color: "#6b6b8a" }}>este mês</div>
            </div>
            <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "18px 16px" }}>
              <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 10 }}>📊 Total concluído</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#f0eeff", margin: "0 0 2px", letterSpacing: "-1px" }}>{stats.totalConcluido}</div>
              <div style={{ fontSize: 12, color: "#6b6b8a" }}>de {stats.totalPossivel} possíveis</div>
            </div>
          </div>

          {/* Habits block */}
          <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 20, padding: "24px", marginBottom: 16 }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 500, color: "#f0eeff" }}>Meus hábitos</span>
                  <button onClick={() => setSemanaOffset(o => o - 1)}
                    style={{ background: "#13132a", border: "1px solid #1e1e35", borderRadius: 7, width: 28, height: 28, color: "#6b6b8a", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                  <span style={{ fontSize: 11, color: semanaOffset === 0 ? "#7c3aed" : "#6b6b8a", minWidth: 100, textAlign: "center" }}>{labelSemana}</span>
                  <button onClick={() => setSemanaOffset(o => Math.min(0, o + 1))} disabled={semanaOffset === 0}
                    style={{ background: "#13132a", border: "1px solid #1e1e35", borderRadius: 7, width: 28, height: 28, color: semanaOffset === 0 ? "#2a2a3a" : "#6b6b8a", cursor: semanaOffset === 0 ? "default" : "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                </div>
                <div style={{ display: "flex", background: "#12122a", borderRadius: 10, padding: 3 }}>
                  {(["todos","positivo","negativo"] as const).map(f => (
                    <button key={f} onClick={() => setFiltro(f)}
                      style={{ padding: "6px 13px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, background: filtro === f ? "#7c3aed30" : "transparent", color: filtro === f ? "#a855f7" : "#6b6b8a" }}>
                      {f === "todos" ? "Todos" : f === "positivo" ? "Positivos" : "Negativos"}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setModal(true)}
                style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "9px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 16px #7c3aed40" }}>
                + Novo hábito
              </button>
            </div>

            {/* Column labels */}
            {habitosFiltrados.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 196px 100px", gap: 12, alignItems: "center", paddingBottom: 10, borderBottom: "1px solid #1a1a2e", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#3a3a5a" }}>Hábito <span style={{ color: "#2a2a45", fontStyle: "italic" }}>(clique para ver histórico)</span></span>
                <div style={{ display: "flex", gap: 8 }}>
                  {diasLabel.map((d, i) => {
                    const ehHoje = semana[i] === hoje
                    return <span key={i} style={{ width: 24, textAlign: "center", fontSize: 10, color: ehHoje ? "#7c3aed" : "#3a3a5a", fontWeight: ehHoje ? 700 : 400 }}>{d}</span>
                  })}
                </div>
                <span style={{ fontSize: 10, color: "#3a3a5a", textAlign: "right" }}>Progresso</span>
              </div>
            )}

            {/* Rows */}
            {habitosFiltrados.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.3 }}>🌱</div>
                <p style={{ fontSize: 14, color: "#2a2a45", margin: "0 0 16px" }}>Nenhum hábito ainda.</p>
                <button onClick={() => setModal(true)} style={{ background: "#7c3aed18", border: "1px solid #7c3aed30", borderRadius: 10, padding: "8px 20px", color: "#a855f7", fontSize: 13, cursor: "pointer" }}>
                  Criar primeiro hábito
                </button>
              </div>
            ) : habitosFiltrados.map((h, idx) => {
              const cor      = habitCor(h.icone, h.tipo)
              const streak   = getStreak(h.historico || [], hoje)
              const diasArr  = Array.from({ length: diaAtual }, (_, i) => `${prefixoMes}-${String(i + 1).padStart(2, "0")}`)
              const pctMes   = diasArr.length > 0 ? Math.round((h.historico || []).filter(d => diasArr.includes(d)).length / diasArr.length * 100) : 0
              const feitoHoje = (h.historico || []).includes(hoje)
              const total    = (h.historico || []).length

              return (
                <div key={h.id} style={{ display: "grid", gridTemplateColumns: "1fr 196px 100px", gap: 12, alignItems: "center", padding: "14px 0", borderBottom: idx < habitosFiltrados.length - 1 ? "1px solid #0f0f1c" : "none" }}>

                  {/* Info — clicável para ver detalhe */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div onClick={() => setHabitoDetalhe(h)}
                      style={{ width: 42, height: 42, borderRadius: 13, background: cor + "20", border: `1px solid ${cor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, cursor: "pointer", boxShadow: feitoHoje ? `0 0 12px ${cor}30` : "none", transition: "transform .15s" }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
                      {h.icone}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div onClick={() => setHabitoDetalhe(h)}
                        style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 500, cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#a855f7")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#e2e8f0")}>
                        {h.nome}
                      </div>
                      <div style={{ fontSize: 11, color: "#4a4a6a", marginTop: 2 }}>{h.meta}</div>
                      <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                        {streak > 0 && <span style={{ fontSize: 10, color: "#f59e0b" }}>🔥 {streak} dias</span>}
                        <span style={{ fontSize: 10, color: "#3a3a5a" }}>{total} registros</span>
                      </div>
                    </div>
                    <button onClick={() => deletar(h.id)}
                      style={{ background: "none", border: "none", color: "#2a2a3a", cursor: "pointer", fontSize: 14, padding: "4px", flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#6b6b8a")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#2a2a3a")}>···</button>
                  </div>

                  {/* Week circles */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {semana.map((d, i) => {
                      const feito  = (h.historico || []).includes(d)
                      const futuro = d > hoje
                      const ehHoje = d === hoje
                      return (
                        <div key={i} onClick={() => !futuro && toggleDia(h.id, d)}
                          title={futuro ? "Dia futuro" : feito ? "Clique para desmarcar" : "Clique para marcar"}
                          style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: feito ? cor + "28" : "#1a1a2e", border: `1.5px solid ${feito ? cor : ehHoje ? cor + "55" : "#2a2a4a"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: futuro ? "default" : "pointer", opacity: futuro ? 0.3 : 1, boxShadow: feito ? `0 0 8px ${cor}40` : "none", transition: "all .15s" }}>
                          {feito && <span style={{ fontSize: 11, color: cor }}>✓</span>}
                        </div>
                      )
                    })}
                  </div>

                  {/* Progress */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: cor }}>{pctMes}%</span>
                    <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 20, height: 4 }}>
                      <div style={{ background: cor, height: 4, borderRadius: 20, width: `${pctMes}%`, boxShadow: `0 0 5px ${cor}60`, transition: "width .4s" }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#4a4a6a" }}>{semana.filter(d => (h.historico || []).includes(d)).length}/7 dias</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Ritual sugerido */}
          {ritual.length > 0 && (
            <div style={{ background: "linear-gradient(135deg, #0e0d24, #120f2e)", border: "1px solid #1e1a35", borderRadius: 18, padding: "22px 24px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16, color: "#f59e0b" }}>⭐</span>
                <span style={{ fontSize: 15, fontWeight: 500, color: "#f0eeff" }}>Ritual sugerido para hoje</span>
              </div>
              <p style={{ fontSize: 12, color: "#4a4a6a", margin: "0 0 20px" }}>Com base nos hábitos ainda não concluídos hoje.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {ritual.map((h, i) => {
                  const cor = habitCor(h.icone, h.tipo)
                  return (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <div style={{ background: "#13132a", border: `1px solid ${cor}30`, borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, minWidth: 118 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: cor + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{h.icone}</div>
                        <div>
                          <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>{h.nome}</div>
                          {h.meta && <div style={{ fontSize: 10, color: "#4a4a6a", marginTop: 2 }}>{h.meta}</div>}
                        </div>
                      </div>
                      {i < ritual.length - 1 && <span style={{ fontSize: 16, color: "#2a2a45", flexShrink: 0 }}>→</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Card emocional */}
          <div style={{ background: "linear-gradient(135deg, #0c0b22, #100e2e)", border: "1px solid #1e1a35", borderRadius: 18, padding: "28px 32px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 22, minHeight: 100 }}>
            <MountainCard />
            <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#7c3aed20", border: "1px solid #7c3aed40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, boxShadow: "0 0 20px #7c3aed25", position: "relative" }}>💜</div>
            <div style={{ position: "relative" }}>
              <h3 style={{ fontSize: 22, fontWeight: 500, color: "#f0eeff", margin: "0 0 7px", letterSpacing: "-0.3px" }}>Você está construindo a sua melhor versão.</h3>
              <p style={{ fontSize: 13, color: "#4a4a6a", margin: 0 }}>Foco no hoje, orgulho no amanhã.</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ background: "#08080f", borderLeft: "1px solid #0f0f22", padding: "28px 18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: "#f59e0b" }}>✨</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}>Insight do mês</span>
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>{insight}</p>
            <CloudSVG />
          </div>
          <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <span>⏰</span>
              <span style={{ fontSize: 12, color: "#6b6b8a" }}>Consistência — últimos 7 dias</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#f0eeff", marginBottom: 2 }}>{sparkConsis[sparkConsis.length - 1]}%</div>
            <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 12 }}>{stats.consistencia}% este mês</div>
            <Sparkline vals={sparkConsis} cor="#7c3aed" />
          </div>
          <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 16 }}>Categorias</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {categorias.map((cat, i) => (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 14 }}>{cat.icone}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{cat.nome}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: cat.cor }}>{cat.pct}%</span>
                  </div>
                  <div style={{ background: "#1a1a2e", borderRadius: 20, height: 5 }}>
                    <div style={{ background: cat.cor, height: 5, borderRadius: 20, width: `${cat.pct}%`, boxShadow: `0 0 5px ${cat.cor}50`, transition: "width .5s" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 14 }}>Histórico total</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {habitos.slice(0, 6).map((h, i) => {
                const cor = habitCor(h.icone, h.tipo)
                const total = (h.historico || []).length
                const streak = getStreak(h.historico || [], hoje)
                return (
                  <div key={i} onClick={() => setHabitoDetalhe(h)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", borderRadius: 8, padding: "4px 6px", transition: "background .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#0f0f1c")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{h.icone}</span>
                    <span style={{ flex: 1, fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.nome}</span>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: cor }}>{total}×</div>
                      {streak > 0 && <div style={{ fontSize: 9, color: "#f59e0b" }}>🔥{streak}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
        