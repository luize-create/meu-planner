"use client"

import { useState } from "react"
import { usePlanner } from "../context/PlannerContext"
import { useRouter } from "next/navigation"

type Nivel = "Baixa" | "Média" | "Alta"

export default function Checkin() {
  const { data, setTarefas, setDiario } = usePlanner()
  const router = useRouter()

  const hora      = new Date().getHours()
  const saudacao  = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite"
  const emoji     = hora < 12 ? "☀️" : hora < 18 ? "🌤️" : "🌙"
  const hoje      = new Date().toISOString().slice(0, 10)
  const horaStr   = new Date().toTimeString().slice(0, 5)

  const [sono,        setSono]        = useState<number>(7)
  const [ansiedade,   setAnsiedade]   = useState<Nivel | null>(null)
  const [energia,     setEnergia]     = useState<Nivel | null>(null)
  const [tarefas,     setTarefasLocal] = useState<string[]>([])
  const [novaTarefa,  setNovaTarefa]  = useState("")

  function nivelAnsiedade(n: Nivel) { return n === "Alta" ? 8 : n === "Média" ? 5 : 2 }
  function nivelEnergia(n: Nivel)   { return n === "Alta" ? 8 : n === "Média" ? 5 : 2 }

  function adicionarTarefa() {
    if (!novaTarefa.trim()) return
    setTarefasLocal(t => [...t, novaTarefa.trim()])
    setNovaTarefa("")
  }

  function removerTarefa(i: number) {
    setTarefasLocal(t => t.filter((_, idx) => idx !== i))
  }

  function salvar() {
    if (!ansiedade || !energia) return

    // ── Salvar no diário ──
    const novaEntrada: any = {
      id:     Date.now(),
      data:   hoje,
      hora:   horaStr,
      titulo: "Check-in matinal",
      texto:  `Sono: ${sono}h | Ansiedade: ${ansiedade} | Energia: ${energia}`,
      humor:  energia === "Alta" ? "otimo" : energia === "Média" ? "bom" : "cansado",
      tags:   ["checkin", "matinal"],
      checkin: {
        sono,
        ansiedade: nivelAnsiedade(ansiedade),
        energia:   nivelEnergia(energia),
        humor:     energia === "Alta" ? 8 : energia === "Média" ? 5 : 3,
        clareza:   energia === "Alta" ? 7 : energia === "Média" ? 5 : 3,
        estresse:  ansiedade === "Alta" ? 8 : ansiedade === "Média" ? 5 : 2,
      }
    }

    const diarioAtual = (data.diario || []) as any[]
    const semHoje     = diarioAtual.filter((e: any) => e.data !== hoje)
    setDiario([...semHoje, novaEntrada] as any)

    // ── Salvar tarefas ──
    if (tarefas.length > 0) {
      const tarefasAtuais = (data.tarefas || []) as any[]
      const novas = tarefas.map((t, i) => ({
        id:         Date.now() + i,
        texto:      t,
        descricao:  "",
        categoria:  "Pessoal",
        prioridade: "Média",
        hora:       "",
        feita:      false,
        data:       hoje,
      }))
      setTarefas([...tarefasAtuais, ...novas] as any)
    }

    // ── Marcar check-in como feito ──
    localStorage.setItem(`checkin-dia-${hoje}`, "1")

    router.replace("/")
  }

  const pronto = ansiedade !== null && energia !== null

  return (
    <div style={{ minHeight: "100vh", background: "#07070f", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #7c3aed, #a855f7)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, margin: "0 auto 14px" }}>✦</div>
          <h1 style={{ fontSize: 26, fontWeight: 300, color: "#e2e8f0", margin: "0 0 6px" }}>
            {saudacao} {emoji}
          </h1>
          <p style={{ fontSize: 13, color: "#4a4a6a", margin: 0 }}>Como você está chegando hoje?</p>
        </div>

        {/* Sono */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: "#6b6b8a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🌙</span> Quantas horas você dormiu?
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: "14px 20px" }}>
            <button
              onClick={() => setSono(s => Math.max(0, s - 0.5))}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a1a2e", border: "1px solid #2e2e4e", color: "#94a3b8", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >−</button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontSize: 36, fontWeight: 300, color: "#e2e8f0" }}>{sono}</span>
              <span style={{ fontSize: 16, color: "#4a4a6a" }}>h</span>
            </div>
            <button
              onClick={() => setSono(s => Math.min(12, s + 0.5))}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a1a2e", border: "1px solid #2e2e4e", color: "#94a3b8", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >+</button>
          </div>
        </div>

        {/* Ansiedade */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: "#6b6b8a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🧠</span> Como está sua ansiedade?
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {(["Baixa", "Média", "Alta"] as Nivel[]).map(n => {
              const ativo = ansiedade === n
              const cor   = n === "Baixa" ? "#10b981" : n === "Média" ? "#f59e0b" : "#fb923c"
              return (
                <button
                  key={n} onClick={() => setAnsiedade(n)}
                  style={{ padding: "14px 0", borderRadius: 12, border: `1.5px solid ${ativo ? cor : "#1e1e35"}`, background: ativo ? `${cor}20` : "#0f0f1c", color: ativo ? cor : "#6b6b8a", fontSize: 14, fontWeight: ativo ? 600 : 400, cursor: "pointer", transition: "all .15s" }}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </div>

        {/* Energia */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, color: "#6b6b8a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚡</span> Como está sua energia?
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {(["Baixa", "Média", "Alta"] as Nivel[]).map(n => {
              const ativo = energia === n
              const cor   = n === "Alta" ? "#10b981" : n === "Média" ? "#f59e0b" : "#fb923c"
              return (
                <button
                  key={n} onClick={() => setEnergia(n)}
                  style={{ padding: "14px 0", borderRadius: 12, border: `1.5px solid ${ativo ? cor : "#1e1e35"}`, background: ativo ? `${cor}20` : "#0f0f1c", color: ativo ? cor : "#6b6b8a", fontSize: 14, fontWeight: ativo ? 600 : 400, cursor: "pointer", transition: "all .15s" }}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tarefas */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 13, color: "#6b6b8a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>✅</span> O que você quer fazer hoje?
            <span style={{ fontSize: 11, color: "#3a3a5a" }}>(opcional)</span>
          </div>

          {tarefas.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {tarefas.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: "#94a3b8" }}>{t}</span>
                  <button
                    onClick={() => removerTarefa(i)}
                    style={{ background: "none", border: "none", color: "#3a3a5a", fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={novaTarefa}
              onChange={e => setNovaTarefa(e.target.value)}
              onKeyDown={e => e.key === "Enter" && adicionarTarefa()}
              placeholder="adicionar tarefa..."
              style={{ flex: 1, background: "#0f0f1c", border: "1px solid #1e1e35", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 13, outline: "none" }}
            />
            <button
              onClick={adicionarTarefa}
              style={{ background: "#1a1a2e", border: "1px solid #2e2e4e", borderRadius: 10, padding: "11px 16px", color: "#a855f7", fontSize: 20, cursor: "pointer" }}
            >+</button>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={salvar}
          disabled={!pronto}
          style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: pronto ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "#1a1a2e", color: pronto ? "#fff" : "#3a3a5a", fontSize: 15, fontWeight: 600, cursor: pronto ? "pointer" : "not-allowed", boxShadow: pronto ? "0 4px 20px #7c3aed40" : "none", transition: "all .2s" }}
        >
          Começar o dia →
        </button>

        {!pronto && (
          <p style={{ textAlign: "center", fontSize: 11, color: "#3a3a5a", marginTop: 10, margin: "10px 0 0" }}>
            Preencha ansiedade e energia para continuar
          </p>
        )}
      </div>
    </div>
  )
}