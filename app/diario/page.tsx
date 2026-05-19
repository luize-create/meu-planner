"use client"

import { useState, useMemo } from "react"
import { usePlanner } from "../context/PlannerContext"

type Checkin = {
  humor: number; ansiedade: number; energia: number; clareza: number
  controle: number; estresse: number; pensamentos: number; socializacao: number; sono: number
}

const checkinInicial: Checkin = {
  humor: 5, ansiedade: 5, energia: 5, clareza: 5,
  controle: 5, estresse: 5, pensamentos: 5, socializacao: 5, sono: 5
}

const camposCheckin = [
  { key: "humor",        label: "Humor",         icone: "😊", cor: "#a855f7" },
  { key: "ansiedade",    label: "Ansiedade",      icone: "🌀", cor: "#f59e0b" },
  { key: "energia",      label: "Energia",        icone: "⚡", cor: "#7c3aed" },
  { key: "clareza",      label: "Clareza Mental", icone: "🧠", cor: "#818cf8" },
  { key: "controle",     label: "Controle",       icone: "🎯", cor: "#10b981" },
  { key: "estresse",     label: "Estresse",       icone: "🌊", cor: "#fb923c" },
  { key: "pensamentos",  label: "Pensamentos",    icone: "💭", cor: "#60a5fa" },
  { key: "socializacao", label: "Socialização",   icone: "👥", cor: "#f472b6" },
  { key: "sono",         label: "Sono",           icone: "🌙", cor: "#6366f1" },
]

const gatilhosBase = ["Pouco sono", "Excesso de tela", "Isolamento", "Discussão", "Sobrecarga", "Procrastinação", "Cobrança", "Comparação", "Álcool", "Barulho"]
const ajudouBase = ["Exercício", "Banho", "Caminhada", "Rotina", "Música", "Conversa", "Foco", "Respirar", "Descanso", "Leitura"]
const tagsBase = ["Leve", "Confusa", "Acelerada", "Estável", "Cansada", "Produtiva", "Ansiosa", "Sensível", "Tranquila", "Sobrecarregada", "Motivada", "Desligada"]

const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

function formatarData(data: string) {
  const d = new Date(data + "T12:00:00")
  return `${d.getDate()} ${meses[d.getMonth()]}. ${d.getFullYear()}`
}

function scoreEntrada(checkin: any): number {
  if (!checkin) return 0
  const positivos = (checkin.humor + checkin.energia + checkin.clareza + checkin.controle + checkin.socializacao) / 5
  const negativos = (checkin.ansiedade + checkin.estresse + checkin.pensamentos) / 3
  return Math.round((positivos + (10 - negativos)) / 2)
}

function corScore(score: number) {
  if (score >= 7) return "#10b981"
  if (score >= 5) return "#a855f7"
  return "#fb923c"
}

