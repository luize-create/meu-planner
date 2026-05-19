"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { usePlanner } from "../context/PlannerContext"

const nosPrimarios = [
  { id: "clareza",       label: "Clareza mental", icone: "🧠", cor: "#a855f7", cx: 50,  cy: 50,  r: 68, central: true },
  { id: "sono",          label: "Sono",            icone: "🌙", cor: "#3b82f6", cx: 22,  cy: 22,  r: 52 },
  { id: "exercicio",     label: "Exercício",       icone: "🏃", cor: "#10b981", cx: 12,  cy: 46,  r: 46 },
  { id: "rotina",        label: "Rotina",          icone: "📅", cor: "#60a5fa", cx: 26,  cy: 68,  r: 44 },
  { id: "alimentacao",   label: "Alimentação",     icone: "🥗", cor: "#34d399", cx: 42,  cy: 78,  r: 38 },
  { id: "energia",       label: "Energia",         icone: "✨", cor: "#c084fc", cx: 34,  cy: 36,  r: 44 },
  { id: "foco",          label: "Foco",            icone: "🎯", cor: "#818cf8", cx: 66,  cy: 36,  r: 44 },
  { id: "ansiedade",     label: "Ansiedade",       icone: "🌀", cor: "#fb923c", cx: 76,  cy: 22,  r: 46 },
  { id: "tela",          label: "Excesso de tela", icone: "📱", cor: "#f59e0b", cx: 85,  cy: 44,  r: 38 },
  { id: "projetos",      label: "Projetos",        icone: "🚀", cor: "#34d399", cx: 68,  cy: 72,  r: 44 },
  { id: "socializacao",  label: "Socialização",    icone: "👥", cor: "#f472b6", cx: 16,  cy: 72,  r: 38 },
  { id: "impulsividade", label: "Impulsividade",   icone: "⚡", cor: "#fb7185", cx: 82,  cy: 62,  r: 36 },
]

const nosSecundarios = [
  { id: "s1", label: "Criatividade",  icone: "🎨", cor: "#a78bfa", cx: 48,  cy: 12,  r: 22 },
  { id: "s2", label: "Dopamina",      icone: "💫", cor: "#f472b6", cx: 7,   cy: 25,  r: 18 },
  { id: "s3", label: "Autocontrole",  icone: "🛡️", cor: "#60a5fa", cx: 90,  cy: 16,  r: 20 },
  { id: "s4", label: "Pressão",       icone: "🌪️", cor: "#f87171", cx: 94,  cy: 55,  r: 18 },
  { id: "s5", label: "Descanso",      icone: "☁️", cor: "#93c5fd", cx: 6,   cy: 84,  r: 20 },
  { id: "s6", label: "Motivação",     icone: "🌱", cor: "#6ee7b7", cx: 78,  cy: 86,  r: 22 },
  { id: "s7", label: "Comparação",    icone: "⚖️", cor: "#fbbf24", cx: 55,  cy: 10,  r: 18 },
  { id: "s8", label: "Sensibilidade", icone: "💜", cor: "#c084fc", cx: 93,  cy: 78,  r: 20 },
]

const conexoesBase = [
  { de: "sono",         para: "clareza",      forca: 0.88, positivo: true  },
  { de: "exercicio",    para: "clareza",      forca: 0.76, positivo: true  },
  { de: "rotina",       para: "clareza",      forca: 0.72, positivo: true  },
  { de: "energia",      para: "clareza",      forca: 0.68, positivo: true  },
  { de: "foco",         para: "clareza",      forca: 0.74, positivo: true  },
  { de: "exercicio",    para: "energia",      forca: 0.82, positivo: true  },
  { de: "sono",         para: "energia",      forca: 0.76, positivo: true  },
  { de: "alimentacao",  para: "energia",      forca: 0.58, positivo: true  },
  { de: "rotina",       para: "foco",         forca: 0.66, positivo: true  },
  { de: "projetos",     para: "foco",         forca: 0.62, positivo: true  },
  { de: "socializacao", para: "energia",      forca: 0.48, positivo: true  },
  { de: "ansiedade",    para: "clareza",      forca: 0.68, positivo: false },
  { de: "tela",         para: "ansiedade",    forca: 0.75, positivo: false },
  { de: "tela",         para: "clareza",      forca: 0.62, positivo: false },
  { de: "impulsividade",para: "clareza",      forca: 0.54, positivo: false },
  { de: "impulsividade",para: "tela",         forca: 0.58, positivo: false },
]

