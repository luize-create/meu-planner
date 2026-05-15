"use client"

import { useState, useEffect, useRef } from "react"
import { usePlanner } from "../context/PlannerContext"

const MODOS = {
  foco: { label: "Foco", minutos: 25, cor: "#7c3aed" },
  curta: { label: "Pausa curta", minutos: 5, cor: "#059669" },
  longa: { label: "Pausa longa", minutos: 15, cor: "#2563eb" },
}

type Modo = keyof typeof MODOS

export default function Foco() {
  const { data, setSessoesFoco, adicionarXP } = usePlanner()
  const sessoesFoco = data.sessoesFoco

  const [modo, setModo] = useState<Modo>("foco")
  const [segundos, setSegundos] = useState(MODOS.foco.minutos * 60)
  const [rodando, setRodando] = useState(false)
  const [tarefa, setTarefa] = useState("")
  const [tempoCustom, setTempoCustom] = useState(25)
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null)

  const hoje = new Date().toISOString().slice(0, 10)
  const sessoesHoje = sessoesFoco.filter(s => s.data === hoje)
  const hojeMin = sessoesHoje.reduce((acc, s) => acc + s.minutos, 0)
  const totalSessoes = sessoesHoje.length

  useEffect(() => {
    if (rodando) {
      intervalo.current = setInterval(() => {
        setSegundos(s => {
          if (s <= 1) {
            clearInterval(intervalo.current!)
            setRodando(false)
            concluirSessao()
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalo.current) clearInterval(intervalo.current)
    }
    return () => { if (intervalo.current) clearInterval(intervalo.current) }
  }, [rodando])

  function concluirSessao() {
    if (modo === "foco") {
      const novaSessao = {
        id: Date.now(),
        tipo: tarefa || "Sessão de foco",
        hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        minutos: Math.round(tempoCustom),
        data: hoje
      }
      setSessoesFoco([novaSessao, ...sessoesFoco].slice(0, 50))
      adicionarXP(50)
    }
  }

  function mudarModo(novoModo: Modo) {
    setModo(novoModo)
    setRodando(false)
    setTempoCustom(MODOS[novoModo].minutos)
    setSegundos(MODOS[novoModo].minutos * 60)
  }

  function aplicarTempo() {
    setRodando(false)
    setSegundos(tempoCustom * 60)
  }

  function resetar() {
    setRodando(false)
    setSegundos(tempoCustom * 60)
  }

  const min = String(Math.floor(segundos / 60)).padStart(2, "0")
  const seg = String(segundos % 60).padStart(2, "0")
  const total = tempoCustom * 60
  const pct = Math.round(((total - segundos) / total) * 100)
  const raio = 110
  const circ = 2 * Math.PI * raio
  const cor = MODOS[modo].cor

  return (
    <div style={{ padding: 24, color: "#e2e8f0" }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Modo Foco</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Concentre-se e seja produtiva</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

          <div style={{ display: "flex", gap: 8, marginBottom: 32, background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 12, padding: 6 }}>
            {(Object.keys(MODOS) as Modo[]).map(m => (
              <button key={m} onClick={() => mudarModo(m)} style={{
                padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                background: modo === m ? MODOS[m].cor + "33" : "transparent",
                color: modo === m ? MODOS[m].cor : "#64748b",
                transition: "all .2s"
              }}>{MODOS[m].label}</button>
            ))}
          </div>

          <div style={{ position: "relative", width: 280, height: 280, marginBottom: 32 }}>
            <svg width="280" height="280" viewBox="0 0 280 280">
              <circle cx="140" cy="140" r={raio} fill="none" stroke="#1e1e2e" strokeWidth="10" />
              <circle cx="140" cy="140" r={raio} fill="none" stroke={cor} strokeWidth="10"
                strokeDasharray={`${circ * pct / 100} ${circ}`}
                strokeLinecap="round" transform="rotate(-90 140 140)"
                style={{ transition: "stroke-dasharray .5s" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 56, fontWeight: 300, letterSpacing: 2, color: "#e2e8f0", fontVariantNumeric: "tabular-nums" }}>{min}:{seg}</div>
              <div style={{ fontSize: 13, color: cor, marginTop: 4 }}>{MODOS[modo].label}</div>
            </div>
          </div>

          <input
            placeholder="Em que você está focando? (opcional)"
            value={tarefa}
            onChange={e => setTarefa(e.target.value)}
            style={{ width: "100%", maxWidth: 360, background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", marginBottom: 16, textAlign: "center" }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Tempo (min):</span>
            <input type="number" min={1} max={120} value={tempoCustom}
              onChange={e => setTempoCustom(Number(e.target.value))}
              style={{ width: 70, background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 8, padding: "8px 10px", color: "#e2e8f0", fontSize: 14, outline: "none", textAlign: "center" }} />
            <button onClick={aplicarTempo} style={{ background: "#1e1e2e", border: "1px solid #2e2e3e", borderRadius: 8, padding: "8px 14px", color: "#a78bfa", cursor: "pointer", fontSize: 13 }}>
              Aplicar
            </button>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={resetar} style={{ background: "#1e1e2e", border: "1px solid #2e2e3e", borderRadius: 10, padding: "12px 24px", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>
              ↺ Resetar
            </button>
            <button onClick={() => setRodando(!rodando)} style={{
              background: rodando ? "#1e1e2e" : cor, border: rodando ? `1px solid ${cor}` : "none",
              borderRadius: 10, padding: "12px 40px", color: rodando ? cor : "#fff",
              cursor: "pointer", fontSize: 15, fontWeight: 600, minWidth: 140, transition: "all .2s"
            }}>
              {rodando ? "⏸ Pausar" : "▶ Iniciar"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600 }}>Hoje</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Sessões", valor: totalSessoes },
                { label: "Minutos focados", valor: hojeMin },
                { label: "Horas focadas", valor: `${Math.floor(hojeMin / 60)}h ${hojeMin % 60}m` },
                { label: "XP ganho", valor: `+${totalSessoes * 50}` },
              ].map((s, i) => (
                <div key={i} style={{ background: "#1e1e2e", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#a78bfa" }}>{s.valor}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>Meta diária de foco</span>
              <span style={{ fontSize: 13, color: "#a78bfa" }}>{Math.min(100, Math.round(hojeMin / 240 * 100))}%</span>
            </div>
            <div style={{ background: "#1e1e2e", borderRadius: 20, height: 8 }}>
              <div style={{ background: cor, height: 8, borderRadius: 20, width: `${Math.min(100, Math.round(hojeMin / 240 * 100))}%`, transition: "width .3s" }} />
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{hojeMin} de 240 minutos</div>
          </div>

          <div style={{ background: "#0f0f1a", border: "1px solid #1e1e2e", borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>Histórico</h3>
            {sessoesHoje.length === 0 && (
              <div style={{ fontSize: 13, color: "#475569", textAlign: "center", padding: "16px 0" }}>Nenhuma sessão ainda</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sessoesHoje.slice(0, 8).map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#1e1e2e", borderRadius: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12 }}>{h.tipo}</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{h.minutos}min</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>{h.hora}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}