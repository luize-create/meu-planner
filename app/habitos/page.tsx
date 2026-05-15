"use client"

import { useState } from "react"
import { usePlanner } from "../context/PlannerContext"

const iconesPositivos = [
  { ic: "🧠", placeholder: "Ex: Estudar IA" },
  { ic: "🏋️", placeholder: "Ex: Treinar na academia" },
  { ic: "📚", placeholder: "Ex: Ler 20 páginas" },
  { ic: "💻", placeholder: "Ex: Programar 1h" },
  { ic: "💧", placeholder: "Ex: Beber 2L de água" },
  { ic: "🌙", placeholder: "Ex: Dormir antes das 23h" },
  { ic: "🎯", placeholder: "Ex: Sessão de foco" },
  { ic: "🧘", placeholder: "Ex: Meditar 10 minutos" },
  { ic: "🥗", placeholder: "Ex: Comer saudável" },
  { ic: "🎨", placeholder: "Ex: Criar algo novo" },
  { ic: "🎵", placeholder: "Ex: Praticar instrumento" },
  { ic: "🏃", placeholder: "Ex: Correr 30 minutos" },
  { ic: "✍️", placeholder: "Ex: Escrever no diário" },
  { ic: "🌅", placeholder: "Ex: Acordar cedo" },
  { ic: "💪", placeholder: "Ex: Fazer exercícios" },
  { ic: "📝", placeholder: "Ex: Planejar o dia" },
  { ic: "🙏", placeholder: "Ex: Praticar gratidão" },
  { ic: "🌿", placeholder: "Ex: Passar tempo na natureza" },
  { ic: "😴", placeholder: "Ex: Dormir 8h por noite" },
  { ic: "📵", placeholder: "Ex: Sem celular de manhã" },
  { ic: "☀️", placeholder: "Ex: Tomar sol pela manhã" },
]

const iconesNegativos = [
  { ic: "🚬", placeholder: "Ex: Sem fumar" },
  { ic: "🍺", placeholder: "Ex: Sem beber álcool" },
  { ic: "💊", placeholder: "Ex: Sem automedicação" },
  { ic: "🍔", placeholder: "Ex: Sem fast food" },
  { ic: "🎮", placeholder: "Ex: Sem jogos em excesso" },
  { ic: "🍫", placeholder: "Ex: Sem açúcar" },
  { ic: "🥃", placeholder: "Ex: Sem destilados" },
  { ic: "🛒", placeholder: "Ex: Sem compras impulsivas" },
  { ic: "🍩", placeholder: "Ex: Sem doces" },
  { ic: "💬", placeholder: "Ex: Sem fofoca" },
  { ic: "📱", placeholder: "Ex: Sem redes sociais" },
  { ic: "🍬", placeholder: "Ex: Sem guloseimas" },
  { ic: "⏰", placeholder: "Ex: Sem dormir tarde" },
  { ic: "🛋️", placeholder: "Ex: Sem sedentarismo" },
  { ic: "⚡", placeholder: "Ex: Sem impulsividade" },
  { ic: "😴", placeholder: "Ex: Sem procrastinar" },
  { ic: "👥", placeholder: "Ex: Sem pessoas tóxicas" },
  { ic: "🎲", placeholder: "Ex: Sem apostas" },
  { ic: "🍕", placeholder: "Ex: Sem junk food" },
  { ic: "📺", placeholder: "Ex: Sem TV em excesso" },
  { ic: "🧁", placeholder: "Ex: Sem industrializados" },
]

const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
const diasSemCurtos = ["D", "S", "T", "Q", "Q", "S", "S"]

const insightsFixos = [
  { icone: "📈", cor: "#7c3aed", texto: "Você é mais consistente às terças e quintas." },
  { icone: "⭐", cor: "#f59e0b", texto: "Seus dias perfeitos aumentaram 40%." },
  { icone: "🎯", cor: "#059669", texto: "Sua sequência média é de 14 dias." },
]

