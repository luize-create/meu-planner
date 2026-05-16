"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { usePlanner } from "../context/PlannerContext"

// Clusters orgânicos — não radiais
const clusters = {
  rotina: { label: "Rotina", cor: "#2563eb", cx: 25, cy: 35 },
  emocional: { label: "Emocional", cor: "#f59e0b", cx: 75, cy: 30 },
  foco: { label: "Foco", cor: "#7c3aed", cx: 50, cy: 55 },
  proposito: { label: "Propósito", cor: "#059669", cx: 50, cy: 82 },
}

const nosBase = [
  // Cluster Rotina
  { id: "sono", label: "Sono", icone: "🌙", cor: "#3b82f6", cx: 18, cy: 22, tamanho: 54, cluster: "rotina", impacto: 0.85 },
  { id: "exercicio", label: "Exercício", icone: "🏃", cor: "#10b981", cx: 12, cy: 42, tamanho: 48, cluster: "rotina", impacto: 0.75 },
  { id: "alimentacao", label: "Alimentação", icone: "🥗", cor: "#34d399", cx: 28, cy: 52, tamanho: 42, cluster: "rotina", impacto: 0.60 },
  { id: "rotina", label: "Rotina", icone: "📅", cor: "#60a5fa", cx: 30, cy: 28, tamanho: 46, cluster: "rotina", impacto: 0.70 },
  // Cluster Emocional
  { id: "ansiedade", label: "Ansiedade", icone: "🌀", cor: "#fb923c", cx: 72, cy: 22, tamanho: 50, cluster: "emocional", impacto: 0.75 },
  { id: "tela", label: "Excesso de tela", icone: "📱", cor: "#f59e0b", cx: 83, cy: 36, tamanho: 42, cluster: "emocional", impacto: 0.65 },
  { id: "impulsividade", label: "Impulsividade", icone: "⚡", cor: "#fb7185", cx: 78, cy: 48, tamanho: 40, cluster: "emocional", impacto: 0.55 },
  { id: "socializacao", label: "Socialização", icone: "👥", cor: "#a78bfa", cx: 62, cy: 18, tamanho: 44, cluster: "emocional", impacto: 0.50 },
  // Cluster Foco (central)
  { id: "clareza", label: "Clareza mental", icone: "🧠", cor: "#a855f7", cx: 50, cy: 50, tamanho: 70, cluster: "foco", impacto: 1.0, central: true },
  { id: "energia", label: "Energia", icone: "✨", cor: "#c084fc", cx: 38, cy: 65, tamanho: 44, cluster: "foco", impacto: 0.70 },
  { id: "organizacao", label: "Organização", icone: "📋", cor: "#818cf8", cx: 63, cy: 62, tamanho: 42, cluster: "foco", impacto: 0.65 },
  // Cluster Propósito
  { id: "projetos", label: "Projetos", icone: "🚀", cor: "#34d399", cx: 42, cy: 80, tamanho: 46, cluster: "proposito", impacto: 0.70 },
  { id: "procrastinacao", label: "Procrastinação", icone: "😴", cor: "#f87171", cx: 62, cy: 78, tamanho: 40, cluster: "proposito", impacto: 0.55 },
  { id: "motivacao", label: "Motivação", icone: "🌱", cor: "#6ee7b7", cx: 52, cy: 90, tamanho: 42, cluster: "proposito", impacto: 0.60 },
]

