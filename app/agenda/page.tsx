"use client"

import { useState, useEffect } from "react"

type Bloco = {
  id: number
  titulo: string
  data: string
  horaInicio: string
  horaFim: string
  categoria: string
  cor: string
  recorrencia: string
  concluido: boolean
}

const categorias = [
  { label: "Estudos", cor: "#7c3aed" },
  { label: "IA", cor: "#9333ea" },
  { label: "Programação", cor: "#2563eb" },
  { label: "Trabalho", cor: "#0891b2" },
  { label: "Academia", cor: "#059669" },
  { label: "Saúde", cor: "#16a34a" },
  { label: "Projeto", cor: "#d97706" },
  { label: "Pessoal", cor: "#db2777" },
  { label: "Reunião", cor: "#dc2626" },
]

const recorrencias = ["Nunca", "Diário", "Semanal"]
const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const mesesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function toMin(hora: string) {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

function formatarDuracao(ini: string, fim: string) {
  const diff = toMin(fim) - toMin(ini)
  if (diff <= 0) return ""
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

function temConflito(blocos: Bloco[], data: string) {
  const b = blocos.filter(x => x.data === data).sort((a, b) => toMin(a.horaInicio) - toMin(b.horaInicio))
  for (let i = 0; i < b.length - 1; i++) {
    if (toMin(b[i].horaFim) > toMin(b[i + 1].horaInicio)) return [b[i].titulo, b[i + 1].titulo]
  }
  return null
}

function tempoLivre(blocos: Bloco[], data: string) {
  const b = blocos.filter(x => x.data === data)
  const totalOcupado = b.reduce((acc, x) => acc + Math.max(0, toMin(x.horaFim) - toMin(x.horaInicio)), 0)
  const horasUteis = 16 * 60 // 6h às 22h
  return Math.max(0, horasUteis - totalOcupado)
}

export default function Agenda() {
  const hoje = new Date()
  const hojeStr = hoje.toISOString().slice(0, 10)

  const [blocos, setBlocos] = useState<Bloco[]>(() => {
    if (typeof window === "undefined") return []
    const s = localStorage.getItem("agenda-v3")
    return s ? JSON.parse(s) : []
  })

  const [dia, setDia] = useState(hojeStr)
  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Bloco | null>(null)
  const [form, setForm] = useState({ titulo: "", horaInicio: "09:00", horaFim: "10:00", categoria: "Estudos", recorrencia: "Nunca" })

  useEffect(() => { localStorage.setItem("agenda-v3", JSON.stringify(blocos)) }, [blocos])

  function abrirNovo() {
    setEditando(null)
    setForm({ titulo: "", horaInicio: "09:00", horaFim: "10:00", categoria: "Estudos", recorrencia: "Nunca" })
    setModal(true)
  }

  function abrirEditar(b: Bloco) {
    setEditando(b)
    setForm({ titulo: b.titulo, horaInicio: b.horaInicio, horaFim: b.horaFim, categoria: b.categoria, recorrencia: b.recorrencia })
    setModal(true)
  }

  function salvar() {
    if (!form.titulo.trim()) return
    const cat = categorias.find(c => c.label === form.categoria)
    if (editando) {
      setBlocos(blocos.map(b => b.id === editando.id ? { ...b, ...form, cor: cat?.cor || "#7c3aed" } : b))
    } else {
      const base: Bloco = { id: Date.now(), titulo: form.titulo, data: dia, horaInicio: form.horaInicio, horaFim: form.horaFim, categoria: form.categoria, cor: cat?.cor || "#7c3aed", recorrencia: form.recorrencia, concluido: false }
      const novos = [base]
      if (form.recorrencia === "Diário") {
        for (let i = 1; i <= 30; i++) {
          const d = new Date(dia); d.setDate(d.getDate() + i)
          novos.push({ ...base, id: Date.now() + i, data: d.toISOString().slice(0, 10) })
        }
      } else if (form.recorrencia === "Semanal") {
        for (let i = 1; i <= 12; i++) {
          const d = new Date(dia); d.setDate(d.getDate() + i * 7)
          novos.push({ ...base, id: Date.now() + i, data: d.toISOString().slice(0, 10) })
        }
      }
      setBlocos([...blocos, ...novos])
    }
    setModal(false)
  }

  function deletar(id: number) { setBlocos(blocos.filter(b => b.id !== id)) }
  function toggle(id: number) { setBlocos(blocos.map(b => b.id === id ? { ...b, concluido: !b.concluido } : b)) }

  const blocosDia = blocos.filter(b => b.data === dia).sort((a, b) => toMin(a.horaInicio) - toMin(b.horaInicio))
  const conflito = temConflito(blocos, dia)
  const livreMin = tempoLivre(blocos, dia)
  const livreH = Math.floor(livreMin / 60)
  const livreM = livreMin % 60

  // Próximo compromisso
  const agora = hoje.getHours() * 60 + hoje.getMinutes()
  const proximo = dia === hojeStr ? blocosDia.find(b => toMin(b.horaInicio) > agora && !b.concluido) : null
  const emMin = proximo ? toMin(proximo.horaInicio) - agora : 0

  // Calendário
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const totalDias = new Date(ano, mes + 1, 0).getDate()
  const diasCal = Array.from({ length: primeiroDia }, () => null).concat(Array.from({ length: totalDias }, (_, i) => i + 1))

  function strDia(d: number) {
    return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  }

  // Timeline
  const horasTimeline = Array.from({ length: 17 }, (_, i) => i + 6) // 6h às 22h
  const totalMin = 16 * 60

  return (
    <div style={{ padding: 24, color: "#e2e8f0" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Agenda</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            {new Date(dia + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <button onClick={abrirNovo} style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "9px 18px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          + Novo bloco
        </button>
      </div>

      {/* Cards de info rápida */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>

        {/* Próximo compromisso */}
        <div style={{ background: "#0f0f1a", border: proximo ? "1px solid #7c3aed44" : "1px solid #1e1e2e", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>⏰</span> PRÓXIMO COMPROMISSO
          </div>
          {proximo ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{proximo.titulo}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{proximo.horaInicio}</div>
              <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 4 }}>
                Em {emMin >= 60 ? `${Math.floor(emMin / 60)}h${emMin % 60 > 0 ? ` ${emMin % 60}min` : ""}` : `${emMin}min`}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "#475569" }}>Nenhum compromisso à frente hoje</div>
          )}
        </div>

        {/* Tempo livre */}
        <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🌿</span> TEMPO LIVRE HOJE
          </div>
          <div style={{ fontSize: 24, fontWeight: 300, color: livreH >= 3 ? "#059669" : livreH >= 1 ? "#d97706" : "#dc2626" }}>
            {livreH}h{livreM > 0 ? ` ${livreM}min` : ""}
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{blocosDia.length} blocos agendados</div>
        </div>

        {/* Conflito ou progresso */}
        {conflito ? (
          <div style={{ background: "#0f0f1a", border: "1px solid #dc262644", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: "#dc2626", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span>⚠️</span> CONFLITO DE HORÁRIO
            </div>
            <div style={{ fontSize: 13, color: "#e2e8f0" }}>{conflito[0]}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>conflita com</div>
            <div style={{ fontSize: 13, color: "#e2e8f0" }}>{conflito[1]}</div>
          </div>
        ) : (
          <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span>✓</span> PROGRESSO DO DIA
            </div>
            <div style={{ fontSize: 24, fontWeight: 300 }}>
              {blocosDia.filter(b => b.concluido).length}<span style={{ fontSize: 14, color: "#64748b" }}>/{blocosDia.length}</span>
            </div>
            <div style={{ background: "#1e1e2e", borderRadius: 20, height: 6, marginTop: 8 }}>
              <div style={{ background: "#7c3aed", height: 6, borderRadius: 20, width: `${blocosDia.length === 0 ? 0 : Math.round(blocosDia.filter(b => b.concluido).length / blocosDia.length * 100)}%`, transition: "width .3s" }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>

        {/* Calendário mini */}
        <div>
          <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <button onClick={() => { if (mes === 0) { setMes(11); setAno(ano - 1) } else setMes(mes - 1) }}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}>‹</button>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{mesesAbrev[mes]} {ano}</span>
              <button onClick={() => { if (mes === 11) { setMes(0); setAno(ano + 1) } else setMes(mes + 1) }}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 10, color: "#475569" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {diasCal.map((d, i) => {
                if (!d) return <div key={i} />
                const data = strDia(d)
                const isHoje = data === hojeStr
                const isSel = data === dia
                const temBloco = blocos.some(b => b.data === data)
                return (
                  <div key={i} onClick={() => setDia(data)} style={{
                    textAlign: "center", padding: "5px 2px", borderRadius: 6, cursor: "pointer", fontSize: 11, position: "relative",
                    background: isSel ? "#7c3aed" : isHoje ? "#7c3aed22" : "transparent",
                    color: isSel ? "#fff" : isHoje ? "#a78bfa" : "#e2e8f0",
                  }}>
                    {d}
                    {temBloco && !isSel && <div style={{ position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: "#7c3aed" }} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Navegação do dia */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => { const d = new Date(dia); d.setDate(d.getDate() - 1); setDia(d.toISOString().slice(0, 10)) }}
              style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 8, padding: "6px 12px", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>←</button>
            <button onClick={() => setDia(hojeStr)}
              style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 8, padding: "6px 12px", color: "#a78bfa", cursor: "pointer", fontSize: 12 }}>Hoje</button>
            <button onClick={() => { const d = new Date(dia); d.setDate(d.getDate() + 1); setDia(d.toISOString().slice(0, 10)) }}
              style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 8, padding: "6px 12px", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>→</button>
          </div>

          {/* Legenda categorias */}
          <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>CATEGORIAS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {categorias.map(c => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.cor, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16, color: "#e2e8f0" }}>
            Timeline do dia
          </div>

          {blocosDia.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#475569" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗓</div>
              <div style={{ fontSize: 14, marginBottom: 12 }}>Nenhum bloco agendado</div>
              <button onClick={abrirNovo} style={{ background: "#7c3aed22", border: "1px solid #7c3aed44", borderRadius: 8, padding: "8px 16px", color: "#a78bfa", cursor: "pointer", fontSize: 13 }}>
                + Criar primeiro bloco
              </button>
            </div>
          )}

          <div style={{ position: "relative" }}>
            {horasTimeline.map(h => {
              const hora = `${String(h).padStart(2, "0")}:00`
              const posY = ((h - 6) / 16) * 100
              const blocoNaHora = blocosDia.filter(b => {
                const ini = toMin(b.horaInicio)
                const fim = toMin(b.horaFim)
                return ini >= h * 60 && ini < (h + 1) * 60
              })
              return (
                <div key={h} style={{ display: "flex", gap: 14, minHeight: 56, borderTop: h > 6 ? "1px solid #1e1e2e" : "none" }}>
                  <div style={{ width: 44, flexShrink: 0, fontSize: 11, color: "#475569", paddingTop: 6, textAlign: "right" }}>{hora}</div>
                  <div style={{ flex: 1, paddingTop: 4, paddingBottom: 4, display: "flex", flexDirection: "column", gap: 4 }}>
                    {blocoNaHora.map(b => (
                      <div key={b.id} onClick={() => abrirEditar(b)} style={{
                        padding: "8px 12px", borderRadius: 10, background: b.cor + "18",
                        borderLeft: `3px solid ${b.cor}`, cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        opacity: b.concluido ? 0.5 : 1, transition: "opacity .2s"
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: b.cor, textDecoration: b.concluido ? "line-through" : "none" }}>{b.titulo}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {b.horaInicio} — {b.horaFim}
                            <span style={{ marginLeft: 8, color: "#475569" }}>{formatarDuracao(b.horaInicio, b.horaFim)}</span>
                            {b.recorrencia !== "Nunca" && <span style={{ marginLeft: 8, color: "#7c3aed" }}>↻ {b.recorrencia}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => toggle(b.id)} style={{
                            width: 26, height: 26, borderRadius: 6,
                            background: b.concluido ? "#059669" : "#1e1e2e",
                            border: b.concluido ? "none" : "1px solid #2e2e3e",
                            color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center"
                          }}>✓</button>
                          <button onClick={() => deletar(b.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 16, padding: 24, width: 420, maxWidth: "90vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{editando ? "Editar bloco" : "Novo bloco de tempo"}</h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder="O que você vai fazer?" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                autoFocus onKeyDown={e => e.key === "Enter" && salvar()}
                style={{ background: "#1e1e2e", border: "1px solid #2e2e3e", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Início</div>
                  <input type="time" value={form.horaInicio} onChange={e => setForm({ ...form, horaInicio: e.target.value })}
                    style={{ width: "100%", background: "#1e1e2e", border: "1px solid #2e2e3e", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Fim</div>
                  <input type="time" value={form.horaFim} onChange={e => setForm({ ...form, horaFim: e.target.value })}
                    style={{ width: "100%", background: "#1e1e2e", border: "1px solid #2e2e3e", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
                </div>
              </div>
              {form.horaInicio && form.horaFim && toMin(form.horaFim) > toMin(form.horaInicio) && (
                <div style={{ fontSize: 12, color: "#7c3aed", textAlign: "center" }}>
                  Duração: {formatarDuracao(form.horaInicio, form.horaFim)}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                  style={{ background: "#1e1e2e", border: "1px solid #2e2e3e", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }}>
                  {categorias.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                </select>
                {!editando && (
                  <select value={form.recorrencia} onChange={e => setForm({ ...form, recorrencia: e.target.value })}
                    style={{ background: "#1e1e2e", border: "1px solid #2e2e3e", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }}>
                    {recorrencias.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </div>
              <button onClick={salvar} style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: 12, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500, marginTop: 4 }}>
                {editando ? "Salvar alterações" : "Criar bloco"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}