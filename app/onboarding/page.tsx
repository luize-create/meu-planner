"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveProfile } from "../lib/profileEngine"
import { usePlanner } from "../context/PlannerContext"

// ── Dados ────────────────────────────────────────────────
const OBJETIVOS = [
  { id: "rotina",       label: "Melhorar minha rotina",        emoji: "📅" },
  { id: "emocoes",      label: "Entender minhas emoções",       emoji: "🧠" },
  { id: "produtividade",label: "Ser mais produtivo",            emoji: "⚡" },
  { id: "habitos",      label: "Controlar hábitos ruins",       emoji: "🔄" },
  { id: "evolucao",     label: "Acompanhar minha evolução",     emoji: "📈" },
  { id: "estudos",      label: "Estudar melhor",                emoji: "📚" },
  { id: "projetos",     label: "Organizar projetos",            emoji: "🎯" },
]

const PERIODOS = [
  { id: "morning",    label: "Manhã",     emoji: "🌅", sub: "06h - 12h" },
  { id: "afternoon",  label: "Tarde",     emoji: "☀️", sub: "12h - 18h" },
  { id: "night",      label: "Noite",     emoji: "🌙", sub: "18h - 00h" },
  { id: "late_night", label: "Madrugada", emoji: "🌃", sub: "00h - 06h" },
]

const BLOQUEADORES = [
  "Celular", "Ansiedade", "Cansaço", "Excesso de tarefas",
  "Falta de clareza", "Ambiente bagunçado", "Redes sociais",
  "Procrastinação", "Pensamentos acelerados",
]

const GATILHOS = [
  "Dormir pouco", "Beber álcool", "Brigar com alguém",
  "Excesso de socialização", "Ficar isolado", "Bagunça",
  "Cobrança", "Comparação", "Sensação de fracasso",
  "Mudanças de plano", "Excesso de estímulo", "Tédio",
  "Estresse no trabalho", "Estresse nos estudos",
]

const HABITOS_POS = [
  { id: "agua",        label: "Beber água",     emoji: "💧" },
  { id: "estudar",     label: "Estudar",        emoji: "📚" },
  { id: "treinar",     label: "Treinar",        emoji: "🏋️" },
  { id: "correr",      label: "Correr",         emoji: "🏃" },
  { id: "ler",         label: "Ler",            emoji: "📖" },
  { id: "meditar",     label: "Meditar",        emoji: "🧘" },
  { id: "dormir_cedo", label: "Dormir cedo",    emoji: "🌙" },
  { id: "comer",       label: "Comer melhor",   emoji: "🥗" },
  { id: "diario",      label: "Diário",         emoji: "✍️" },
  { id: "caminhada",   label: "Caminhada",      emoji: "🚶" },
  { id: "alongamento", label: "Alongamento",    emoji: "🤸" },
  { id: "organizar",   label: "Organizar",      emoji: "🏠" },
]

const HABITOS_NEG = [
  { id: "alcool",       label: "Álcool",                emoji: "🍺" },
  { id: "tabaco",       label: "Tabaco",                emoji: "🚬" },
  { id: "vape",         label: "Vape",                  emoji: "💨" },
  { id: "redes",        label: "Excesso de redes",      emoji: "📱" },
  { id: "compras",      label: "Compras impulsivas",    emoji: "🛒" },
  { id: "junk",         label: "Furar dieta",           emoji: "🍔" },
  { id: "dormir_tarde", label: "Dormir muito tarde",    emoji: "⏰" },
  { id: "procrastinar", label: "Procrastinação",        emoji: "🛋️" },
  { id: "isolamento",   label: "Isolamento",            emoji: "🚪" },
  { id: "cafeina",      label: "Excesso de cafeína",    emoji: "☕" },
]

const METRICAS = [
  { id: "humor",         label: "Humor",               emoji: "😊" },
  { id: "ansiedade",     label: "Ansiedade",           emoji: "💭" },
  { id: "clareza",       label: "Clareza mental",      emoji: "☀️" },
  { id: "energia",       label: "Energia",             emoji: "⚡" },
  { id: "foco",          label: "Foco",                emoji: "🎯" },
  { id: "impulsividade", label: "Impulsividade",       emoji: "🔥" },
  { id: "produtividade", label: "Produtividade",       emoji: "📊" },
  { id: "autoestima",    label: "Autoestima",          emoji: "💪" },
  { id: "controle",      label: "Sensação de controle",emoji: "🧭" },
  { id: "estresse",      label: "Estresse",            emoji: "😤" },
  { id: "sono",          label: "Qualidade do sono",   emoji: "😴" },
  { id: "socializacao",  label: "Socialização",        emoji: "👥" },
]