const conexoes = [
  // Positivas (para clareza)
  { de: "sono", para: "clareza", forca: 0.85, positivo: true },
  { de: "rotina", para: "clareza", forca: 0.75, positivo: true },
  { de: "exercicio", para: "clareza", forca: 0.70, positivo: true },
  { de: "organizacao", para: "clareza", forca: 0.60, positivo: true },
  { de: "socializacao", para: "clareza", forca: 0.45, positivo: true },
  // Negativas (para clareza) — cores suaves
  { de: "tela", para: "ansiedade", forca: 0.72, positivo: false },
  { de: "ansiedade", para: "clareza", forca: 0.65, positivo: false },
  { de: "impulsividade", para: "clareza", forca: 0.50, positivo: false },
  { de: "procrastinacao", para: "clareza", forca: 0.45, positivo: false },
  // Entre clusters
  { de: "exercicio", para: "energia", forca: 0.75, positivo: true },
  { de: "sono", para: "energia", forca: 0.70, positivo: true },
  { de: "alimentacao", para: "energia", forca: 0.55, positivo: true },
  { de: "projetos", para: "motivacao", forca: 0.65, positivo: true },
  { de: "rotina", para: "organizacao", forca: 0.60, positivo: true },
  { de: "energia", para: "projetos", forca: 0.55, positivo: true },
  { de: "tela", para: "impulsividade", forca: 0.60, positivo: false },
  { de: "procrastinacao", para: "motivacao", forca: 0.50, positivo: false },
]

const painelDados: Record<string, any> = {
  clareza: {
    titulo: "Clareza mental",
    descricao: "Nas últimas semanas, sua mente parece mais tranquila e presente após noites bem dormidas e dias organizados.",
    presenca: ["rotina estruturada", "noites acima de 7h", "exercício consistente", "organização do dia"],
    ausencia: ["excesso de tela à noite", "noites curtas", "procrastinação prolongada"],
    insight: "Há indícios de que sua clareza mental está diretamente conectada à consistência da sua rotina. Dias com estrutura definida parecem criar um efeito cumulativo de estabilidade.",
    confianca: "alta",
  },
  sono: {
    titulo: "Sono",
    descricao: "Seus registros sugerem que a qualidade do sono impacta profundamente o seu estado emocional no dia seguinte.",
    presenca: ["rotina noturna consistente", "menos tela antes de dormir", "exercício diurno"],
    ausencia: ["tela até tarde", "ansiedade acumulada", "dias sem rotina"],
    insight: "Parece que o sono não é apenas descanso — é quando sua mente processa e organiza o que viveu. Noites curtas parecem deixar um rastro emocional no dia seguinte.",
    confianca: "alta",
  },
  exercicio: {
    titulo: "Exercício",
    descricao: "Há uma relação clara entre os dias que você se movimenta e a sensação de leveza e foco que segue.",
    presenca: ["dias subsequentes com mais energia", "clareza mental aumentada", "humor mais estável"],
    ausencia: [],
    insight: "Seus registros sugerem que o exercício age como um regulador emocional. Os benefícios parecem se estender além do dia em que ele acontece.",
    confianca: "alta",
  },
  ansiedade: {
    titulo: "Ansiedade",
    descricao: "Há indícios de que períodos de ansiedade têm padrões recogníveis — e isso é o primeiro passo para lidar com eles.",
    presenca: [],
    ausencia: ["excesso de tela", "noites curtas", "sobrecarga de tarefas"],
    insight: "Seus padrões sugerem que a ansiedade raramente aparece sozinha — ela parece estar conectada a acúmulos de fatores, não a um único evento.",
    confianca: "moderada",
  },
  energia: {
    titulo: "Energia",
    descricao: "Seus registros mostram que energia não vem apenas de descanso — ela parece surgir da combinação de movimento, propósito e rotina.",
    presenca: ["exercício consistente", "sono reparador", "avanço em projetos"],
    ausencia: ["procrastinação", "dias sem estrutura"],
    insight: "Há indícios de que sua energia é renovada quando você sente que avançou em algo significativo — não apenas quando descansou.",
    confianca: "moderada",
  },
  projetos: {
    titulo: "Projetos",
    descricao: "Seus dados sugerem que avançar em projetos tem um impacto emocional real — além da produtividade.",
    presenca: ["clareza de propósito", "energia renovada", "motivação crescente"],
    ausencia: ["longos períodos sem progresso"],
    insight: "Parece que o simples ato de avançar — mesmo que pouco — alimenta sua motivação de um jeito que pausas longas não conseguem recuperar facilmente.",
    confianca: "moderada",
  },
}

