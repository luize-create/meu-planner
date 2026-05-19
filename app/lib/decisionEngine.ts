// ══════════════════════════════════════════════
// DECISION ENGINE — Leitura inteligente do estado
// ══════════════════════════════════════════════

import type { ResultadoAnalise } from "./patternEngine"

export type EstadoAtual = "leve" | "estavel" | "sobrecarregado" | "critico"

export type DecisionState = {
  estadoAtual: EstadoAtual
  sobrecargaScore: number   // 0–100
  clarezaScore: number      // 0–100
  energiaScore: number      // 0–100
  estabilidadeScore: number // 0–100
  modoProtecao: boolean
  prioridadeDoDia: string
  mensagemPrincipal: string
  sugestaoImediata: string
  motivos: string[]
}

export type DecisionInput = {
  tarefas: any[]
  habitos: any[]
  diario: any[]
  sessoesFoco: any[]
  projetos: any[]
  analise: ResultadoAnalise
}

// ── Helpers ──────────────────────────────────

function media(lista: any[], campo: string, fallback = 5): number {
  const validos = lista.map(e => e?.checkin?.[campo]).filter(v => v !== undefined && v !== null)
  if (!validos.length) return fallback
  return validos.reduce((a: number, b: number) => a + b, 0) / validos.length
}

function getDiasAtras(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  })
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val))
}

// ── Motor principal ───────────────────────────

