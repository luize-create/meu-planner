"use client"

import { useState, useMemo } from "react"
import { usePlanner } from "../context/PlannerContext"

const periodos = ["Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias"]
const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]

function fmtData(d: string) {
  const dt = new Date(d + "T12:00:00")
  return `${dt.getDate()}/${meses[dt.getMonth()].slice(0,3)}`
}

function getDias(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

// ── Gráfico de linha ──
function LineChart({ dados, cor }: { dados: { x: string; y: number }[]; cor: string }) {
  const W = 320, H = 110, padX = 32, padY = 12
  const filtrados = dados.filter(d => d.y > 0)
  if (filtrados.length < 2) return (
    <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#4a4a6a" }}>
      Registre no diário para ver
    </div>
  )
  const step = (W - padX * 2) / (dados.length - 1)
  const pts = dados.map((d, i) => ({ x: padX + i * step, y: padY + (H - padY * 2) * (1 - d.y / 100) }))
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${H - padY} L ${pts[0].x} ${H - padY} Z`
  const last = pts[pts.length - 1]
  const indices = [0, Math.floor(dados.length / 2), dados.length - 1]
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`lg${cor.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(v => {
        const y = padY + (H - padY * 2) * (1 - v / 100)
        return <g key={v}><line x1={padX} y1={y} x2={W - padX} y2={y} stroke="#1a1a2e" strokeWidth="1" /><text x={padX - 4} y={y + 3} textAnchor="end" fill="#3a3a5a" fontSize="7">{v}%</text></g>
      })}
      <path d={areaD} fill={`url(#lg${cor.replace("#","")})`} />
      <path d={pathD} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${cor}80)` }} />
      <circle cx={last.x} cy={last.y} r="4" fill={cor} style={{ filter: `drop-shadow(0 0 5px ${cor})` }} />
      <text x={last.x} y={last.y - 7} textAnchor="middle" fill={cor} fontSize="8" fontWeight="600">{Math.round(dados[dados.length-1].y)}%</text>
      {indices.map(i => <text key={i} x={padX + i * step} y={H - 1} textAnchor="middle" fill="#3a3a5a" fontSize="7">{fmtData(dados[i].x)}</text>)}
    </svg>
  )
}

// ── Scatter energia x sono ──
function ScatterChart({ pontos }: { pontos: { x: number; y: number }[] }) {
  const W = 320, H = 110, padX = 28, padY = 12
  if (pontos.length < 3) return (
    <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#4a4a6a" }}>
      Registre sono e energia no diário
    </div>
  )
  const xMin = 3, xMax = 11
  function px(v: number) { return padX + ((v - xMin) / (xMax - xMin)) * (W - padX * 2) }
  function py(v: number) { return padY + (1 - v / 100) * (H - padY * 2) }
  const n = pontos.length
  const sx = pontos.reduce((a, p) => a + p.x, 0), sy = pontos.reduce((a, p) => a + p.y, 0)
  const sxy = pontos.reduce((a, p) => a + p.x * p.y, 0), sx2 = pontos.reduce((a, p) => a + p.x * p.x, 0)
  const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx) || 0
  const intercept = (sy - slope * sx) / n
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {[3,5,7,9,11].map(v => <line key={v} x1={px(v)} y1={padY} x2={px(v)} y2={H - padY} stroke="#1a1a2e" strokeWidth="1" />)}
      {[0,25,50,75,100].map(v => <line key={v} x1={padX} y1={py(v)} x2={W - padX} y2={py(v)} stroke="#1a1a2e" strokeWidth="1" />)}
      <line x1={px(xMin)} y1={py(slope * xMin + intercept)} x2={px(xMax)} y2={py(slope * xMax + intercept)} stroke="#a855f770" strokeWidth="1.5" strokeDasharray="4,3" />
      {pontos.map((p, i) => <circle key={i} cx={px(p.x)} cy={py(p.y)} r="3.5" fill="#a855f7" opacity="0.8" style={{ filter: "drop-shadow(0 0 3px #7c3aed)" }} />)}
      {[3,5,7,9,11].map(v => <text key={v} x={px(v)} y={H - 2} textAnchor="middle" fill="#3a3a5a" fontSize="7">{v}h</text>)}
      <text x={4} y={H / 2} textAnchor="middle" fill="#3a3a5a" fontSize="7" transform={`rotate(-90,4,${H/2})`}>Energia</text>
      <text x={W / 2} y={H - 1} textAnchor="middle" fill="#3a3a5a" fontSize="6">Horas de sono</text>
    </svg>
  )
}

// ── Bar chart ──
function BarChart({ dados, cor }: { dados: { label: string; value: number }[]; cor: string }) {
  const W = 320, H = 110, padX = 10, padY = 15
  const max = Math.max(...dados.map(d => d.value), 1)
  const bw = (W - padX * 2) / dados.length - 4
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {dados.map((d, i) => {
        const x = padX + i * ((W - padX * 2) / dados.length) + 2
        const bh = Math.max((d.value / max) * (H - padY * 2), d.value > 0 ? 5 : 2)
        const y = H - padY - bh
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} fill={d.value > 0 ? cor : "#1a1a2e"} rx="3" style={{ filter: d.value > 0 ? `drop-shadow(0 0 4px ${cor}60)` : "none" }} />
            <text x={x + bw / 2} y={H - 3} textAnchor="middle" fill="#3a3a5a" fontSize="7">{d.label}</text>
            {d.value > 0 && <text x={x + bw / 2} y={y - 3} textAnchor="middle" fill={cor} fontSize="8">{d.value}</text>}
          </g>
        )
      })}
    </svg>
  )
}

// ── Dual line ──
function DualLineChart({ s1, s2, labels, c1, c2, l1, l2 }: { s1: number[]; s2: number[]; labels: string[]; c1: string; c2: string; l1: string; l2: string }) {
  const W = 320, H = 110, padX = 10, padY = 12
  if (s1.length < 2) return <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#4a4a6a" }}>Dados insuficientes</div>
  const max = Math.max(...s1, ...s2, 10)
  const step = (W - padX * 2) / (s1.length - 1)
  function pathOf(s: number[]) {
    return s.map((v, i) => `${i === 0 ? "M" : "L"} ${padX + i * step} ${padY + (H - padY * 2) * (1 - v / max)}`).join(" ")
  }
  const sel = [0, Math.floor(labels.length / 2), labels.length - 1]
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {[0, 0.25, 0.5, 0.75, 1].map(v => <line key={v} x1={padX} y1={padY + (H - padY * 2) * v} x2={W - padX} y2={padY + (H - padY * 2) * v} stroke="#1a1a2e" strokeWidth="1" />)}
      <path d={pathOf(s1)} fill="none" stroke={c1} strokeWidth="1.5" strokeLinejoin="round" />
      <path d={pathOf(s2)} fill="none" stroke={c2} strokeWidth="1.5" strokeLinejoin="round" />
      {sel.map(i => <text key={i} x={padX + i * step} y={H - 1} textAnchor="middle" fill="#3a3a5a" fontSize="7">{labels[i]}</text>)}
    </svg>
  )
}

// ── Mapa de correlações SVG ──
function MapaCorrelacoes({ correlacoes }: { correlacoes: any[] }) {
  const W = 280, H = 190
  const nos = [
    { id: "clareza",   label: ["Clareza", "mental"], x: 140, y: 95,  cor: "#a855f7", r: 30 },
    { id: "sono",      label: ["Sono"],              x: 140, y: 25,  cor: "#3b82f6", r: 18 },
    { id: "exercicio", label: ["Exercício"],          x: 238, y: 128, cor: "#10b981", r: 18 },
    { id: "rotina",    label: ["Rotina"],             x: 238, y: 50,  cor: "#818cf8", r: 18 },
    { id: "tela",      label: ["Tela"],               x: 42,  y: 50,  cor: "#fb923c", r: 18 },
    { id: "ansiedade", label: ["Ansiedade"],          x: 42,  y: 150, cor: "#f472b6", r: 18 },
  ]
  const conexoes = correlacoes.length > 0 ? correlacoes.map(c => ({
    de: c.origem,
    para: c.origem === "tela" ? "ansiedade" : "clareza",
    positivo: c.tipo === "positiva"
  })) : [
    { de: "sono",      para: "clareza",   positivo: true  },
    { de: "exercicio", para: "clareza",   positivo: true  },
    { de: "rotina",    para: "clareza",   positivo: true  },
    { de: "tela",      para: "ansiedade", positivo: false },
    { de: "ansiedade", para: "clareza",   positivo: false },
  ]
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {conexoes.map((c, i) => {
        const de = nos.find(n => n.id === c.de), para = nos.find(n => n.id === c.para)
        if (!de || !para) return null
        return <line key={i} x1={de.x} y1={de.y} x2={para.x} y2={para.y} stroke={c.positivo ? "#10b98155" : "#fb923c55"} strokeWidth="1.5" strokeDasharray={c.positivo ? "none" : "4,3"} />
      })}
      {nos.map(n => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.cor + "18"} stroke={n.cor + "55"} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 5px ${n.cor}40)` }} />
          {n.label.map((line, i) => (
            <text key={i} x={n.x} y={n.y + (n.label.length > 1 ? (i === 0 ? -4 : 8) : 4)} textAnchor="middle" fill={n.cor} fontSize={n.r > 25 ? "8" : "7"} fontWeight={n.r > 25 ? "600" : "400"}>{line}</text>
          ))}
        </g>
      ))}
    </svg>
  )
}

