// ══════════════════════════════════════════════════════
// INTERVENTION ENGINE — Transforma inteligência em ação
// ══════════════════════════════════════════════════════

import type { ResultadoAnalise } from "./patternEngine"
import type { DecisionState } from "./decisionEngine"
import type { BehavioralMemory } from "./memoryEngine"
import type { ForecastState } from "./forecastEngine"

export type InterventionTipo =
  | "protecao"
  | "foco"
  | "rotina"
  | "descanso"
  | "reducao"
  | "expansao"

export type Intervention = {
  id: string
  tipo: InterventionTipo
  titulo: string
  descricao: string
  acaoPrincipal: string
  intensidade: "leve" | "moderada" | "alta"
  motivo: string
}

export type InterventionInput = {
  analise: ResultadoAnalise
  decisao: DecisionState
  memorias: BehavioralMemory[]
  previsao: ForecastState
  tarefas: any[]
  habitos: any[]
  diario: any[]
  sessoesFoco: any[]
  projetos: any[]
}

// ── Helpers ──────────────────────────────────────────

function getDias(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Motor principal ───────────────────────────────────

export function generateInterventions(input: InterventionInput): Intervention[] {
  const { analise, decisao, memorias, previsao, tarefas, habitos, diario, sessoesFoco, projetos } = input
  const lista: Intervention[] = []

  const dias7 = getDias(7)
  const hojeStr = hoje()

  const tarefasAbertas   = tarefas.filter(t => !t.feita).length
  const tarefasAtrasadas = tarefas.filter(t => !t.feita && t.data && t.data < hojeStr).length
  const tarefasHoje      = tarefas.filter(t => t.data === hojeStr && !t.feita)
  const sessoes7         = sessoesFoco.filter(s => dias7.includes(s.data)).length
  const sessoesHoje      = sessoesFoco.filter(s => s.data === hojeStr).length
  const habitosHoje      = habitos.filter(h => h.tipo !== "negativo" && (h.historico || []).includes(hojeStr)).length
  const habitosTotal     = habitos.filter(h => h.tipo !== "negativo").length
  const projetosAtivos   = projetos.filter((p: any) => p.status === "Em andamento")
  const diarioHoje       = diario.find(e => e.data === hojeStr)

  // ── 1. PROTEÇÃO — risco de sobrecarga alto ──────
  if (previsao.riscoSobrecarga >= 65 || decisao.modoProtecao) {
    lista.push({
      id: "int-protecao-sobrecarga",
      tipo: "protecao",
      titulo: "Reduzir ruído hoje",
      descricao: tarefasAtrasadas > 0
        ? `Há ${tarefasAtrasadas} tarefa(s) atrasada(s) e ${tarefasAbertas} abertas. Talvez seja melhor resolver ou arquivar o que está parado antes de avançar.`
        : `Seus registros sugerem sobrecarga crescente. Hoje pode ser um bom dia para proteger o básico e não assumir mais compromissos.`,
      acaoPrincipal: "Escolha apenas uma prioridade e deixe o resto para depois.",
      intensidade: previsao.riscoSobrecarga >= 80 ? "alta" : "moderada",
      motivo: decisao.motivos[0] || "Sobrecarga detectada nos registros recentes."
    })
  }

  // ── 2. FOCO — clareza caindo ou foco ausente ───
  if (previsao.tendenciaClareza === "caindo" || (sessoesHoje === 0 && tarefasHoje.length > 2)) {
    const tarefaTop = tarefas.find(t => !t.feita && t.prioridade === "Alta" && t.data === hojeStr)
    lista.push({
      id: "int-foco-curto",
      tipo: "foco",
      titulo: "Um bloco de foco pode clarear o dia",
      descricao: previsao.tendenciaClareza === "caindo"
        ? "Há indícios de queda na clareza mental nos últimos dias. Um bloco de foco de 25 minutos costuma reverter essa tendência."
        : "Você ainda não iniciou nenhuma sessão de foco hoje. Começar com um bloco curto pode ajudar a organizar a mente.",
      acaoPrincipal: tarefaTop
        ? `Inicie um foco de 25 minutos em: "${tarefaTop.texto}"`
        : "Inicie um foco de 25 minutos no que mais importa agora.",
      intensidade: previsao.tendenciaClareza === "caindo" ? "moderada" : "leve",
      motivo: "Foco ativo tende a aumentar clareza e reduzir sensação de sobrecarga."
    })
  }

  // ── 3. REDUÇÃO — muitas tarefas abertas ────────
  if (tarefasAbertas > 10 || (tarefasAtrasadas >= 3 && !lista.find(i => i.tipo === "protecao"))) {
    lista.push({
      id: "int-reducao-tarefas",
      tipo: "reducao",
      titulo: "Limpar o que está parado",
      descricao: `Você tem ${tarefasAbertas} tarefas abertas${tarefasAtrasadas > 0 ? `, sendo ${tarefasAtrasadas} atrasada(s)` : ""}. Listas longas costumam aumentar a sensação de sobrecarga mesmo quando você não está trabalhando nelas.`,
      acaoPrincipal: "Escolha 3 tarefas essenciais para hoje e arquive ou adie o resto.",
      intensidade: tarefasAbertas > 15 ? "alta" : "moderada",
      motivo: "Menos itens em aberto = mais clareza mental."
    })
  }

  // ── 4. ROTINA — hábitos abandonados ────────────
  const habitosFalhados = habitosTotal - habitosHoje
  if (habitosTotal > 0 && habitosFalhados >= Math.ceil(habitosTotal * 0.6) && habitosHoje === 0) {
    const habitoPendente = habitos.find(h => h.tipo !== "negativo" && !(h.historico || []).includes(hojeStr))
    lista.push({
      id: "int-rotina-habitos",
      tipo: "rotina",
      titulo: "Voltar para a rotina básica",
      descricao: analise.habitoAncora
        ? `"${analise.habitoAncora}" parece ser seu hábito âncora. Quando ele acontece, outros tendem a seguir. Hoje pode ser um bom dia para recomeçar por ele.`
        : "Seus hábitos estão em pausa hoje. Começar por um pequeno hábito costuma criar movimento.",
      acaoPrincipal: habitoPendente
        ? `Comece por "${habitoPendente.nome}" agora.`
        : "Escolha um único hábito e faça agora.",
      intensidade: "leve",
      motivo: "Rotinas básicas são o alicerce da estabilidade emocional."
    })
  }

  // ── 5. DESCANSO — energia e sono baixos ────────
  const diarioRecente = diario.filter(e => dias7.includes(e.data))
  const sonoMedio = diarioRecente.length > 0
    ? diarioRecente.reduce((a: number, e: any) => a + (e.checkin?.sono || 6), 0) / diarioRecente.length
    : 6
  const energiaMedia = diarioRecente.length > 0
    ? diarioRecente.reduce((a: number, e: any) => a + (e.checkin?.energia || 5), 0) / diarioRecente.length
    : 5

  if (sonoMedio < 5.5 && energiaMedia < 4.5 && decisao.energiaScore < 40) {
    lista.push({
      id: "int-descanso",
      tipo: "descanso",
      titulo: "Seus registros sugerem necessidade de descanso",
      descricao: `Sono médio de ${Math.round(sonoMedio * 10) / 10}/10 e energia baixa nos últimos dias. Forçar produtividade nesse estado costuma custar mais do que render.`,
      acaoPrincipal: "Considere uma pausa real hoje — mesmo que seja de 20 minutos.",
      intensidade: sonoMedio < 4.5 ? "alta" : "moderada",
      motivo: "Descanso não é perda de tempo — é manutenção do sistema."
    })
  }

  // ── 6. EXPANSÃO — momento positivo ─────────────
  if (
    previsao.estabilidadePrevista === "alta" &&
    decisao.estadoAtual !== "sobrecarregado" &&
    decisao.estadoAtual !== "critico" &&
    decisao.clarezaScore >= 65 &&
    decisao.energiaScore >= 60
  ) {
    const projetoTop = projetosAtivos.sort((a: any, b: any) => (b.progresso || 0) - (a.progresso || 0))[0]
    lista.push({
      id: "int-expansao",
      tipo: "expansao",
      titulo: "Hoje parece um bom dia para avançar",
      descricao: projetoTop
        ? `Seus registros mostram clareza e energia acima da média. Pode ser um bom momento para avançar em "${projetoTop.nome}" — que está em ${projetoTop.progresso || 0}%.`
        : "Seus registros mostram clareza e energia acima da média. Hoje pode ser um bom dia para avançar no que mais importa.",
      acaoPrincipal: projetoTop
        ? `Dedique um bloco de foco para "${projetoTop.nome}".`
        : "Escolha o projeto mais importante e avance um passo real hoje.",
      intensidade: "leve",
      motivo: "Aproveitar os momentos de clareza acelera a evolução."
    })
  }

  // ── 7. MEMÓRIA — padrão recorrente detectado ───
  const memoriaGatilho = memorias.find(m => m.tipo === "gatilho_recorrente" && m.impacto === "alto")
  if (memoriaGatilho && !lista.find(i => i.tipo === "protecao")) {
    lista.push({
      id: `int-memoria-${memoriaGatilho.id}`,
      tipo: "protecao",
      titulo: "Padrão recorrente detectado",
      descricao: memoriaGatilho.descricao,
      acaoPrincipal: `Observe se "${memoriaGatilho.relacionadoA[0]}" está presente hoje e considere reduzir.`,
      intensidade: "moderada",
      motivo: `Esse padrão apareceu ${memoriaGatilho.recorrencias} vez(es) nos seus registros.`
    })
  }

  // ── 8. DIÁRIO — sem registro hoje ──────────────
  if (!diarioHoje && diario.length > 0 && decisao.sobrecargaScore >= 30) {
    lista.push({
      id: "int-diario",
      tipo: "rotina",
      titulo: "Registrar como você está hoje",
      descricao: "Um registro rápido no Diário ajuda o sistema a entender seu momento atual e oferecer sugestões mais precisas.",
      acaoPrincipal: "Abra o Diário e faça um check-in de 2 minutos.",
      intensidade: "leve",
      motivo: "Dados do diário alimentam toda a inteligência do sistema."
    })
  }

  // Ordena por intensidade e limita
  const ordem = { alta: 0, moderada: 1, leve: 2 }
  return lista
    .sort((a, b) => ordem[a.intensidade] - ordem[b.intensidade])
    .slice(0, 4)
}