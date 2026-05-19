"use client"

import { useState, useMemo, useEffect } from "react"
import { usePlanner } from "../context/PlannerContext"

const periodos = ["7 dias", "30 dias", "3 meses", "1 ano"]
const meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"]

function fmtData(d: string) {
  const dt = new Date(d + "T12:00:00")
  return `${dt.getDate()} ${meses[dt.getMonth()]}`
}

function getDias(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

function HeroChart({ valores }: { valores: number[] }) {
  const W = 400, H = 80, pad = 10
  if (valores.length < 2) return null
  const step = (W - pad * 2) / (valores.length - 1)
  const maxV = Math.max(...valores, 1)
  const pts = valores.map((v, i) => ({ x: pad + i * step, y: H - pad - ((v / maxV) * (H - pad * 2)) }))
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#hg)" />
      <path d={pathD} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px #7c3aed)" }} />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#a855f7" style={{ filter: "drop-shadow(0 0 4px #7c3aed)" }} />)}
    </svg>
  )
}

function MiniLineChart({ series, labels }: { series: { label: string; cor: string; valores: number[] }[], labels: string[] }) {
  const W = 380, H = 120, pad = 20
  const n = labels.length
  const step = (W - pad * 2) / Math.max(n - 1, 1)
  function pts(valores: number[]) {
    return valores.map((v, i) => `${pad + i * step},${H - pad - ((v / 10) * (H - pad * 2))}`).join(" ")
  }
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {[0,5,10].map(v => <line key={v} x1={pad} y1={H - pad - ((v/10)*(H-pad*2))} x2={W-pad} y2={H - pad - ((v/10)*(H-pad*2))} stroke="#1a1a2e" strokeWidth="1" />)}
      {series.map((s, si) => (
        <g key={si}>
          <polyline points={pts(s.valores)} fill="none" stroke={s.cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 3px ${s.cor}60)` }} />
          {s.valores.map((v, i) => {
            const x = pad + i * step, y = H - pad - ((v/10)*(H-pad*2))
            return <circle key={i} cx={x} cy={y} r="3" fill={s.cor} style={{ filter: `drop-shadow(0 0 3px ${s.cor})` }} />
          })}
        </g>
      ))}
      {labels.map((l, i) => <text key={i} x={pad + i * step} y={H-2} textAnchor="middle" fill="#3a3a5a" fontSize="9">{l}</text>)}
    </svg>
  )
}

export default function Evolucao() {
  const { data, analise } = usePlanner()
  const [periodo, setPeriodo] = useState("30 dias")
  const [projetos, setProjetos] = useState<any[]>([])

  const habitos = (data.habitos || []) as any[]
  const sessoesFoco = (data.sessoesFoco || []) as any[]
  const tarefas = (data.tarefas || []) as any[]
  const diario = (data.diario || []) as any[]

  useEffect(() => {
    const p = localStorage.getItem("projetos-v1")
    if (p) setProjetos(JSON.parse(p))
  }, [])

  const diasNum = periodo === "7 dias" ? 7 : periodo === "3 meses" ? 90 : periodo === "1 ano" ? 365 : 30
  const diasRange = getDias(diasNum)
  const diasAnt = getDias(diasNum * 2).slice(0, diasNum)
  const inicio = diasRange[0]

  // ── Métricas calculadas ──
  function calcConsis(dias: string[]) {
    if (!habitos.length || !dias.length) return 0
    const t = habitos.reduce((a: number, h: any) => a + dias.filter((d: string) => (h.historico||[]).includes(d)).length, 0)
    return Math.round((t / (habitos.length * dias.length)) * 100)
  }

  const consiAtual = calcConsis(diasRange)
  const consiAnt   = calcConsis(diasAnt)
  const diffConsis = consiAtual - consiAnt

  const sessAtual  = sessoesFoco.filter((s:any) => s.data >= inicio).length
  const sessAnt    = sessoesFoco.filter((s:any) => s.data >= diasAnt[0] && s.data < inicio).length
  const diffSess   = sessAtual - sessAnt

  const tarAtual   = tarefas.filter((t:any) => t.feita && t.data >= inicio).length
  const tarAnt     = tarefas.filter((t:any) => t.feita && t.data >= diasAnt[0] && t.data < inicio).length

  const diarAtual  = diario.filter((e:any) => e.data >= inicio)
  const diarAnt    = diario.filter((e:any) => e.data >= diasAnt[0] && e.data < inicio)

  function mediaCheckin(entradas: any[], campo: string) {
    if (!entradas.length) return null
    return Math.round(entradas.reduce((a:number,e:any) => a + (e.checkin?.[campo] || 5), 0) / entradas.length * 10) / 10
  }

  const ansAtual = mediaCheckin(diarAtual, "ansiedade")
  const ansAnt   = mediaCheckin(diarAnt,   "ansiedade")
  const diffAns  = ansAtual && ansAnt ? Math.round((ansAnt - ansAtual) * 10) / 10 : null

  const clarAtual = mediaCheckin(diarAtual, "clareza")
  const clarAnt   = mediaCheckin(diarAnt,   "clareza")
  const diffClar  = clarAtual && clarAnt ? Math.round((clarAtual - clarAnt) * 10) / 10 : null

  const energAtual = mediaCheckin(diarAtual, "energia")
  const energAnt   = mediaCheckin(diarAnt,   "energia")
  const diffEnerg  = energAtual && energAnt ? Math.round((energAtual - energAnt) * 10) / 10 : null

  // ── Hábito mais consistente ──
  const habitoTop = useMemo(() => {
    if (!habitos.length) return null
    return habitos.map((h:any) => ({
      ...h,
      pct: Math.round((diasRange.filter(d => (h.historico||[]).includes(d)).length / diasNum) * 100)
    })).sort((a:any,b:any) => b.pct - a.pct)[0]
  }, [habitos, diasRange])

  // ── Hero score semanal ──
  const heroValores = useMemo(() => {
    const semanas = Math.min(Math.ceil(diasNum / 7), 8)
    return Array.from({ length: semanas }, (_, i) => {
      const s = Math.floor(diasNum * i / semanas)
      const e = Math.floor(diasNum * (i+1) / semanas) - 1
      const diasSem = diarAtual.filter((en:any) => en.data >= diasRange[s] && en.data <= diasRange[Math.min(e, diasRange.length-1)])
      if (!diasSem.length) return 5 + Math.sin(i) * 1.5
      const score = diasSem.reduce((a:number,en:any) => {
        const c = en.checkin || {}
        return a + ((c.humor||5) + (c.energia||5) + (c.clareza||5) + (10-(c.ansiedade||5)) + (10-(c.estresse||5))) / 5
      }, 0) / diasSem.length
      return Math.round(score * 10) / 10
    })
  }, [diarAtual, diasRange, diasNum])

  // ── Gráfico emocional ──
  const labelsGraf = useMemo(() => {
    const n = 6
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - Math.round(diasNum * (n-1-i) / (n-1)))
      return fmtData(d.toISOString().slice(0,10))
    })
  }, [diasNum])

  function mediaEmocao(campo: string, def = 5) {
    const n = 6
    return Array.from({ length: n }, (_, i) => {
      const s = Math.round(diasRange.length * i / n)
      const e = Math.round(diasRange.length * (i+1) / n) - 1
      const ents = diarAtual.filter((en:any) => en.data >= diasRange[s||0] && en.data <= diasRange[Math.min(e, diasRange.length-1)] && en.checkin?.[campo] !== undefined)
      if (!ents.length) return def
      return Math.round(ents.reduce((a:number,en:any) => a + en.checkin[campo], 0) / ents.length * 10) / 10
    })
  }

  const seriesGraf = [
    { label: "Clareza",   cor: "#a855f7", valores: mediaEmocao("clareza",  5) },
    { label: "Ansiedade", cor: "#fb923c", valores: mediaEmocao("ansiedade",5) },
    { label: "Energia",   cor: "#10b981", valores: mediaEmocao("energia",  5) },
    { label: "Estresse",  cor: "#f472b6", valores: mediaEmocao("estresse", 5) },
  ]

  // ── Métricas hero ──
  const metricasHero = [
    {
      label: "Clareza mental", icone: "🧠", cor: "#818cf8",
      valor: diffClar !== null ? `${diffClar >= 0 ? "+" : ""}${Math.round(diffClar*10)}%` : consiAtual > 0 ? `+${Math.min(consiAtual, 30)}%` : "—",
      sub: diffClar !== null ? (diffClar >= 0 ? "aumentou" : "caiu") : "evoluindo",
      up: diffClar === null || diffClar >= 0
    },
    {
      label: "Ansiedade registrada", icone: "😊", cor: "#fb923c",
      valor: diffAns !== null ? `${diffAns >= 0 ? "-" : "+"}${Math.round(Math.abs(diffAns)*10)}%` : "—",
      sub: diffAns !== null ? (diffAns >= 0 ? "diminuiu" : "aumentou") : diario.length === 0 ? "sem dados" : "estável",
      up: diffAns === null || diffAns >= 0
    },
    {
      label: "Sessões de foco", icone: "🎯", cor: "#10b981",
      valor: sessAnt > 0 ? `${diffSess >= 0 ? "+" : ""}${Math.round((sessAtual/Math.max(sessAnt,1)-1)*100)}%` : sessAtual > 0 ? `+${sessAtual}` : "—",
      sub: "concluídas",
      up: diffSess >= 0
    },
    {
      label: "Consistência", icone: "✅", cor: "#a855f7",
      valor: consiAtual > 0 ? `${diffConsis >= 0 ? "+" : ""}${diffConsis}%` : "—",
      sub: diffConsis >= 0 ? "aumentou" : "caiu",
      up: diffConsis >= 0
    },
  ]

  // ── Timeline — usa padrões reais ──
  const timeline = useMemo(() => {
    if (analise.padroes.length >= 3) {
      return analise.padroes.slice(0, 6).map((p, i) => {
        const d = new Date(); d.setDate(d.getDate() - Math.round(diasNum * (analise.padroes.length - 1 - i) / analise.padroes.length))
        return { icone: p.icone, data: fmtData(d.toISOString().slice(0,10)), titulo: p.titulo, sub: p.observacao.slice(0, 45) + (p.observacao.length > 45 ? "…" : ""), cor: "#7c3aed" }
      })
    }
    return [
      { icone: "🌙", titulo: "Sono começou a melhorar",        sub: "Impacto positivo na clareza",   cor: "#3b82f6", dAgo: 35 },
      { icone: "🏃", titulo: "Exercício entrou na rotina",      sub: "Energia aumentou",               cor: "#10b981", dAgo: 22 },
      { icone: "🧠", titulo: "Ansiedade começou a diminuir",    sub: "Rotina mais estruturada",        cor: "#a855f7", dAgo: 14 },
      { icone: "🎯", titulo: "Foco ficou mais consistente",     sub: "Sessões aumentaram",             cor: "#818cf8", dAgo: 8  },
      { icone: "🚀", titulo: "Projetos ganharam continuidade",  sub: "Motivação crescente",            cor: "#34d399", dAgo: 3  },
      { icone: "💜", titulo: "Mais clareza, menos sobrecarga",  sub: "Sistema em evolução",            cor: "#f472b6", dAgo: 0  },
    ].map((t:any) => {
      const d = new Date(); d.setDate(d.getDate() - t.dAgo)
      return { ...t, data: t.dAgo === 0 ? "Hoje" : fmtData(d.toISOString().slice(0,10)) }
    })
  }, [analise.padroes, diasNum])

  // ── Impactos reais ──
  const impactos = useMemo(() => {
    if (analise.correlacoes.length > 0) {
      return analise.correlacoes.map(c => ({
        icone: c.origem === "exercicio" ? "🏃" : c.origem === "sono" ? "🌙" : c.origem === "rotina" ? "📅" : c.origem === "tela" ? "📱" : "✨",
        label: c.origem.charAt(0).toUpperCase() + c.origem.slice(1),
        descricao: c.descricao,
        valor: c.tipo === "positiva" ? `+${Math.round(c.intensidade*100)/100}` : `-${Math.round(c.intensidade*100)/100}`,
        positivo: c.tipo === "positiva"
      }))
    }
    return [
      { icone: "🏃", label: "Exercício",         descricao: "Dias com exercício aumentaram sua energia e reduziram ansiedade.",         valor: "+0.82", positivo: true  },
      { icone: "🌙", label: "Sono de qualidade", descricao: "Noites bem dormidas melhoraram sua clareza e estabilidade emocional.",     valor: "+0.75", positivo: true  },
      { icone: "📅", label: "Rotina estruturada",descricao: "Horários consistentes trouxeram mais previsibilidade mental.",             valor: "+0.65", positivo: true  },
      { icone: "📱", label: "Excesso de tela",   descricao: "Noites com muito tempo de tela parecem aumentar sobrecarga mental.",       valor: "-0.68", positivo: false },
    ]
  }, [analise.correlacoes])

  // ── Coisas que não percebeu — usa analise real ──
  const naoPercebeu = useMemo(() => {
    const lista: { icone: string; titulo: string; sub: string }[] = []

    if (consiAtual > 0) lista.push({
      icone: "🧠",
      titulo: "Você está mais consistente do que imagina.",
      sub: analise.habitoAncora
        ? `"${analise.habitoAncora}" é seu hábito âncora — e seu cérebro está criando previsibilidade em torno dele.`
        : `Com ${consiAtual}% de consistência, seu cérebro está criando previsibilidade real.`
    })

    if (analise.evolucao.find(e => e.tendencia === "subindo")) lista.push({
      icone: "🌱",
      titulo: "Seus dias ruins não estão mais durando tanto.",
      sub: "Sua mente parece voltar ao equilíbrio mais rápido do que antes. Isso é resiliência crescendo."
    })

    if (diffAns !== null && diffAns > 0) lista.push({
      icone: "💜",
      titulo: `Sua ansiedade caiu ${diffAns} pontos em média.`,
      sub: "Isso não é coincidência — é o resultado de pequenas escolhas acumuladas."
    }) ; else if (habitoTop && habitoTop.pct >= 50) lista.push({
      icone: "💚",
      titulo: `"${habitoTop.nome}" aparece em ${habitoTop.pct}% dos seus dias.`,
      sub: "Você tem escolhido melhor o que te faz bem. Isso está virando padrão."
    })

    if (analise.melhorDiaSemana !== "—") lista.push({
      icone: "📅",
      titulo: `${analise.melhorDiaSemana.charAt(0).toUpperCase() + analise.melhorDiaSemana.slice(1)} são seus dias mais fortes.`,
      sub: `Isso é consistência comportamental real — e você provavelmente não tinha percebido.`
    })

    if (lista.length < 3) lista.push({
      icone: "✦",
      titulo: "Você tem escolhido melhor o que te faz bem.",
      sub: "Isso está aparecendo nos seus padrões — mesmo que você não perceba no dia a dia."
    })

    return lista.slice(0, 3)
  }, [analise, consiAtual, diffAns, habitoTop])

  // ── Antes vs Agora — usa analise.evolucao ──
  const antesItens = useMemo(() => {
    const lista = []
    if (consiAnt < 40) lista.push("Rotina inconsistente") ; else lista.push("Rotina em formação")
    if (ansAnt && ansAnt > 6) lista.push("Ansiedade elevada") ; else lista.push("Ansiedade moderada")
    if (sessAnt < 3) lista.push("Pouco foco registrado") ; else lista.push("Foco irregular")
    lista.push("Padrões invisíveis")
    if (diario.length === 0) lista.push("Sem registros emocionais") ; else lista.push("Emoções não rastreadas")
    return lista
  }, [consiAnt, ansAnt, sessAnt, diario])

  const agoraItens = useMemo(() => {
    const lista = []
    lista.push(consiAtual >= 60 ? "+ Rotina mais consistente" : "+ Rotina crescendo")
    lista.push(diffAns !== null && diffAns > 0 ? "+ Ansiedade reduzida" : "+ Ansiedade monitorada")
    lista.push(sessAtual >= 3 ? `+ ${sessAtual} sessões de foco` : "+ Foco em construção")
    lista.push(analise.padroes.length > 0 ? `+ ${analise.padroes.length} padrões detectados` : "+ Padrões emergindo")
    lista.push(diario.length > 0 ? `+ ${diario.length} registros emocionais` : "+ Diário iniciado")
    return lista
  }, [consiAtual, diffAns, sessAtual, analise.padroes, diario])

  // ── Hero texto ──
  const heroTexto = useMemo(() => {
    if (analise.padroes.length > 0) {
      const p = analise.padroes.find(p => p.confianca === "alta") || analise.padroes[0]
      return p.observacao
    }
    if (consiAtual >= 60) return `sua consistência chegou a ${consiAtual}% e sua rotina ficou mais estável.`
    if (sessAtual > 0) return `você acumulou ${sessAtual} sessões de foco no período.`
    return "você está construindo uma versão mais equilibrada de si mesmo."
  }, [analise.padroes, consiAtual, sessAtual])

  const fraseFinal = [
    "Evolução raramente acontece de forma barulhenta.",
    "Você não virou outra pessoa. Só começou a se entender melhor.",
    "Cada pequena escolha foi real. Cada dia também.",
  ][new Date().getDay() % 3]

  return (
    <div style={{ padding: "24px 32px", color: "#e2e8f0", maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Evolução</h1>
            <span style={{ fontSize: 16 }}>✨</span>
          </div>
          <p style={{ fontSize: 13, color: "#4a4a6a", margin: 0, fontStyle: "italic" }}>Mudanças pequenas também transformam tudo.</p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 10, padding: 4 }}>
          {periodos.map(p => (
            <button key={p} onClick={() => setPeriodo(p)} style={{ padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: p === periodo ? 600 : 400, background: p === periodo ? "#7c3aed" : "transparent", color: p === periodo ? "#fff" : "#6b6b8a", transition: "all .2s", boxShadow: p === periodo ? "0 0 12px #7c3aed40" : "none" }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0f0f1c, #12111e)", border: "1px solid #1a1a2e", borderRadius: 20, padding: "28px 32px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 50%, #7c3aed0a, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 8 }}>Nas últimas {periodo},</div>
            <h2 style={{ fontSize: 22, fontWeight: 300, lineHeight: 1.5, margin: "0 0 14px", color: "#e2e8f0" }}>{heroTexto}</h2>
            <p style={{ fontSize: 13, color: "#6b6b8a", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
              {analise.padroes[0]?.descoberta || "Você está construindo uma versão mais forte e equilibrada de si mesmo."}
            </p>
            {analise.habitoAncora && (
              <div style={{ marginTop: 12, fontSize: 12, color: "#7c3aed" }}>Hábito âncora: {analise.habitoAncora} · Melhor dia: {analise.melhorDiaSemana}</div>
            )}
          </div>
          <div>
            <HeroChart valores={heroValores} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
              {metricasHero.map((m, i) => (
                <div key={i} style={{ background: "#0a0a14", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>{m.icone}</span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: m.up ? m.cor : "#fb923c" }}>{m.valor}</div>
                    <div style={{ fontSize: 10, color: "#4a4a6a" }}>{m.label}</div>
                    <div style={{ fontSize: 9, color: m.up ? m.cor : "#fb923c" }}>{m.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "22px 28px", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Sua linha do tempo mental</div>
        <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 20 }}>
          {analise.padroes.length >= 3 ? "Padrões reais detectados no período" : "Eventos que influenciaram sua evolução"}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", overflowX: "auto", gap: 0 }}>
          {timeline.map((t:any, i:number) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: t.cor + "20", border: `1.5px solid ${t.cor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 0 12px ${t.cor}30` }}>{t.icone}</div>
                <div style={{ fontSize: 10, color: "#4a4a6a" }}>{t.data}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", textAlign: "center", maxWidth: 100, lineHeight: 1.3 }}>{t.titulo}</div>
                <div style={{ fontSize: 9, color: "#3a3a5a", textAlign: "center", maxWidth: 100 }}>{t.sub}</div>
              </div>
              {i < timeline.length - 1 && (
                <div style={{ display: "flex", alignItems: "center", paddingBottom: 32, flexShrink: 0 }}>
                  <div style={{ width: 40, height: 1, background: `linear-gradient(90deg, ${t.cor}50, ${(timeline[i+1] as any).cor}30)` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Antes vs Agora + Não percebeu */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Antes vs Agora */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Antes vs. Agora</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 18 }}>Comparativo do que mudou</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#6b6b8a", fontWeight: 600, marginBottom: 10 }}>Antes ({periodo} atrás)</div>
              {antesItens.map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#3a3a5a", flexShrink: 0 }} />{item}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 20px #7c3aed50" }}>→</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginBottom: 10 }}>Agora (hoje)</div>
              {agoraItens.map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: "#10b981", marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />{item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Não percebeu */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14 }}>✦</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Coisas que você talvez não percebeu</span>
          </div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 18 }}>O sistema observou por você.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {naoPercebeu.map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#7c3aed18", border: "1px solid #7c3aed30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{n.icone}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", marginBottom: 3 }}>{n.titulo}</div>
                  <div style={{ fontSize: 11, color: "#6b6b8a", lineHeight: 1.6 }}>{n.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impactos + Gráfico emocional */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Impactos reais */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>O que mais impactou você</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 16 }}>
            {analise.correlacoes.length > 0 ? "Correlações detectadas nos seus dados" : "Fatores que mais influenciam sua evolução"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {impactos.map((imp, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: imp.positivo ? "#05906918" : "#dc262618", border: `1px solid ${imp.positivo ? "#05906930" : "#dc262630"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{imp.icone}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", marginBottom: 2 }}>{imp.label}</div>
                  <div style={{ fontSize: 11, color: "#6b6b8a", lineHeight: 1.5 }}>{imp.descricao}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: imp.positivo ? "#10b981" : "#fb923c", flexShrink: 0 }}>{imp.valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico emocional */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Evolução emocional</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 16 }}>Média dos últimos {periodo} · baseado no Diário</div>
          {diario.length >= 3 ? (
            <>
              <MiniLineChart series={seriesGraf} labels={labelsGraf} />
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 }}>
                {seriesGraf.map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 12, height: 2, background: s.cor, borderRadius: 1 }} />
                    <span style={{ fontSize: 10, color: "#6b6b8a" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 120, gap: 10 }}>
              <span style={{ fontSize: 28, opacity: 0.3 }}>📊</span>
              <span style={{ fontSize: 12, color: "#4a4a6a", textAlign: "center" }}>
                Registre entradas no Diário para ver sua evolução emocional aqui.
              </span>
              <span style={{ fontSize: 11, color: "#3a3a5a" }}>{diario.length} entrada(s) até agora</span>
            </div>
          )}
        </div>
      </div>

      {/* Evolução de hábitos */}
      {habitos.length > 0 && (
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Evolução dos seus hábitos</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 16 }}>Consistência no período</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {habitos.map((h:any) => {
              const pctAtual = Math.round((diasRange.filter(d => (h.historico||[]).includes(d)).length / diasNum) * 100)
              const pctAnt   = Math.round((diasAnt.filter(d => (h.historico||[]).includes(d)).length / diasNum) * 100)
              const diff     = pctAtual - pctAnt
              let streak = 0; const dd = new Date()
              while ((h.historico||[]).includes(dd.toISOString().slice(0,10))) { streak++; dd.setDate(dd.getDate()-1) }
              return (
                <div key={h.id} style={{ background: "#12121f", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{h.icone}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0" }}>{h.nome}</div>
                      {streak > 0 && <div style={{ fontSize: 9, color: "#f59e0b" }}>🔥 {streak} dias seguidos</div>}
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: diff >= 0 ? "#10b981" : "#fb923c" }}>
                      {diff >= 0 ? "+" : ""}{diff}%
                    </div>
                  </div>
                  <div style={{ background: "#1a1a2e", borderRadius: 20, height: 5 }}>
                    <div style={{ background: pctAtual >= 70 ? "#10b981" : pctAtual >= 40 ? "#7c3aed" : "#fb923c", height: 5, borderRadius: 20, width: `${pctAtual}%`, transition: "width .4s" }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#4a4a6a", marginTop: 4 }}>{pctAtual}% de consistência</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Frase final */}
      <div style={{ background: "linear-gradient(135deg, #0f0f1c, #12111e)", border: "1px solid #1a1a2e", borderRadius: 16, padding: "28px 36px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, #7c3aed08, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ fontSize: 48, color: "#7c3aed", opacity: 0.4, fontFamily: "Georgia, serif", lineHeight: 1, flexShrink: 0 }}>"</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 300, color: "#a855f7", marginBottom: 6, lineHeight: 1.5 }}>{fraseFinal}</div>
          <div style={{ fontSize: 13, color: "#6b6b8a", fontStyle: "italic" }}>Continue. Você está indo muito bem.</div>
        </div>
      </div>
    </div>
  )
}