export default function Insights() {
  const { data, analise, inteligencia } = usePlanner()
  const [periodo, setPeriodo] = useState("Últimos 30 dias")
  const [showPeriodo, setShowPeriodo] = useState(false)

  const habitos     = (data.habitos     || []) as any[]
  const sessoesFoco = (data.sessoesFoco || []) as any[]
  const diario      = (data.diario      || []) as any[]
  const diasNum     = periodo === "Últimos 7 dias" ? 7 : periodo === "Últimos 90 dias" ? 90 : 30

  const dias          = getDias(diasNum)
  const inicioPeriodo = dias[0]
  const diasAnt       = getDias(diasNum * 2).slice(0, diasNum)
  const diarAtual     = diario.filter((e: any) => e.data >= inicioPeriodo)
  const diarAnt       = diario.filter((e: any) => e.data >= diasAnt[0] && e.data < inicioPeriodo)

  function media(ents: any[], campo: string) {
    if (!ents.length) return 0
    return ents.reduce((a: number, e: any) => a + (e.checkin?.[campo] || 5), 0) / ents.length
  }

  function contarRecaidas(ents: any[]) {
    return ents.filter((e: any) => (e.checkin?.ansiedade || 5) >= 7 || (e.checkin?.humor || 5) <= 3).length
  }

  const clarezaAtual  = media(diarAtual, "clareza")
  const clarezaAnt    = media(diarAnt,   "clareza")
  const energiaAtual  = media(diarAtual, "energia")
  const energiaAnt    = media(diarAnt,   "energia")
  const recaidasAtual = contarRecaidas(diarAtual)
  const recaidasAnt   = contarRecaidas(diarAnt)

  const diffClareza  = clarezaAnt  > 0 ? Math.round((clarezaAtual  - clarezaAnt)  * 10) : 0
  const diffEnergia  = energiaAnt  > 0 ? Math.round((energiaAtual  - energiaAnt)  * 10) : 0
  const diffRecaidas = recaidasAnt > 0 ? Math.round(((recaidasAnt - recaidasAtual) / recaidasAnt) * 100) : 0

  // ── Dados para gráficos ──
  const dadosClareza = useMemo(() => {
    const n = Math.min(diasNum, 20)
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (n - 1 - i))
      const key = d.toISOString().slice(0, 10)
      const e = diarAtual.find((en: any) => en.data === key)
      return { x: key, y: e?.checkin?.clareza ? e.checkin.clareza * 10 : 0 }
    })
  }, [diarAtual, diasNum])

  const dadosScatter = useMemo(() =>
    diarAtual.filter((e: any) => e.checkin?.sono && e.checkin?.energia)
      .map((e: any) => ({ x: e.checkin.sono, y: e.checkin.energia * 10 }))
  , [diarAtual])

  const dadosRecaidas = useMemo(() => {
    const semanas = Math.min(Math.ceil(diasNum / 7), 6)
    return Array.from({ length: semanas }, (_, i) => {
      const s = new Date(); s.setDate(s.getDate() - (semanas - i) * 7)
      const e = new Date(); e.setDate(e.getDate() - (semanas - i - 1) * 7)
      const sk = s.toISOString().slice(0, 10), ek = e.toISOString().slice(0, 10)
      return { label: `${s.getDate()}/${s.getMonth()+1}`, value: contarRecaidas(diarAtual.filter((en: any) => en.data >= sk && en.data <= ek)) }
    })
  }, [diarAtual, diasNum])

  const dadosDual = useMemo(() => {
    const n = Math.min(diasNum, 14)
    const labels: string[] = [], ansiedade: number[] = [], tela: number[] = []
    Array.from({ length: n }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (n - 1 - i))
      const key = d.toISOString().slice(0, 10)
      const e = diarAtual.find((en: any) => en.data === key)
      labels.push(`${d.getDate()}/${d.getMonth()+1}`)
      ansiedade.push(e?.checkin?.ansiedade ? e.checkin.ansiedade * 10 : 50)
      tela.push(e?.checkin?.tela ? Math.min(e.checkin.tela * 10, 100) : 40)
    })
    return { labels, ansiedade, tela }
  }, [diarAtual, diasNum])

  // ── Hábitos âncora ──
  const habitosAncora = useMemo(() => {
    if (analise.correlacoes.length > 0) {
      return analise.correlacoes.map(c => ({
        icone: c.origem === "exercicio" ? "🏃" : c.origem === "sono" ? "🌙" : c.origem === "rotina" ? "📅" : c.origem === "tela" ? "📱" : "✨",
        nome: c.origem.charAt(0).toUpperCase() + c.origem.slice(1),
        impacto: c.tipo === "positiva" ? `+${Math.round(c.intensidade * 100)}%` : `-${Math.round(c.intensidade * 100)}%`,
        positivo: c.tipo === "positiva",
        pct: Math.round(c.intensidade * 100),
        destino: c.tipo === "positiva" ? (c.destino === "energia" ? "energia" : "clareza") : "ansiedade"
      }))
    }
    return [
      { icone: "🌙", nome: "Sono",       impacto: "+41%", positivo: true,  pct: 41, destino: "clareza"      },
      { icone: "🏃", nome: "Exercício",  impacto: "+27%", positivo: true,  pct: 27, destino: "energia"      },
      { icone: "📅", nome: "Rotina",     impacto: "+23%", positivo: true,  pct: 23, destino: "estabilidade" },
      { icone: "🍎", nome: "Alimentação",impacto: "+12%", positivo: true,  pct: 12, destino: "humor"        },
      { icone: "📱", nome: "Tela à noite",impacto: "-31%", positivo: false, pct: 31, destino: "ansiedade"    },
    ]
  }, [analise.correlacoes])

  // ── Insights importantes ──
  const insightsImportantes = useMemo(() => {
    const lista: { icone: string; texto: string }[] = []
    analise.correlacoes.forEach(c => {
      if (c.tipo === "positiva" && c.origem === "sono")
        lista.push({ icone: "🌙", texto: `Dias com 7h+ de sono aumentam sua clareza mental em ${Math.round(c.intensidade * 100)}% no dia seguinte.` })
      if (c.tipo === "negativa" && c.origem === "tela")
        lista.push({ icone: "📱", texto: `Excesso de tela após 20h está ligado a ${Math.round(c.intensidade * 100)}% dos seus picos de ansiedade.` })
      if (c.tipo === "positiva" && c.origem === "exercicio")
        lista.push({ icone: "🏃", texto: `Você é 3x mais consistente quando se exercita de manhã.` })
    })
    analise.padroes.slice(0, 3).forEach(p => {
      if (lista.length < 3) lista.push({ icone: p.icone, texto: p.observacao })
    })
    if (!lista.length) {
      lista.push({ icone: "🌙", texto: "Dias com 7h+ de sono tendem a aumentar sua clareza mental no dia seguinte." })
      lista.push({ icone: "📱", texto: "Excesso de tela após 20h parece estar ligado a picos de ansiedade." })
      lista.push({ icone: "🏃", texto: "Você é mais consistente nos dias em que se exercita." })
    }
    return lista.slice(0, 3)
  }, [analise])

  const previsaoScore = clarezaAtual > clarezaAnt && energiaAtual > energiaAnt ? 78 : clarezaAtual > clarezaAnt || energiaAtual > energiaAnt ? 62 : 45
  const circ = 2 * Math.PI * 38

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", minHeight: "100vh", color: "#e2e8f0", background: "#07070f" }}>

      {/* ── COLUNA PRINCIPAL ── */}
      <div style={{ padding: "22px 26px", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 3px" }}>Insights</h1>
            <p style={{ fontSize: 12, color: "#4a4a6a", margin: 0 }}>Entenda sua mente. Transforme padrões em clareza.</p>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowPeriodo(!showPeriodo)} style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 10, padding: "7px 14px", color: "#94a3b8", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              📅 {periodo} ▾
            </button>
            {showPeriodo && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 10, overflow: "hidden", zIndex: 10, minWidth: 170 }}>
                {periodos.map(p => (
                  <button key={p} onClick={() => { setPeriodo(p); setShowPeriodo(false) }} style={{ display: "block", width: "100%", padding: "9px 14px", background: p === periodo ? "#7c3aed20" : "transparent", border: "none", color: p === periodo ? "#a855f7" : "#6b6b8a", fontSize: 12, cursor: "pointer", textAlign: "left" }}>{p}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RESUMO MENTAL */}
        <div style={{ background: "linear-gradient(135deg, #0f0f1c, #12111e)", border: "1px solid #1a1a2e", borderRadius: 18, padding: "20px 24px", marginBottom: 14, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: 0, top: 0, width: 180, height: "100%", background: "radial-gradient(ellipse at 80% 50%, #7c3aed15, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Resumo mental</div>
          <p style={{ fontSize: 17, fontWeight: 300, color: "#e2e8f0", margin: "0 0 5px", lineHeight: 1.5 }}>
            {analise.padroes[0]?.observacao || "Seu sistema ficou mais estável nos últimos dias."}
          </p>
          <p style={{ fontSize: 12, color: "#6b6b8a", margin: "0 0 16px", lineHeight: 1.6, fontStyle: "italic" }}>
            {analise.padroes[0]?.descoberta || "Você vem mantendo consistência, reduzindo recaídas e fortalecendo seus hábitos âncora."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {[
              { label: "Consistência",   valor: `${analise.consistenciaGeral}%`, diff: null,          cor: "#7c3aed" },
              { label: "Clareza mental", valor: clarezaAtual > 0 ? `${Math.round(clarezaAtual * 10)}%` : "—", diff: diffClareza || null, cor: "#818cf8" },
              { label: "Energia média",  valor: energiaAtual > 0 ? `${Math.round(energiaAtual * 10)}%` : "—", diff: diffEnergia || null, cor: "#10b981" },
              { label: "Recaídas",       valor: String(recaidasAtual), diff: diffRecaidas || null, negativeIsGood: true, cor: "#fb923c" },
            ].map((m: any, i) => (
              <div key={i} style={{ background: "#0a0a14", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 2 }}>
                  <span style={{ fontSize: 19, fontWeight: 700, color: m.cor }}>{m.valor}</span>
                  {m.diff !== null && (
                    <span style={{ fontSize: 10, color: (m.negativeIsGood ? m.diff > 0 : m.diff >= 0) ? "#10b981" : "#fb923c" }}>
                      {m.diff >= 0 ? "+" : ""}{m.diff}%
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: "#4a4a6a" }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* GRÁFICOS 2x2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Clareza mental</div>
            <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 10 }}>Evolução nos últimos {diasNum} dias</div>
            <LineChart dados={dadosClareza} cor="#a855f7" />
          </div>
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Energia x Sono</div>
            <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 10 }}>Relação entre horas de sono e nível de energia</div>
            <ScatterChart pontos={dadosScatter} />
          </div>
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Recaídas</div>
            <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 10 }}>Quantidade de recaídas por semana</div>
            <BarChart dados={dadosRecaidas} cor="#f472b6" />
          </div>
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Tela x Ansiedade (dias seguintes)</div>
            <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 10 }}>Excesso de tela tende a aumentar ansiedade</div>
            <DualLineChart s1={dadosDual.tela} s2={dadosDual.ansiedade} labels={dadosDual.labels} c1="#3b82f6" c2="#f472b6" l1="Tela" l2="Ansiedade" />
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 2, background: "#3b82f6" }} /><span style={{ fontSize: 9, color: "#6b6b8a" }}>Tempo de tela (h)</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 12, height: 2, background: "#f472b6" }} /><span style={{ fontSize: 9, color: "#6b6b8a" }}>Ansiedade (0-10)</span></div>
            </div>
          </div>
        </div>

        {/* Hábitos âncora + Mapa */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Hábitos âncora</div>
            <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 14 }}>Impacto no sistema</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {habitosAncora.slice(0, 5).map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{h.icone}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: "#e2e8f0" }}>{h.nome}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: h.positivo ? "#10b981" : "#fb923c" }}>{h.impacto} {h.destino}</span>
                    </div>
                    <div style={{ background: "#1a1a2e", borderRadius: 20, height: 5 }}>
                      <div style={{ background: h.positivo ? "linear-gradient(90deg, #7c3aed, #10b981)" : "#fb923c", height: 5, borderRadius: 20, width: `${Math.min(h.pct, 100)}%`, transition: "width .4s" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Mapa de Correlações</div>
            <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 10 }}>Como seus fatores se conectam</div>
            <MapaCorrelacoes correlacoes={analise.correlacoes} />
            <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 14, height: 1.5, background: "#10b981" }} /><span style={{ fontSize: 9, color: "#6b6b8a" }}>positivo</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 14, height: 1.5, background: "#fb923c" }} /><span style={{ fontSize: 9, color: "#6b6b8a" }}>negativo</span></div>
            </div>
          </div>
        </div>

        {/* Insights importantes */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Insights importantes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {insightsImportantes.map((ins, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", background: i % 2 === 0 ? "#0a0a14" : "transparent", borderRadius: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: "#7c3aed18", border: "1px solid #7c3aed30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{ins.icone}</div>
                <span style={{ flex: 1, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{ins.texto}</span>
                <span style={{ fontSize: 13, color: "#3a3a5a" }}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SIDEBAR DIREITA ── */}
      <div style={{ background: "#08080f", borderLeft: "1px solid #0f0f22", padding: "22px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Estado atual */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, color: "#4a4a6a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Estado atual</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <div style={{ position: "relative", width: 86, height: 86 }}>
              <svg width="86" height="86" viewBox="0 0 86 86">
                <circle cx="43" cy="43" r="38" fill="none" stroke="#1a1a2e" strokeWidth="5" />
                <circle cx="43" cy="43" r="38" fill="none" stroke="#7c3aed" strokeWidth="5"
                  strokeDasharray={`${circ * (analise.consistenciaGeral || 72) / 100} ${circ}`}
                  strokeLinecap="round" transform="rotate(-90 43 43)"
                  style={{ filter: "drop-shadow(0 0 5px #7c3aed)" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#a855f7" }}>{analise.consistenciaGeral || 72}%</div>
                <div style={{ fontSize: 9, color: "#6b6b8a" }}>estável</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: "#10b981" }}>↑ Tendência: positiva</div>
        </div>

        {/* Fatores em destaque */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, color: "#4a4a6a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Fatores em destaque</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {habitosAncora.slice(0, 5).map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>{h.icone}</span>
                <span style={{ flex: 1, fontSize: 12, color: "#94a3b8" }}>{h.nome}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: h.positivo ? "#10b981" : "#fb923c" }}>{h.impacto}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Previsão */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, color: "#4a4a6a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Previsão <span style={{ color: "#3a3a5a", textTransform: "none", fontWeight: 400, fontSize: 9 }}>(próximos 7 dias)</span>
          </div>
          <p style={{ fontSize: 11, color: "#6b6b8a", lineHeight: 1.6, margin: "0 0 12px", fontStyle: "italic" }}>
            {previsaoScore >= 70 ? "Se manter essa média, sua clareza mental deve continuar melhorando." : previsaoScore >= 50 ? "Tendência estável. Consistência nos hábitos vai manter o equilíbrio." : "Sinais de atenção. Simplificar a rotina pode ajudar."}
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 76, height: 76 }}>
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="32" fill="none" stroke="#1a1a2e" strokeWidth="4" />
                <circle cx="38" cy="38" r="32" fill="none"
                  stroke={previsaoScore >= 70 ? "#10b981" : "#7c3aed"}
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 32 * previsaoScore / 100} ${2 * Math.PI * 32}`}
                  strokeLinecap="round" transform="rotate(-90 38 38)"
                  style={{ filter: `drop-shadow(0 0 4px ${previsaoScore >= 70 ? "#10b981" : "#7c3aed"})` }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: previsaoScore >= 70 ? "#10b981" : "#a855f7" }}>{previsaoScore}%</div>
                <div style={{ fontSize: 7, color: "#4a4a6a", textAlign: "center", lineHeight: 1.3 }}>chance de evolução positiva</div>
              </div>
            </div>
          </div>
        </div>

        {/* Lembrete */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, color: "#4a4a6a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Lembrete</div>
          <p style={{ fontSize: 12, color: "#6b6b8a", lineHeight: 1.7, margin: "0 0 8px", fontStyle: "italic" }}>
            "Pequenas escolhas repetidas constroem grandes mudanças."
          </p>
          <div style={{ textAlign: "right", fontSize: 15, color: "#7c3aed" }}>💜</div>
        </div>
      </div>
    </div>
  )
}