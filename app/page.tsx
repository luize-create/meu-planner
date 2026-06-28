"use client"

import { useState, useEffect, useMemo } from "react"
import { usePlanner } from "./context/PlannerContext"
import { useRouter } from "next/navigation"
type InsightItem = { texto: string; confianca: number; tipo: string; dados?: string }
type EstadoMental = { modo: string; descricao: string; cor: string; icone: string; score: number }

function buildDailyDataset(diario: any[], habitos: any[], tarefas: any[], sessoesFoco: any[], days = 30) {
  const habitosPos = habitos.filter((h: any) => h.tipo !== "negativo")
  const habitosNeg = habitos.filter((h: any) => h.tipo === "negativo")
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i))
    const key = d.toISOString().slice(0, 10)
    let humor: number | null = null, energia: number | null = null, clareza: number | null = null
    try {
      const est = JSON.parse(localStorage.getItem(`estado-dia-${key}`) || "{}")
      if (est.humor) humor = est.humor
      if (est.energia) energia = est.energia
      if (est.clareza) clareza = est.clareza
    } catch {}
    const entrada = diario.find((e: any) => e.data === key)
    const sono = entrada?.checkin?.sono ?? null
    const ansiedade = entrada?.checkin?.ansiedade ?? null
    if (energia === null && entrada?.checkin?.energia) energia = entrada.checkin.energia
    const sessoesDia = sessoesFoco.filter((s: any) => s.data === key)
    const focoMin = sessoesDia.reduce((a: number, s: any) => a + (s.minutos || 0), 0)
    const tarefasDia = tarefas.filter((t: any) => t.data === key)
    return {
      data: key, humor, energia, clareza, sono, ansiedade, focoMin,
      sessoesCount: sessoesDia.length,
      tarefasConcluidas: tarefasDia.filter((t: any) => t.concluida).length,
      tarefasTotal: tarefasDia.length,
      habitosConcluidos: habitosPos.filter((h: any) => (h.historico || []).includes(key)).length,
      habitosTotal: habitosPos.length,
      recaidas: habitosNeg.filter((h: any) => (h.historico || []).includes(key)).length,
    }
  })
}