const AREAS = [
  { id: "estudos",          label: "Estudos",          emoji: "📚" },
  { id: "trabalho",         label: "Trabalho",         emoji: "💼" },
  { id: "saude",            label: "Saúde",            emoji: "❤️" },
  { id: "dinheiro",         label: "Dinheiro",         emoji: "💰" },
  { id: "relacionamentos",  label: "Relacionamentos",  emoji: "💞" },
  { id: "mercado_digital",  label: "Mercado digital",  emoji: "🌐" },
  { id: "programacao",      label: "Programação",      emoji: "💻" },
  { id: "espiritualidade",  label: "Espiritualidade",  emoji: "🙏" },
  { id: "lazer",            label: "Lazer",            emoji: "🎮" },
  { id: "autocuidado",      label: "Autocuidado",      emoji: "🌿" },
  { id: "projetos",         label: "Projetos pessoais",emoji: "🎯" },
  { id: "casa",             label: "Casa",             emoji: "🏠" },
]

const TOTAL_STEPS = 8

// ── Chip multi-select ─────────────────────────────────────
function ChipGrid({ items, selected, onToggle, cols = 3 }: {
  items: { id: string; label: string; emoji?: string; sub?: string }[]
  selected: string[]
  onToggle: (id: string) => void
  cols?: number
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
      {items.map(item => {
        const ativo = selected.includes(item.id)
        return (
          <button key={item.id} onClick={() => onToggle(item.id)}
            style={{ padding: "12px 10px", borderRadius: 14, border: `1.5px solid ${ativo ? "#7c3aed80" : "#1e1e35"}`, background: ativo ? "#7c3aed20" : "#0f0f1c", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all .15s", boxShadow: ativo ? "0 0 12px #7c3aed25" : "none" }}>
            {item.emoji && <span style={{ fontSize: 22 }}>{item.emoji}</span>}
            <span style={{ fontSize: 12, color: ativo ? "#c4b5fd" : "#6b6b8a", textAlign: "center", lineHeight: 1.3 }}>{item.label}</span>
            {item.sub && <span style={{ fontSize: 10, color: ativo ? "#7c3aed" : "#3a3a5a" }}>{item.sub}</span>}
          </button>
        )
      })}
    </div>
  )
}

function TagGrid({ items, selected, onToggle }: {
  items: string[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map(item => {
        const ativo = selected.includes(item)
        return (
          <button key={item} onClick={() => onToggle(item)}
            style={{ padding: "8px 16px", borderRadius: 22, border: `1px solid ${ativo ? "#7c3aed60" : "#1e1e35"}`, background: ativo ? "#7c3aed20" : "#0f0f1c", cursor: "pointer", fontSize: 13, color: ativo ? "#c4b5fd" : "#6b6b8a", transition: "all .15s" }}>
            {item}
          </button>
        )
      })}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────
export default function Onboarding() {
  const router = useRouter()
  const { setHabitos, data } = usePlanner()

  const [step,        setStep]        = useState(0)
  const [animating,   setAnimating]   = useState(false)

  // Dados do perfil
  const [nome,        setNome]        = useState("")
  const [idade,       setIdade]       = useState("")
  const [ocupacao,    setOcupacao]    = useState("")
  const [objetivo,    setObjetivo]    = useState("")
  const [wakeTime,    setWakeTime]    = useState("07:00")
  const [sleepTime,   setSleepTime]   = useState("23:00")
  const [sleepHours,  setSleepHours]  = useState(8)
  const [focusPeriod, setFocusPeriod] = useState<"morning"|"afternoon"|"night"|"late_night">("morning")
  const [bloqueadores,setBloqueadores]= useState<string[]>([])
  const [gatilhos,    setGatilhos]    = useState<string[]>([])
  const [habitosPos,  setHabitosPos]  = useState<string[]>([])
  const [habitosNeg,  setHabitosNeg]  = useState<string[]>([])
  const [metricas,    setMetricas]    = useState<string[]>(["humor","energia","clareza"])
  const [areas,       setAreas]       = useState<string[]>([])

  function toggle<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter(x => x !== item) : [...list, item]
  }

  function avancar() {
    if (animating) return
    setAnimating(true)
    setTimeout(() => { setStep(s => s + 1); setAnimating(false) }, 200)
  }

  function voltar() {
    if (animating || step === 0) return
    setAnimating(true)
    setTimeout(() => { setStep(s => s - 1); setAnimating(false) }, 200)
  }

  function pular() { avancar() }

  function concluir() {
    // Salva perfil
    saveProfile({
      name: nome.trim(),
      age: idade ? parseInt(idade) : undefined,
      occupation: ocupacao.trim() || undefined,
      mainGoal: objetivo,
      sleepTargetHours: sleepHours,
      usualWakeTime: wakeTime,
      usualSleepTime: sleepTime,
      bestFocusPeriod: focusPeriod,
      productivityBlockers: bloqueadores,
      triggers: gatilhos,
      positiveHabits: habitosPos,
      negativeHabits: habitosNeg,
      trackedMetrics: metricas,
      lifeAreas: areas,
      insightPreferences: [],
      onboardingComplete: true,
    })

    // Adiciona hábitos ao planner automaticamente
    const habitosExistentes = (data.habitos || []) as any[]
    const novosHabitos = [
      ...habitosPos.map(id => {
        const h = HABITOS_POS.find(x => x.id === id)
        if (!h) return null
        return { id: Date.now() + Math.random(), nome: h.label, icone: h.emoji, meta: "1x por dia", tipo: "positivo", historico: [] }
      }),
      ...habitosNeg.map(id => {
        const h = HABITOS_NEG.find(x => x.id === id)
        if (!h) return null
        return { id: Date.now() + Math.random(), nome: h.label, icone: h.emoji, meta: "Todos os dias", tipo: "negativo", historico: [] }
      }),
    ].filter(Boolean)

    if (novosHabitos.length > 0) {
      setHabitos([...habitosExistentes, ...novosHabitos] as any)
    }

    router.push("/")
  }

  const pct = Math.round((step / TOTAL_STEPS) * 100)

  const steps = [
    // 0 — Nome
    {
      titulo: "Olá 👋",
      subtitulo: "Vamos entender como sua mente funciona. Isso vai tornar seus insights cada vez mais pessoais.",
      podePular: false,
      podeAvancar: nome.trim().length >= 2,
      content: (
        <div>
          <div style={{ fontSize: 13, color: "#4a4a6a", marginBottom: 10 }}>Como você quer ser chamado?</div>
          <input autoFocus value={nome} onChange={e => setNome(e.target.value)}
            onKeyDown={e => e.key === "Enter" && nome.trim().length >= 2 && avancar()}
            placeholder="Seu nome ou apelido"
            style={{ width: "100%", background: "#0f0f1c", border: "1px solid #1e1e35", borderRadius: 14, padding: "16px 20px", color: "#f0eeff", fontSize: 22, fontWeight: 400, outline: "none", boxSizing: "border-box" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 8 }}>Idade (opcional)</div>
              <input type="number" value={idade} onChange={e => setIdade(e.target.value)} placeholder="ex: 24"
                style={{ width: "100%", background: "#0f0f1c", border: "1px solid #1e1e35", borderRadius: 10, padding: "12px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 8 }}>Ocupação (opcional)</div>
              <input value={ocupacao} onChange={e => setOcupacao(e.target.value)} placeholder="ex: Estudante de IA"
                style={{ width: "100%", background: "#0f0f1c", border: "1px solid #1e1e35", borderRadius: 10, padding: "12px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>
      ),
    },

    // 1 — Objetivo
    {
      titulo: "Por que você está aqui?",
      subtitulo: "Seu objetivo principal ajuda o app a priorizar os insights certos para você.",
      podePular: true,
      podeAvancar: true,
      content: (
        <ChipGrid
          items={OBJETIVOS}
          selected={objetivo ? [objetivo] : []}
          onToggle={id => setObjetivo(id === objetivo ? "" : id)}
          cols={2}
        />
      ),
    },

    // 2 — Rotina
    {
      titulo: "Como é sua rotina?",
      subtitulo: "Esses dados ajudam o app a entender seus ciclos de energia — não para te julgar, mas para interpretar melhor seus dias.",
      podePular: true,
      podeAvancar: true,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 8 }}>Acorda por volta de</div>
              <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
                style={{ width: "100%", background: "#0f0f1c", border: "1px solid #1e1e35", borderRadius: 10, padding: "11px 12px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 8 }}>Dorme por volta de</div>
              <input type="time" value={sleepTime} onChange={e => setSleepTime(e.target.value)}
                style={{ width: "100%", background: "#0f0f1c", border: "1px solid #1e1e35", borderRadius: 10, padding: "11px 12px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 8 }}>Meta de sono (h)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setSleepHours(h => Math.max(4, h - 1))} style={{ width: 32, height: 32, borderRadius: 8, background: "#1a1a2e", border: "1px solid #2a2a4a", color: "#6b6b8a", cursor: "pointer", fontSize: 16 }}>−</button>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#f0eeff", minWidth: 28, textAlign: "center" }}>{sleepHours}</span>
                <button onClick={() => setSleepHours(h => Math.min(12, h + 1))} style={{ width: 32, height: 32, borderRadius: 8, background: "#1a1a2e", border: "1px solid #2a2a4a", color: "#6b6b8a", cursor: "pointer", fontSize: 16 }}>+</button>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 12 }}>Período em que você rende mais</div>
            <ChipGrid
              items={PERIODOS}
              selected={[focusPeriod]}
              onToggle={id => setFocusPeriod(id as any)}
              cols={4}
            />
          </div>
        </div>
      ),
    },

    // 3 — O que te atrapalha
    {
      titulo: "O que costuma te derrubar?",
      subtitulo: "Isso ajuda o app a detectar padrões antes que você perceba.",
      podePular: true,
      podeAvancar: true,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 12 }}>O que mais atrapalha sua produtividade?</div>
            <TagGrid items={BLOQUEADORES} selected={bloqueadores} onToggle={item => setBloqueadores(toggle(bloqueadores, item))} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 12 }}>Situações que costumam te afetar</div>
            <TagGrid items={GATILHOS} selected={gatilhos} onToggle={item => setGatilhos(toggle(gatilhos, item))} />
          </div>
        </div>
      ),
    },

    // 4 — Hábitos positivos
    {
      titulo: "O que você quer construir?",
      subtitulo: "Esses hábitos serão criados automaticamente no seu planner.",
      podePular: true,
      podeAvancar: true,
      content: (
        <ChipGrid
          items={HABITOS_POS}
          selected={habitosPos}
          onToggle={id => setHabitosPos(toggle(habitosPos, id))}
          cols={3}
        />
      ),
    },

    // 5 — Hábitos negativos
    {
      titulo: "O que você quer monitorar?",
      subtitulo: "Sem julgamento. Observar padrões é o primeiro passo para mudá-los.",
      podePular: true,
      podeAvancar: true,
      content: (
        <ChipGrid
          items={HABITOS_NEG}
          selected={habitosNeg}
          onToggle={id => setHabitosNeg(toggle(habitosNeg, id))}
          cols={3}
        />
      ),
    },

    // 6 — Métricas
    {
      titulo: "O que você quer observar em você?",
      subtitulo: "Essas dimensões aparecerão nos seus check-ins diários e nos gráficos de evolução.",
      podePular: true,
      podeAvancar: true,
      content: (
        <ChipGrid
          items={METRICAS}
          selected={metricas}
          onToggle={id => setMetricas(toggle(metricas, id))}
          cols={3}
        />
      ),
    },

    // 7 — Áreas da vida
    {
      titulo: "Quais áreas da sua vida importam agora?",
      subtitulo: "Isso orienta os resumos e os projetos em destaque.",
      podePular: true,
      podeAvancar: true,
      content: (
        <ChipGrid
          items={AREAS}
          selected={areas}
          onToggle={id => setAreas(toggle(areas, id))}
          cols={3}
        />
      ),
    },

    // 8 — Conclusão
    {
      titulo: "",
      subtitulo: "",
      podePular: false,
      podeAvancar: true,
      content: null,
    },
  ]

  const currentStep = steps[step]
  const isLast      = step === TOTAL_STEPS

  // ── Tela final ──
  if (isLast) {
    return (
      <div style={{ minHeight: "100vh", background: "#07070f", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>
        <div style={{ textAlign: "center", maxWidth: 480, animation: "fadeUp .6s ease" }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>✦</div>
          <h1 style={{ fontSize: 30, fontWeight: 400, color: "#f0eeff", margin: "0 0 16px", letterSpacing: "-0.5px" }}>
            Seu perfil mental foi criado.
          </h1>
          <p style={{ fontSize: 15, color: "#6b6b8a", margin: "0 0 40px", lineHeight: 1.8 }}>
            A partir de agora, seus dados vão começar a virar padrões.<br />
            Quanto mais você usar, mais preciso o sistema fica.
          </p>
          <button onClick={concluir}
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 16, padding: "16px 48px", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", boxShadow: "0 8px 32px #7c3aed50" }}>
            Começar →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#07070f", display: "flex", flexDirection: "column", color: "#e2e8f0" }}>

      {/* Progress bar */}
      <div style={{ height: 3, background: "#1a1a2e", flexShrink: 0 }}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #7c3aed, #a855f7)", width: `${pct}%`, transition: "width .4s", boxShadow: "0 0 8px #7c3aed80" }} />
      </div>

      {/* Step counter */}
      <div style={{ padding: "20px 32px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, color: "#7c3aed", fontWeight: 700 }}>Focus</span>
          <span style={{ fontSize: 22, color: "#f0eeff", fontWeight: 300 }}>Planner</span>
        </div>
        <span style={{ fontSize: 12, color: "#3a3a5a" }}>{step + 1} de {TOTAL_STEPS}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 32px 32px" }}>
        <div style={{ width: "100%", maxWidth: 580, opacity: animating ? 0 : 1, transform: animating ? "translateY(10px)" : "translateY(0)", transition: "opacity .2s, transform .2s" }}>

          {/* Título */}
          {currentStep.titulo && (
            <h1 style={{ fontSize: 32, fontWeight: 400, margin: "0 0 10px", color: "#f0eeff", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
              {currentStep.titulo}
              {step === 0 && nome && ` ${nome.split(" ")[0]}`}
            </h1>
          )}
          {currentStep.subtitulo && (
            <p style={{ fontSize: 14, color: "#4a4a6a", margin: "0 0 28px", lineHeight: 1.7 }}>
              {currentStep.subtitulo}
            </p>
          )}

          {/* Step content */}
          {currentStep.content}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: "20px 32px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 580 + 64, margin: "0 auto", width: "100%" }}>
        <button onClick={voltar} disabled={step === 0}
          style={{ background: "none", border: "1px solid #1e1e35", borderRadius: 12, padding: "12px 24px", color: step === 0 ? "#2a2a3a" : "#6b6b8a", fontSize: 14, cursor: step === 0 ? "default" : "pointer" }}>
          ← Anterior
        </button>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {currentStep.podePular && (
            <button onClick={pular}
              style={{ background: "none", border: "none", color: "#3a3a5a", fontSize: 13, cursor: "pointer" }}>
              Pular
            </button>
          )}

          {step < TOTAL_STEPS - 1 ? (
            <button onClick={avancar} disabled={!currentStep.podeAvancar}
              style={{ background: currentStep.podeAvancar ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "#1a1a2e", border: "none", borderRadius: 12, padding: "12px 28px", color: currentStep.podeAvancar ? "#fff" : "#3a3a5a", fontSize: 14, fontWeight: 600, cursor: currentStep.podeAvancar ? "pointer" : "default", boxShadow: currentStep.podeAvancar ? "0 4px 16px #7c3aed40" : "none", transition: "all .2s" }}>
              Próximo →
            </button>
          ) : (
            <button onClick={() => setStep(TOTAL_STEPS)}
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 16px #7c3aed40" }}>
              Concluir ✓
            </button>
          )}
        </div>
      </div>
    </div>
  )
}