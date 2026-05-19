// ══════════════════════════════════════════════════════
// PERSONAL PROFILE ENGINE — Perfil de funcionamento pessoal
// ══════════════════════════════════════════════════════

import type { ResultadoAnalise } from "./patternEngine"
import type { DecisionState } from "./decisionEngine"
import type { BehavioralMemory } from "./memoryEngine"
import type { ForecastState } from "./forecastEngine"
import type { Intervention } from "./interventionEngine"

export type PersonalProfile = {
  melhorHorarioFoco:    string
  habitosReguladores:   string[]
  gatilhosPrincipais:   string[]
  sinaisDeSobrecarga:   string[]
  formasDeRecuperacao:  string[]
  padraoDeEnergia:      string
  estiloDeProdutividade: string
  resumoHumano:         string
}

export type PersonalProfileInput = {
  analise:      ResultadoAnalise
  decisao:      DecisionState
  memorias:     BehavioralMemory[]
  previsao:     ForecastState
  intervencoes: Intervention[]
  diario:       any[]
  habitos:      any[]
  tarefas:      any[]
  sessoesFoco:  any[]
  projetos:     any[]
}

// ── Helpers ──────────────────────────────────────────

function getDias(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

function mediaCheckin(entradas: any[], campo: string, fallback = 5): number {
  const vals = entradas.map(e => e?.checkin?.[campo]).filter(v => v !== undefined)
  if (!vals.length) return fallback
  return vals.reduce((a: number, b: number) => a + b, 0) / vals.length
}

// ── Motor principal ───────────────────────────────────

export function generatePersonalProfile(input: PersonalProfileInput): PersonalProfile {
  const { analise, decisao, memorias, previsao, intervencoes, diario, habitos, sessoesFoco, tarefas, projetos } = input

  const dias30 = getDias(30)
  const dias14 = getDias(14)

  const diario30 = diario.filter(e => dias30.includes(e.data))
  const diario14 = diario.filter(e => dias14.includes(e.data))

  // ── MELHOR HORÁRIO DE FOCO ────────────────────────
  let melhorHorarioFoco = analise.melhorHorarioFoco

  if (melhorHorarioFoco === "—") {
    const horasConc: Record<number, number> = {}
    sessoesFoco.forEach(s => {
      if (s.hora) {
        const h = parseInt(s.hora.split(":")[0])
        horasConc[h] = (horasConc[h] || 0) + 1
      }
    })
    const melhorH = Object.entries(horasConc).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
    if (melhorH) {
      const h = Number(melhorH[0])
      melhorHorarioFoco = h < 12 ? "manhã" : h < 17 ? "tarde" : "noite"
    } else {
      melhorHorarioFoco = "ainda não detectado"
    }
  } else {
    const h = parseInt(melhorHorarioFoco.split(":")[0])
    melhorHorarioFoco = h < 12 ? "manhã" : h < 17 ? "tarde" : "noite"
  }

  // ── HÁBITOS REGULADORES ───────────────────────────
  const habitosReguladores: string[] = []

  // Do memoryEngine
  memorias
    .filter(m => m.tipo === "regulador")
    .forEach(m => {
      const nome = m.relacionadoA.find(r => !["energia", "humor", "consistencia"].includes(r))
      if (nome && !habitosReguladores.includes(nome)) habitosReguladores.push(nome)
    })

  // Do patternEngine
  if (analise.habitoAncora && !habitosReguladores.includes(analise.habitoAncora)) {
    habitosReguladores.unshift(analise.habitoAncora)
  }

  // Hábitos com alta consistência
  habitos
    .filter(h => h.tipo !== "negativo")
    .map(h => ({
      ...h,
      pct: Math.round((dias30.filter(d => (h.historico || []).includes(d)).length / 30) * 100)
    }))
    .filter((h: any) => h.pct >= 50 && !habitosReguladores.includes(h.nome))
    .sort((a: any, b: any) => b.pct - a.pct)
    .slice(0, 2)
    .forEach((h: any) => habitosReguladores.push(h.nome))

  // ── GATILHOS PRINCIPAIS ───────────────────────────
  const gatilhosPrincipais: string[] = []

  // Do memoryEngine
  memorias
    .filter(m => m.tipo === "gatilho_recorrente")
    .forEach(m => {
      const g = m.relacionadoA.find(r => !["ansiedade", "gatilhos"].includes(r))
      if (g && !gatilhosPrincipais.includes(g)) gatilhosPrincipais.push(g)
    })

  // Do diário
  const contagemGatilhos: Record<string, number> = {}
  diario30.forEach(e => {
    ;(e.gatilhos || []).forEach((g: string) => {
      contagemGatilhos[g] = (contagemGatilhos[g] || 0) + 1
    })
  })
  Object.entries(contagemGatilhos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([g]) => { if (!gatilhosPrincipais.includes(g)) gatilhosPrincipais.push(g) })

  // Fallback
  if (gatilhosPrincipais.length === 0) {
    if (previsao.sinaisDetectados.length > 0) gatilhosPrincipais.push(...previsao.sinaisDetectados.slice(0, 2))
  }

  // ── SINAIS DE SOBRECARGA ──────────────────────────
  const sinaisDeSobrecarga: string[] = []

  if (decisao.motivos.length > 0) sinaisDeSobrecarga.push(...decisao.motivos)

  memorias
    .filter(m => m.tipo === "ciclo" || m.tipo === "queda")
    .forEach(m => {
      m.evidencias.slice(0, 1).forEach(e => {
        if (!sinaisDeSobrecarga.includes(e)) sinaisDeSobrecarga.push(e)
      })
    })

  if (sinaisDeSobrecarga.length === 0) {
    if (analise.consistenciaGeral < 40) sinaisDeSobrecarga.push("Queda de consistência nos hábitos")
    sinaisDeSobrecarga.push("Aumento de tarefas abertas")
    sinaisDeSobrecarga.push("Foco reduzido")
  }

  // ── FORMAS DE RECUPERAÇÃO ─────────────────────────
  const formasDeRecuperacao: string[] = []

  memorias
    .filter(m => m.tipo === "recuperacao")
    .forEach(m => {
      m.relacionadoA
        .filter(r => !["recuperacao", "ansiedade", "clareza"].includes(r))
        .forEach(r => { if (!formasDeRecuperacao.includes(r)) formasDeRecuperacao.push(r) })
    })

  // Do diário: o que ajudou nos dias difíceis
  const contagemAjudou: Record<string, number> = {}
  diario30.forEach(e => {
    const ansiedade = e.checkin?.ansiedade || 0
    if (ansiedade >= 6) {
      ;(e.ajudou || []).forEach((a: string) => {
        contagemAjudou[a] = (contagemAjudou[a] || 0) + 1
      })
    }
  })
  Object.entries(contagemAjudou)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .forEach(([a]) => { if (!formasDeRecuperacao.includes(a)) formasDeRecuperacao.push(a) })

  if (formasDeRecuperacao.length === 0) {
    formasDeRecuperacao.push("Organizar o básico", "Foco curto", "Descanso consciente")
  }

  // ── PADRÃO DE ENERGIA ─────────────────────────────
  let padraoDeEnergia = ""

  const eneManha = mediaCheckin(
    diario30.filter(e => e.hora && parseInt(e.hora.split(":")[0]) < 12), "energia", 5)
  const eneTarde = mediaCheckin(
    diario30.filter(e => e.hora && parseInt(e.hora.split(":")[0]) >= 12 && parseInt(e.hora.split(":")[0]) < 18), "energia", 5)
  const eneNoite = mediaCheckin(
    diario30.filter(e => e.hora && parseInt(e.hora.split(":")[0]) >= 18), "energia", 5)

  if (diario30.length >= 5) {
    const max = Math.max(eneManha, eneTarde, eneNoite)
    const periodo = max === eneManha ? "manhã" : max === eneTarde ? "tarde" : "noite"
    const mediaGeral = mediaCheckin(diario30, "energia", 5)
    if (mediaGeral >= 6.5) {
      padraoDeEnergia = `energia consistentemente boa, com pico no período da ${periodo}`
    } else if (mediaGeral < 4.5) {
      padraoDeEnergia = `energia frequentemente baixa — descanso e rotina parecem essenciais`
    } else {
      padraoDeEnergia = `energia variável, com tendência de alta no período da ${periodo}`
    }
  } else {
    padraoDeEnergia = decisao.energiaScore >= 60
      ? "energia em bom nível nos registros recentes"
      : "energia abaixo da média nos registros recentes"
  }

  // ── ESTILO DE PRODUTIVIDADE ───────────────────────
  let estiloDeProdutividade = ""

  const tarefasConcluidas = tarefas.filter(t => t.feita).length
  const totalTarefas = tarefas.length
  const ratioConclusao = totalTarefas > 0 ? tarefasConcluidas / totalTarefas : 0.5
  const mediaSessoes = sessoesFoco.length > 0
    ? sessoesFoco.reduce((a: number, s: any) => a + (s.minutos || 0), 0) / sessoesFoco.length
    : 0

  if (mediaSessoes >= 45 && ratioConclusao >= 0.6) {
    estiloDeProdutividade = "tende a funcionar melhor com blocos longos de foco e poucas prioridades claras"
  } else if (mediaSessoes >= 25 && mediaSessoes < 45) {
    estiloDeProdutividade = "parece funcionar bem com sessões moderadas e rotina estruturada"
  } else if (ratioConclusao >= 0.7) {
    estiloDeProdutividade = "tende a concluir bem quando as tarefas estão organizadas e são poucas"
  } else if (analise.consistenciaGeral >= 60) {
    estiloDeProdutividade = "consistência é seu ponto forte — funciona melhor com hábitos previsíveis"
  } else {
    estiloDeProdutividade = "ainda construindo um ritmo consistente — poucas tarefas e foco curto parecem ajudar"
  }

  // ── RESUMO HUMANO ─────────────────────────────────
  let resumoHumano = ""

  const partes: string[] = []

  if (habitosReguladores.length > 0) {
    partes.push(`"${habitosReguladores[0]}" parece ser seu principal regulador`)
  }

  if (melhorHorarioFoco !== "ainda não detectado") {
    partes.push(`seu foco costuma ser melhor pela ${melhorHorarioFoco}`)
  }

  if (gatilhosPrincipais.length > 0) {
    partes.push(`"${gatilhosPrincipais[0]}" tende a desestabilizar mais`)
  }

  if (analise.consistenciaGeral > 0) {
    partes.push(`você manteve ${analise.consistenciaGeral}% de consistência nos últimos 30 dias`)
  }

  if (partes.length >= 2) {
    resumoHumano = `Seus registros sugerem que ${partes.slice(0, 2).join(" e ")}. ${estiloDeProdutividade.charAt(0).toUpperCase() + estiloDeProdutividade.slice(1)}.`
  } else if (partes.length === 1) {
    resumoHumano = `Seus registros sugerem que ${partes[0]}. Continue registrando para o sistema aprender mais sobre como você funciona.`
  } else {
    resumoHumano = "Continue registrando seus hábitos e emoções para que o sistema construa um perfil preciso do seu funcionamento."
  }

  return {
    melhorHorarioFoco,
    habitosReguladores:   habitosReguladores.slice(0, 4),
    gatilhosPrincipais:   gatilhosPrincipais.slice(0, 4),
    sinaisDeSobrecarga:   sinaisDeSobrecarga.slice(0, 4),
    formasDeRecuperacao:  formasDeRecuperacao.slice(0, 4),
    padraoDeEnergia,
    estiloDeProdutividade,
    resumoHumano,
  }
}