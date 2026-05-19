"use client"

import { useState } from "react"
import { usePlanner } from "../context/PlannerContext"

const periodos = ["Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias"]
const diasSemLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const experimentos = [
  { icone: "🌙", texto: "Observe se dormir antes das 23h reduz pensamentos acelerados." },
  { icone: "📱", texto: "Teste reduzir tempo de tela após 22h durante 5 dias." },
  { icone: "☀️", texto: "Mantenha sua rotina matinal por 7 dias seguidos." },
  { icone: "🏃", texto: "Inclua 20min de exercício e observe mudanças no humor." },
]

function BarChartDias({ sessoesFoco, periodo }: { sessoesFoco: any[], periodo: number }) {
  const hoje = new Date()
  const dias = Array.from({ length: periodo }, (_, i) => {
    const d = new Date(hoje); d.setDate(d.getDate() - (periodo - 1 - i))
    return d.toISOString().slice(0, 10)
  })
  const por = Array(7).fill(0)
  dias.forEach(d => {
    if (sessoesFoco.some((s: any) => s.data === d)) {
      por[new Date(d + "T12:00:00").getDay()]++
    }
  })
  const max = Math.max(...por, 1)
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60 }}>
      {por.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", background: v > 0 ? "linear-gradient(180deg, #7c3aed, #7c3aed88)" : "#1a1a2e", borderRadius: "4px 4px 0 0", height: `${Math.max((v / max) * 52, v > 0 ? 4 : 2)}px`, boxShadow: v > 0 ? "0 0 6px #7c3aed40" : "none" }} />
          <div style={{ fontSize: 9, color: "#4a4a6a" }}>{["D","S","T","Q","Q","S","S"][i]}</div>
        </div>
      ))}
    </div>
  )
}

