"use client"

import { useMemo } from "react"
import { usePlanner } from "../context/PlannerContext"
import { useRouter } from "next/navigation"

// ── Sparkline mini ────────────────────────────────────────
function Sparkline({ valores, cor }: { valores: number[]; cor: string }) {
  const W = 72, H = 28
  if (valores.length < 2) return (
    <div style={{ width: W, height: H, background: "#1a1a2e", borderRadius: 4, opacity: 0.4 }} />
  )
  const max   = Math.max(...valores, 1)
  const min   = Math.min(...valores, 0)
  const range = max - min || 1
  const step  = W / (valores.length - 1)
  const pts   = valores.map((v, i) =>
    `${i * step},${H - 2 - ((v - min) / range) * (H - 6)}`
  ).join(" ")
  const lx = (valores.length - 1) * step
  const ly = H - 2 - ((valores[valores.length - 1] - min) / range) * (H - 6)
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 3px ${cor}50)` }} />
      <circle cx={lx} cy={ly} r="3" fill={cor} />
    </svg>
  )
}

// ── Insight card ──────────────────────────────────────────
function InsightCard({ icone, texto, sub, cor = "#7c3aed" }: {
  icone: string; texto: string; sub?: string; cor?: string
}) {
  return (
    <div style={{
      background: "#0d0d1c", border: "1px solid #1a1a2e",
      borderRadius: 16, padding: "20px 24px",
      display: "flex", gap: 16, alignItems: "flex-start",
      transition: "border-color .2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${cor}30`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a1a2e")}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${cor}14`, border: `1px solid ${cor}22`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
      }}>
        {icone}
      </div>
      <div>
        <p style={{ fontSize: 14, color: "#e2e8f0", margin: "0 0 6px", lineHeight: 1.65 }}>
          {texto}
        </p>
        {sub && (
          <p style={{ fontSize: 12, color: "#4a4a6a", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Humanize correlation ──────────────────────────────────
function humanizar(c: any): { texto: string; sub: string } {
  const mapa: Record<string, { pos: string; neg: string; sp: string; sn: string }> = {
    sono: {
      pos: "Nos dias em que você dormiu melhor, sua mente ficou mais clara.",
      neg: "Noites mal dormidas parecem deixar o dia mais pesado.",
      sp:  "Seu corpo responde bem a noites mais consistentes.",
      sn:  "Proteger o sono pode fazer muita diferença em como você se sente.",
    },
    exercicio: {
      pos: "Dias com movimento físico tendem a trazer mais energia e leveza.",
      neg: "Quando você fica vários dias sem se mover, a clareza começa a cair.",
      sp:  "Não precisa ser muito — qualquer movimento conta.",
      sn:  "Um pequeno momento de movimento pode mudar o tom do dia.",
    },
    rotina: {
      pos: "Uma rotina mais previsível parece reduzir o ruído mental do dia.",
      neg: "Dias sem estrutura tendem a aumentar a sensação de caos interno.",
      sp:  "Consistência cria clareza — mesmo que pequena.",
      sn:  "Mesmo uma âncora simples na rotina já ajuda bastante.",
    },
    tela: {
      pos: "Menos tempo de tela parece deixar a mente mais tranquila.",
      neg: "Excesso de tela parece deixar o cérebro mais acelerado no dia seguinte.",
      sp:  "O descanso visual também é descanso mental.",
      sn:  "Especialmente à noite, menos tela tende a significar mais clareza amanhã.",
    },
  }
  const k = (c.origem || "").toLowerCase()
  if (mapa[k]) {
    return c.tipo === "positiva"
      ? { texto: mapa[k].pos, sub: mapa[k].sp }
      : { texto: mapa[k].neg, sub: mapa[k].sn }
  }
  return { texto: c.descricao || "", sub: "" }
}

// ── Main ─────────────────────────────────────────────────
export default function Insights() {
  const { data, analise, inteligencia } = usePlanner()
  const router = useRouter()

  const habitos     = (data.habitos     || []) as any[]
  const sessoesFoco = (data.sessoesFoco || []) as any[]
  const diario      = (data.diario      || []) as any[]

  const hoje = new Date().toISOString().slice(0, 10)
  const inicioSemana = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay())
    return d.toISOString().slice(0, 10)
  })()

  const ultimaDiario  = diario.find((e: any) => e.data === hoje)
    || [...diario].sort((a: any, b: any) => b.data.localeCompare(a.data))[0]
  const sono          = ultimaDiario?.checkin?.sono      ?? null
  const ansiedadeHoje = ultimaDiario?.checkin?.ansiedade ?? null
  const energiaHoje   = ultimaDiario?.checkin?.energia   ?? null
  const sessoesHoje   = sessoesFoco.filter((s: any) => s.data === hoje)
  const sessoesSemana = sessoesFoco.filter((s: any) => s.data >= inicioSemana)
  const minSemana     = sessoesSemana.reduce((a: number, s: any) => a + (s.minutos || 0), 0)
  const habitosFeitos = habitos.filter((h: any) => (h.historico || []).includes(hoje)).length
  const consistencia  = analise.consistenciaGeral

  // ── Hybrid insights ──────────────────────────────────
  const insights = useMemo(() => {
    const lista: { icone: string; texto: string; sub?: string; cor?: string }[] = []

    // 1. Engine — alta confiança
    analise.padroes
      .filter((p: any) => p.confianca === "alta")
      .slice(0, 2)
      .forEach((p: any) => lista.push({
        icone: p.icone || "✦",
        texto: p.observacao,
        sub:   p.descoberta || undefined,
        cor:   "#7c3aed",
      }))

    // 2. Correlações humanizadas
    if (lista.length < 3) {
      analise.correlacoes
        .filter((c: any) => (c.intensidade ?? 0) > 0.35)
        .slice(0, 2)
        .forEach((c: any) => {
          const { texto, sub } = humanizar(c)
          if (texto) lista.push({
            icone: c.origem === "sono" ? "🌙"
              : c.origem === "exercicio" ? "🏃"
              : c.origem === "tela" ? "📱" : "✨",
            texto, sub: sub || undefined,
            cor: c.tipo === "positiva" ? "#059669" : "#f59e0b",
          })
        })
    }

    // 3. Contextuais (disponíveis desde o primeiro dia)
    if (sono !== null && lista.length < 5) {
      if (sono < 6) lista.push({
        icone: "🌙",
        texto: `Você dormiu ${sono}h. Seu dia pode estar um pouco mais pesado.`,
        sub:   "Tente proteger sua energia. Menos é mais hoje.",
        cor:   "#f59e0b",
      })
      else if (sono >= 7) lista.push({
        icone: "🌙",
        texto: `Você dormiu ${sono}h. Isso tende a fazer diferença no dia.`,
        sub:   "Seu corpo e mente respondem bem a noites assim.",
        cor:   "#059669",
      })
    }

    if (sessoesHoje.length >= 2 && lista.length < 5) lista.push({
      icone: "⏱",
      texto: `Você focou ${sessoesHoje.length} vezes hoje. Isso é consistência real.`,
      sub:   "Cada sessão constrói algo — mesmo as curtas.",
      cor:   "#7c3aed",
    })

    if (consistencia > 60 && lista.length < 5) lista.push({
      icone: "✅",
      texto: `Você está em ${consistencia}% de consistência nos hábitos.`,
      sub:   "Isso está construindo algo silenciosamente.",
      cor:   "#059669",
    })

    if (analise.melhorDiaSemana && analise.melhorDiaSemana !== "—" && lista.length < 5) lista.push({
      icone: "📅",
      texto: `${analise.melhorDiaSemana.charAt(0).toUpperCase() + analise.melhorDiaSemana.slice(1)}s parecem ser seus dias mais fortes.`,
      sub:   "Você provavelmente não tinha percebido isso.",
      cor:   "#7c3aed",
    })

    // 4. Neutros (fallback)
    if (lista.length === 0) lista.push({
      icone: "✦",
      texto: "Continue registrando. Padrões começam a surgir com o tempo.",
      sub:   "Cada check-in é uma peça do puzzle.",
      cor:   "#7c3aed",
    })
    if (lista.length < 2) lista.push({
      icone: "🌱",
      texto: "Pequenos passos constroem clareza ao longo do tempo.",
      sub:   "O app está aprendendo com você.",
      cor:   "#059669",
    })

    return lista.slice(0, 5)
  }, [analise, sono, sessoesHoje, consistencia])

  // ── Recomendações ──
  const recomendacoes = useMemo(() => {
    const lista: string[] = []

    if (ansiedadeHoje !== null && ansiedadeHoje >= 7)
      lista.push("Dias com ansiedade alta pedem tarefas menores e mais simples.")
    if (energiaHoje !== null && energiaHoje <= 3)
      lista.push("Com energia baixa, escolha uma coisa só. Uma é suficiente.")
    if (consistencia < 30 && habitos.length > 3)
      lista.push("Você parece render melhor com menos hábitos simultâneos.")
    if (analise.melhorHorarioFoco && analise.melhorHorarioFoco !== "—")
      lista.push(`Seu foco costuma ser melhor ${analise.melhorHorarioFoco}. Vale proteger esse horário.`)
    if (sessoesHoje.length === 0)
      lista.push("Começar por uma tarefa pequena costuma desbloquear o resto do dia.")

    if (lista.length === 0) {
      lista.push("Dias mais leves costumam melhorar sua consistência.")
      lista.push("Consistência importa mais do que intensidade.")
      lista.push("Seu foco tende a aumentar quando você começa por tarefas pequenas.")
    }

    return lista.slice(0, 3)
  }, [analise, ansiedadeHoje, energiaHoje, consistencia, habitos, sessoesHoje])

  // ── Dados tendências ──
  const trendsFoco = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const s = new Date(); s.setDate(s.getDate() - (5 - i) * 7)
      const e = new Date(); e.setDate(e.getDate() - (4 - i) * 7)
      return sessoesFoco
        .filter((s2: any) => s2.data >= s.toISOString().slice(0,10) && s2.data <= e.toISOString().slice(0,10))
        .reduce((a: number, s2: any) => a + (s2.minutos || 0), 0)
    })
  }, [sessoesFoco])

  const trendsEnergia = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (5 - i) * 5)
      const key = d.toISOString().slice(0, 10)
      const entry = [...diario].sort((a: any, b: any) =>
        Math.abs(new Date(a.data).getTime() - new Date(key).getTime()) -
        Math.abs(new Date(b.data).getTime() - new Date(key).getTime())
      )[0]
      return entry?.checkin?.energia ?? 5
    })
  }, [diario])

  const trendsConsis = useMemo(() => {
    if (!habitos.length) return [0, 0, 0, 0, 0, 0]
    return Array.from({ length: 6 }, (_, i) => {
      const s = new Date(); s.setDate(s.getDate() - (5 - i) * 7)
      const dias = Array.from({ length: 7 }, (_, j) => {
        const d = new Date(s); d.setDate(d.getDate() + j)
        return d.toISOString().slice(0, 10)
      })
      const feitos = habitos.reduce((a: number, h: any) =>
        a + dias.filter((d: string) => (h.historico || []).includes(d)).length, 0)
      return Math.round((feitos / (habitos.length * 7)) * 100)
    })
  }, [habitos])

  function tendencia(vals: number[]) {
    if (vals.length < 2) return { seta: "→", cor: "#6b6b8a" }
    const diff = vals[vals.length - 1] - vals[vals.length - 2]
    if (diff > 2)  return { seta: "↑", cor: "#10b981" }
    if (diff < -2) return { seta: "↓", cor: "#fb923c" }
    return { seta: "→", cor: "#6b6b8a" }
  }

  function fmtMin(m: number) {
    if (m === 0) return "—"
    return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60>0?m%60+"m":""}`.trim()
  }

  const tf = tendencia(trendsFoco)
  const te = tendencia(trendsEnergia)
  const tc = tendencia(trendsConsis)

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 32px 80px", color: "#e2e8f0" }}>

      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 32, fontWeight: 400, margin: "0 0 8px", color: "#f0eeff", letterSpacing: "-0.5px" }}>
          Insights
        </h1>
        <p style={{ fontSize: 14, color: "#4a4a6a", margin: 0, lineHeight: 1.6 }}>
          Pequenos padrões que podem ajudar você a se entender melhor.
        </p>
      </div>

      {/* Insights principais */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 10, color: "#2a2a45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>
          O que o sistema percebeu
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {insights.map((ins, i) => (
            <InsightCard key={i} icone={ins.icone} texto={ins.texto} sub={ins.sub} cor={ins.cor} />
          ))}
        </div>
      </section>

      <div style={{ height: 1, background: "#0d0d1a", marginBottom: 48 }} />

      {/* Tendências */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 10, color: "#2a2a45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>
          Tendências
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {[
            { label: "Foco semanal",        valor: fmtMin(minSemana),                                           trend: tf, spark: trendsFoco,   cor: "#7c3aed" },
            { label: "Energia média",        valor: energiaHoje != null ? `${energiaHoje}/10` : "—",            trend: te, spark: trendsEnergia, cor: "#10b981" },
            { label: "Consistência hábitos", valor: consistencia > 0 ? `${consistencia}%` : "—",               trend: tc, spark: trendsConsis,  cor: "#f59e0b" },
          ].map((t, i) => (
            <div key={i} style={{ background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: 11, color: "#3a3a5a", marginBottom: 10 }}>{t.label}</div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: t.cor }}>{t.valor}</div>
                <span style={{ fontSize: 16, color: t.trend.cor, fontWeight: 700 }}>{t.trend.seta}</span>
              </div>
              <Sparkline valores={t.spark} cor={t.cor} />
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: 1, background: "#0d0d1a", marginBottom: 48 }} />

      {/* Recomendações */}
      <section style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 10, color: "#2a2a45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20 }}>
          Talvez isso ajude
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {recomendacoes.map((rec, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "18px 20px", background: "#0d0d1c", border: "1px solid #1a1a2e", borderRadius: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", flexShrink: 0, marginTop: 7 }} />
              <p style={{ fontSize: 14, color: "#94a3b8", margin: 0, lineHeight: 1.7 }}>{rec}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#2a2a3a", margin: 0, fontStyle: "italic" }}>
          Os padrões ficam mais precisos conforme você usa o app.
        </p>
      </div>
    </div>
  )
}