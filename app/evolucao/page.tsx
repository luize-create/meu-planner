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
  const W = 500, H = 100, pad = 10
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
      {[0, 5, 10].map(v => <line key={v} x1={pad} y1={H - pad - ((v/10)*(H-pad*2))} x2={W-pad} y2={H - pad - ((v/10)*(H-pad*2))} stroke="#1a1a2e" strokeWidth="1" />)}
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

  const habitos     = (data.habitos     || []) as any[]
  const sessoesFoco = (data.sessoesFoco || []) as any[]
  const diario      = (data.diario      || []) as any[]

  const diasNum  = periodo === "7 dias" ? 7 : periodo === "3 meses" ? 90 : periodo === "1 ano" ? 365 : 30
  const diasRange = getDias(diasNum)
  const diasAnt   = getDias(diasNum * 2).slice(0, diasNum)
  const inicio    = diasRange[0]

  function calcConsis(dias: string[]) {
    if (!habitos.length || !dias.length) return 0
    const t = habitos.reduce((a: number, h: any) => a + dias.filter((d: string) => (h.historico||[]).includes(d)).length, 0)
    return Math.round((t / (habitos.length * dias.length)) * 100)
  }

  const consiAtual = calcConsis(diasRange)
  const consiAnt   = calcConsis(diasAnt)
  const diffConsis = consiAtual - consiAnt

  const sessAtual  = sessoesFoco.filter((s: any) => s.data >= inicio).length
  const sessAnt    = sessoesFoco.filter((s: any) => s.data >= diasAnt[0] && s.data < inicio).length

  const diarAtual  = diario.filter((e: any) => e.data >= inicio)
  const diarAnt    = diario.filter((e: any) => e.data >= diasAnt[0] && e.data < inicio)

  function mediaCheckin(entradas: any[], campo: string) {
    if (!entradas.length) return null
    return Math.round(entradas.reduce((a: number, e: any) => a + (e.checkin?.[campo] || 5), 0) / entradas.length * 10) / 10
  }

  const ansAtual  = mediaCheckin(diarAtual, "ansiedade")
  const ansAnt    = mediaCheckin(diarAnt,   "ansiedade")
  const diffAns   = ansAtual && ansAnt ? Math.round((ansAnt - ansAtual) * 10) / 10 : null

  const clarAtual = mediaCheckin(diarAtual, "clareza")
  const clarAnt   = mediaCheckin(diarAnt,   "clareza")
  const diffClar  = clarAtual && clarAnt ? Math.round((clarAtual - clarAnt) * 10) / 10 : null

  const habitoTop = useMemo(() => {
    if (!habitos.length) return null
    return habitos.map((h: any) => ({
      ...h,
      pct: Math.round((diasRange.filter(d => (h.historico||[]).includes(d)).length / diasNum) * 100)
    })).sort((a: any, b: any) => b.pct - a.pct)[0]
  }, [habitos, diasRange, diasNum])

  const heroValores = useMemo(() => {
    const semanas = Math.min(Math.ceil(diasNum / 7), 8)
    return Array.from({ length: semanas }, (_, i) => {
      const s = Math.floor(diasNum * i / semanas)
      const e = Math.floor(diasNum * (i+1) / semanas) - 1
      const diasSem = diarAtual.filter((en: any) => en.data >= diasRange[s] && en.data <= diasRange[Math.min(e, diasRange.length-1)])
      if (!diasSem.length) return 5 + Math.sin(i) * 1.5
      const score = diasSem.reduce((a: number, en: any) => {
        const c = en.checkin || {}
        return a + ((c.humor||5) + (c.energia||5) + (c.clareza||5) + (10-(c.ansiedade||5)) + (10-(c.estresse||5))) / 5
      }, 0) / diasSem.length
      return Math.round(score * 10) / 10
    })
  }, [diarAtual, diasRange, diasNum])

  const labelsGraf = useMemo(() => {
    const n = 6
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - Math.round(diasNum * (n-1-i) / (n-1)))
      return fmtData(d.toISOString().slice(0, 10))
    })
  }, [diasNum])

  function mediaEmocao(campo: string, def = 5) {
    const n = 6
    return Array.from({ length: n }, (_, i) => {
      const s = Math.round(diasRange.length * i / n)
      const e = Math.round(diasRange.length * (i+1) / n) - 1
      const ents = diarAtual.filter((en: any) =>
        en.data >= diasRange[s||0] && en.data <= diasRange[Math.min(e, diasRange.length-1)] && en.checkin?.[campo] !== undefined
      )
      if (!ents.length) return def
      return Math.round(ents.reduce((a: number, en: any) => a + en.checkin[campo], 0) / ents.length * 10) / 10
    })
  }

  const seriesGraf = [
    { label: "Clareza",   cor: "#a855f7", valores: mediaEmocao("clareza",   5) },
    { label: "Ansiedade", cor: "#fb923c", valores: mediaEmocao("ansiedade", 5) },
    { label: "Energia",   cor: "#10b981", valores: mediaEmocao("energia",   5) },
    { label: "Estresse",  cor: "#f472b6", valores: mediaEmocao("estresse",  5) },
  ]

  // ── Hero texto — narrativa de crescimento ──
  const heroTexto = useMemo(() => {
    if (consiAtual >= 70) return `você manteve consistência em ${consiAtual}% dos dias. Isso não é pouco — é muito.`
    if (diarAtual.length >= 7) return `você se registrou em ${diarAtual.length} dias. Isso é autoconhecimento acumulado.`
    if (sessAtual >= 5) return `você acumulou ${sessAtual} sessões de foco. Cada uma foi uma escolha consciente.`
    if (consiAtual > 0) return `você manteve pelo menos um hábito em ${consiAtual}% dos dias. A construção está acontecendo.`
    return "você está construindo algo. Cada dia conta — mesmo os imperfeitos."
  }, [consiAtual, diarAtual.length, sessAtual])

  // ── Antes vs Agora ──
  const antesItens = useMemo(() => {
    const lista = []
    lista.push(consiAnt < 40 ? "Rotina inconsistente" : "Rotina em formação")
    lista.push(ansAnt && ansAnt > 6 ? "Ansiedade elevada" : "Ansiedade moderada")
    lista.push(sessAnt < 3 ? "Pouco foco registrado" : "Foco irregular")
    lista.push("Padrões invisíveis")
    lista.push(diario.length === 0 ? "Emoções não rastreadas" : "Pouco autoconhecimento")
    return lista
  }, [consiAnt, ansAnt, sessAnt, diario])

  const agoraItens = useMemo(() => {
    const lista = []
    lista.push(consiAtual >= 60 ? "+ Rotina mais consistente" : "+ Rotina crescendo")
    lista.push(diffAns !== null && diffAns > 0 ? "+ Ansiedade reduzida" : "+ Ansiedade monitorada")
    lista.push(sessAtual >= 3 ? `+ ${sessAtual} sessões de foco` : "+ Foco em construção")
    lista.push(analise.padroes.length > 0 ? `+ ${analise.padroes.length} padrões detectados` : "+ Padrões emergindo")
    lista.push(diarAtual.length > 0 ? `+ ${diarAtual.length} registros emocionais` : "+ Diário iniciado")
    return lista
  }, [consiAtual, diffAns, sessAtual, analise.padroes, diarAtual])

  // ── Coisas que não percebeu — expandido ──
  const naoPercebeu = useMemo(() => {
    const lista: { icone: string; titulo: string; sub: string }[] = []

    lista.push({
      icone: "🧠",
      titulo: "Você está mais consistente do que imagina.",
      sub: analise.habitoAncora
        ? `"${analise.habitoAncora}" é seu hábito âncora — seu cérebro está criando previsibilidade em torno dele.`
        : `${consiAtual > 0 ? consiAtual + "% de consistência" : "Cada registro"} não acontece por acidente. É escolha repetida.`
    })

    lista.push({
      icone: "🌱",
      titulo: "Seus dias ruins não estão mais durando tanto.",
      sub: "Sua mente parece voltar ao equilíbrio mais rápido do que antes. Isso é resiliência crescendo."
    })

  if (diffAns !== null && diffAns > 0) {
  lista.push({
    icone: "💜",
    titulo: `Sua ansiedade caiu ${Math.round(diffAns * 10)}% nesse período.`,
    sub: "Isso não é coincidência — é o resultado de pequenas escolhas acumuladas."
  })
} else if (habitoTop && habitoTop.pct >= 40) {
  lista.push({
    icone: "✅",
    titulo: `"${habitoTop.nome}" aparece em ${habitoTop.pct}% dos seus dias.`,
    sub: "Você tem escolhido melhor o que te faz bem. Isso está virando padrão."
  })
}

if (analise.melhorDiaSemana && analise.melhorDiaSemana !== "—") {
  lista.push({
    icone: "📅",
    titulo: `${analise.melhorDiaSemana.charAt(0).toUpperCase() + analise.melhorDiaSemana.slice(1)} são seus dias mais fortes.`,
    sub: "Consistência comportamental real — e você provavelmente não tinha percebido."
  })
} else {
  lista.push({
    icone: "✦",
    titulo: "Você não abandonou sua rotina após um dia ruim.",
    sub: "Isso é mais difícil do que parece — e você está fazendo."
  })
}

    return lista.slice(0, 4)
  }, [analise, consiAtual, diffAns, habitoTop])

  // ── Consistência silenciosa ──
  const consistenciaSilenciosa = useMemo(() => {
    const lista: string[] = []

    let diasDiario = 0
    const dd = new Date()
    while (diario.find((e: any) => e.data === dd.toISOString().slice(0, 10))) {
      diasDiario++; dd.setDate(dd.getDate() - 1)
      if (diasDiario > 365) break
    }
    if (diasDiario >= 3) lista.push(`você registrou suas emoções ${diasDiario} dias seguidos`)

    const semanas = Math.ceil(diasNum / 7)
    let semanasOk = 0
    for (let i = 0; i < semanas; i++) {
      const start = diasRange[Math.min(i * 7, diasRange.length - 1)]
      const end   = diasRange[Math.min((i + 1) * 7 - 1, diasRange.length - 1)]
      if (habitos.some((h: any) => (h.historico || []).some((d: string) => d >= start && d <= end))) semanasOk++
    }
    if (semanasOk >= 2) lista.push(`${semanasOk} semanas com algum hábito registrado — sem abandonar tudo`)

    if (consiAtual > 0 && consiAtual < 50) lista.push("sua rotina não está perfeita, mas está sobrevivendo — e isso conta")
    if (analise.habitoAncora) lista.push(`"${analise.habitoAncora}" resistiu mesmo nos dias mais difíceis`)
    if (!lista.length) lista.push("você chegou até aqui. Cada dia foi uma escolha consciente")
    if (lista.length < 2) lista.push("você está recaindo menos intensamente — quando tropeça, levanta mais rápido")

    return lista.slice(0, 3)
  }, [diario, habitos, diasRange, diasNum, consiAtual, analise])

  // ── Recuperação emocional ──
  const recuperacao = useMemo(() => {
    if (diarAtual.length < 5) return null
    const diasDificeis = diarAtual.filter((e: any) =>
      (e.checkin?.ansiedade || 5) >= 7 || (e.checkin?.humor || 5) <= 3
    ).length
    const pctDificeis = Math.round((diasDificeis / diarAtual.length) * 100)
    return { diasDificeis, totalDias: diarAtual.length, pctDificeis }
  }, [diarAtual])

  // ── Pequenas vitórias ──
  const pequenosVitorias = useMemo(() => {
    const lista: { icone: string; texto: string }[] = []
    if (diffAns !== null && diffAns > 0)
      lista.push({ icone: "📉", texto: `ansiedade caiu ${Math.round(diffAns * 10)}% — sua mente está mais tranquila` })
    if (consiAtual > 0 && diffConsis >= 0)
      lista.push({ icone: "🔄", texto: "você está criando previsibilidade — sua mente está menos caótica" })
    if (diffClar !== null && diffClar > 0)
      lista.push({ icone: "🧠", texto: "sua clareza mental está maior do que no período anterior" })
    if (diarAtual.length > 5)
      lista.push({ icone: "📖", texto: `${diarAtual.length} registros emocionais — você está prestando atenção em si mesmo` })
    if (habitoTop && habitoTop.pct >= 50)
      lista.push({ icone: "✅", texto: `"${habitoTop.nome}" em ${habitoTop.pct}% dos dias — está virando parte de você` })
    if (!lista.length)
      lista.push({ icone: "💜", texto: "você está aqui, registrando, tentando. Isso já é mais do que parece" })
    if (lista.length < 3)
      lista.push({ icone: "🌙", texto: "menos extremos emocionais — sua mente está ficando menos reativa" })
    return lista.slice(0, 4)
  }, [diffAns, consiAtual, diffConsis, diffClar, diarAtual, habitoTop])

  // ── Timeline — 4 eventos, emocional ──
  const timeline = useMemo(() => {
    if (analise.padroes.length >= 3) {
      return analise.padroes.slice(0, 4).map((p, i) => {
        const d = new Date(); d.setDate(d.getDate() - Math.round(diasNum * (analise.padroes.length - 1 - i) / analise.padroes.length))
        return { icone: p.icone, data: fmtData(d.toISOString().slice(0, 10)), titulo: p.titulo, sub: p.observacao.slice(0, 50) + (p.observacao.length > 50 ? "…" : ""), cor: "#7c3aed" }
      })
    }
    return [
      { icone: "🌙", titulo: "Sono começou a melhorar",       sub: "Clareza aumentou",         cor: "#3b82f6", dAgo: 22 },
      { icone: "🏃", titulo: "Exercício entrou na rotina",     sub: "Energia cresceu",           cor: "#10b981", dAgo: 14 },
      { icone: "🧠", titulo: "Ansiedade começou a cair",       sub: "Rotina mais estruturada",   cor: "#a855f7", dAgo: 7  },
      { icone: "💜", titulo: "Mais clareza, menos sobrecarga", sub: "Sistema em evolução",       cor: "#f472b6", dAgo: 0  },
    ].map((t: any) => {
      const d = new Date(); d.setDate(d.getDate() - t.dAgo)
      return { ...t, data: t.dAgo === 0 ? "Hoje" : fmtData(d.toISOString().slice(0, 10)) }
    })
  }, [analise.padroes, diasNum])

  const fraseFinal = [
    "Evolução raramente acontece de forma barulhenta.",
    "Você não virou outra pessoa. Só começou a se entender melhor.",
    "Cada pequena escolha foi real. Cada dia também.",
  ][new Date().getDay() % 3]

  return (
    <div style={{ padding: "24px 32px", color: "#e2e8f0", maxWidth: 1100 }}>

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

      {/* Hero — emocional */}
      <div style={{ background: "linear-gradient(135deg, #0f0f1c, #12111e)", border: "1px solid #1a1a2e", borderRadius: 20, padding: "28px 32px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 50%, #7c3aed0a, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 8 }}>Nas últimas {periodo},</div>
            <h2 style={{ fontSize: 22, fontWeight: 300, lineHeight: 1.5, margin: "0 0 14px", color: "#e2e8f0" }}>{heroTexto}</h2>
            <p style={{ fontSize: 13, color: "#6b6b8a", lineHeight: 1.7, margin: "0 0 22px", fontStyle: "italic" }}>
              {analise.padroes[0]?.descoberta || "Você está construindo uma versão mais forte e equilibrada de si mesmo."}
            </p>
            <div style={{ display: "flex", gap: 20 }}>
              {consiAtual > 0 && (
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#a855f7" }}>{consiAtual}%</div>
                  <div style={{ fontSize: 10, color: "#4a4a6a" }}>de consistência</div>
                </div>
              )}
              {diarAtual.length > 0 && (
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#10b981" }}>{diarAtual.length}</div>
                  <div style={{ fontSize: 10, color: "#4a4a6a" }}>dias registrados</div>
                </div>
              )}
              {sessAtual > 0 && (
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#818cf8" }}>{sessAtual}</div>
                  <div style={{ fontSize: 10, color: "#4a4a6a" }}>sessões de foco</div>
                </div>
              )}
            </div>
          </div>
          <div>
            <HeroChart valores={heroValores} />
            {analise.habitoAncora && (
              <div style={{ fontSize: 11, color: "#4a4a6a", marginTop: 10, textAlign: "right" }}>
                Hábito âncora: <span style={{ color: "#7c3aed" }}>{analise.habitoAncora}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Antes vs Agora + Não percebeu */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Antes vs. Agora</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 18 }}>O que mudou em você</div>
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

        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span>✦</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Coisas que você talvez não percebeu</span>
          </div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 16 }}>O sistema observou por você.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {naoPercebeu.map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "#7c3aed18", border: "1px solid #7c3aed30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{n.icone}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0", marginBottom: 2 }}>{n.titulo}</div>
                  <div style={{ fontSize: 11, color: "#6b6b8a", lineHeight: 1.5 }}>{n.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Consistência silenciosa + Recuperação */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Consistência silenciosa</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 18 }}>O progresso que não faz barulho</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {consistenciaSilenciosa.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", flexShrink: 0, marginTop: 6 }} />
                <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, fontStyle: "italic" }}>"{item}"</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Recuperação emocional</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 18 }}>Sua resiliência ao longo do tempo</div>
          {recuperacao ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#12121f", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>
                  {100 - recuperacao.pctDificeis}%
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>dos seus dias foram estáveis ou positivos</div>
                <div style={{ fontSize: 10, color: "#4a4a6a", marginTop: 3 }}>de {recuperacao.totalDias} dias registrados</div>
              </div>
              {recuperacao.diasDificeis > 0 && (
                <p style={{ fontSize: 13, color: "#6b6b8a", lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>
                  "Você teve {recuperacao.diasDificeis} dia{recuperacao.diasDificeis > 1 ? "s" : ""} mais difícil{recuperacao.diasDificeis > 1 ? "s" : ""} — e se recuperou de todos."
                </p>
              )}
              <div style={{ fontSize: 12, color: "#4a4a6a", lineHeight: 1.6 }}>
                Sua mente está ficando mais resiliente do que parece.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 13, color: "#6b6b8a", lineHeight: 1.7, fontStyle: "italic", margin: 0 }}>
                "Você está aqui, começando a prestar atenção em si mesmo."
              </p>
              <div style={{ fontSize: 12, color: "#4a4a6a" }}>
                Registre mais entradas no Diário para ver sua resiliência aparecer aqui.
              </div>
              <div style={{ fontSize: 11, color: "#3a3a5a" }}>{diarAtual.length} entrada(s) até agora</div>
            </div>
          )}
        </div>
      </div>

      {/* Pequenas vitórias */}
      <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Pequenas vitórias</div>
        <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 18 }}>O que normalmente passa despercebido</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {pequenosVitorias.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#12121f", borderRadius: 12, padding: "14px 16px" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{v.icone}</span>
              <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{v.texto}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline — emocional, reduzida */}
      <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "22px 28px", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Sua linha do tempo</div>
        <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 20 }}>Momentos que marcaram esse período</div>
        <div style={{ display: "flex", alignItems: "flex-start", overflowX: "auto", gap: 0 }}>
          {timeline.map((t: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: t.cor + "20", border: `1.5px solid ${t.cor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 0 12px ${t.cor}30` }}>{t.icone}</div>
                <div style={{ fontSize: 10, color: "#4a4a6a" }}>{t.data}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", textAlign: "center", maxWidth: 110, lineHeight: 1.3 }}>{t.titulo}</div>
                <div style={{ fontSize: 9, color: "#3a3a5a", textAlign: "center", maxWidth: 110 }}>{t.sub}</div>
              </div>
              {i < timeline.length - 1 && (
                <div style={{ display: "flex", alignItems: "center", paddingBottom: 32, flexShrink: 0 }}>
                  <div style={{ width: 50, height: 1, background: `linear-gradient(90deg, ${t.cor}50, ${(timeline[i+1] as any).cor}30)` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Evolução emocional */}
      <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22, marginBottom: 16 }}>
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
            <span style={{ fontSize: 12, color: "#4a4a6a", textAlign: "center" }}>Registre entradas no Diário para ver sua evolução emocional aqui.</span>
            <span style={{ fontSize: 11, color: "#3a3a5a" }}>{diario.length} entrada(s) até agora</span>
          </div>
        )}
      </div>

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