export default function Insights() {
  const { data, analise } = usePlanner()
  const [periodo, setPeriodo] = useState("Últimos 30 dias")
  const [showPeriodo, setShowPeriodo] = useState(false)

  const habitos = (data.habitos || []) as any[]
  const sessoesFoco = (data.sessoesFoco || []) as any[]
  const tarefas = (data.tarefas || []) as any[]
  const diasNum = periodo === "Últimos 7 dias" ? 7 : periodo === "Últimos 90 dias" ? 90 : 30

  const totalSessoes = sessoesFoco.length
  const totalMin = sessoesFoco.reduce((a: number, s: any) => a + (s.minutos || 0), 0)
  const hoje = new Date().toISOString().slice(0, 10)
  const inicioPeriodo = (() => { const d = new Date(); d.setDate(d.getDate() - diasNum); return d.toISOString().slice(0, 10) })()
  const sessoesPeriodo = sessoesFoco.filter((s: any) => s.data >= inicioPeriodo)
  const tarefasConcluidas = tarefas.filter((t: any) => t.feita && t.data >= inicioPeriodo).length

  // Hero dinâmico baseado nos padrões reais
  const heroTexto = analise.padroes.length > 0
    ? analise.padroes[0].observacao
    : analise.consistenciaGeral > 0
    ? `Seus dados mostram ${analise.consistenciaGeral}% de consistência nos hábitos e ${Math.floor(totalMin / 60)}h de foco registradas.`
    : "Comece a registrar seus hábitos e sessões para que seus padrões pessoais apareçam aqui."

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
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowPeriodo(!showPeriodo)} style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 10, padding: "8px 16px", color: "#94a3b8", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              📅 {periodo} ▾
            </button>
            {showPeriodo && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 10, overflow: "hidden", zIndex: 10, minWidth: 160 }}>
                {periodos.map(p => (
                  <button key={p} onClick={() => { setPeriodo(p); setShowPeriodo(false) }} style={{ display: "block", width: "100%", padding: "10px 16px", background: p === periodo ? "#7c3aed20" : "transparent", border: "none", color: p === periodo ? "#a855f7" : "#6b6b8a", fontSize: 13, cursor: "pointer", textAlign: "left" }}>{p}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero — dados reais */}
      <div style={{ background: "linear-gradient(135deg, #0f0f1c, #12111e)", border: "1px solid #1a1a2e", borderRadius: 20, padding: "32px 36px", marginBottom: 20, position: "relative", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center" }}>
        <div style={{ position: "absolute", right: "15%", top: "50%", transform: "translateY(-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, #7c3aed20, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
        <div>
          <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Insight principal</div>
          <p style={{ fontSize: 20, fontWeight: 300, lineHeight: 1.7, margin: "0 0 16px", color: "#e2e8f0", maxWidth: 540 }}>{heroTexto}</p>
          {analise.padroes[0]?.descoberta && (
            <p style={{ fontSize: 13, color: "#6b6b8a", fontStyle: "italic", margin: "0 0 12px", lineHeight: 1.6 }}>{analise.padroes[0].descoberta}</p>
          )}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ fontSize: 12, color: "#4a4a6a" }}>Período: {periodo.toLowerCase()}</div>
            {analise.consistenciaGeral > 0 && <div style={{ fontSize: 12, color: "#7c3aed" }}>Consistência: {analise.consistenciaGeral}%</div>}
            {analise.habitoAncora && <div style={{ fontSize: 12, color: "#059669" }}>Âncora: {analise.habitoAncora}</div>}
          </div>
        </div>
        <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="55" fill="none" stroke="#1a1a2e" strokeWidth="5" />
            <circle cx="65" cy="65" r="55" fill="none" stroke="#7c3aed" strokeWidth="5"
              strokeDasharray={`${2 * Math.PI * 55 * analise.consistenciaGeral / 100} ${2 * Math.PI * 55}`}
              strokeLinecap="round" transform="rotate(-90 65 65)"
              style={{ filter: "drop-shadow(0 0 6px #7c3aed)" }} />
            <text x="65" y="60" textAnchor="middle" fill="#a855f7" fontSize="18" fontWeight="600">{analise.consistenciaGeral}%</text>
            <text x="65" y="76" textAnchor="middle" fill="#4a4a6a" fontSize="9">consistência</text>
            <text x="65" y="90" textAnchor="middle" fill="#3a3a5a" fontSize="8">{analise.diasAnalisados} dias ativos</text>
          </svg>
        </div>
      </div>

      {/* Cards resumo reais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Sessões de foco", valor: sessoesPeriodo.length, sub: `${Math.floor(sessoesPeriodo.reduce((a: number, s: any) => a + (s.minutos || 0), 0) / 60)}h ${sessoesPeriodo.reduce((a: number, s: any) => a + (s.minutos || 0), 0) % 60}m`, icone: "⏱️", cor: "#7c3aed" },
          { label: "Hábitos ativos", valor: habitos.length, sub: `${analise.consistenciaGeral}% consistência`, icone: "🔥", cor: "#f59e0b" },
          { label: "Padrões detectados", valor: analise.padroes.length, sub: "nos seus dados", icone: "✦", cor: "#059669" },
          { label: "Tarefas concluídas", valor: tarefasConcluidas, sub: "no período", icone: "✅", cor: "#2563eb" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: c.cor + "18", border: `1px solid ${c.cor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{c.icone}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{c.valor}</div>
              <div style={{ fontSize: 11, color: "#4a4a6a" }}>{c.label}</div>
              <div style={{ fontSize: 10, color: c.cor }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Padrões reais + Hábitos reais */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Padrões detectados pelo cérebro */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Padrões detectados</span>
            <span style={{ fontSize: 11, color: "#4a4a6a", fontStyle: "italic" }}>baseado nos seus dados reais</span>
          </div>
          {analise.padroes.length === 0 ? (
            <div style={{ fontSize: 12, color: "#4a4a6a", lineHeight: 1.7 }}>
              Continue registrando hábitos e sessões de foco. Os padrões aparecem conforme você usa o app.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {analise.padroes.slice(0, 4).map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#12121f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{p.icone}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500, marginBottom: 2 }}>{p.titulo}</div>
                    <div style={{ fontSize: 11, color: "#6b6b8a", lineHeight: 1.5, marginBottom: 4 }}>{p.observacao}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, background: "#1a1a2e", borderRadius: 20, height: 3 }}>
                        <div style={{ background: p.confianca === "alta" ? "#059669" : "#7c3aed", height: 3, borderRadius: 20, width: p.confianca === "alta" ? "85%" : "55%" }} />
                      </div>
                      <span style={{ fontSize: 10, color: p.confianca === "alta" ? "#059669" : "#7c3aed", flexShrink: 0 }}>Confiança {p.confianca}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hábitos com consistência real */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Seus hábitos no período</span>
          </div>
          {habitos.length === 0 ? (
            <div style={{ fontSize: 12, color: "#4a4a6a" }}>Nenhum hábito cadastrado. Adicione na página Hábitos!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {habitos.map((h: any, i: number) => {
                const total = (() => { const d = new Date(); d.setDate(d.getDate() - diasNum); const s = d.toISOString().slice(0, 10); return (h.historico || []).filter((d: string) => d >= s).length })()
                const pct = Math.round((total / diasNum) * 100)
                let streak = 0
                const dd = new Date()
                while ((h.historico || []).includes(dd.toISOString().slice(0, 10))) { streak++; dd.setDate(dd.getDate() - 1) }
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{h.icone}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: "#e2e8f0" }}>{h.nome}</span>
                        <span style={{ fontSize: 11, color: pct >= 70 ? "#059669" : pct >= 40 ? "#7c3aed" : "#dc2626" }}>{pct}%</span>
                      </div>
                      <div style={{ background: "#1a1a2e", borderRadius: 20, height: 4 }}>
                        <div style={{ background: pct >= 70 ? "#059669" : pct >= 40 ? "#7c3aed" : "#dc2626", height: 4, borderRadius: 20, width: `${pct}%`, transition: "width .4s" }} />
                      </div>
                    </div>
                    {streak > 0 && <span style={{ fontSize: 10, color: "#f59e0b", flexShrink: 0 }}>🔥{streak}d</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ciclos + Evolução + Foco */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Ciclos reais */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Ciclos e ritmos</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 14 }}>Seus dias de foco na semana</div>
          <BarChartDias sessoesFoco={sessoesFoco} periodo={diasNum} />
          <div style={{ marginTop: 14, padding: "10px 12px", background: "#12121f", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 2 }}>Melhor dia</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#a855f7" }}>{analise.melhorDiaSemana}</div>
          </div>
          <div style={{ marginTop: 8, padding: "10px 12px", background: "#12121f", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 2 }}>Melhor horário</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#a855f7" }}>{analise.melhorHorarioFoco}</div>
          </div>
        </div>

        {/* Evolução real */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Evolução real</div>
          <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 16 }}>Comparado ao período anterior</div>
          {analise.evolucao.length === 0 ? (
            <div style={{ fontSize: 12, color: "#4a4a6a" }}>Dados insuficientes para comparação ainda.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {analise.evolucao.map((e, i) => {
                const up = e.tendencia === "subindo"
                const est = e.tendencia === "estavel"
                const cor = up ? "#059669" : est ? "#7c3aed" : "#f59e0b"
                const seta = up ? "↑" : est ? "→" : "↓"
                return (
                  <div key={i}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: cor + "18", border: `1px solid ${cor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, color: cor }}>{seta}</div>
                      <span style={{ flex: 1, fontSize: 12, color: "#6b6b8a" }}>{e.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: cor }}>{e.diff >= 0 ? "+" : ""}{e.diff}{i === 0 ? "%" : ""}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "#4a4a6a", margin: "0 0 0 36px", fontStyle: "italic", lineHeight: 1.5 }}>{e.descricao}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Insights de foco reais */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Insights de foco</div>
          {totalSessoes === 0 ? (
            <div style={{ fontSize: 12, color: "#4a4a6a", lineHeight: 1.7 }}>Nenhuma sessão registrada. Inicie uma sessão para ver seus insights!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {analise.padroes.filter(p => p.categoria === "foco").map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#7c3aed18", border: "1px solid #7c3aed20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{p.icone}</div>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{p.observacao}</div>
                    {p.descoberta && <div style={{ fontSize: 10, color: "#4a4a6a", lineHeight: 1.5, marginTop: 3, fontStyle: "italic" }}>{p.descoberta}</div>}
                  </div>
                </div>
              ))}
              {analise.padroes.filter(p => p.categoria === "foco").length === 0 && (
                <div style={{ fontSize: 12, color: "#4a4a6a" }}>
                  {totalSessoes} sessão(ões) registrada(s) — {Math.floor(totalMin / 60)}h {totalMin % 60}m no total.
                  Continue registrando para ver padrões de foco.
                </div>
              )}
              {sessoesPeriodo.slice(0, 3).length > 0 && (
                <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 10, marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 6 }}>Últimas sessões</div>
                  {sessoesPeriodo.slice(0, 3).map((s: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#7c3aed", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, color: "#6b6b8a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.tarefa || "Sessão de foco"}</span>
                      <span style={{ fontSize: 10, color: "#4a4a6a", flexShrink: 0 }}>{s.minutos}min</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Correlações reais + Descobertas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Correlações do motor */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Correlações detectadas</span>
          </div>
          {analise.correlacoes.length === 0 ? (
            <div style={{ fontSize: 12, color: "#4a4a6a" }}>Correlações aparecem conforme você registra dados.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {analise.correlacoes.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 80, textTransform: "capitalize" }}>{c.origem} ↑</span>
                  <span style={{ color: "#4a4a6a", fontSize: 14 }}>→</span>
                  <span style={{ flex: 1, fontSize: 12, color: "#94a3b8", textTransform: "capitalize" }}>{c.destino} {c.tipo === "positiva" ? "↑" : "↓"}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c.tipo === "positiva" ? "#059669" : "#f59e0b" }}>
                    {c.tipo === "positiva" ? "Positiva" : "Negativa"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Todos os padrões restantes */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Mais descobertas</div>
          {analise.padroes.slice(4).length === 0 ? (
            <div style={{ fontSize: 12, color: "#4a4a6a" }}>Mais padrões aparecem conforme você usa o app.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {analise.padroes.slice(4).map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", background: "#12121f", borderRadius: 10 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{p.icone}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#e2e8f0", marginBottom: 2 }}>{p.titulo}</div>
                    <div style={{ fontSize: 11, color: "#6b6b8a", lineHeight: 1.5 }}>{p.descoberta}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Experimentos */}
      <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 22, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Observe nos próximos dias</div>
        <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 16 }}>Pequenos experimentos geram grandes descobertas.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {experimentos.map((e, i) => (
            <div key={i} style={{ background: "#12121f", border: "1px solid #1e1e35", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{e.icone}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>{e.texto}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "#3a3a5a", paddingBottom: 8 }}>
        🔒 Seus dados são privados e protegidos. Nada é compartilhado.
      </div>
    </div>
  )
}