export default function Diario() {
  const { data, setDiario, adicionarXP, analise } = usePlanner()
  const entradas = (data.diario || []) as any[]

  const hoje = new Date().toISOString().slice(0, 10)

  const [checkin, setCheckin] = useState<Checkin>(checkinInicial)
  const [texto, setTexto] = useState("")
  const [gatilhosSel, setGatilhosSel] = useState<string[]>([])
  const [ajudouSel, setAjudouSel] = useState<string[]>([])
  const [tagsSel, setTagsSel] = useState<string[]>([])
  const [busca, setBusca] = useState("")
  const [entradaAberta, setEntradaAberta] = useState<any>(null)
  const [gatilhoCustom, setGatilhoCustom] = useState("")
  const [ajudouCustom, setAjudouCustom] = useState("")
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const entradasFiltradas = useMemo(() => {
    const todas = [...entradas].sort((a, b) => b.data.localeCompare(a.data))
    if (!busca.trim()) return todas
    return todas.filter(e =>
      e.texto?.toLowerCase().includes(busca.toLowerCase()) ||
      e.tags?.some((t: string) => t.toLowerCase().includes(busca.toLowerCase())) ||
      e.gatilhos?.some((g: string) => g.toLowerCase().includes(busca.toLowerCase()))
    )
  }, [entradas, busca])

  function toggleItem(lista: string[], setLista: (v: string[]) => void, item: string) {
    setLista(lista.includes(item) ? lista.filter(i => i !== item) : [...lista, item])
  }

  function atualizarCheckin(key: keyof Checkin, val: number) {
    setCheckin(prev => ({ ...prev, [key]: val }))
  }

  function salvarEntrada() {
    if (!texto.trim() && tagsSel.length === 0) return
    setSalvando(true)
    const nova = {
      id: Date.now().toString(),
      data: hoje,
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      texto: texto.trim(),
      checkin: { ...checkin },
      gatilhos: [...gatilhosSel],
      ajudou: [...ajudouSel],
      tags: [...tagsSel],
    }
    setDiario([nova, ...entradas] as any)
    adicionarXP(20)
    setTexto(""); setGatilhosSel([]); setAjudouSel([]); setTagsSel([])
    setCheckin(checkinInicial)
    setTimeout(() => setSalvando(false), 800)
  }

  // Reflexão dinâmica baseada no patternEngine
  const reflexao = useMemo(() => {
    if (analise.padroes.length > 0) {
      const p = analise.padroes[0]
      return p.observacao + " " + p.descoberta
    }
    if (entradas.length >= 3) {
      const ultimasAnsiedade = entradas.slice(0, 5).map(e => e.checkin?.ansiedade || 5)
      const media = ultimasAnsiedade.reduce((a: number, b: number) => a + b, 0) / ultimasAnsiedade.length
      if (media > 6) return "Há indícios de que sua ansiedade esteve elevada recentemente. Observe o que aconteceu nesses dias — gatilhos recorrentes costumam ter padrão."
      if (media < 4) return "Seus registros recentes mostram baixa ansiedade. Algo está funcionando — vale prestar atenção no que foi diferente nesses dias."
    }
    return "Seus registros constroem uma memória emocional rica. Quanto mais você registra, mais padrões aparecem."
  }, [analise.padroes, entradas])

  const scoreHoje = scoreEntrada(checkin)

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", height: "100%", color: "#e2e8f0" }}>

      {/* COLUNA PRINCIPAL */}
      <div style={{ padding: "24px 28px", overflowY: "auto", borderRight: "1px solid #1a1a2e" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Diário</h1>
              <span style={{ fontSize: 14, color: "#7c3aed" }}>✦</span>
            </div>
            <p style={{ fontSize: 13, color: "#4a4a6a", margin: 0, fontStyle: "italic" }}>
              Registre o que aconteceu, como você se sentiu e o que sua mente tentou te dizer.
            </p>
          </div>
          <button onClick={salvarEntrada} style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 20px #7c3aed40" }}>
            {salvando ? "✓ Salvo!" : "+ Nova entrada"}
          </button>
        </div>

        {/* Check-in emocional */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Como você está hoje?</span>
            <span style={{ fontSize: 11, color: "#4a4a6a" }}>Avalie de 0 a 10</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 8 }}>
            {camposCheckin.map(c => (
              <div key={c.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 18 }}>{c.icone}</span>
                <span style={{ fontSize: 9, color: "#6b6b8a", textAlign: "center", lineHeight: 1.2 }}>{c.label}</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: c.cor }}>{checkin[c.key as keyof Checkin]}</span>
                <input type="range" min={0} max={10} value={checkin[c.key as keyof Checkin]}
                  onChange={e => atualizarCheckin(c.key as keyof Checkin, Number(e.target.value))}
                  style={{ width: "100%", accentColor: c.cor, cursor: "pointer" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Texto + Gatilhos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

          {/* Texto livre */}
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>O que marcou seu dia?</div>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value.slice(0, 1000))}
              placeholder="Escreva livremente..."
              rows={8}
              style={{ width: "100%", background: "#12121f", border: "1px solid #1e1e35", borderRadius: 10, padding: "12px 14px", color: "#e2e8f0", fontSize: 13, outline: "none", resize: "none", lineHeight: 1.7, fontFamily: "inherit" }}
            />
            <div style={{ fontSize: 11, color: "#3a3a5a", textAlign: "right", marginTop: 6 }}>{texto.length}/1000</div>
          </div>

          {/* Gatilhos + Ajudou */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Gatilhos */}
            <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 18, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>O que parece ter pesado?</div>
              <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 12 }}>Selecione os gatilhos que estiveram presentes hoje.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
                {gatilhosBase.map(g => (
                  <button key={g} onClick={() => toggleItem(gatilhosSel, setGatilhosSel, g)} style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid", fontSize: 12, cursor: "pointer", transition: "all .15s", borderColor: gatilhosSel.includes(g) ? "#fb923c" : "#1e1e35", background: gatilhosSel.includes(g) ? "#fb923c20" : "#12121f", color: gatilhosSel.includes(g) ? "#fb923c" : "#6b6b8a" }}>
                    {g}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={gatilhoCustom} onChange={e => setGatilhoCustom(e.target.value)} placeholder="+ Adicionar gatilho"
                  onKeyDown={e => { if (e.key === "Enter" && gatilhoCustom.trim()) { setGatilhosSel(prev => [...prev, gatilhoCustom.trim()]); setGatilhoCustom("") } }}
                  style={{ flex: 1, background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "6px 10px", color: "#e2e8f0", fontSize: 11, outline: "none" }} />
              </div>
            </div>

            {/* O que ajudou */}
            <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 18, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>O que te ajudou a voltar para si?</div>
              <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 12 }}>Selecione o que te fez bem hoje.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
                {ajudouBase.map(a => (
                  <button key={a} onClick={() => toggleItem(ajudouSel, setAjudouSel, a)} style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid", fontSize: 12, cursor: "pointer", transition: "all .15s", borderColor: ajudouSel.includes(a) ? "#10b981" : "#1e1e35", background: ajudouSel.includes(a) ? "#10b98120" : "#12121f", color: ajudouSel.includes(a) ? "#10b981" : "#6b6b8a" }}>
                    {a}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={ajudouCustom} onChange={e => setAjudouCustom(e.target.value)} placeholder="+ Adicionar ajuda"
                  onKeyDown={e => { if (e.key === "Enter" && ajudouCustom.trim()) { setAjudouSel(prev => [...prev, ajudouCustom.trim()]); setAjudouCustom("") } }}
                  style={{ flex: 1, background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "6px 10px", color: "#e2e8f0", fontSize: 11, outline: "none" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tags do dia */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Como você descreveria seu dia?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tagsBase.map(t => (
              <button key={t} onClick={() => toggleItem(tagsSel, setTagsSel, t)} style={{ padding: "6px 16px", borderRadius: 20, border: "1px solid", fontSize: 13, cursor: "pointer", transition: "all .15s", borderColor: tagsSel.includes(t) ? "#7c3aed" : "#1e1e35", background: tagsSel.includes(t) ? "#7c3aed25" : "#12121f", color: tagsSel.includes(t) ? "#c4b5fd" : "#6b6b8a", fontWeight: tagsSel.includes(t) ? 500 : 400 }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Botão salvar */}
        <button onClick={salvarEntrada} style={{ background: salvando ? "#05906930" : "linear-gradient(135deg, #7c3aed, #a855f7)", border: salvando ? "1px solid #05906950" : "none", borderRadius: 10, padding: "12px 28px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 20, boxShadow: salvando ? "none" : "0 0 20px #7c3aed35", transition: "all .3s" }}>
          {salvando ? "✓ Entrada salva!" : "✓  Salvar entrada"}
        </button>

        {/* Reflexão do sistema */}
        <div style={{ background: "linear-gradient(135deg, #0f0f1c, #12111e)", border: "1px solid #1a1a2e", borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: "5%", bottom: "10%", fontSize: 80, opacity: 0.06, pointerEvents: "none" }}>🧠</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>✦</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Reflexão do sistema</span>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8, margin: 0, maxWidth: 600 }}>{reflexao} 💜</p>
          {analise.padroes.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {analise.padroes.slice(0, 3).map((p, i) => (
                <span key={i} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "#7c3aed18", border: "1px solid #7c3aed30", color: "#a855f7" }}>{p.icone} {p.titulo}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* COLUNA DIREITA — Entradas */}
      <div style={{ background: "#09090f", padding: "24px 18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Suas entradas</div>

        {/* Busca */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#4a4a6a" }}>🔍</span>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar entradas..."
            style={{ width: "100%", background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 10, padding: "9px 12px 9px 32px", color: "#e2e8f0", fontSize: 12, outline: "none" }} />
        </div>

        {/* Modal entrada aberta */}
        {entradaAberta && (
          <div style={{ position: "fixed", inset: 0, background: "#00000090", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setEntradaAberta(null)}>
            <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 20, padding: 28, maxWidth: 520, width: "90%", maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{formatarData(entradaAberta.data)}</div>
                  <div style={{ fontSize: 11, color: "#4a4a6a" }}>{entradaAberta.hora}</div>
                </div>
                <button onClick={() => setEntradaAberta(null)} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 18 }}>✕</button>
              </div>
              {entradaAberta.checkin && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
                  {camposCheckin.map(c => (
                    <div key={c.key} style={{ background: "#12121f", borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{c.icone}</span>
                      <div>
                        <div style={{ fontSize: 10, color: "#4a4a6a" }}>{c.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: c.cor }}>{entradaAberta.checkin[c.key]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {entradaAberta.texto && <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8, marginBottom: 14, whiteSpace: "pre-wrap" }}>{entradaAberta.texto}</p>}
              {entradaAberta.gatilhos?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 6 }}>Pesou:</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {entradaAberta.gatilhos.map((g: string) => <span key={g} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#fb923c15", border: "1px solid #fb923c30", color: "#fb923c" }}>{g}</span>)}
                  </div>
                </div>
              )}
              {entradaAberta.ajudou?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 6 }}>Ajudou:</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {entradaAberta.ajudou.map((a: string) => <span key={a} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#10b98115", border: "1px solid #10b98130", color: "#10b981" }}>{a}</span>)}
                  </div>
                </div>
              )}
              {entradaAberta.tags?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {entradaAberta.tags.map((t: string) => <span key={t} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#7c3aed15", border: "1px solid #7c3aed30", color: "#a855f7" }}>{t}</span>)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista de entradas */}
        {entradasFiltradas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#4a4a6a" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📖</div>
            <div style={{ fontSize: 13 }}>Nenhuma entrada ainda.</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Salve sua primeira entrada!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(mostrarTodas ? entradasFiltradas : entradasFiltradas.slice(0, 6)).map((e: any) => {
              const score = scoreEntrada(e.checkin)
              return (
                <div key={e.id} onClick={() => setEntradaAberta(e)} style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all .2s" }}
                  onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.borderColor = "#7c3aed40"; (ev.currentTarget as HTMLElement).style.background = "#0f0f22" }}
                  onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.borderColor = "#1a1a2e"; (ev.currentTarget as HTMLElement).style.background = "#0f0f1c" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>{formatarData(e.data)}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: corScore(score) + "18", border: `1px solid ${corScore(score)}30`, borderRadius: 20, padding: "2px 8px" }}>
                      <span style={{ fontSize: 11 }}>😊</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: corScore(score) }}>{score}</span>
                    </div>
                  </div>
                  {e.texto && (
                    <p style={{ fontSize: 12, color: "#6b6b8a", margin: "0 0 8px", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>{e.texto}</p>
                  )}
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {e.tags?.slice(0, 2).map((t: string) => (
                      <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#7c3aed15", color: "#a855f7" }}>{t}</span>
                    ))}
                    {e.gatilhos?.slice(0, 1).map((g: string) => (
                      <span key={g} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#fb923c12", color: "#fb923c" }}>{g}</span>
                    ))}
                    {e.ajudou?.slice(0, 1).map((a: string) => (
                      <span key={a} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#10b98112", color: "#10b981" }}>{a}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {entradasFiltradas.length > 6 && (
          <button onClick={() => setMostrarTodas(!mostrarTodas)} style={{ marginTop: 12, background: "none", border: "1px solid #1a1a2e", borderRadius: 10, padding: "10px", color: "#6b6b8a", fontSize: 12, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            📅 {mostrarTodas ? "Ver menos" : `Ver todas as ${entradasFiltradas.length} entradas`}
          </button>
        )}
      </div>
    </div>
  )
}