function avgNum(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function detectarPadroes(dataset: any[]): InsightItem[] {
  const comDados = dataset.filter((d: any) =>
    d.humor !== null || d.energia !== null || d.clareza !== null || d.sono !== null
  )
  if (comDados.length < 5) return []
  const insights: InsightItem[] = []

  const comClareza = comDados.filter((d: any) => d.clareza !== null)
  if (comClareza.length >= 5) {
    const alta  = comClareza.filter((d: any) => d.clareza >= 7)
    const baixa = comClareza.filter((d: any) => d.clareza <= 4)
    if (alta.length >= 2 && baixa.length >= 2) {
      const mfA = avgNum(alta.map((d: any) => d.focoMin))
      const mfB = avgNum(baixa.map((d: any) => d.focoMin))
      if (mfB > 5 && mfA > mfB * 1.2) {
        insights.push({ tipo: "correlacao", confianca: 0.85,
          texto: `Você foca ${Math.round((mfA/mfB-1)*100)}% mais nos dias com clareza mental alta — ${Math.round(mfA)}min vs ${Math.round(mfB)}min.`,
          dados: `${comClareza.length} dias analisados` })
      }
    }
  }

  const comSono = dataset.filter((d: any) => d.sono !== null)
  if (comSono.length >= 4) {
    let seq = 0; const posC: number[] = []
    for (let i = 0; i < dataset.length - 1; i++) {
      if (dataset[i].sono !== null && dataset[i].sono < 6) {
        seq++
        if (seq >= 2 && dataset[i+1].clareza !== null) posC.push(dataset[i+1].clareza)
      } else { seq = 0 }
    }
    if (posC.length >= 2 && avgNum(posC) < 5)
      insights.push({ tipo: "tendencia", confianca: 0.88,
        texto: "Sua clareza costuma cair após 2 noites consecutivas com menos de 6h de sono.",
        dados: `Clareza média: ${Math.round(avgNum(posC)*10)/10}/10` })
  }

  const comHab = comDados.filter((d: any) => d.habitosTotal > 0)
  if (comHab.length >= 5) {
    const boa = comHab.filter((d: any) => d.habitosConcluidos/d.habitosTotal >= 0.7)
    const ma  = comHab.filter((d: any) => d.habitosConcluidos/d.habitosTotal < 0.4)
    if (boa.length >= 2 && ma.length >= 2) {
      const fB = avgNum(boa.map((d: any) => d.focoMin))
      const fM = avgNum(ma.map((d: any) => d.focoMin))
      if (fM > 0 && fB > fM * 1.2)
        insights.push({ tipo: "correlacao", confianca: 0.72,
          texto: `Você foca ${Math.round((fB/fM-1)*100)}% mais nos dias em que conclui 70%+ dos hábitos.`,
          dados: `${boa.length} dias com boa rotina analisados` })
    }
  }

  return insights.sort((a, b) => b.confianca - a.confianca).slice(0, 4)
}

function detectarEstadoMental(hoje: any, recente: any[]): EstadoMental {
  const validos = recente.filter((d: any) => d.energia !== null || d.clareza !== null)
  const h = (hoje.humor   ?? avgNum(validos.filter((d: any) => d.humor   !== null).map((d: any) => d.humor)))   || 5
  const e = (hoje.energia ?? avgNum(validos.filter((d: any) => d.energia !== null).map((d: any) => d.energia))) || 5
  const c = (hoje.clareza ?? avgNum(validos.filter((d: any) => d.clareza !== null).map((d: any) => d.clareza))) || 5
  const hab = validos.length > 0 ? avgNum(validos.map((d: any) => d.habitosTotal > 0 ? d.habitosConcluidos/d.habitosTotal : 0)) : 0
  const foco = avgNum(validos.map((d: any) => d.focoMin))
  const rec  = recente.reduce((a: number, d: any) => a + d.recaidas, 0)
  const acum = recente.reduce((a: number, d: any) => a + Math.max(0, d.tarefasTotal - d.tarefasConcluidas), 0)
  if (c >= 7 && h >= 7 && hab >= 0.6 && foco >= 25) return { modo: "Produtivo estável", descricao: "Clareza alta, rotina consistente e foco ativo.", cor: "#10b981", icone: "🎯", score: 90 }
  if (e >= 7 && c <= 5 && (rec >= 2 || (hoje.ansiedade !== null && hoje.ansiedade >= 7))) return { modo: "Modo impulsivo", descricao: "Energia alta com clareza baixa. Atenção às decisões.", cor: "#f59e0b", icone: "⚡", score: 40 }
  if (e <= 4 && (acum >= 5 || hab < 0.3)) return { modo: "Modo vulnerável", descricao: "Energia baixa e rotina instável. Priorize o essencial.", cor: "#f43f5e", icone: "🌧️", score: 28 }
  if (c <= 4 && foco < 15 && acum >= 3) return { modo: "Modo disperso", descricao: "Pouco foco e clareza recente. Tente simplificar o dia.", cor: "#6366f1", icone: "🌀", score: 35 }
  if (e <= 5 && c >= 6 && hab >= 0.5) return { modo: "Recarregando", descricao: "Energia baixa, mas mantendo o essencial.", cor: "#3b82f6", icone: "🔋", score: 62 }
  if (hab >= 0.6 && foco >= 20) return { modo: "Modo consistente", descricao: "Rotina mantida, progresso silencioso.", cor: "#7c3aed", icone: "✦", score: 75 }
  return { modo: "Calibrando", descricao: "Coletando dados. Padrões aparecem em alguns dias.", cor: "#6b6b8a", icone: "⋯", score: 50 }
}


const humores = [
  { emoji: "😄", label: "Incrível", valor: 10 },
  { emoji: "🙂", label: "Bem",      valor: 7  },
  { emoji: "😐", label: "Ok",       valor: 5  },
  { emoji: "😞", label: "Difícil",  valor: 3  },
  { emoji: "😵‍💫", label: "Caótico", valor: 1  },
]
const energias = [
  { emoji: "⚡",  label: "Alta",     valor: 9 },
  { emoji: "🔋",  label: "Boa",      valor: 7 },
  { emoji: "🪫",  label: "Baixa",    valor: 3 },
  { emoji: "😴",  label: "Esgotada", valor: 1 },
]
const clarezas = [
  { emoji: "☀️",  label: "Cristalina", valor: 9 },
  { emoji: "⛅",  label: "Clara",      valor: 7 },
  { emoji: "🌤️", label: "Turva",      valor: 3 },
  { emoji: "🌧️", label: "Confusa",    valor: 1 },
]

const frasesDia = [
  "Vamos construir um dia incrível.",
  "Pequenos passos ainda contam.",
  "Um dia de cada vez.",
  "Clareza antes de velocidade.",
  "Você já começou só por estar aqui.",
]

function interpretarEstado(h: number | null, e: number | null, c: number | null): string {
  const p: string[] = []
  if (h !== null) p.push(h >= 7 ? "Humor bom"    : h >= 5 ? "Humor ok"         : "Humor difícil")
  if (e !== null) p.push(e >= 7 ? "Energia alta" : e >= 5 ? "Energia moderada" : "Energia baixa")
  if (c !== null) p.push(c >= 7 ? "Clareza boa"  : c >= 5 ? "Clareza razoável" : "Mente turva")
  return p.join(" · ")
}

function getUltimos7() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function calcStreak(hist: string[]): number {
  let s = 0; const d = new Date()
  while (s < 365) {
    if (hist.includes(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1) } else break
  }
  return s
}

const tipoCor: Record<string, string> = {
  correlacao: "#7c3aed",
  tendencia:  "#f59e0b",
  padrao:     "#10b981",
}

function HeroMountain() {
  return (
    <svg width="280" height="200" viewBox="0 0 300 220"
      style={{ position: "absolute", right: -10, top: 0, height: "100%", opacity: 0.9, pointerEvents: "none" }}>
      <defs>
        <radialGradient id="hglow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hm1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="hm2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <ellipse cx="180" cy="90" rx="110" ry="80" fill="url(#hglow)" />
      <polygon points="50,220 170,40 290,220" fill="url(#hm2)" opacity="0.5" />
      <polygon points="10,220 150,10 290,220" fill="url(#hm1)" />
      <polygon points="150,10 172,52 128,52" fill="white" opacity="0.12" />
      <path d="M150,10 C158,40 162,70 168,100 C174,130 178,160 182,190"
        fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.5" />
      <circle cx="152" cy="10"  r="2.5" fill="#c4b5fd" opacity="0.85" />
      <circle cx="160" cy="45"  r="2.5" fill="#c4b5fd" opacity="0.70" />
      <circle cx="165" cy="80"  r="2.5" fill="#c4b5fd" opacity="0.55" />
      <circle cx="170" cy="115" r="2.5" fill="#c4b5fd" opacity="0.40" />
      <circle cx="150" cy="10" r="14" fill="#a855f7" opacity="0.16" />
      <circle cx="150" cy="10" r="6"  fill="#c4b5fd" opacity="0.28" />
      <line x1="150" y1="10" x2="150" y2="-8" stroke="#e2e8f0" strokeWidth="1.5" opacity="0.8" />
      <polygon points="150,-8 166,-2 150,5" fill="#a855f7" />
      <circle cx="240" cy="25" r="1.4" fill="#e2e8f0" opacity="0.45" />
      <circle cx="260" cy="50" r="1"   fill="#c4b5fd" opacity="0.35" />
    </svg>
  )
}

function ClockMini() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="20" fill="#0d0d20" stroke="#7c3aed" strokeWidth="1.5"
        style={{ filter: "drop-shadow(0 0 5px #7c3aed50)" }} />
      <circle cx="22" cy="22" r="2.5" fill="#a855f7" />
      <line x1="22" y1="22" x2="22" y2="8"  stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="22" y1="22" x2="32" y2="22" stroke="#c4b5fd" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function CheckinGroup({ label, options, valor, onChange }: {
  label: string
  options: { emoji: string; label: string; valor: number }[]
  valor: number | null
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#2a2a45", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {options.map(opt => {
          const ativo = valor === opt.valor
          return (
            <button key={opt.valor} onClick={() => onChange(opt.valor)} title={opt.label}
              style={{ width: 38, height: 38, borderRadius: 10, fontSize: 17, background: ativo ? "#7c3aed20" : "#13132a", border: `1px solid ${ativo ? "#7c3aed60" : "#1e1e35"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", boxShadow: ativo ? "0 0 10px #7c3aed40" : "none", transform: ativo ? "scale(1.1)" : "scale(1)" }}>
              {opt.emoji}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Central() {
  const { data, setTarefas, setHabitos } = usePlanner()
  const router = useRouter()

  const tarefas     = (data.tarefas     || []) as any[]
  const habitos     = (data.habitos     || []) as any[]
  const sessoesFoco = (data.sessoesFoco || []) as any[]
  const diario      = ((data as any).diario || []) as any[]

  const hoje      = new Date().toISOString().slice(0, 10)
  const hora      = new Date().getHours()
  const saudacao  = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite"
  const emojiHora = hora < 12 ? "🌤️" : hora < 18 ? "☀️" : "🌙"
  const fraseDia  = frasesDia[new Date().getDay() % frasesDia.length]

  const [humor,          setHumor]          = useState<number | null>(null)
  const [energia,        setEnergia]        = useState<number | null>(null)
  const [clareza,        setClareza]        = useState<number | null>(null)
  const [editandoEstado, setEditandoEstado] = useState(false)

  const [tarefaSemana,  setTarefaSemana]  = useState("")
  const [progresso,     setProgresso]     = useState(0)
  const [semanaEditing, setSemanaEditing] = useState(false)
  const [semanaInput,   setSemanaInput]   = useState("")

  const [novaTarefa, setNovaTarefa] = useState("")

  const [brainDump,   setBrainDump]   = useState<BrainItem[]>([])
  const [novaBrain,   setNovaBrain]   = useState("")
  const [processando, setProcessando] = useState<number | null>(null)

  const [projetos, setProjetos] = useState<any[]>([])
  const [nome,     setNome]     = useState("")

  const [insights,     setInsights]     = useState<InsightItem[]>([])
  const [estadoMental, setEstadoMental] = useState<EstadoMental>({
    modo: "Calibrando", descricao: "Coletando dados.", cor: "#6b6b8a", icone: "⋯", score: 50,
  })
  const [diasComDados, setDiasComDados] = useState(0)

  useEffect(() => {
    try {
      const est = JSON.parse(localStorage.getItem(`estado-dia-${hoje}`) || "{}")
      if (est.humor)   setHumor(est.humor)
      if (est.energia) setEnergia(est.energia)
      if (est.clareza) setClareza(est.clareza)
      if (est.humor && est.energia && est.clareza) setEditandoEstado(false)
    } catch {}

    try {
      const ts = JSON.parse(localStorage.getItem("tarefa-semana-v1") || "{}")
      setTarefaSemana(ts.texto || "")
      setProgresso(ts.progresso || 0)
    } catch {}

    try {
      const p = JSON.parse(localStorage.getItem("projetos-v1") || "[]")
      setProjetos(p.filter((pr: any) => pr.status === "Em andamento").slice(0, 3))
    } catch {}

    try {
      setBrainDump(JSON.parse(localStorage.getItem("brain-dump-v1") || "[]"))
    } catch {}

    const n = localStorage.getItem("usuario-nome")
    if (n) setNome(n)

    try {
      const dataset  = buildDailyDataset(diario, habitos, tarefas, sessoesFoco, 30)
      const hojeSnap = dataset[dataset.length - 1]
      const recente7 = dataset.slice(-7)
      setInsights(detectarPadroes(dataset))
      setEstadoMental(detectarEstadoMental(hojeSnap, recente7))
      setDiasComDados(
        dataset.filter((d: any) =>
          d.humor !== null || d.energia !== null || d.clareza !== null || d.sono !== null
        ).length
      )
    } catch {}
  }, [hoje])

  function salvarEstado(campo: "humor" | "energia" | "clareza", valor: number) {
    const novoHumor   = campo === "humor"   ? valor : humor
    const novaEnergia = campo === "energia" ? valor : energia
    const novaClareza = campo === "clareza" ? valor : clareza

    if (campo === "humor")   setHumor(valor)
    if (campo === "energia") setEnergia(valor)
    if (campo === "clareza") setClareza(valor)

    if (novoHumor !== null && novaEnergia !== null && novaClareza !== null) {
      setTimeout(() => setEditandoEstado(false), 300)
    }

    const atual = JSON.parse(localStorage.getItem(`estado-dia-${hoje}`) || "{}")
    localStorage.setItem(`estado-dia-${hoje}`, JSON.stringify({ ...atual, [campo]: valor }))
  }

  function salvarTarefaSemana() {
    setTarefaSemana(semanaInput.trim())
    localStorage.setItem("tarefa-semana-v1", JSON.stringify({ texto: semanaInput.trim(), progresso }))
    setSemanaEditing(false)
  }

  const tarefasHoje = tarefas.filter((t: any) => t.data === hoje)
  const tarefasDone = tarefasHoje.filter((t: any) => t.concluida).length

  function adicionarTarefa() {
    if (!novaTarefa.trim()) return
    setTarefas([{ id: Date.now(), texto: novaTarefa.trim(), data: hoje, concluida: false }, ...tarefas] as any)
    setNovaTarefa("")
  }

  function toggleTarefa(id: number) {
    setTarefas(tarefas.map((t: any) => t.id === id ? { ...t, concluida: !t.concluida } : t) as any)
  }

  function deletarTarefa(id: number) {
    setTarefas(tarefas.filter((t: any) => t.id !== id) as any)
  }

  function toggleHabito(hid: number) {
    setHabitos(habitos.map((h: any) => {
      if (h.id !== hid) return h
      const hist = h.historico || []
      const feito = hist.includes(hoje)
      return { ...h, historico: feito ? hist.filter((d: string) => d !== hoje) : [...hist, hoje] }
    }) as any)
  }

  function adicionarBrain() {
    if (!novaBrain.trim()) return
    const item: BrainItem = { id: Date.now(), texto: novaBrain.trim(), data: hoje, status: "pendente" }
    const nova = [item, ...brainDump]
    setBrainDump(nova)
    localStorage.setItem("brain-dump-v1", JSON.stringify(nova))
    setNovaBrain("")
  }

  function processarBrain(id: number, acao: "tarefa" | "projeto" | "arquivado") {
    if (acao === "tarefa") {
      const item = brainDump.find(b => b.id === id)
      if (item) setTarefas([{ id: Date.now(), texto: item.texto, data: hoje, concluida: false }, ...tarefas] as any)
    }
    const nova = brainDump.map(b => b.id === id ? { ...b, status: acao } : b)
    setBrainDump(nova)
    localStorage.setItem("brain-dump-v1", JSON.stringify(nova))
    setProcessando(null)
  }

  function deletarBrain(id: number) {
    const nova = brainDump.filter(b => b.id !== id)
    setBrainDump(nova)
    localStorage.setItem("brain-dump-v1", JSON.stringify(nova))
    setProcessando(null)
  }

  const alertas = useMemo(() => {
    const lista: { tipo: string; texto: string; icone: string }[] = []
    const agora    = Date.now()
    const ultimos7 = getUltimos7()

    projetos.forEach(p => {
      const ref  = p.ultimaAtividade || p.criadoEm
      if (!ref) return
      const dias = Math.floor((agora - new Date(ref + "T12:00:00").getTime()) / 86400000)
      if (dias >= 7) lista.push({ tipo: "projeto", icone: "📁", texto: `"${p.nome}" parado há ${dias} dias.` })
    })

    habitos.filter((h: any) => h.tipo !== "negativo").forEach((h: any) => {
      const falhas = ultimos7.filter(d => !(h.historico || []).includes(d)).length
      if (falhas >= 5) lista.push({ tipo: "habito", icone: "📉", texto: `"${h.nome}" ignorado ${falhas} vezes nos últimos 7 dias.` })
    })

    brainDump.filter(b => b.status === "pendente").forEach(b => {
      const dias = Math.floor((agora - new Date(b.data + "T12:00:00").getTime()) / 86400000)
      if (dias >= 3) lista.push({
        tipo: "braindump", icone: "💭",
        texto: `"${b.texto.length > 48 ? b.texto.slice(0, 48) + "…" : b.texto}" não processado há ${dias} dias.`,
      })
    })

    return lista.slice(0, 3)
  }, [projetos, habitos, brainDump])

  const sessoesHoje   = sessoesFoco.filter((s: any) => s.data === hoje)
  const minFocados    = sessoesHoje.reduce((a: number, s: any) => a + (s.minutos || 0), 0)
  const habitosHoje   = habitos.filter((h: any) => (h.historico || []).includes(hoje)).length
  const brainPendente = brainDump.filter(b => b.status === "pendente")
  const corProgresso  = progresso >= 80 ? "#10b981" : progresso >= 50 ? "#7c3aed" : "#f59e0b"
  const interpretacao = interpretarEstado(humor, energia, clareza)
  const estadoCompleto = humor !== null && energia !== null && clareza !== null

  const humorEmoji   = humores.find(o => o.valor === humor)
  const energiaEmoji = energias.find(o => o.valor === energia)
  const clarezaEmoji = clarezas.find(o => o.valor === clareza)

  function fmtMin(m: number) {
    if (m === 0) return "0m"
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60 > 0 ? m % 60 + "m" : ""}`.trim()
  }

  function diasAtras(dataStr: string): string {
    const dias = Math.floor((Date.now() - new Date(dataStr + "T12:00:00").getTime()) / 86400000)
    if (dias === 0) return "hoje"
    if (dias === 1) return "ontem"
    return `${dias}d`
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 32px 80px", color: "#e2e8f0" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 34, fontWeight: 400, margin: "0 0 6px", color: "#f0eeff", letterSpacing: "-0.5px" }}>
          {saudacao}{nome ? `, ${nome}` : ""} {emojiHora}
        </h1>
        <p style={{ fontSize: 13, color: "#3a3a5a", margin: "0 0 16px", fontStyle: "italic" }}>{fraseDia}</p>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "foco hoje", valor: fmtMin(minFocados),                                                    cor: "#7c3aed" },
            { label: "hábitos",   valor: `${habitosHoje}/${habitos.length}`,                                     cor: "#10b981" },
            { label: "tarefas",   valor: `${tarefasDone}/${tarefasHoje.length}`,                                 cor: "#f59e0b" },
            { label: "pendentes", valor: `${brainPendente.length} dump${brainPendente.length !== 1 ? "s" : ""}`, cor: "#6366f1" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.cor }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: s.cor }}>{s.valor}</span>
              <span style={{ fontSize: 12, color: "#3a3a5a" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Estado emocional */}
      <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "20px 22px", marginBottom: 14 }}>
        {estadoCompleto && !editandoEstado ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { emoji: humorEmoji?.emoji,   label: humorEmoji?.label,   titulo: "Humor"   },
                { emoji: energiaEmoji?.emoji, label: energiaEmoji?.label, titulo: "Energia" },
                { emoji: clarezaEmoji?.emoji, label: clarezaEmoji?.label, titulo: "Clareza" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: "#7c3aed15", border: "1px solid #7c3aed25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                    {item.emoji}
                  </div>
                  <span style={{ fontSize: 9, color: "#4a4a6a" }}>{item.titulo}</span>
                  <span style={{ fontSize: 9, color: "#7c3aed" }}>{item.label}</span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 4px", lineHeight: 1.5 }}>{interpretacao}</p>
              <p style={{ fontSize: 11, color: "#3a3a5a", margin: 0 }}>Check-in registrado para hoje.</p>
            </div>
            <button onClick={() => setEditandoEstado(true)}
              style={{ background: "none", border: "1px solid #1e1e35", borderRadius: 8, padding: "6px 14px", color: "#4a4a6a", fontSize: 12, cursor: "pointer", flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed40"; e.currentTarget.style.color = "#7c3aed" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e35"; e.currentTarget.style.color = "#4a4a6a" }}>
              Editar
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: "#3a3a5a" }}>Como você está hoje?</span>
              {estadoCompleto && (
                <button onClick={() => setEditandoEstado(false)}
                  style={{ background: "none", border: "none", color: "#3a3a5a", cursor: "pointer", fontSize: 13 }}>✕</button>
              )}
            </div>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              <CheckinGroup label="Humor"   options={humores}  valor={humor}   onChange={v => salvarEstado("humor",   v)} />
              <CheckinGroup label="Energia" options={energias} valor={energia} onChange={v => salvarEstado("energia", v)} />
              <CheckinGroup label="Clareza" options={clarezas} valor={clareza} onChange={v => salvarEstado("clareza", v)} />
            </div>
            {interpretacao && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1a1a2e" }}>
                <p style={{ fontSize: 12, color: "#4a4a6a", margin: 0 }}>{interpretacao}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Estado Mental + Padrões */}
      <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "20px 22px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: insights.length > 0 ? 18 : 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: estadoMental.cor + "20", border: `1px solid ${estadoMental.cor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, boxShadow: `0 0 14px ${estadoMental.cor}20` }}>
            {estadoMental.icone}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: estadoMental.cor, marginBottom: 2 }}>{estadoMental.modo}</div>
            <div style={{ fontSize: 12, color: "#4a4a6a" }}>{estadoMental.descricao}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <div style={{ width: 64, height: 4, background: "#1a1a2e", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ width: `${estadoMental.score}%`, height: "100%", borderRadius: 20, background: estadoMental.cor, transition: "width .5s" }} />
            </div>
            <span style={{ fontSize: 10, color: "#3a3a5a" }}>{estadoMental.score}/100</span>
          </div>
        </div>

        {insights.length > 0 && (
          <>
            <div style={{ height: 1, background: "#1a1a2e", marginBottom: 16 }} />
            <div style={{ fontSize: 10, color: "#2a2a45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
              Padrões detectados
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: tipoCor[ins.tipo] || "#7c3aed", flexShrink: 0, marginTop: 8 }} />
                  <div>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 3px", lineHeight: 1.65 }}>{ins.texto}</p>
                    {ins.dados && <span style={{ fontSize: 10, color: "#2a2a45" }}>{ins.dados}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {insights.length === 0 && (
          <p style={{ fontSize: 12, color: "#2a2a45", margin: "14px 0 0", fontStyle: "italic" }}>
            {diasComDados < 5
              ? `Padrões aparecem após 5+ dias de uso.${diasComDados > 0 ? ` Você tem ${diasComDados} dia${diasComDados > 1 ? "s" : ""} registrado${diasComDados > 1 ? "s" : ""}.` : " Continue registrando."}`
              : "Nenhum padrão forte detectado ainda. Continue registrando."}
          </p>
        )}
      </div>

      {/* Tarefa da semana */}
      <div style={{ background: "linear-gradient(135deg, #0c0c22, #0f0d28)", border: "1px solid #1e1a35", borderRadius: 16, padding: "24px 28px", marginBottom: 14, position: "relative", overflow: "hidden", minHeight: 120 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 15% 50%, #7c3aed10, transparent 55%)", pointerEvents: "none" }} />
        <HeroMountain />
        <div style={{ position: "relative", maxWidth: "58%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Tarefa da semana
            </span>
            {tarefaSemana && !semanaEditing && (
              <button onClick={() => { setSemanaEditing(true); setSemanaInput(tarefaSemana) }}
                style={{ background: "none", border: "none", color: "#3a3a5a", cursor: "pointer", fontSize: 13, marginLeft: "auto" }}>✎</button>
            )}
          </div>
          {semanaEditing ? (
            <div>
              <input autoFocus value={semanaInput} onChange={e => setSemanaInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && salvarTarefaSemana()}
                placeholder="Qual é o foco desta semana?"
                style={{ width: "100%", background: "#ffffff08", border: "1px solid #7c3aed30", borderRadius: 10, padding: "10px 14px", color: "#f0eeff", fontSize: 18, fontWeight: 600, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: "#4a4a6a", flexShrink: 0 }}>{progresso}%</span>
                <input type="range" min={0} max={100} value={progresso}
                  onChange={e => setProgresso(Number(e.target.value))} style={{ flex: 1, accentColor: "#7c3aed" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={salvarTarefaSemana} style={{ background: "#7c3aed", border: "none", borderRadius: 9, padding: "8px 20px", color: "#fff", fontSize: 12, cursor: "pointer" }}>Salvar</button>
                <button onClick={() => setSemanaEditing(false)} style={{ background: "none", border: "1px solid #1e1e35", borderRadius: 9, padding: "8px 14px", color: "#4a4a6a", fontSize: 12, cursor: "pointer" }}>Cancelar</button>
              </div>
            </div>
          ) : tarefaSemana ? (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f0eeff", margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-0.3px" }}>
                {tarefaSemana}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, background: "#1a1a2e", borderRadius: 20, height: 5 }}>
                  <div style={{ background: corProgresso, height: 5, borderRadius: 20, width: `${progresso}%`, boxShadow: `0 0 8px ${corProgresso}60`, transition: "width .4s" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: corProgresso, flexShrink: 0 }}>{progresso}%</span>
              </div>
            </div>
          ) : (
            <button onClick={() => setSemanaEditing(true)}
              style={{ background: "none", border: "1px dashed #2a2a4a", borderRadius: 12, padding: "16px 20px", color: "#2a2a45", fontSize: 14, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed30"; e.currentTarget.style.color = "#4a4a6a" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a4a"; e.currentTarget.style.color = "#2a2a45" }}>
              <span style={{ opacity: 0.3 }}>✦</span> Definir foco da semana...
            </button>
          )}
        </div>
      </div>

      {/* Tarefas do dia */}
      <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "20px 22px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#f0eeff" }}>Tarefas do dia</span>
          {tarefasHoje.length > 0 && <span style={{ fontSize: 11, color: "#4a4a6a" }}>{tarefasDone}/{tarefasHoje.length} concluídas</span>}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: tarefasHoje.length > 0 ? 14 : 0 }}>
          <input value={novaTarefa} onChange={e => setNovaTarefa(e.target.value)}
            onKeyDown={e => e.key === "Enter" && adicionarTarefa()}
            placeholder="+ Nova tarefa..."
            style={{ flex: 1, background: "#13132a", border: "1px solid #1e1e35", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
          {novaTarefa.trim() && (
            <button onClick={adicionarTarefa} style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "10px 16px", color: "#fff", fontSize: 13, cursor: "pointer" }}>
              Adicionar
            </button>
          )}
        </div>
        {tarefasHoje.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {tarefasHoje.map((t: any) => (
              <div key={t.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderRadius: 8 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#0f0f1c")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div onClick={() => toggleTarefa(t.id)}
                  style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${t.concluida ? "#7c3aed" : "#2a2a4a"}`, background: t.concluida ? "#7c3aed25" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  {t.concluida && <span style={{ fontSize: 10, color: "#a855f7" }}>✓</span>}
                </div>
                <span onClick={() => toggleTarefa(t.id)}
                  style={{ flex: 1, fontSize: 13, color: t.concluida ? "#3a3a5a" : "#94a3b8", textDecoration: t.concluida ? "line-through" : "none", cursor: "pointer" }}>
                  {t.texto}
                </span>
                <button onClick={() => deletarTarefa(t.id)}
                  style={{ background: "none", border: "none", color: "#2a2a3a", cursor: "pointer", fontSize: 12, padding: "2px 4px", flexShrink: 0, opacity: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "0")}>✕</button>
              </div>
            ))}
          </div>
        )}
        {tarefasHoje.length === 0 && (
          <p style={{ fontSize: 12, color: "#2a2a45", margin: "8px 0 0", fontStyle: "italic" }}>
            Nenhuma tarefa. Adicione acima ou faça o check-in matinal.
          </p>
        )}
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div style={{ background: "#0d0d1c", border: "1px solid #f59e0b20", borderRadius: 16, padding: "18px 22px", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚠</span> Merece atenção
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {alertas.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{a.icone}</span>
                <p style={{ fontSize: 13, color: "#6b6b8a", margin: 0, lineHeight: 1.6 }}>{a.texto}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foco */}
      <div style={{ background: "linear-gradient(135deg, #0c0c22, #0f0c28)", border: "1px solid #1e1a35", borderRadius: 16, padding: "18px 22px", marginBottom: 14, display: "flex", alignItems: "center", gap: 18 }}>
        <ClockMini />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#f0eeff", marginBottom: 4 }}>
            {sessoesHoje.length > 0 ? `${sessoesHoje.length} sessão${sessoesHoje.length > 1 ? "ões" : ""} hoje · ${fmtMin(minFocados)} focados` : "Pronto para uma sessão de foco?"}
          </div>
          <div style={{ fontSize: 12, color: "#4a4a6a" }}>
            {sessoesHoje.length > 0 ? "Continue ou inicie uma nova sessão." : "Entre em modo de concentração profunda."}
          </div>
        </div>
        <button onClick={() => router.push("/foco")}
          style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 16px #7c3aed40", flexShrink: 0 }}>
          Abrir foco ›
        </button>
      </div>

      {/* Projetos ativos */}
      {projetos.length > 0 && (
        <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "20px 22px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#f0eeff" }}>Projetos ativos</span>
            <button onClick={() => router.push("/projetos")} style={{ background: "none", border: "none", color: "#7c3aed", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver todos</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {projetos.map((p: any) => {
              const cor  = p.cor || "#7c3aed"
              const ref  = p.ultimaAtividade || p.criadoEm
              const dias = ref ? Math.floor((Date.now() - new Date(ref + "T12:00:00").getTime()) / 86400000) : null
              const ult  = dias === null ? "—" : dias === 0 ? "hoje" : dias === 1 ? "ontem" : `há ${dias} dias`
              return (
                <div key={p.id} onClick={() => router.push(`/projetos/${p.id}`)}
                  style={{ cursor: "pointer", padding: "12px 14px", background: "#0a0a14", borderRadius: 12, border: "1px solid #1a1a2e" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = cor + "40")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a1a2e")}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: "#e2e8f0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</span>
                    <span style={{ fontSize: 12, color: cor, fontWeight: 700, flexShrink: 0 }}>{p.progresso || 0}%</span>
                  </div>
                  <div style={{ background: "#1a1a2e", borderRadius: 20, height: 3, marginBottom: 8 }}>
                    <div style={{ background: cor, height: 3, borderRadius: 20, width: `${p.progresso || 0}%` }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#3a3a5a" }}>
                    Última atividade: <span style={{ color: dias !== null && dias >= 7 ? "#f59e0b" : "#4a4a6a" }}>{ult}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Hábitos rápidos */}
      {habitos.length > 0 && (
        <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "20px 22px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#f0eeff" }}>Hábitos de hoje</span>
            <button onClick={() => router.push("/habitos")} style={{ background: "none", border: "none", color: "#7c3aed", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver todos</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {habitos.slice(0, 8).map((h: any) => {
              const feito  = (h.historico || []).includes(hoje)
              const streak = calcStreak(h.historico || [])
              return (
                <button key={h.id} onClick={() => toggleHabito(h.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 22, border: `1px solid ${feito ? "#7c3aed50" : "#1e1e35"}`, background: feito ? "#7c3aed18" : "#13132a", cursor: "pointer", transition: "all .15s" }}>
                  <span style={{ fontSize: 16 }}>{h.icone}</span>
                  <span style={{ fontSize: 12, color: feito ? "#a855f7" : "#6b6b8a", textDecoration: feito ? "line-through" : "none" }}>{h.nome}</span>
                  {streak > 1 && <span style={{ fontSize: 11, color: "#f59e0b" }}>🔥{streak}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Brain dump */}
      <div style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#f0eeff" }}>Brain dump</span>
          <span style={{ fontSize: 11, color: "#3a3a5a", fontStyle: "italic" }}>— capture, processe depois</span>
          {brainPendente.length > 0 && (
            <span style={{ marginLeft: "auto", background: "#6366f120", border: "1px solid #6366f130", borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "#818cf8" }}>
              {brainPendente.length} para processar
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: brainPendente.length > 0 ? 14 : 0 }}>
          <input value={novaBrain} onChange={e => setNovaBrain(e.target.value)}
            onKeyDown={e => e.key === "Enter" && adicionarBrain()}
            placeholder="O que está na sua cabeça?"
            style={{ flex: 1, background: "#13132a", border: "1px solid #1e1e35", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
          {novaBrain.trim() && (
            <button onClick={adicionarBrain} style={{ background: "#6366f1", border: "none", borderRadius: 10, padding: "10px 16px", color: "#fff", fontSize: 13, cursor: "pointer" }}>
              Capturar
            </button>
          )}
        </div>
        {brainPendente.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {brainPendente.slice(0, 6).map(b => (
              <div key={b.id} style={{ borderRadius: 10, overflow: "hidden" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#0a0a14", border: "1px solid #1a1a2e", borderRadius: processando === b.id ? "10px 10px 0 0" : 10, cursor: "pointer" }}
                  onClick={() => setProcessando(processando === b.id ? null : b.id)}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: "#94a3b8" }}>{b.texto}</span>
                  <span style={{ fontSize: 10, color: "#2a2a45", flexShrink: 0 }}>{diasAtras(b.data)}</span>
                  <span style={{ fontSize: 10, color: "#3a3a5a" }}>{processando === b.id ? "▲" : "▾"}</span>
                </div>
                {processando === b.id && (
                  <div style={{ display: "flex", background: "#0f0f1c", border: "1px solid #1a1a2e", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                    {[
                      { label: "→ Tarefa",  acao: "tarefa",    cor: "#10b981" },
                      { label: "→ Projeto", acao: "projeto",   cor: "#7c3aed" },
                      { label: "Arquivar",  acao: "arquivado", cor: "#6b6b8a" },
                    ].map(op => (
                      <button key={op.acao} onClick={() => processarBrain(b.id, op.acao as any)}
                        style={{ flex: 1, background: "none", border: "none", borderRight: "1px solid #1a1a2e", padding: "9px 0", color: op.cor, fontSize: 12, cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = op.cor + "12")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        {op.label}
                      </button>
                    ))}
                    <button onClick={() => deletarBrain(b.id)}
                      style={{ flex: 0.6, background: "none", border: "none", padding: "9px 0", color: "#f43f5e", fontSize: 12, cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f43f5e12")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      Apagar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}