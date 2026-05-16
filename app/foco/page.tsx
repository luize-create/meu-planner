"use client"

import { useState, useEffect, useRef } from "react"
import { usePlanner } from "../context/PlannerContext"

const MODOS = {
  foco: { label: "Foco profundo", minutos: 25, cor: "#7c3aed" },
  curta: { label: "Pausa curta", minutos: 5, cor: "#059669" },
  longa: { label: "Pausa longa", minutos: 15, cor: "#2563eb" },
}
type Modo = keyof typeof MODOS

const frases = [
  "Volte para o presente.",
  "Uma coisa de cada vez.",
  "Clareza nasce da continuidade.",
  "Aqui. Agora. Isso.",
  "Respire. Comece. Continue.",
  "O foco é um ato de cuidado.",
  "Silêncio mental é produtividade.",
]

const presets = [15, 20, 25, 30, 45, 60]
const intencoes = ["Construir", "Aprender", "Organizar", "Descansar mentalmente", "Avançar com calma"]

function getSegundosRestantes(): number {
  try {
    const iniciou = localStorage.getItem("foco-iniciou")
    const duracao = Number(localStorage.getItem("foco-duracao") || 25 * 60)
    const rodando = localStorage.getItem("foco-rodando") === "true"
    if (iniciou && rodando) {
      const elapsed = Math.floor((Date.now() - Number(iniciou)) / 1000)
      const restante = duracao - elapsed
      return restante > 0 ? restante : 0
    }
    return duracao
  } catch { return 25 * 60 }
}

function getTempoCustomInicial(): number {
  try { return Number(localStorage.getItem("foco-tempo-custom") || 25) } catch { return 25 }
}

function getRodandoInicial(): boolean {
  try {
    if (localStorage.getItem("foco-rodando") !== "true") return false
    const iniciou = localStorage.getItem("foco-iniciou")
    const duracao = Number(localStorage.getItem("foco-duracao") || 25 * 60)
    if (!iniciou) return false
    const elapsed = Math.floor((Date.now() - Number(iniciou)) / 1000)
    return elapsed < duracao
  } catch { return false }
}