const timelineItems = [
  { data: "02 Mai", icone: "🌙", titulo: "Sono melhorou", sub: "Impacto positivo na clareza", cor: "#3b82f6" },
  { data: "08 Mai", icone: "🏃", titulo: "Exercício consistente", sub: "Energia aumentou", cor: "#10b981" },
  { data: "15 Mai", icone: "📱", titulo: "Excesso de tela", sub: "Ansiedade levemente aumentada", cor: "#f59e0b" },
  { data: "20 Mai", icone: "📅", titulo: "Rotina estruturada", sub: "Mais estabilidade emocional", cor: "#60a5fa" },
  { data: "27 Mai", icone: "🚀", titulo: "Avanço em projetos", sub: "Motivação crescente", cor: "#a855f7" },
]

const descobertas = [
  { icone: "🌅", texto: "Você parece ter mais clareza entre 09h e 12h." },
  { icone: "🏃", texto: "Exercícios acima de 30min parecem melhorar seu humor." },
  { icone: "🌙", texto: "Noites acima de 7h parecem reduzir ansiedade no dia seguinte." },
]

const frasesMapa = [
  "sua mente não é um caos aleatório",
  "existe um padrão acontecendo",
  "você está começando a se entender",
  "cada conexão conta uma história",
]

export default function MapaMental() {
  const { data } = usePlanner()
  const [noAtivo, setNoAtivo] = useState<string>("clareza")
  const [noHover, setNoHover] = useState<string | null>(null)
  const [imersivo, setImersivo] = useState(false)
  const [tick, setTick] = useState(0)
  const [fraseIdx, setFraseIdx] = useState(0)
  const animRef = useRef<number>()

  // Dados reais
  const habitos = (data.habitos || []) as any[]
  const sessoesFoco = (data.sessoesFoco || []) as any[]
  const hoje = new Date().toISOString().slice(0, 10)

  const totalSessoes = sessoesFoco.length
  const habitosComStreak = habitos.map((h: any) => {
    let streak = 0
    const d = new Date(hoje)
    while ((h.historico || []).includes(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1) }
    return { ...h, streak }
  })

  // Animação contínua
  useEffect(() => {
    let t = 0
    const loop = () => {
      t += 0.006
      setTick(t)
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [])

  // Rotação de frases no modo imersivo
  useEffect(() => {
    if (!imersivo) return
    const t = setInterval(() => setFraseIdx(i => (i + 1) % frasesMapa.length), 4000)
    return () => clearInterval(t)
  }, [imersivo])

  const activeId = noHover || noAtivo
  const nosConectados = useMemo(() => {
    const ids = new Set<string>()
    if (activeId) {
      ids.add(activeId)
      conexoes.forEach(c => { if (c.de === activeId || c.para === activeId) { ids.add(c.de); ids.add(c.para) } })
    }
    return ids
  }, [activeId])

  function getFloat(id: string, offset: number, amplitude = 1.2) {
    const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
    return Math.sin(tick + seed * 0.4 + offset) * amplitude
  }

  const noSelecionado = nosBase.find(n => n.id === noAtivo)
  const painel = painelDados[noAtivo] || painelDados["clareza"]

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#06060e", color: "#e2e8f0", overflow: "hidden", position: "relative" }}>

      {/* Header */}
      {!imersivo && (
        <div style={{ padding: "14px 28px", borderBottom: "1px solid #12122a", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, zIndex: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 21, fontWeight: 600, margin: 0 }}>Mapa Mental</h1>
              <span style={{ fontSize: 14, color: "#7c3aed" }}>✦</span>
            </div>
            <p style={{ fontSize: 12, color: "#3a3a5a", margin: "2px 0 0", fontStyle: "italic" }}>Visualize conexões invisíveis entre seus hábitos, emoções e rotina.</p>
          </div>
          <button onClick={() => setImersivo(true)} style={{ background: "linear-gradient(135deg, #7c3aed22, #a855f722)", border: "1px solid #7c3aed40", borderRadius: 10, padding: "8px 18px", color: "#c4b5fd", fontSize: 12, cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 7 }}>
            🌌 Entrar em observação
          </button>
        </div>
      )}

      {/* Layout principal */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* GALÁXIA */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

          {/* Atmosfera */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 48% 52%, #1a0a3e 0%, #08081a 45%, #06060e 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 30%, #7c3aed0a 0%, transparent 55%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 70%, #2563eb07 0%, transparent 50%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 20%, #10b9810a 0%, transparent 45%)" }} />

          {/* Nebulosa central */}
          <div style={{ position: "absolute", left: "40%", top: "35%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #7c3aed12 0%, transparent 70%)", filter: "blur(40px)", transform: `scale(${1 + Math.sin(tick * 0.5) * 0.06})`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: "10%", top: "15%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, #2563eb0a 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: "15%", top: "20%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, #f59e0b08 0%, transparent 70%)", filter: "blur(25px)", pointerEvents: "none" }} />

          {/* Estrelas */}
          {Array.from({ length: 80 }, (_, i) => {
            const twinkle = 0.15 + Math.abs(Math.sin(tick * 0.8 + i * 0.7)) * 0.4
            return (
              <div key={i} style={{ position: "absolute", width: i % 8 === 0 ? 2 : 1, height: i % 8 === 0 ? 2 : 1, borderRadius: "50%", background: "#fff", opacity: twinkle, left: `${(i * 19 + 5) % 100}%`, top: `${(i * 11 + 3) % 100}%`, pointerEvents: "none" }} />
            )
          })}

          {/* SVG conexões */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <defs>
              {conexoes.map((c, i) => (
                <linearGradient key={i} id={`grad${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={c.positivo ? "#7c3aed" : "#f59e0b"} stopOpacity="0.6" />
                  <stop offset="100%" stopColor={c.positivo ? "#a855f7" : "#fb923c"} stopOpacity="0.3" />
                </linearGradient>
              ))}
            </defs>
            {conexoes.map((c, i) => {
              const noD = nosBase.find(n => n.id === c.de)
              const noP = nosBase.find(n => n.id === c.para)
              if (!noD || !noP) return null
              const conectado = nosConectados.has(c.de) && nosConectados.has(c.para)
              const opacity = activeId ? (conectado ? 0.75 : 0.04) : 0.25
              const largura = c.forca > 0.7 ? 2 : c.forca > 0.5 ? 1.5 : 1
              const pulse = 1 + Math.sin(tick * 1.5 + i * 0.8) * 0.25
              const floatDx = getFloat(c.de, i, 0.8)
              const floatDy = getFloat(c.para, i, 0.8)
              const x1 = noD.cx + floatDx
              const y1 = noD.cy + floatDy
              const x2 = noP.cx + floatDx * 0.5
              const y2 = noP.cy + floatDy * 0.5
              const mx = (x1 + x2) / 2 + (Math.sin(tick + i) * 2)
              const my = (y1 + y2) / 2 + (Math.cos(tick + i) * 2)
              return (
                <path key={i}
                  d={`M ${x1}% ${y1}% Q ${mx}% ${my}% ${x2}% ${y2}%`}
                  fill="none"
                  stroke={`url(#grad${i})`}
                  strokeWidth={largura * (conectado ? 1.8 : 1) * pulse}
                  opacity={opacity}
                  strokeLinecap="round"
                  style={{ filter: conectado ? `drop-shadow(0 0 3px ${c.positivo ? "#7c3aed" : "#f59e0b"})` : "none", transition: "opacity .4s" }}
                />
              )
            })}
          </svg>

          {/* Nós */}
          {nosBase.map((no, i) => {
            const isAtivo = noAtivo === no.id
            const isHover = noHover === no.id
            const isDimmed = activeId && !nosConectados.has(no.id)
            const fx = getFloat(no.id, i * 0.6, 1.5)
            const fy = getFloat(no.id, i * 0.4 + 1, 1.2)
            const breathe = 1 + Math.sin(tick * 1.2 + i * 0.5) * 0.035
            const scale = (isAtivo || isHover ? 1.14 : 1) * breathe
            const glowSize = isAtivo ? 35 : isHover ? 25 : 12

            return (
              <div key={no.id}
                onClick={() => setNoAtivo(no.id)}
                onMouseEnter={() => setNoHover(no.id)}
                onMouseLeave={() => setNoHover(null)}
                style={{
                  position: "absolute",
                  left: `calc(${no.cx}% + ${fx}px)`,
                  top: `calc(${no.cy}% + ${fy}px)`,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  cursor: "pointer",
                  transition: "opacity .4s",
                  opacity: isDimmed ? 0.12 : 1,
                  zIndex: isAtivo ? 10 : isHover ? 9 : 2,
                }}>
                <div style={{
                  width: no.tamanho, height: no.tamanho, borderRadius: "50%",
                  background: isAtivo
                    ? `radial-gradient(circle at 35% 35%, ${no.cor}60, ${no.cor}20 60%, transparent)`
                    : `radial-gradient(circle at 35% 35%, ${no.cor}35, ${no.cor}10 60%, transparent)`,
                  border: `${isAtivo ? 1.5 : 1}px solid ${no.cor}${isAtivo ? "90" : "45"}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 ${glowSize}px ${no.cor}${isAtivo ? "50" : isHover ? "35" : "20"}, inset 0 0 ${isAtivo ? 20 : 8}px ${no.cor}${isAtivo ? "15" : "08"}`,
                  transition: "all .3s",
                }}>
                  <span style={{ fontSize: no.central ? 22 : 17, filter: isAtivo ? "drop-shadow(0 0 4px rgba(255,255,255,0.3))" : "none" }}>{no.icone}</span>
                  {no.central && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginTop: 4, textAlign: "center", lineHeight: 1.2, textShadow: "0 0 10px rgba(168,85,247,0.5)" }}>
                      {no.label}
                    </div>
                  )}
                </div>
                {!no.central && (
                  <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: 5, fontSize: 9, color: isAtivo || isHover ? "#c4b5fd" : "#4a4a6a", whiteSpace: "nowrap", pointerEvents: "none", transition: "color .2s", textShadow: isAtivo ? "0 0 8px rgba(168,85,247,0.6)" : "none" }}>
                    {no.label}
                  </div>
                )}
              </div>
            )
          })}

          {/* Frase imersiva */}
          {imersivo && (
            <div style={{ position: "absolute", bottom: "12%", left: "50%", transform: "translateX(-50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 13, color: "#6b6b8a", fontStyle: "italic", letterSpacing: "0.06em", opacity: 0.8 }}>
                ❝ {frasesMapa[fraseIdx]} ❞
              </div>
            </div>
          )}

          {/* Sair imersivo */}
          {imersivo && (
            <button onClick={() => setImersivo(false)} style={{ position: "absolute", top: 16, right: 16, background: "#0f0f1c80", border: "1px solid #1a1a2e", borderRadius: 8, padding: "7px 14px", color: "#6b6b8a", fontSize: 11, cursor: "pointer", backdropFilter: "blur(8px)" }}>
              ← Sair
            </button>
          )}
        </div>

        {/* PAINEL LATERAL */}
        {!imersivo && (
          <div style={{ width: 270, background: "#08080f", borderLeft: "1px solid #12122a", padding: "20px 18px", overflowY: "auto", flexShrink: 0 }}>
            {noSelecionado && painel ? (
              <>
                {/* Nó ativo */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: noSelecionado.cor + "25", border: `1.5px solid ${noSelecionado.cor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 0 16px ${noSelecionado.cor}30` }}>
                    {noSelecionado.icone}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{painel.titulo}</div>
                    <div style={{ fontSize: 10, color: "#4a4a6a" }}>nó {noSelecionado.central ? "central" : "conectado"}</div>
                  </div>
                </div>

                {/* Descrição humana */}
                <p style={{ fontSize: 12, color: "#6b6b8a", lineHeight: 1.7, margin: "0 0 18px", fontStyle: "italic" }}>
                  {painel.descricao}
                </p>

                {/* Mais presente */}
                {painel.presenca?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: "#4a4a6a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Mais presente em períodos com</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {painel.presenca.map((item: string, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#059669", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tende a diminuir */}
                {painel.ausencia?.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 10, color: "#4a4a6a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Tende a diminuir após</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {painel.ausencia.map((item: string, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insight */}
                <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <span>✦</span> Insight do sistema
                  </div>
                  <p style={{ fontSize: 11, color: "#6b6b8a", lineHeight: 1.7, margin: "0 0 10px", fontStyle: "italic" }}>
                    "{painel.insight}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "#3a3a5a" }}>confiança:</span>
                    <span style={{ fontSize: 10, color: painel.confianca === "alta" ? "#059669" : "#f59e0b" }}>{painel.confianca}</span>
                    <div style={{ flex: 1, background: "#1a1a2e", borderRadius: 20, height: 2 }}>
                      <div style={{ background: painel.confianca === "alta" ? "#059669" : "#f59e0b", height: 2, borderRadius: 20, width: painel.confianca === "alta" ? "85%" : "55%", transition: "width .4s" }} />
                    </div>
                  </div>
                </div>

                {/* Dados reais se disponíveis */}
                {(noAtivo === "clareza" || noAtivo === "exercicio" || noAtivo === "sono") && habitosComStreak.length > 0 && (
                  <div style={{ marginTop: 16, padding: "12px", background: "#0d0d1a", borderRadius: 12, border: "1px solid #1a1a2e" }}>
                    <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 8 }}>Seus hábitos relacionados</div>
                    {habitosComStreak.slice(0, 3).map((h: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 14 }}>{h.icone}</span>
                        <span style={{ flex: 1, fontSize: 11, color: "#6b6b8a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.nome}</span>
                        {h.streak > 0 && <span style={{ fontSize: 10, color: "#f59e0b" }}>🔥{h.streak}d</span>}
                      </div>
                    ))}
                  </div>
                )}

                {noAtivo === "projetos" && (
                  <div style={{ marginTop: 14, fontSize: 11, color: "#4a4a6a" }}>
                    Sessões de foco registradas: <span style={{ color: "#a855f7" }}>{totalSessoes}</span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50%", gap: 10, opacity: 0.4 }}>
                <span style={{ fontSize: 28 }}>🧠</span>
                <span style={{ fontSize: 11, color: "#4a4a6a", textAlign: "center" }}>Clique em um nó para explorar</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline + Descobertas */}
      {!imersivo && (
        <div style={{ borderTop: "1px solid #12122a", display: "grid", gridTemplateColumns: "1fr 280px", flexShrink: 0, background: "#07070e" }}>

          {/* Timeline */}
          <div style={{ padding: "14px 24px", overflowX: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#6b6b8a", marginBottom: 12, fontStyle: "italic" }}>
              ∿ como os padrões foram evoluindo
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
              {timelineItems.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: t.cor + "18", border: `1px solid ${t.cor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, boxShadow: `0 0 10px ${t.cor}25` }}>
                      {t.icone}
                    </div>
                    <div style={{ fontSize: 9, color: "#3a3a5a" }}>{t.data}</div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8", textAlign: "center", maxWidth: 80, lineHeight: 1.3 }}>{t.titulo}</div>
                    <div style={{ fontSize: 9, color: "#3a3a5a", textAlign: "center", maxWidth: 80 }}>{t.sub}</div>
                  </div>
                  {i < timelineItems.length - 1 && (
                    <div style={{ width: 32, marginBottom: 36, position: "relative" }}>
                      <div style={{ height: 1, background: `linear-gradient(90deg, ${t.cor}50, ${timelineItems[i + 1].cor}30)`, boxShadow: `0 0 4px ${t.cor}20` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Descobertas */}
          <div style={{ padding: "14px 18px", borderLeft: "1px solid #12122a" }}>
            <div style={{ fontSize: 11, color: "#6b6b8a", marginBottom: 10, fontStyle: "italic" }}>✦ descobertas recentes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {descobertas.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{d.icone}</span>
                  <span style={{ fontSize: 11, color: "#4a4a6a", lineHeight: 1.5 }}>{d.texto}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}