type Habito = {
  id: number
  nome: string
  icone: string
  meta: string
  tipo: "positivo" | "negativo"
  historico: string[]
}

const COL = 160
const CELL = 22

function strDia(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
}

function getDiasDoMes(ano: number, mes: number) {
  return new Date(ano, mes + 1, 0).getDate()
}

function getStreak(hist: string[], hoje: string) {
  if (!hist?.length) return 0
  let streak = 0
  const d = new Date(hoje)
  while (true) {
    const k = d.toISOString().slice(0, 10)
    if (hist.includes(k)) { streak++; d.setDate(d.getDate() - 1) }
    else break
  }
  return streak
}

function getMelhorStreak(hist: string[]) {
  if (!hist?.length) return 0
  const sorted = [...hist].sort()
  let best = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000
    if (diff === 1) { cur++; if (cur > best) best = cur } else cur = 1
  }
  return best
}

export default function Habitos() {
  const { data, setHabitos } = usePlanner()
  const habitos = (data.habitos || []) as unknown as Habito[]

  const hoje = new Date()
  const hojeStr = hoje.toISOString().slice(0, 10)

  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [modal, setModal] = useState(false)
  const [novo, setNovo] = useState({ nome: "", icone: "🧠", meta: "", tipo: "positivo" as "positivo" | "negativo" })

  const totalDias = getDiasDoMes(ano, mes)
  const dias = Array.from({ length: totalDias }, (_, i) => i + 1)
  const isMesAtual = ano === hoje.getFullYear() && mes === hoje.getMonth()

  const habitosPositivos = habitos.filter(h => h.tipo !== "negativo")
  const habitosNegativos = habitos.filter(h => h.tipo === "negativo")

  function toggleDia(id: number, dia: number) {
    const key = strDia(ano, mes, dia)
    if (key > hojeStr) return
    setHabitos(habitos.map(h => {
      if (h.id !== id) return h
      const hist = h.historico || []
      const feito = hist.includes(key)
      return { ...h, historico: feito ? hist.filter(d => d !== key) : [...hist, key] }
    }) as any)
  }

  function adicionarHabito() {
    if (!novo.nome.trim()) return
    setHabitos([...(habitos as any), {
      id: Date.now(), nome: novo.nome, icone: novo.icone,
      meta: novo.meta || (novo.tipo === "negativo" ? "Todos os dias" : "1x por dia"),
      tipo: novo.tipo, historico: []
    }] as any)
    setNovo({ nome: "", icone: "🧠", meta: "", tipo: "positivo" })
    setModal(false)
  }

  function deletar(id: number) {
    setHabitos(habitos.filter(h => h.id !== id) as any)
  }

  function navMes(dir: number) {
    let nm = mes + dir, na = ano
    if (nm < 0) { nm = 11; na-- }
    if (nm > 11) { nm = 0; na++ }
    setMes(nm); setAno(na)
  }

  const prefixoMes = `${ano}-${String(mes + 1).padStart(2, "0")}`
  const totalPossivel = habitos.length * totalDias
  const totalFeito = habitos.reduce((a, h) => a + (h.historico || []).filter(d => d.startsWith(prefixoMes)).length, 0)
  const consistencia = totalPossivel === 0 ? 0 : Math.round((totalFeito / totalPossivel) * 100)

  const diasPerfeitos = dias.filter(d => {
    const key = strDia(ano, mes, d)
    return key <= hojeStr && habitos.length > 0 && habitos.every(h => (h.historico || []).includes(key))
  }).length

  const todasStreaks = habitos.map(h => ({
    ...h, streak: getStreak(h.historico || [], hojeStr),
    melhor: getMelhorStreak(h.historico || [])
  }))

  const melhorSeqGeral = todasStreaks.length > 0 ? Math.max(...todasStreaks.map(h => h.melhor)) : 0
  const melhorSeqHabito = todasStreaks.find(h => h.melhor === melhorSeqGeral)
  const totalConcluido = habitos.reduce((a, h) => a + (h.historico || []).length, 0)
  const sequenciasAtivas = todasStreaks.filter(h => h.streak > 0).sort((a, b) => b.streak - a.streak)

  const iconesList = novo.tipo === "negativo" ? iconesNegativos : iconesPositivos
  const placeholder = iconesList.find(o => o.ic === novo.icone)?.placeholder || "Nome do hábito"

  function renderLinha(h: Habito, isNeg: boolean) {
    const hist = h.historico || []
    const streak = getStreak(hist, hojeStr)
    return (
      <div key={h.id} style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid #0d0d18" }}>
        <div style={{ width: COL, flexShrink: 0, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: isNeg ? "#05906918" : "#7c3aed18", border: `1px solid ${isNeg ? "#05906930" : "#7c3aed30"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{h.icone}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.nome}</div>
            <div style={{ fontSize: 9, color: "#4a4a6a" }}>{h.meta}</div>
            {streak > 0 && <div style={{ fontSize: 9, color: "#f59e0b" }}>🔥 {streak}d</div>}
          </div>
          <button onClick={() => deletar(h.id)} style={{ background: "none", border: "none", color: "#2e2e4e", cursor: "pointer", fontSize: 10, padding: 0, flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "5px 0" }}>
          {/* Linha principal */}
          <div style={{ display: "flex" }}>
            {dias.map(d => {
              const key = strDia(ano, mes, d)
              const feito = hist.includes(key)
              const futuro = key > hojeStr
              const ehHoje = key === hojeStr
              const perfeito = feito && habitos.every(hh => (hh.historico || []).includes(key))
              let bg = "#1e1e2e", shadow = "none", content = ""
              if (!futuro && feito) {
                bg = isNeg ? "#059669" : "#7c3aed"
                shadow = `0 0 5px ${isNeg ? "#059669" : "#7c3aed"}60`
                content = perfeito ? "⭐" : "✓"
              } else if (!futuro && !feito && isNeg) {
                bg = "#dc2626"
                shadow = "0 0 4px #dc262640"
                content = "✕"
              } else if (futuro) {
                bg = "#1e1e2e"
              }
              return (
                <div
                  key={d}
                  onClick={() => toggleDia(h.id, d)}
                  title={`${d}/${mes + 1}`}
                  style={{
                    width: CELL, height: 18, borderRadius: 4,
                    background: bg,
                    border: ehHoje ? "1.5px solid #7c3aed60" : "1px solid transparent",
                    cursor: futuro ? "default" : "pointer",
                    opacity: futuro ? 0.35 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, color: "#fff", fontWeight: 600,
                    boxShadow: shadow,
                    transition: "all .15s",
                    flexShrink: 0,
                  }}
                >
                  {content}
                </div>
              )
            })}
          </div>
          {/* Linha decorativa */}
          <div style={{ display: "flex" }}>
            {dias.map(d => {
              const key = strDia(ano, mes, d)
              const feito = hist.includes(key)
              const futuro = key > hojeStr
              const ehHoje = key === hojeStr
              const perfeito = feito && habitos.every(hh => (hh.historico || []).includes(key))
              let bg = "#1a1a2e"
              if (!futuro && feito) bg = isNeg ? "#05906940" : (perfeito ? "#a855f760" : "#7c3aed40")
              else if (!futuro && !feito && isNeg) bg = "#dc262630"
              return (
                <div
                  key={d}
                  onClick={() => toggleDia(h.id, d)}
                  style={{
                    width: CELL, height: 8, borderRadius: 3,
                    background: bg,
                    border: ehHoje ? "1px solid #7c3aed30" : "none",
                    cursor: futuro ? "default" : "pointer",
                    opacity: futuro ? 0.3 : 1,
                    flexShrink: 0,
                    transition: "all .15s",
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", gap: 20, padding: "24px 28px", color: "#e2e8f0" }}>
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Hábitos</h1>
            <p style={{ fontSize: 13, color: "#4a4a6a", margin: "4px 0 0" }}>Pequenas ações, grandes transformações.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 10, overflow: "hidden" }}>
              <button onClick={() => navMes(-1)} style={{ background: "none", border: "none", color: "#6b6b8a", cursor: "pointer", padding: "8px 12px", fontSize: 14 }}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 500, minWidth: 120, textAlign: "center" }}>{mesesNomes[mes]} {ano}</span>
              <button onClick={() => navMes(1)} style={{ background: "none", border: "none", color: "#6b6b8a", cursor: "pointer", padding: "8px 12px", fontSize: 14 }}>›</button>
            </div>
            <button onClick={() => { setMes(hoje.getMonth()); setAno(hoje.getFullYear()) }} style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 8, padding: "7px 14px", color: isMesAtual ? "#4a4a6a" : "#a855f7", cursor: "pointer", fontSize: 12 }}>Hoje</button>
            <button onClick={() => setModal(true)} style={{ background: "#7c3aed", border: "none", borderRadius: 8, padding: "8px 18px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>+ Novo hábito</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Consistência geral", valor: `${consistencia}%`, sub: "este mês", ring: true },
            { label: "Melhor sequência", valor: `${melhorSeqGeral} dias`, sub: melhorSeqHabito?.nome || "—", icone: "🔥" },
            { label: "Dias perfeitos", valor: diasPerfeitos, sub: "este mês", icone: "⭐" },
            { label: "Total concluído", valor: totalConcluido, sub: `de ${totalPossivel} possíveis`, icone: "✓" },
          ].map((s: any, i) => (
            <div key={i} style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              {s.ring ? (
                <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
                  <svg width="52" height="52" viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="20" fill="none" stroke="#1a1a2e" strokeWidth="5" />
                    <circle cx="26" cy="26" r="20" fill="none" stroke="#7c3aed" strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 20 * consistencia / 100} ${2 * Math.PI * 20}`}
                      strokeLinecap="round" transform="rotate(-90 26 26)" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#a855f7" }}>{consistencia}%</div>
                </div>
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 11, background: "#12121f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icone}</div>
              )}
              <div>
                <div style={{ fontSize: 11, color: "#4a4a6a" }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{s.valor}</div>
                <div style={{ fontSize: 10, color: "#4a4a6a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Grade */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #1a1a2e" }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{mesesNomes[mes]} {ano}</span>
            <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#6b6b8a", flexWrap: "wrap" }}>
              {[
                { cor: "#7c3aed", label: "Completo" },
                { cor: "#1e1e2e", label: "Não feito" },
                { label: "Dia perfeito", star: true },
                { cor: "#059669", label: "Dia limpo" },
                { cor: "#dc2626", label: "Recaída" },
              ].map((l: any, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  {l.star ? <span style={{ fontSize: 9 }}>⭐</span> : <span style={{ width: 8, height: 8, borderRadius: 2, background: l.cor, display: "inline-block" }} />}
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: `${COL + totalDias * CELL}px` }}>

              {/* Header dias */}
              <div style={{ display: "flex", padding: "5px 0 3px", borderBottom: "1px solid #1a1a2e", background: "#0a0a14" }}>
                <div style={{ width: COL, flexShrink: 0, padding: "0 12px", fontSize: 9, color: "#4a4a6a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center" }}>HÁBITOS</div>
                {dias.map(d => {
                  const key = strDia(ano, mes, d)
                  const ehHoje = key === hojeStr
                  const diaSem = new Date(key + "T00:00:00").getDay()
                  const perfeito = habitos.length > 0 && habitos.every(h => (h.historico || []).includes(key)) && key <= hojeStr
                  return (
                    <div key={d} style={{ width: CELL, flexShrink: 0, textAlign: "center" }}>
                      <div style={{ fontSize: 7, color: "#2e2e4e" }}>{diasSemCurtos[diaSem]}</div>
                      <div style={{ fontSize: 9, fontWeight: ehHoje ? 700 : 400, color: ehHoje ? "#a855f7" : perfeito ? "#f59e0b" : "#4a4a6a" }}>
                        {perfeito ? "⭐" : d}
                      </div>
                    </div>
                  )
                })}
              </div>

              {habitosPositivos.length > 0 && (
                <>
                  <div style={{ padding: "6px 12px 3px", fontSize: 9, color: "#4a4a6a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", background: "#0a0a14" }}>Hábitos Positivos</div>
                  {habitosPositivos.map(h => renderLinha(h, false))}
                </>
              )}

              {habitosNegativos.length > 0 && (
                <>
                  <div style={{ padding: "6px 12px 3px", fontSize: 9, color: "#4a4a6a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", background: "#0a0a14", borderTop: "1px solid #1a1a2e" }}>Hábitos Negativos</div>
                  {habitosNegativos.map(h => renderLinha(h, true))}
                </>
              )}

              {habitos.length === 0 && (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#4a4a6a" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🔥</div>
                  <div style={{ fontSize: 14 }}>Nenhum hábito ainda.</div>
                </div>
              )}

              <div style={{ padding: "8px 12px", borderTop: "1px solid #0d0d18" }}>
                <button onClick={() => setModal(true)} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
                  <span>+</span> Adicionar hábito
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ width: 210, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#c4b5fd", marginBottom: 14 }}>Resumo do mês</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="24" fill="none" stroke="#1a1a2e" strokeWidth="5" />
                <circle cx="30" cy="30" r="24" fill="none" stroke="#7c3aed" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 24 * consistencia / 100} ${2 * Math.PI * 24}`}
                  strokeLinecap="round" transform="rotate(-90 30 30)" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#a855f7" }}>{consistencia}%</div>
                <div style={{ fontSize: 8, color: "#4a4a6a" }}>consistência</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
              {[
                { cor: "#7c3aed", label: "Concluídos", val: totalFeito },
                { cor: "#1e1e2e", label: "Não concluídos", val: totalPossivel - totalFeito },
                { cor: "#f59e0b", label: "Dias perfeitos", val: diasPerfeitos },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: item.cor, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: "#6b6b8a", flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#12121f", borderRadius: 8, padding: "8px 10px", fontSize: 11, color: "#6b6b8a", lineHeight: 1.5, borderLeft: "2px solid #7c3aed" }}>
            Você está construindo uma versão melhor de você. 💜
          </div>
        </div>

        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#c4b5fd", marginBottom: 12 }}>Sequências atuais</div>
          {sequenciasAtivas.length === 0 ? (
            <div style={{ fontSize: 12, color: "#4a4a6a" }}>Nenhuma sequência ativa</div>
          ) : sequenciasAtivas.slice(0, 5).map((h, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>{h.icone}</span>
              <span style={{ flex: 1, fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.nome}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b" }}>{h.streak} dias</span>
              <span>🔥</span>
            </div>
          ))}
        </div>

        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#c4b5fd", marginBottom: 12 }}>Insights do mês</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {insightsFixos.map((ins, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: ins.cor + "18", border: "1px solid " + ins.cor + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{ins.icone}</div>
                <p style={{ margin: 0, fontSize: 11, color: "#6b6b8a", lineHeight: 1.5 }}>{ins.texto}</p>
              </div>
            ))}
          </div>
          <button style={{ marginTop: 12, width: "100%", background: "none", border: "none", color: "#a855f7", cursor: "pointer", fontSize: 11, textAlign: "left", display: "flex", justifyContent: "space-between" }}>
            Ver relatório completo <span>→</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000092", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(8px)" }}>
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 20, padding: 24, width: 480, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px #00000090" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Novo hábito</h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { v: "positivo", label: "Hábito positivo", prefix: "✓", cor: "#7c3aed", sub: "Marcar quando fizer" },
                { v: "negativo", label: "Hábito negativo", prefix: "✕", cor: "#dc2626", sub: "Marcar quando recair" },
              ].map(t => (
                <button key={t.v} onClick={() => setNovo({ ...novo, tipo: t.v as any, icone: t.v === "negativo" ? "🚬" : "🧠" })} style={{
                  padding: "14px 12px", borderRadius: 12, border: "2px solid",
                  borderColor: novo.tipo === t.v ? t.cor : "#1e1e35",
                  background: novo.tipo === t.v ? t.cor + "15" : "#12121f",
                  cursor: "pointer", textAlign: "center",
                  boxShadow: novo.tipo === t.v ? `0 0 20px ${t.cor}25` : "none",
                  transition: "all .2s"
                }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: novo.tipo === t.v ? t.cor : "#6b6b8a", marginBottom: 4 }}>{t.prefix} {t.label}</div>
                  <div style={{ fontSize: 11, color: novo.tipo === t.v ? t.cor + "aa" : "#4a4a6a" }}>{t.sub}</div>
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 10, fontWeight: 500 }}>
                Ícone ({novo.tipo === "negativo" ? "hábito negativo" : "hábito positivo"})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {iconesList.map(({ ic }) => {
                  const sel = novo.icone === ic
                  const cor = novo.tipo === "negativo" ? "#dc2626" : "#7c3aed"
                  return (
                    <button key={ic} onClick={() => setNovo({ ...novo, icone: ic })} style={{
                      width: "100%", aspectRatio: "1", borderRadius: 10, border: "1px solid",
                      borderColor: sel ? cor : "#1e1e35",
                      background: sel ? cor + "18" : "#12121f",
                      cursor: "pointer", fontSize: 22,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: sel ? `0 0 12px ${cor}40` : "none",
                      transform: sel ? "scale(1.08)" : "scale(1)",
                      transition: "all .15s",
                    }}>{ic}</button>
                  )
                })}
              </div>
            </div>

            {novo.tipo === "negativo" && (
              <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#05906912", border: "1px solid #05906930", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#05906920", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🌿</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#10b981", marginBottom: 2 }}>Hábito negativo: você marca quando recair.</div>
                  <div style={{ fontSize: 11, color: "#4a4a6a" }}>O objetivo é manter dias limpos e evitar recaídas.</div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 6, fontWeight: 500 }}>Nome do hábito</div>
              <input autoFocus placeholder={placeholder} value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} onKeyDown={e => e.key === "Enter" && adicionarHabito()} style={{ width: "100%", background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "11px 14px", color: "#e2e8f0", fontSize: 14, outline: "none" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 6, fontWeight: 500 }}>Meta diária (opcional)</div>
              <input placeholder={novo.tipo === "negativo" ? "Ex: Todos os dias" : "Ex: 2h por dia"} value={novo.meta} onChange={e => setNovo({ ...novo, meta: e.target.value })} style={{ width: "100%", background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "11px 14px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
            </div>

            <button onClick={adicionarHabito} disabled={!novo.nome.trim()} style={{
              width: "100%",
              background: !novo.nome.trim() ? "#1e1e35" : novo.tipo === "negativo" ? "linear-gradient(135deg, #dc2626, #ef4444)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
              border: "none", borderRadius: 10, padding: "13px",
              color: novo.nome.trim() ? "#fff" : "#4a4a6a",
              cursor: novo.nome.trim() ? "pointer" : "not-allowed",
              fontSize: 14, fontWeight: 600, transition: "all .2s",
              boxShadow: novo.nome.trim() ? (novo.tipo === "negativo" ? "0 4px 20px #dc262640" : "0 4px 20px #7c3aed40") : "none"
            }}>
              Criar hábito {novo.tipo === "negativo" ? "negativo" : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}