export default function Foco() {
  const { data, setSessoesFoco, setTarefas, adicionarXP } = usePlanner()
  const sessoesFoco = data.sessoesFoco as any[]
  const tarefas = data.tarefas as any[]

  const tempoInicial = getTempoCustomInicial()
  const [modo, setModo] = useState<Modo>("foco")
  const [tempoCustom, setTempoCustom] = useState(tempoInicial)
  const [horas, setHoras] = useState(Math.floor(tempoInicial / 60))
  const [minutos, setMinutos] = useState(tempoInicial % 60)
  const [segundos, setSegundos] = useState(getSegundosRestantes)
  const [rodando, setRodando] = useState(getRodandoInicial)
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null)

  const [metaDiaria, setMetaDiaria] = useState(() => {
    try { return Number(localStorage.getItem("foco-meta-diaria") || 120) } catch { return 120 }
  })
  const [editandoMeta, setEditandoMeta] = useState(false)
  const [intencao, setIntencao] = useState("")
  const [intencaoTexto, setIntencaoTexto] = useState("")
  const [tarefaSelecionada, setTarefaSelecionada] = useState<any>(null)
  const [sessaoConcluida, setSessaoConcluida] = useState(false)

  const hoje = new Date().toISOString().slice(0, 10)
  const sessoesHoje = sessoesFoco.filter((s: any) => s.data === hoje)
  const hojeMin = sessoesHoje.reduce((acc: number, s: any) => acc + (s.minutos || 0), 0)
  const totalMin = sessoesFoco.reduce((acc: number, s: any) => acc + (s.minutos || 0), 0)
  const minAtual = rodando ? Math.floor((tempoCustom * 60 - segundos) / 60) : 0
  const hojeMinTotal = hojeMin + minAtual
  const totalMinGeral = totalMin + minAtual
  const pctMeta = metaDiaria > 0 ? Math.min(100, Math.round(hojeMinTotal / metaDiaria * 100)) : 0
  const consistencia = sessoesHoje.length > 0 ? Math.min(100, Math.round((sessoesHoje.length / 4) * 100)) : 0
  const frase = frases[new Date().getDay() % frases.length]
  const tarefasHoje = tarefas.filter((t: any) => t.data === hoje && !t.feita)
  const cor = MODOS[modo].cor

  useEffect(() => {
    if (rodando) {
      localStorage.setItem("foco-rodando", "true")
      localStorage.setItem("foco-duracao", String(tempoCustom * 60))
      localStorage.setItem("foco-tempo-custom", String(tempoCustom))
      if (!localStorage.getItem("foco-iniciou")) {
        localStorage.setItem("foco-iniciou", String(Date.now() - (tempoCustom * 60 - segundos) * 1000))
      }
      intervalo.current = setInterval(() => {
        const restante = getSegundosRestantes()
        setSegundos(restante)
        if (restante <= 0) {
          clearInterval(intervalo.current!)
          setRodando(false)
          localStorage.setItem("foco-rodando", "false")
          localStorage.removeItem("foco-iniciou")
          if (modo === "foco") {
            concluirSessao()
            setSessaoConcluida(true)
          }
        }
      }, 1000)
    } else {
      if (intervalo.current) clearInterval(intervalo.current)
    }
    return () => { if (intervalo.current) clearInterval(intervalo.current) }
  }, [rodando])

  function concluirSessao() {
    const tarefaNome = tarefaSelecionada?.texto || intencaoTexto || intencao || "Sessão de foco"
    const nova: any = {
      id: Date.now(),
      tipo: MODOS[modo].label,
      tarefa: tarefaNome,
      tarefaId: tarefaSelecionada?.id || null,
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      minutos: tempoCustom,
      data: hoje,
    }
    setSessoesFoco([nova, ...sessoesFoco].slice(0, 100) as any)
    adicionarXP(50)
    if (tarefaSelecionada) {
      setTarefas(tarefas.map((t: any) =>
        t.id === tarefaSelecionada.id ? { ...t, feita: true } : t
      ) as any)
      setTarefaSelecionada(null)
    }
  }

  function iniciarOuPausar() {
    if (sessaoConcluida) return
    if (!rodando) {
      localStorage.setItem("foco-iniciou", String(Date.now() - (tempoCustom * 60 - segundos) * 1000))
    } else {
      localStorage.removeItem("foco-iniciou")
      localStorage.setItem("foco-rodando", "false")
    }
    setRodando(!rodando)
  }

  function mudarModo(m: Modo) {
    setModo(m)
    setRodando(false)
    const t = MODOS[m].minutos
    setTempoCustom(t); setMinutos(t % 60); setHoras(Math.floor(t / 60)); setSegundos(t * 60)
    setSessaoConcluida(false)
    localStorage.setItem("foco-rodando", "false")
    localStorage.removeItem("foco-iniciou")
    localStorage.setItem("foco-tempo-custom", String(t))
    localStorage.setItem("foco-duracao", String(t * 60))
  }

  function selecionarPreset(t: number) {
    setRodando(false)
    setTempoCustom(t); setMinutos(t % 60); setHoras(Math.floor(t / 60)); setSegundos(t * 60)
    localStorage.setItem("foco-rodando", "false")
    localStorage.removeItem("foco-iniciou")
    localStorage.setItem("foco-tempo-custom", String(t))
    localStorage.setItem("foco-duracao", String(t * 60))
  }

  function ajustarMinutos(delta: number) {
    const novoMin = Math.max(0, Math.min(59, minutos + delta))
    setMinutos(novoMin)
    const total = horas * 60 + novoMin
    if (total > 0) {
      setTempoCustom(total); setSegundos(total * 60)
      localStorage.setItem("foco-tempo-custom", String(total))
      localStorage.setItem("foco-duracao", String(total * 60))
    }
    setRodando(false)
    localStorage.setItem("foco-rodando", "false")
    localStorage.removeItem("foco-iniciou")
  }

  function salvarMeta(valor: number) {
    if (valor > 0) {
      setMetaDiaria(valor)
      localStorage.setItem("foco-meta-diaria", String(valor))
    }
    setEditandoMeta(false)
  }

  function resetar() {
    setRodando(false); setSegundos(tempoCustom * 60); setSessaoConcluida(false)
    localStorage.setItem("foco-rodando", "false")
    localStorage.removeItem("foco-iniciou")
  }

  const minStr = String(Math.floor(segundos / 60)).padStart(2, "0")
  const segStr = String(segundos % 60).padStart(2, "0")
  const total = tempoCustom * 60
  const pct = total > 0 ? ((total - segundos) / total) : 0
  const raio = 140
  const circ = 2 * Math.PI * raio

  return (
    <div style={{ padding: "24px 32px", color: "#e2e8f0", minHeight: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Modo foco</h1>
          <p style={{ fontSize: 13, color: "#4a4a6a", margin: "4px 0 0", fontStyle: "italic" }}>Um espaço para desacelerar o ruído.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {rodando && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: cor + "18", border: `1px solid ${cor}30`, borderRadius: 20, padding: "5px 12px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: cor, boxShadow: `0 0 6px ${cor}` }} />
              <span style={{ fontSize: 12, color: cor, fontWeight: 500 }}>Em sessão · {minStr}:{segStr}</span>
            </div>
          )}
          <div style={{ fontSize: 12, color: "#4a4a6a" }}>
            Hoje: <span style={{ color: "#a855f7" }}>{Math.floor(hojeMinTotal / 60)}h {hojeMinTotal % 60}m</span>
            <span style={{ margin: "0 6px", color: "#2e2e4e" }}>·</span>
            Total: <span style={{ color: "#6b6b8a" }}>{Math.floor(totalMinGeral / 60)}h {totalMinGeral % 60}m</span>
          </div>
        </div>
      </div>

      {/* Frase */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: "#4a4a6a", fontStyle: "italic" }}>❝ {frase} ❞</span>
      </div>

      {/* Layout principal — 2 colunas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, marginBottom: 20 }}>

        {/* Centro — Timer + Intenção */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Seletor modo */}
          <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "#0a0a14", border: "1px solid #1a1a2e", borderRadius: 14, padding: 5 }}>
            {(Object.keys(MODOS) as Modo[]).map(m => (
              <button key={m} onClick={() => mudarModo(m)} style={{ padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: modo === m ? MODOS[m].cor + "30" : "transparent", color: modo === m ? MODOS[m].cor : "#4a4a6a", transition: "all .25s", boxShadow: modo === m ? `0 0 14px ${MODOS[m].cor}25` : "none" }}>
                {MODOS[m].label}
              </button>
            ))}
          </div>

          {/* Timer circle */}
          <div style={{ position: "relative", width: 360, height: 360, marginBottom: 32 }}>
            <div style={{ position: "absolute", inset: "-8%", borderRadius: "50%", background: `radial-gradient(circle, ${cor}14, transparent 65%)`, filter: "blur(28px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: "18%", borderRadius: "50%", background: `radial-gradient(circle, ${cor}08, transparent 70%)`, filter: "blur(14px)", pointerEvents: "none" }} />
            <svg width="360" height="360" viewBox="0 0 360 360" style={{ position: "absolute", inset: 0 }}>
              <circle cx="180" cy="180" r="172" fill="none" stroke="#1a1a2e" strokeWidth="1" strokeDasharray="3 7" />
              <circle cx="180" cy="180" r={raio} fill="none" stroke="#1a1a2e" strokeWidth="4" />
              <circle cx="180" cy="180" r={raio} fill="none" stroke={cor} strokeWidth="4"
                strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round" transform="rotate(-90 180 180)"
                style={{ transition: "stroke-dasharray .5s", filter: `drop-shadow(0 0 8px ${cor})` }} />
              {pct > 0.01 && (
                <circle cx={180 + raio * Math.cos(-Math.PI / 2 + 2 * Math.PI * pct)} cy={180 + raio * Math.sin(-Math.PI / 2 + 2 * Math.PI * pct)}
                  r="7" fill={cor} style={{ filter: `drop-shadow(0 0 5px ${cor})` }} />
              )}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: `1.5px solid ${cor}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${cor}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: cor }} />
                </div>
              </div>
              <div style={{ fontSize: 14, color: cor, fontWeight: 500 }}>{MODOS[modo].label}</div>
              <div style={{ fontSize: 68, fontWeight: 200, letterSpacing: 4, color: sessaoConcluida ? cor : "#e2e8f0", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                {sessaoConcluida ? "✓" : `${minStr}:${segStr}`}
              </div>
              <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 8 }}>
                {sessaoConcluida ? "Sessão concluída! +50 XP 🎉" : rodando ? "Em andamento..." : "Tempo restante"}
              </div>
              {(tarefaSelecionada || intencaoTexto || intencao) && !sessaoConcluida && (
                <div style={{ fontSize: 11, color: "#4a4a6a", maxWidth: 180, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tarefaSelecionada?.texto || intencaoTexto || intencao}
                </div>
              )}
              <button onClick={iniciarOuPausar} disabled={sessaoConcluida}
                style={{ width: 52, height: 52, borderRadius: "50%", marginTop: 8, background: sessaoConcluida ? "#059669" : rodando ? "#1a1a2e" : cor, border: rodando && !sessaoConcluida ? `2px solid ${cor}` : "none", cursor: sessaoConcluida ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff", boxShadow: `0 0 20px ${sessaoConcluida ? "#059669" : cor}50`, transition: "all .25s" }}>
                {sessaoConcluida ? "✓" : rodando ? "⏸" : "▶"}
              </button>
            </div>
          </div>

          {/* Presets + controles */}
          {!sessaoConcluida && (
            <div style={{ width: "100%", maxWidth: 420 }}>
              <div style={{ fontSize: 11, color: "#4a4a6a", fontWeight: 500, textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Duração</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
                {presets.map(p => {
                  const ativo = tempoCustom === p
                  return (
                    <button key={p} onClick={() => selecionarPreset(p)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 12, border: "1px solid", borderColor: ativo ? cor : "#1a1a2e", background: ativo ? cor + "25" : "#0f0f1c", cursor: "pointer", transition: "all .2s", boxShadow: ativo ? `0 0 14px ${cor}35` : "none" }}>
                      <span style={{ fontSize: 16, fontWeight: ativo ? 600 : 400, color: ativo ? cor : "#6b6b8a" }}>{p}</span>
                      <span style={{ fontSize: 9, color: ativo ? cor + "cc" : "#3a3a5a" }}>min</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 12, padding: "14px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#6b6b8a", fontSize: 13 }}>
                  Personalizado ✎
                </div>
                <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <button onClick={() => ajustarMinutos(-5)} style={{ background: "none", border: "none", color: "#6b6b8a", cursor: "pointer", fontSize: 18, padding: "0 4px" }}>−</button>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 300, color: "#e2e8f0", letterSpacing: 2, fontVariantNumeric: "tabular-nums" }}>{String(horas).padStart(2, "0")}</div>
                      <div style={{ fontSize: 9, color: "#4a4a6a" }}>hh</div>
                    </div>
                    <span style={{ fontSize: 18, color: "#4a4a6a" }}>:</span>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 300, color: "#e2e8f0", letterSpacing: 2, fontVariantNumeric: "tabular-nums" }}>{String(minutos).padStart(2, "0")}</div>
                      <div style={{ fontSize: 9, color: "#4a4a6a" }}>min</div>
                    </div>
                  </div>
                  <button onClick={() => ajustarMinutos(5)} style={{ background: "none", border: "none", color: "#6b6b8a", cursor: "pointer", fontSize: 18, padding: "0 4px" }}>+</button>
                </div>
                <button onClick={resetar} style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 12, padding: "14px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: cor, fontSize: 13, cursor: "pointer" }}>
                  <span>↺</span> Redefinir
                </button>
              </div>
            </div>
          )}

          {rodando && (
            <button onClick={() => { setRodando(false); resetar() }} style={{ marginTop: 16, background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 12 }}>
              ☐ Abandonar sessão
            </button>
          )}

          {/* Intenção */}
          <div style={{ width: "100%", maxWidth: 420, marginTop: 24, background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span>🎯</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Intenção da sessão</span>
            </div>
            {tarefasHoje.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 6 }}>Tarefas de hoje</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {tarefasHoje.slice(0, 3).map((t: any) => (
                    <div key={t.id} onClick={() => { setTarefaSelecionada(tarefaSelecionada?.id === t.id ? null : t); setIntencaoTexto(""); setIntencao("") }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, border: "1px solid", cursor: "pointer", transition: "all .15s", borderColor: tarefaSelecionada?.id === t.id ? cor : "#1e1e35", background: tarefaSelecionada?.id === t.id ? cor + "15" : "#12121f" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: tarefaSelecionada?.id === t.id ? cor : "#3a3a5a", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: tarefaSelecionada?.id === t.id ? "#e2e8f0" : "#6b6b8a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.texto}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <input placeholder="Ou escreva livremente..." value={intencaoTexto}
              onChange={e => { setIntencaoTexto(e.target.value); setTarefaSelecionada(null); setIntencao("") }}
              style={{ width: "100%", background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontSize: 12, outline: "none", marginBottom: 10 }} />
            <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 6 }}>Chip de intenção</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {intencoes.map(i => (
                <button key={i} onClick={() => { setIntencao(intencao === i ? "" : i); setIntencaoTexto(""); setTarefaSelecionada(null) }}
                  style={{ padding: "5px 10px", borderRadius: 20, border: "1px solid", fontSize: 11, cursor: "pointer", transition: "all .15s", borderColor: intencao === i ? cor : "#1e1e35", background: intencao === i ? cor + "20" : "#12121f", color: intencao === i ? cor : "#6b6b8a" }}>{i}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Direita — Métricas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span>〰️</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Métricas de hoje</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Sessões", valor: sessoesHoje.length + (rodando ? 1 : 0) },
                { label: "Minutos focados", valor: `${Math.floor(hojeMinTotal / 60)}h ${hojeMinTotal % 60}m` },
                { label: "XP ganho", valor: `+${sessoesHoje.length * 50}` },
                { label: "Consistência", valor: `${consistencia}%` },
              ].map((m, i) => (
                <div key={i} style={{ background: "#12121f", borderRadius: 10, padding: "12px 10px" }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: i === 2 ? "#f59e0b" : "#e2e8f0", marginBottom: 2 }}>{m.valor}</div>
                  <div style={{ fontSize: 10, color: "#4a4a6a" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Meta diária */}
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Meta diária</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {editandoMeta ? (
                  <>
                    <input type="number" min={10} max={480} defaultValue={metaDiaria} autoFocus
                      onBlur={e => salvarMeta(Number(e.target.value))}
                      onKeyDown={e => e.key === "Enter" && salvarMeta(Number((e.target as HTMLInputElement).value))}
                      style={{ width: 60, background: "#12121f", border: `1px solid ${cor}`, borderRadius: 6, padding: "3px 8px", color: "#e2e8f0", fontSize: 12, outline: "none", textAlign: "center" }} />
                    <span style={{ fontSize: 11, color: "#4a4a6a" }}>min</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 13, color: cor }}>{pctMeta}%</span>
                    <button onClick={() => setEditandoMeta(true)} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 13, padding: "0 2px" }}>✎</button>
                  </>
                )}
              </div>
            </div>
            <div style={{ background: "#1a1a2e", borderRadius: 20, height: 5, marginBottom: 6 }}>
              <div style={{ background: `linear-gradient(90deg, ${cor}, ${cor}88)`, height: 5, borderRadius: 20, width: `${pctMeta}%`, transition: "width .4s", boxShadow: `0 0 6px ${cor}60` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "#4a4a6a" }}>{hojeMinTotal} de {metaDiaria} minutos</span>
              {!editandoMeta && <button onClick={() => setEditandoMeta(true)} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 10, padding: 0 }}>Alterar meta</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Sessões recentes */}
      <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>⏱</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Sessões de hoje</span>
          </div>
          <span style={{ fontSize: 12, color: "#4a4a6a" }}>{sessoesHoje.length} sessões · {hojeMinTotal} min</span>
        </div>
        {sessoesHoje.length === 0 && !rodando && (
          <div style={{ fontSize: 13, color: "#4a4a6a" }}>Nenhuma sessão ainda hoje. Inicie seu primeiro bloco de foco!</div>
        )}
        {rodando && sessoesHoje.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: cor + "10", border: `1px solid ${cor}20`, borderRadius: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor, boxShadow: `0 0 6px ${cor}` }} />
            <span style={{ fontSize: 13, color: cor }}>Sessão em andamento... {minStr}:{segStr}</span>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8, marginTop: sessoesHoje.length > 0 ? 0 : 8 }}>
          {sessoesHoje.slice(0, 6).map((s: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#12121f", borderRadius: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: cor + "20", border: `1px solid ${cor}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13 }}>▶</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{s.minutos} min · {s.tipo}</div>
                <div style={{ fontSize: 11, color: "#4a4a6a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.tarefa}</div>
              </div>
              <span style={{ fontSize: 10, color: "#3a3a5a", flexShrink: 0 }}>{s.hora}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}