const frasesModo = [
  "sua mente não é um caos aleatório",
  "existe um padrão acontecendo aqui",
  "cada conexão conta uma história",
  "você está começando a se entender",
  "os padrões revelam o que as palavras não dizem",
  "observe. não julgue. apenas perceba.",
]

export default function MapaMental() {
  const { data, analise } = usePlanner()
  const [noAtivo, setNoAtivo] = useState<string>("clareza")
  const [noHover, setNoHover] = useState<string | null>(null)
  const [imersivo, setImersivo] = useState(false)
  const [tick, setTick] = useState(0)
  const [fraseIdx, setFraseIdx] = useState(0)
  const animRef = useRef<number>()
  const tickRef = useRef(0)

  useEffect(() => {
    const loop = () => {
      tickRef.current += 0.006
      setTick(tickRef.current)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [])

  useEffect(() => {
    if (!imersivo) return
    const t = setInterval(() => setFraseIdx(i => (i + 1) % frasesModo.length), 5000)
    return () => clearInterval(t)
  }, [imersivo])

  // Ajusta intensidade das conexões com dados reais
  const conexoes = useMemo(() => {
    return conexoesBase.map(c => {
      const correlacaoReal = analise.correlacoes.find(
        cr => cr.origem.toLowerCase().includes(c.de) || c.de.includes(cr.origem.toLowerCase())
      )
      return { ...c, forca: correlacaoReal ? correlacaoReal.intensidade : c.forca }
    })
  }, [analise.correlacoes])

  const activeId = noHover || noAtivo
  const nosConectados = useMemo(() => {
    const ids = new Set<string>()
    if (activeId) {
      ids.add(activeId)
      conexoes.forEach(c => {
        if (c.de === activeId || c.para === activeId) { ids.add(c.de); ids.add(c.para) }
      })
    }
    return ids
  }, [activeId, conexoes])

  // Padrões do nó ativo
  const padroesDoNo = useMemo(() =>
    analise.padroes.filter(p => p.noRelacionado === noAtivo).slice(0, 3),
    [analise.padroes, noAtivo]
  )

  // Correlações do nó ativo
  const correlacoesDoNo = useMemo(() =>
    conexoesBase.filter(c => c.de === noAtivo || c.para === noAtivo).slice(0, 4),
    [noAtivo]
  )

  const noSelecionado = nosPrimarios.find(n => n.id === noAtivo)

  function getFloat(id: string, axis: "x" | "y", amp = 1.4) {
    const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    const freq = 0.5 + (seed % 5) * 0.15
    return Math.sin(tickRef.current * freq + seed * 0.3 + (axis === "y" ? 1.5 : 0)) * amp
  }

  function breathe(id: string) {
    const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    return 1 + Math.sin(tickRef.current * 0.8 + seed * 0.4) * 0.04
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#060610", color: "#e2e8f0", overflow: "hidden" }}>

      {/* Header */}
      {!imersivo && (
        <div style={{ padding: "13px 26px", borderBottom: "1px solid #0f0f22", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: "#07070f" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Mapa Mental</h1>
              <span style={{ fontSize: 13, color: "#7c3aed" }}>✦</span>
            </div>
            <p style={{ fontSize: 11, color: "#3a3a5a", margin: "2px 0 0", fontStyle: "italic" }}>
              {analise.consistenciaGeral > 0
                ? `${analise.padroes.length} padrão(ões) detectado(s) · ${analise.consistenciaGeral}% consistência · âncora: ${analise.habitoAncora || "—"}`
                : "Visualize conexões invisíveis entre seus hábitos, emoções e rotina."}
            </p>
          </div>
          <button onClick={() => setImersivo(true)} style={{ background: "linear-gradient(135deg, #7c3aed18, #a855f710)", border: "1px solid #7c3aed35", borderRadius: 10, padding: "8px 18px", color: "#c4b5fd", fontSize: 12, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 7 }}>
            🌌 Entrar em observação
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* GALÁXIA */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 52%, #180a35 0%, #0a0a1e 40%, #060610 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 22% 28%, #7c3aed0c 0%, transparent 52%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 78% 34%, #f59e0b07 0%, transparent 48%)" }} />
          <div style={{ position: "absolute", left: "38%", top: "34%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, #7c3aed14 0%, transparent 65%)", filter: "blur(50px)", transform: `scale(${1 + Math.sin(tick * 0.4) * 0.08})`, pointerEvents: "none" }} />

          {/* Estrelas */}
          {Array.from({ length: 80 }, (_, i) => {
            const tw = 0.08 + Math.abs(Math.sin(tick * 0.6 + i * 0.9)) * 0.45
            return <div key={i} style={{ position: "absolute", width: i % 9 === 0 ? 2 : 1, height: i % 9 === 0 ? 2 : 1, borderRadius: "50%", background: "#fff", opacity: tw, left: `${(i * 23 + 7) % 100}%`, top: `${(i * 17 + 11) % 100}%`, pointerEvents: "none" }} />
          })}

          {/* SVG conexões */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            {conexoes.map((c, i) => {
              const nd = nosPrimarios.find(n => n.id === c.de)
              const np = nosPrimarios.find(n => n.id === c.para)
              if (!nd || !np) return null
              const conectado = nosConectados.has(c.de) && nosConectados.has(c.para)
              const hasActive = !!activeId
              const baseOp = 0.18 + Math.sin(tick * 0.8 + i * 0.7) * 0.07
              const op = hasActive ? (conectado ? 0.7 + Math.sin(tick * 1.2 + i) * 0.15 : 0.03) : baseOp
              const lw = c.forca > 0.75 ? 2 : c.forca > 0.55 ? 1.5 : 1
              const fx1 = getFloat(c.de, "x", 0.5)
              const fy1 = getFloat(c.de, "y", 0.5)
              const fx2 = getFloat(c.para, "x", 0.5)
              const fy2 = getFloat(c.para, "y", 0.5)
              const x1p = nd.cx + fx1, y1p = nd.cy + fy1
              const x2p = np.cx + fx2, y2p = np.cy + fy2
              const mx = (x1p + x2p) / 2 + Math.sin(tick * 0.5 + i * 0.8) * 2.5
              const my = (y1p + y2p) / 2 + Math.cos(tick * 0.4 + i) * 2
              return (
                <path key={i}
                  d={`M ${x1p}% ${y1p}% Q ${mx}% ${my}% ${x2p}% ${y2p}%`}
                  fill="none"
                  stroke={c.positivo ? "#9333ea" : "#f59e0b"}
                  strokeWidth={lw * (conectado ? 1.8 : 1)}
                  opacity={op}
                  strokeLinecap="round"
                  style={{ filter: conectado ? `drop-shadow(0 0 4px ${c.positivo ? "#7c3aed" : "#f59e0b"})` : "none", transition: "opacity .4s" }}
                />
              )
            })}
          </svg>

          {/* Nós secundários */}
          {nosSecundarios.map((no, i) => {
            const fx = getFloat(no.id, "x", 1.2), fy = getFloat(no.id, "y", 1.0)
            const op = 0.1 + Math.sin(tick * 0.4 + i) * 0.04
            return (
              <div key={no.id} style={{ position: "absolute", left: `calc(${no.cx}% + ${fx}px)`, top: `calc(${no.cy}% + ${fy}px)`, transform: "translate(-50%, -50%)", pointerEvents: "none", opacity: op }}>
                <div style={{ width: no.r, height: no.r, borderRadius: "50%", border: `1px solid ${no.cor}25`, background: `radial-gradient(circle, ${no.cor}10, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: no.r * 0.32 }}>{no.icone}</div>
              </div>
            )
          })}

          {/* Nós primários */}
          {nosPrimarios.map((no, i) => {
            const isAtivo = noAtivo === no.id
            const isHover = noHover === no.id
            const isDimmed = !!activeId && !nosConectados.has(no.id)
            const fx = getFloat(no.id, "x"), fy = getFloat(no.id, "y")
            const sc = breathe(no.id) * (isAtivo || isHover ? 1.12 : 1)
            const glow = isAtivo ? 40 : isHover ? 26 : 10
            // Nós com padrões detectados ficam levemente maiores
            const temPadrao = analise.padroes.some(p => p.noRelacionado === no.id)
            const tamanho = no.r * (temPadrao ? 1.08 : 1)
            return (
              <div key={no.id}
                onClick={() => setNoAtivo(no.id)}
                onMouseEnter={() => setNoHover(no.id)}
                onMouseLeave={() => setNoHover(null)}
                style={{ position: "absolute", left: `calc(${no.cx}% + ${fx}px)`, top: `calc(${no.cy}% + ${fy}px)`, transform: `translate(-50%, -50%) scale(${sc})`, cursor: "pointer", opacity: isDimmed ? 0.1 : 1, zIndex: isAtivo ? 10 : isHover ? 9 : 2, transition: "opacity .4s" }}>
                <div style={{ width: tamanho, height: tamanho, borderRadius: "50%", background: isAtivo ? `radial-gradient(circle at 35% 32%, ${no.cor}55, ${no.cor}1a 65%, transparent)` : `radial-gradient(circle at 35% 32%, ${no.cor}30, ${no.cor}0d 65%, transparent)`, border: `${isAtivo ? 1.5 : 1}px solid ${no.cor}${isAtivo ? "80" : temPadrao ? "55" : "40"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: `0 0 ${glow}px ${no.cor}${isAtivo ? "50" : isHover ? "35" : temPadrao ? "28" : "15"}`, transition: "all .3s" }}>
                  <span style={{ fontSize: no.central ? 22 : 16 }}>{no.icone}</span>
                  {no.central && <div style={{ fontSize: 10, fontWeight: 600, color: "#e2e8f0", marginTop: 3, textAlign: "center", lineHeight: 1.2 }}>{no.label}</div>}
                </div>
                {!no.central && (
                  <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: 4, fontSize: 9, color: isAtivo ? "#c4b5fd" : temPadrao ? "#7c3aed80" : "#3a3a5a", whiteSpace: "nowrap", pointerEvents: "none", transition: "color .2s" }}>
                    {no.label}
                  </div>
                )}
                {/* Indicador de padrão detectado */}
                {temPadrao && !no.central && (
                  <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", boxShadow: "0 0 5px #7c3aed" }} />
                )}
              </div>
            )
          })}

          {/* Imersivo */}
          {imersivo && (
            <>
              <div style={{ position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", textAlign: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 13, color: "#6b6b8a", fontStyle: "italic", letterSpacing: "0.05em", opacity: 0.7 }}>❝ {frasesModo[fraseIdx]} ❞</div>
              </div>
              <button onClick={() => setImersivo(false)} style={{ position: "absolute", top: 14, right: 14, background: "#0f0f1c60", border: "1px solid #1a1a2e", borderRadius: 8, padding: "6px 12px", color: "#4a4a6a", fontSize: 11, cursor: "pointer" }}>← Sair</button>
            </>
          )}
        </div>

        {/* PAINEL LATERAL — dados reais */}
        {!imersivo && (
          <div style={{ width: 272, background: "#07070f", borderLeft: "1px solid #0f0f22", padding: "18px 16px", overflowY: "auto", flexShrink: 0 }}>

            {noSelecionado && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #0f0f22" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: noSelecionado.cor + "22", border: `1.5px solid ${noSelecionado.cor}45`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{noSelecionado.icone}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{noSelecionado.label}</div>
                  <div style={{ fontSize: 10, color: "#3a3a5a" }}>{noSelecionado.central ? "centro do sistema" : `${padroesDoNo.length} padrão(ões) detectado(s)`}</div>
                </div>
              </div>
            )}

            {/* Padrões reais do nó */}
            {padroesDoNo.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#3a3a5a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Detectado nos seus dados</div>
                {padroesDoNo.map((p, i) => (
                  <div key={i} style={{ background: "#0a0a18", border: "1px solid #16163a", borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{p.icone}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0", marginBottom: 3 }}>{p.titulo}</div>
                        <p style={{ fontSize: 11, color: "#6b6b8a", lineHeight: 1.6, margin: 0 }}>{p.observacao}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: "#4a4a6a", fontStyle: "italic", lineHeight: 1.6, margin: "8px 0 6px", paddingTop: 8, borderTop: "1px solid #0f0f22" }}>{p.descoberta}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 9, color: "#3a3a5a" }}>confiança:</span>
                      <span style={{ fontSize: 9, color: p.confianca === "alta" ? "#10b981" : "#f59e0b" }}>{p.confianca}</span>
                      <div style={{ flex: 1, background: "#0f0f22", borderRadius: 20, height: 2 }}>
                        <div style={{ background: p.confianca === "alta" ? "#10b981" : "#f59e0b", height: 2, borderRadius: 20, width: p.confianca === "alta" ? "88%" : "55%" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "#0a0a18", border: "1px solid #0f0f22", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600, marginBottom: 6 }}>✦ Observação</div>
                <p style={{ fontSize: 11, color: "#4a4a6a", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
                  "{noAtivo === "clareza"
                    ? "Quando você dorme bem e mantém sua rotina organizada, sua clareza mental tende a aumentar."
                    : noAtivo === "sono"
                    ? "Noites bem dormidas parecem impactar profundamente seu estado emocional no dia seguinte."
                    : noAtivo === "exercicio"
                    ? "Há uma relação clara entre os dias que você se movimenta e a sensação de leveza que segue."
                    : "Continue registrando dados para ver padrões específicos deste nó aparecerem aqui."}"
                </p>
              </div>
            )}

            {/* Conexões do nó */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#3a3a5a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Conexões deste nó</div>
              {correlacoesDoNo.map((c, i) => {
                const outro = c.de === noAtivo ? c.para : c.de
                const noOutro = nosPrimarios.find(n => n.id === outro)
                if (!noOutro) return null
                return (
                  <div key={i} onClick={() => setNoAtivo(outro)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: "#09090f", border: "1px solid #0d0d1e", transition: "all .15s" }}>
                    <span style={{ fontSize: 14 }}>{noOutro.icone}</span>
                    <span style={{ flex: 1, fontSize: 11, color: "#6b6b8a" }}>{noOutro.label}</span>
                    <span style={{ fontSize: 10, color: c.positivo ? "#10b981" : "#f59e0b" }}>{c.positivo ? "+" : "−"}{Math.round(c.forca * 100)}%</span>
                  </div>
                )
              })}
            </div>

            {/* Resumo do sistema */}
            {analise.consistenciaGeral > 0 && (
              <div style={{ padding: "12px", background: "#0a0a18", borderRadius: 12, border: "1px solid #0f0f22" }}>
                <div style={{ fontSize: 10, color: "#3a3a5a", marginBottom: 8 }}>Sistema atual</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#4a4a6a" }}>Consistência geral</span>
                    <span style={{ fontSize: 11, color: "#7c3aed" }}>{analise.consistenciaGeral}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#4a4a6a" }}>Padrões detectados</span>
                    <span style={{ fontSize: 11, color: "#7c3aed" }}>{analise.padroes.length}</span>
                  </div>
                  {analise.habitoAncora && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, color: "#4a4a6a" }}>Âncora</span>
                      <span style={{ fontSize: 11, color: "#f59e0b", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{analise.habitoAncora}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#4a4a6a" }}>Melhor dia</span>
                    <span style={{ fontSize: 11, color: "#10b981" }}>{analise.melhorDiaSemana}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      {!imersivo && (
        <div style={{ borderTop: "1px solid #0f0f22", background: "#07070f", padding: "12px 24px", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "#2a2a45", fontStyle: "italic", marginBottom: 10 }}>
            ∿ padrões recentes detectados pelo sistema
          </div>
          <div style={{ display: "flex", alignItems: "center", overflowX: "auto", gap: 0 }}>
            {analise.padroes.slice(0, 5).map((p, i, arr) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div onClick={() => setNoAtivo(p.noRelacionado)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#7c3aed16", border: "1px solid #7c3aed35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{p.icone}</div>
                  <div style={{ fontSize: 9, color: "#4a4a6a" }}>detectado</div>
                  <div style={{ fontSize: 10, fontWeight: 500, color: "#6b6b8a", textAlign: "center", maxWidth: 80, lineHeight: 1.3 }}>{p.titulo}</div>
                  <div style={{ fontSize: 9, color: "#2a2a45", textAlign: "center", maxWidth: 80 }}>{p.confianca}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: 28, height: 1, background: "linear-gradient(90deg, #7c3aed30, #7c3aed15)", marginBottom: 28, flexShrink: 0 }} />
                )}
              </div>
            ))}
            {analise.padroes.length === 0 && (
              <div style={{ fontSize: 11, color: "#2a2a45", fontStyle: "italic" }}>
                Os padrões detectados aparecerão aqui conforme você usa o app.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}