export function generateDecision(input: DecisionInput): DecisionState {
  const { tarefas, habitos, diario, sessoesFoco, projetos, analise } = input

  const hoje = new Date().toISOString().slice(0, 10)
  const ultimos7 = getDiasAtras(7)
  const ultimos3 = getDiasAtras(3)

  const motivos: string[] = []

  // ── Dados de tarefas ──
  const tarefasAbertas   = tarefas.filter(t => !t.feita).length
  const tarefasHoje      = tarefas.filter(t => t.data === hoje)
  const tarefasFeitasHj  = tarefasHoje.filter(t => t.feita).length
  const tarefasAtrasadas = tarefas.filter(t => !t.feita && t.data && t.data < hoje).length
  const ratioConclusao   = tarefasHoje.length > 0
    ? tarefasFeitasHj / tarefasHoje.length
    : 1

  // ── Dados do diário (últimos 3 dias) ──
  const diarioRecente = diario.filter(e => ultimos3.includes(e.data))
  const ansiedadeMedia = media(diarioRecente, "ansiedade", 5)
  const estresseMedia  = media(diarioRecente, "estresse",  5)
  const sonoMedio      = media(diarioRecente, "sono",      6)
  const energiaMedia   = media(diarioRecente, "energia",   5)
  const clarezaMedia   = media(diarioRecente, "clareza",   5)
  const humorMedio     = media(diarioRecente, "humor",     5)

  // ── Dados de foco ──
  const sessoesHoje   = sessoesFoco.filter(s => s.data === hoje).length
  const sessoes7dias  = sessoesFoco.filter(s => ultimos7.includes(s.data)).length

  // ── Dados de hábitos ──
  const habitosConcluidos = habitos.filter(h =>
    (h.historico || []).includes(hoje) && h.tipo !== "negativo"
  ).length
  const habitosFalhados = habitos.filter(h =>
    !(h.historico || []).includes(hoje) && h.tipo !== "negativo"
  ).length
  const recaidas = habitos.filter(h =>
    (h.historico || []).includes(hoje) && h.tipo === "negativo"
  ).length

  // ─────────────────────────────────────────────
  // CÁLCULO DE SOBRECARGA (0–100)
  // ─────────────────────────────────────────────
  let sobrecarga = 0

  if (tarefasAbertas > 12)      { sobrecarga += 25; motivos.push("Muitas tarefas abertas acumuladas.") }
  else if (tarefasAbertas > 8)  { sobrecarga += 18; motivos.push("Bastante coisa em aberto.") }
  else if (tarefasAbertas > 5)  { sobrecarga += 10 }

  if (tarefasAtrasadas > 3)     { sobrecarga += 20; motivos.push("Várias tarefas passaram do prazo.") }
  else if (tarefasAtrasadas > 0){ sobrecarga += 12; motivos.push("Há tarefas atrasadas.") }

  if (ansiedadeMedia > 7)       { sobrecarga += 20; motivos.push("Ansiedade elevada nos últimos dias.") }
  else if (ansiedadeMedia > 5)  { sobrecarga += 10 }

  if (estresseMedia > 7)        { sobrecarga += 15; motivos.push("Estresse acima do normal recentemente.") }
  else if (estresseMedia > 5)   { sobrecarga += 8 }

  if (sonoMedio < 4)            { sobrecarga += 18; motivos.push("Sono muito curto nos últimos dias.") }
  else if (sonoMedio < 6)       { sobrecarga += 10; motivos.push("Sono abaixo do ideal.") }

  if (sessoesHoje === 0 && tarefasHoje.length > 3) { sobrecarga += 8 }

  if (recaidas > 0)             { sobrecarga += 8 }

  if (habitosFalhados > habitosConcluidos && habitos.length > 0) {
    sobrecarga += 10
    motivos.push("Mais hábitos falhados do que concluídos hoje.")
  }

  if (projetos.filter((p: any) => p.status === "Em andamento").length > 4) {
    sobrecarga += 8; motivos.push("Muitos projetos ativos simultaneamente.")
  }

  const sobrecargaScore = clamp(sobrecarga)

  // ─────────────────────────────────────────────
  // CÁLCULO DE CLAREZA (0–100)
  // ─────────────────────────────────────────────
  let clareza = 50

  clareza += (clarezaMedia - 5) * 8       // diário: -40 a +40
  clareza += (sonoMedio - 5) * 4          // sono
  clareza += sessoesHoje * 5              // foco de hoje
  clareza += habitosConcluidos * 3        // hábitos feitos
  clareza -= (sobrecargaScore / 100) * 20 // penalidade por sobrecarga
  clareza -= ansiedadeMedia * 2           // penalidade por ansiedade

  const clarezaScore = clamp(Math.round(clareza))

  // ─────────────────────────────────────────────
  // CÁLCULO DE ENERGIA (0–100)
  // ─────────────────────────────────────────────
  let energia = 50

  energia += (energiaMedia - 5) * 8
  energia += (sonoMedio - 5) * 5
  energia += sessoesHoje * 4
  energia += habitosConcluidos * 3
  energia -= (ansiedadeMedia - 5) * 3
  energia -= recaidas * 5

  // Bonus se tem hábito de exercício hoje
  const temExercicio = habitos.some(h =>
    (h.nome?.toLowerCase().includes("exerc") ||
     h.nome?.toLowerCase().includes("treino") ||
     h.nome?.toLowerCase().includes("corr") ||
     h.icone === "🏋️" || h.icone === "🏃") &&
    (h.historico || []).includes(hoje)
  )
  if (temExercicio) { energia += 12 }

  const energiaScore = clamp(Math.round(energia))

  // ─────────────────────────────────────────────
  // CÁLCULO DE ESTABILIDADE (0–100)
  // ─────────────────────────────────────────────
  let estabilidade = 50

  estabilidade += analise.consistenciaGeral * 0.3
  estabilidade -= (ansiedadeMedia - 5) * 5
  estabilidade -= (estresseMedia - 5) * 4
  estabilidade += (sonoMedio - 5) * 4
  estabilidade += (humorMedio - 5) * 5
  estabilidade += ratioConclusao * 15
  estabilidade -= (sobrecargaScore / 100) * 20

  if (sessions7diasOK(sessoes7dias)) estabilidade += 8

  const estabilidadeScore = clamp(Math.round(estabilidade))

  // ─────────────────────────────────────────────
  // ESTADO ATUAL
  // ─────────────────────────────────────────────
  let estadoAtual: EstadoAtual

  if (sobrecargaScore >= 70 || (ansiedadeMedia > 7.5 && estresseMedia > 7.5)) {
    estadoAtual = "critico"
  } else if (sobrecargaScore >= 45 || (ansiedadeMedia > 6 && sobrecargaScore >= 30)) {
    estadoAtual = "sobrecarregado"
  } else if (energiaScore >= 60 && clarezaScore >= 55 && sobrecargaScore < 30) {
    estadoAtual = "leve"
  } else {
    estadoAtual = "estavel"
  }

  const modoProtecao = estadoAtual === "sobrecarregado" || estadoAtual === "critico"

  // ─────────────────────────────────────────────
  // MENSAGEM PRINCIPAL
  // ─────────────────────────────────────────────
  const mensagens: Record<EstadoAtual, string> = {
    leve:           "Hoje parece um bom dia para avançar com calma.",
    estavel:        "Seu sistema parece estável. Continue protegendo o básico.",
    sobrecarregado: "Hoje talvez seja melhor reduzir o ruído e escolher apenas uma prioridade.",
    critico:        "Seus registros sugerem que o sistema precisa de menos pressão hoje. Foque no essencial.",
  }
  const mensagemPrincipal = mensagens[estadoAtual]

  // ─────────────────────────────────────────────
  // PRIORIDADE DO DIA
  // ─────────────────────────────────────────────
  let prioridadeDoDia = "Manter a consistência de hoje."

  if (modoProtecao) {
    prioridadeDoDia = "Escolher apenas uma ação essencial e proteger sua energia."
  } else if (clarezaScore >= 70 && energiaScore >= 65) {
    const tarefaTop = tarefas.find(t => !t.feita && t.prioridade === "Alta" && t.data === hoje)
    const projetoTop = projetos.find((p: any) => p.status === "Em andamento")
    if (tarefaTop) prioridadeDoDia = `Avançar em: "${tarefaTop.texto}"`
    else if (projetoTop) prioridadeDoDia = `Dar um passo em "${projetoTop.nome}"`
    else prioridadeDoDia = "Aproveitar a clareza para avançar no que mais importa."
  } else if (energiaScore < 40) {
    prioridadeDoDia = "Fazer uma ação pequena e celebrar a conclusão."
  } else if (sobrecargaScore >= 40) {
    prioridadeDoDia = "Organizar o mínimo necessário e deixar o resto para amanhã."
  }

  // ─────────────────────────────────────────────
  // SUGESTÃO IMEDIATA
  // ─────────────────────────────────────────────
  let sugestaoImediata = "Continue no ritmo."

  if (estadoAtual === "critico") {
    sugestaoImediata = "Talvez valha pausar, respirar e fechar abas mentais desnecessárias."
  } else if (estadoAtual === "sobrecarregado") {
    sugestaoImediata = tarefasAtrasadas > 0
      ? "Tente resolver ou arquivar uma tarefa atrasada agora."
      : "Escolha três tarefas para hoje e arquive o resto."
  } else if (sessoesHoje === 0 && tarefasHoje.length > 0) {
    sugestaoImediata = "Um bloco de foco de 25 minutos pode clarear bastante o dia."
  } else if (habitosConcluidos === 0 && habitos.length > 0) {
    const h = habitos.find((h: any) => !(h.historico || []).includes(hoje) && h.tipo !== "negativo")
    sugestaoImediata = h
      ? `Que tal começar por "${h.nome}" agora?`
      : "Registre como você está no Diário para o sistema te ajudar melhor."
  } else if (energiaScore < 35) {
    sugestaoImediata = "Seus registros sugerem energia baixa. Um descanso curto pode ajudar mais do que forçar."
  } else if (analise.padroes.length > 0) {
    sugestaoImediata = analise.padroes[0].descoberta
  }

  return {
    estadoAtual,
    sobrecargaScore,
    clarezaScore,
    energiaScore,
    estabilidadeScore,
    modoProtecao,
    prioridadeDoDia,
    mensagemPrincipal,
    sugestaoImediata,
    motivos: motivos.slice(0, 3),
  }
}

function sessions7diasOK(total: number): boolean {
  return total >= 3
}