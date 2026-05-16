"use client"

import { useState, useEffect, useMemo } from "react"
import { usePlanner } from "../context/PlannerContext"

const periodos = ["Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias"]
const diasSemLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const diasSemCurtos = ["D", "S", "T", "Q", "Q", "S", "S"]

const experimentos = [
  { icone: "🌙", texto: "Observe se dormir antes das 23h reduz pensamentos acelerados." },
  { icone: "📱", texto: "Teste reduzir tempo de tela após 22h durante 5 dias." },
  { icone: "☀️", texto: "Mantenha sua rotina matinal por 7 dias seguidos." },
  { icone: "🏃", texto: "Inclua 20min de exercício e observe mudanças no humor." },
]

function getDiasAtras(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

function BarChart({ valores, labels }: { valores: number[], labels: string[] }) {
  const max = Math.max(...valores, 1)
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60 }}>
      {valores.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", background: v > 0 ? "linear-gradient(180deg, #7c3aed, #7c3aed88)" : "#1a1a2e", borderRadius: "4px 4px 0 0", height: `${Math.max((v / max) * 52, v > 0 ? 4 : 2)}px`, boxShadow: v > 0 ? "0 0 6px #7c3aed40" : "none", transition: "height .3s" }} />
          <div style={{ fontSize: 9, color: "#4a4a6a" }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  )
}

export default function Insights() {
  const { data } = usePlanner()
  const [periodo, setPeriodo] = useState("Últimos 30 dias")
  const [showPeriodo, setShowPeriodo] = useState(false)
  const [projetos, setProjetos] = useState<any[]>([])

  const habitos = (data.habitos || []) as any[]
  const sessoesFoco = (data.sessoesFoco || []) as any[]
  const tarefas = (data.tarefas || []) as any[]
  const hoje = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    const p = localStorage.getItem("projetos-v1")
    if (p) setProjetos(JSON.parse(p))
  }, [])

  const diasPeriodo = periodo === "Últimos 7 dias" ? 7 : periodo === "Últimos 30 dias" ? 30 : 90
  const diasRange = getDiasAtras(diasPeriodo)
  const inicioPeriodo = diasRange[0]

  // ── Dados reais de Foco ──
  const sessoesPeriodo = sessoesFoco.filter((s: any) => s.data >= inicioPeriodo)
  const totalSessoes = sessoesPeriodo.length
  const totalMin = sessoesPeriodo.reduce((a: number, s: any) => a + (s.minutos || 0), 0)
  const mediaMinPorSessao = totalSessoes > 0 ? Math.round(totalMin / totalSessoes) : 0

  // Sessões por dia da semana
  const sessoesPorDia = Array(7).fill(0)
  sessoesPeriodo.forEach((s: any) => {
    const dia = new Date(s.data + "T00:00:00").getDay()
    sessoesPorDia[dia]++
  })
  const melhorDiaIdx = sessoesPorDia.indexOf(Math.max(...sessoesPorDia))
  const melhorDia = diasSemLabels[melhorDiaIdx]

  // Melhor horário de foco
  const horasFoco: Record<string, number> = {}
  sessoesPeriodo.forEach((s: any) => {
    if (s.hora) {
      const h = s.hora.split(":")[0]
      horasFoco[h] = (horasFoco[h] || 0) + 1
    }
  })
  const melhorHora = Object.entries(horasFoco).sort((a, b) => b[1] - a[1])[0]
  const melhorHoraStr = melhorHora ? `${melhorHora[0]}:00 – ${String(Number(melhorHora[0]) + 2).padStart(2, "0")}:00` : "09:00 – 12:00"

  // ── Dados reais de Hábitos ──
  const totalHabitos = habitos.length
  const habitosPositivos = habitos.filter((h: any) => h.tipo !== "negativo")
  const habitosNegativos = habitos.filter((h: any) => h.tipo === "negativo")

  // Consistência por hábito no período
  const habitosComStats = habitos.map((h: any) => {
    const hist = h.historico || []
    const feitosNoPeriodo = diasRange.filter(d => hist.includes(d)).length
    const consistencia = diasPeriodo > 0 ? Math.round((feitosNoPeriodo / diasPeriodo) * 100) : 0
    let streak = 0
    const d = new Date(hoje)
    while (hist.includes(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1) }
    return { ...h, consistencia, streak, feitosNoPeriodo }
  }).sort((a: any, b: any) => b.consistencia - a.consistencia)

  const consistenciaGeral = habitosComStats.length > 0
    ? Math.round(habitosComStats.reduce((a: number, h: any) => a + h.consistencia, 0) / habitosComStats.length)
    : 0

  // Melhor hábito
  const melhorHabito = habitosComStats[0]

  // Dias com todos os hábitos completos
  const diasPerfeitos = diasRange.filter(d =>
    habitos.length > 0 && habitos.every((h: any) => (h.historico || []).includes(d))
  ).length

  // ── Evolução (comparar período atual vs anterior) ──
  const diasAnteriores = Array.from({ length: diasPeriodo }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - diasPeriodo - (diasPeriodo - 1 - i))
    return d.toISOString().slice(0, 10)
  })

  function calcConsistencia(dias: string[]) {
    if (habitos.length === 0 || dias.length === 0) return 0
    const total = habitos.reduce((a: number, h: any) => {
      return a + dias.filter(d => (h.historico || []).includes(d)).length
    }, 0)
    return Math.round((total / (habitos.length * dias.length)) * 100)
  }

  const consistenciaAtual = calcConsistencia(diasRange)
  const consistenciaAnterior = calcConsistencia(diasAnteriores)
  const diffConsistencia = consistenciaAtual - consistenciaAnterior

  const sessoesMesAtual = sessoesFoco.filter((s: any) => s.data >= inicioPeriodo).length
  const sessoesMesAnterior = sessoesFoco.filter((s: any) => s.data >= diasAnteriores[0] && s.data < inicioPeriodo).length
  const diffSessoes = sessoesMesAtual - sessoesMesAnterior

  const tarefasConcluidas = tarefas.filter((t: any) => t.feita && t.data >= inicioPeriodo).length
  const tarefasConcluidasAnt = tarefas.filter((t: any) => t.feita && t.data >= diasAnteriores[0] && t.data < inicioPeriodo).length
  const diffTarefas = tarefasConcluidas - tarefasConcluidasAnt

  // ── Padrões detectados ──
  const padroes = useMemo(() => {
    const lista = []
    if (consistenciaGeral >= 70) lista.push({ texto: `Sua consistência está em ${consistenciaGeral}% — você está no caminho certo.`, confianca: "alta", icone: "📈" })
    if (melhorHabito?.consistencia >= 80) lista.push({ texto: `"${melhorHabito.nome}" é seu hábito mais consistente com ${melhorHabito.consistencia}% de regularidade.`, confianca: "alta", icone: melhorHabito.icone })
    if (diasPerfeitos > 0) lista.push({ texto: `Você teve ${diasPerfeitos} dia${diasPerfeitos > 1 ? "s" : ""} perfeito${diasPerfeitos > 1 ? "s" : ""} no período — todos os hábitos completos.`, confianca: "alta", icone: "⭐" })
    if (totalSessoes > 0) lista.push({ texto: `Você acumulou ${Math.floor(totalMin / 60)}h ${totalMin % 60}m de foco em ${totalSessoes} sessões.`, confianca: "alta", icone: "⏱" })
    if (mediaMinPorSessao >= 40) lista.push({ texto: `Suas sessões duram em média ${mediaMinPorSessao} minutos — acima do ideal para foco profundo.`, confianca: "moderada", icone: "🎯" })
    if (melhorDia && sessoesPorDia[melhorDiaIdx] > 0) lista.push({ texto: `${melhorDia} é seu melhor dia de foco com ${sessoesPorDia[melhorDiaIdx]} sessão(ões) no período.`, confianca: "moderada", icone: "📅" })
    if (habitosNegativos.length > 0) {
      const limpos = habitosNegativos.filter((h: any) => {
        const hist = h.historico || []
        return !diasRange.slice(-7).some(d => hist.includes(d))
      })
      if (limpos.length > 0) lista.push({ texto: `${limpos.length} hábito${limpos.length > 1 ? "s" : ""} negativo${limpos.length > 1 ? "s" : ""} sem recaída nos últimos 7 dias.`, confianca: "alta", icone: "💚" })
    }
    if (lista.length === 0) lista.push({ texto: "Continue registrando seus hábitos e sessões de foco para ver padrões aparecerem aqui.", confianca: "moderada", icone: "🌱" })
    return lista.slice(0, 4)
  }, [habitos, sessoesPeriodo, diasRange])

  // ── Hero insight principal ──
  const heroInsight = useMemo(() => {
    if (consistenciaGeral >= 70 && totalSessoes > 0)
      return `Seus dados mostram que você mantém ${consistenciaGeral}% de consistência nos hábitos e acumulou ${Math.floor(totalMin / 60)}h de foco no período.`
    if (consistenciaGeral >= 50)
      return `Você está construindo uma rotina sólida. Sua consistência de ${consistenciaGeral}% mostra progresso real acontecendo.`
    if (totalSessoes > 0)
      return `Você completou ${totalSessoes} sessão(ões) de foco no período. Continue e os padrões ficarão mais claros.`
    return "Comece a registrar seus hábitos e sessões de foco para que seus padrões pessoais apareçam aqui."
  }, [consistenciaGeral, totalSessoes, totalMin])

  // ── Projetos reais ──
  const projetosAtivos = projetos.filter((p: any) => p.status === "Em andamento")
  const projetosConcluidos = projetos.filter((p: any) => p.status === "Concluído")

  return (
    <div style={{ padding: "28px 36px", color: "#e2e8f0", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0 }}>Insights</h1>
            <span style={{ fontSize: 18 }}>✦</span>
          </div>
          <p style={{ fontSize: 13, color: "#4a4a6a", margin: 0 }}>Entenda padrões, conecte pontos, evolua com clareza.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowPeriodo(!showPeriodo)} style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 10, padding: "8px 16px", color: "#94a3b8", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              📅 {periodo} ▾
            </button>
            {showPeriodo && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 10, overflow: "hidden", zIndex: 10, minWidth: 160 }}>
                {periodos.map(p => (
                  <button key={p} onClick={() => { setPeriodo(p); setShowPeriodo(false) }} style={{ display: "block", width: "100%", padding: "10px 16px", background: p === periodo ? "#7c3aed20" : "transparent", border: "none", color: p === periodo ? "#a855f7" : "#6b6b8a", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0f0f1c, #12111e)", border: "1px solid #1a1a2e", borderRadius: 20, padding: "32px 36px", marginBottom: 20, position: "relative", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center" }}>
        <div style={{ position: "absolute", right: "15%", top: "50%", transform: "translateY(-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, #7c3aed20, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
        <div>
          <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Insight principal</div>
          <p style={{ fontSize: 20, fontWeight: 300, lineHeight: 1.7, margin: "0 0 20px", color: "#e2e8f0", maxWidth: 540 }}>
            {heroInsight}
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ fontSize: 12, color: "#4a4a6a" }}>Baseado nos seus {periodo.toLowerCase()}.</div>
            {consistenciaGeral > 0 && <div style={{ fontSize: 12, color: "#7c3aed" }}>Consistência: {consistenciaGeral}%</div>}
          </div>
        </div>
        <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <defs>
              <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="70" cy="70" r="60" fill="url(#glow1)" />
            <circle cx="70" cy="70" r="55" fill="none" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.2" />
            <circle cx="70" cy="70" r="55" fill="none" stroke="#7c3aed" strokeWidth="3" strokeOpacity="0.6"
              strokeDasharray={`${2 * Math.PI * 55 * consistenciaGeral / 100} ${2 * Math.PI * 55}`}
              strokeLinecap="round" transform="rotate(-90 70 70)" />
            <circle cx="70" cy="70" r="35" fill="none" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.3" />
            <text x="70" y="66" textAnchor="middle" fill="#a855f7" fontSize="18" fontWeight="600">{consistenciaGeral}%</text>
            <text x="70" y="82" textAnchor="middle" fill="#4a4a6a" fontSize="9">consistência</text>
          </svg>
        </div>
      </div>

      {/* Cards resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Sessões de foco", valor: totalSessoes, sub: `${Math.floor(totalMin / 60)}h ${totalMin % 60}m total`, icone: "⏱️", cor: "#7c3aed" },
          { label: "Hábitos monitorados", valor: totalHabitos, sub: `${consistenciaGeral}% consistência`, icone: "🔥", cor: "#f59e0b" },
          { label: "Dias perfeitos", valor: diasPerfeitos, sub: "todos os hábitos", icone: "⭐", cor: "#059669" },
          { label: "Tarefas concluídas", valor: tarefasConcluidas, sub: `no período`, icone: "✅", cor: "#2563eb" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: c.cor + "18", border: `1px solid ${c.cor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.icone}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: "#e2e8f0" }}>{c.valor}</div>
              <div style={{ fontSize: 11, color: "#4a4a6a" }}>{c.label}</div>
              <div style={{ fontSize: 10, color: c.cor }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Padrões + Hábitos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Padrões reais */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Padrões detectados</span>
            <span style={{ fontSize: 11, color: "#4a4a6a" }}>baseado nos seus dados reais</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {padroes.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#12121f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{p.icone}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4, lineHeight: 1.5 }}>{p.texto}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, background: "#1a1a2e", borderRadius: 20, height: 3 }}>
                      <div style={{ background: p.confianca === "alta" ? "#059669" : "#7c3aed", height: 3, borderRadius: 20, width: p.confianca === "alta" ? "85%" : "55%" }} />
                    </div>
                    <span style={{ fontSize: 10, color: p.confianca === "alta" ? "#059669" : "#7c3aed", fontWeight: 500, flexShrink: 0 }}>Confiança {p.confianca}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hábitos reais */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Seus hábitos no período</span>
          </div>
          {habitosComStats.length === 0 ? (
            <div style={{ fontSize: 12, color: "#4a4a6a" }}>Nenhum hábito cadastrado ainda. Adicione na página de Hábitos!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {habitosComStats.slice(0, 5).map((h: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{h.icone}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.nome}</span>
                      <span style={{ fontSize: 11, color: h.consistencia >= 70 ? "#059669" : h.consistencia >= 40 ? "#7c3aed" : "#dc2626", flexShrink: 0, marginLeft: 8 }}>{h.consistencia}%</span>
                    </div>
                    <div style={{ background: "#1a1a2e", borderRadius: 20, height: 4 }}>
                      <div style={{ background: h.consistencia >= 70 ? "#059669" : h.consistencia >= 40 ? "#7c3aed" : "#dc2626", height: 4, borderRadius: 20, width: `${h.consistencia}%`, transition: "width .4s" }} />
                    </div>
                  </div>
                  {h.streak > 0 && <span style={{ fontSize: 10, color: "#f59e0b", flexShrink: 0 }}>🔥{h.streak}d</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ciclos + Evolução + Foco */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Ciclos reais */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Ciclos e ritmos</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 14 }}>Sessões de foco por dia da semana</div>
          <BarChart valores={sessoesPorDia} labels={diasSemCurtos} />
          <div style={{ marginTop: 16, padding: "10px 14px", background: "#12121f", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>⏱</span>
            <div>
              <div style={{ fontSize: 11, color: "#4a4a6a" }}>Melhor horário detectado</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#a855f7" }}>{melhorHoraStr}</div>
            </div>
          </div>
          {melhorDia && sessoesPorDia[melhorDiaIdx] > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: "#4a4a6a" }}>
              Melhor dia: <span style={{ color: "#7c3aed" }}>{melhorDia}</span> com {sessoesPorDia[melhorDiaIdx]} sessão(ões)
            </div>
          )}
        </div>

        {/* Evolução real */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Evolução real</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 16 }}>Comparado ao período anterior</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Consistência de hábitos", diff: diffConsistencia, sufixo: "%" },
              { label: "Sessões de foco", diff: diffSessoes, sufixo: " sessões" },
              { label: "Tarefas concluídas", diff: diffTarefas, sufixo: " tarefas" },
              { label: "Dias perfeitos", diff: diasPerfeitos, sufixo: " dias", absoluto: true },
            ].map((e, i) => {
              const up = e.absoluto ? e.diff > 0 : e.diff >= 0
              const val = e.absoluto ? e.diff : (e.diff >= 0 ? `+${e.diff}` : `${e.diff}`)
              const cor = up ? "#059669" : "#dc2626"
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: cor + "18", border: `1px solid ${cor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, color: cor }}>
                    {up ? "↑" : "↓"}
                  </div>
                  <span style={{ flex: 1, fontSize: 12, color: "#6b6b8a" }}>{e.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cor }}>{val}{e.sufixo}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Insights de foco reais */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Insights de foco</div>
          {totalSessoes === 0 ? (
            <div style={{ fontSize: 12, color: "#4a4a6a", lineHeight: 1.6 }}>Nenhuma sessão registrada ainda. Inicie uma sessão de foco para ver seus insights!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#7c3aed18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>⏱</div>
                <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                  Média de {mediaMinPorSessao} min por sessão — {mediaMinPorSessao >= 40 ? "ótimo para foco profundo!" : "tente aumentar gradualmente."}
                </span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#7c3aed18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>📊</div>
                <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                  {totalSessoes} sessão(ões) completadas, totalizando {Math.floor(totalMin / 60)}h {totalMin % 60}min de foco real.
                </span>
              </div>
              {melhorDia && sessoesPorDia[melhorDiaIdx] > 0 && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#7c3aed18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🌅</div>
                  <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                    Você foca melhor às {melhorHoraStr} — horário com mais sessões registradas.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Sessões recentes */}
          {sessoesPeriodo.slice(0, 3).length > 0 && (
            <div style={{ marginTop: 14, borderTop: "1px solid #1a1a2e", paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 8 }}>Últimas sessões</div>
              {sessoesPeriodo.slice(0, 3).map((s: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, color: "#6b6b8a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.tarefa}</span>
                  <span style={{ fontSize: 10, color: "#4a4a6a", flexShrink: 0 }}>{s.minutos}min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Projetos + Experimentos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Projetos reais */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Insights de projetos</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 14 }}>{projetosAtivos.length} ativo(s) · {projetosConcluidos.length} concluído(s)</div>
          {projetos.length === 0 ? (
            <div style={{ fontSize: 12, color: "#4a4a6a" }}>Nenhum projeto cadastrado ainda.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projetosAtivos.slice(0, 4).map((p: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{p.icone}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</span>
                      <span style={{ fontSize: 11, color: p.cor || "#7c3aed", flexShrink: 0, marginLeft: 8 }}>{p.progresso || 0}%</span>
                    </div>
                    <div style={{ background: "#1a1a2e", borderRadius: 20, height: 4 }}>
                      <div style={{ background: p.cor || "#7c3aed", height: 4, borderRadius: 20, width: `${p.progresso || 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Experimentos */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Observe nos próximos dias</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 14 }}>Pequenos experimentos geram grandes descobertas.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {experimentos.map((e, i) => (
              <div key={i} style={{ background: "#12121f", border: "1px solid #1e1e35", borderRadius: 12, padding: "12px" }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{e.icone}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>{e.texto}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "#3a3a5a", paddingBottom: 8 }}>
        🔒 Seus dados são privados e protegidos. Nada é compartilhado.
      </div>
    </div>
  )
}