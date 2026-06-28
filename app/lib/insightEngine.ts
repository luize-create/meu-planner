// app/lib/insightEngine.ts

export type DaySnapshot = {
  data: string
  humor:    number | null
  energia:  number | null
  clareza:  number | null
  sono:     number | null
  ansiedade: number | null
  focoMin:  number
  sessoesCount: number
  tarefasConcluidas: number
  tarefasTotal: number
  habitosConcluidos: number
  habitosTotal: number
  recaidas: number
}

export type InsightItem = {
  texto: string
  confianca: number
  tipo: "correlacao" | "tendencia" | "padrao"
  dados?: string
}

export type EstadoMental = {
  modo: string
  descricao: string
  cor: string
  icone: string
  score: number
}

function avg(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function buildDailyDataset(
  diario:      any[],
  habitos:     any[],
  tarefas:     any[],
  sessoesFoco: any[],
  days = 30
): DaySnapshot[] {
  const habitosPos = habitos.filter((h: any) => h.tipo !== "negativo")
  const habitosNeg = habitos.filter((h: any) => h.tipo === "negativo")

  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const key = d.toISOString().slice(0, 10)

    let humor: number | null = null
    let energia: number | null = null
    let clareza: number | null = null

    if (typeof window !== "undefined") {
      try {
        const est = JSON.parse(localStorage.getItem(`estado-dia-${key}`) || "{}")
        if (est.humor)   humor   = est.humor
        if (est.energia) energia = est.energia
        if (est.clareza) clareza = est.clareza
      } catch {}
    }

    const entrada   = diario.find((e: any) => e.data === key)
    const sono      = entrada?.checkin?.sono      ?? null
    const ansiedade = entrada?.checkin?.ansiedade ?? null
    if (energia === null && entrada?.checkin?.energia) energia = entrada.checkin.energia

    const sessoesDia        = sessoesFoco.filter((s: any) => s.data === key)
    const focoMin           = sessoesDia.reduce((a: number, s: any) => a + (s.minutos || 0), 0)
    const tarefasDia        = tarefas.filter((t: any) => t.data === key)
    const tarefasConcluidas = tarefasDia.filter((t: any) => t.concluida).length
    const habitosConcluidos = habitosPos.filter((h: any) => (h.historico || []).includes(key)).length
    const recaidas          = habitosNeg.filter((h: any) => (h.historico || []).includes(key)).length

    return {
      data: key, humor, energia, clareza, sono, ansiedade,
      focoMin, sessoesCount: sessoesDia.length,
      tarefasConcluidas, tarefasTotal: tarefasDia.length,
      habitosConcluidos, habitosTotal: habitosPos.length,
      recaidas,
    }
  })
}

export function detectarPadroes(dataset: DaySnapshot[]): InsightItem[] {
  const insights: InsightItem[] = []

  const comDados = dataset.filter(d =>
    d.humor !== null || d.energia !== null || d.clareza !== null || d.sono !== null
  )
  if (comDados.length < 5) return []

  // 1. Clareza alta → mais foco
  const comClareza = comDados.filter(d => d.clareza !== null)
  if (comClareza.length >= 5) {
    const alta  = comClareza.filter(d => d.clareza! >= 7)
    const baixa = comClareza.filter(d => d.clareza! <= 4)
    if (alta.length >= 2 && baixa.length >= 2) {
      const mfAlta  = avg(alta.map(d => d.focoMin))
      const mfBaixa = avg(baixa.map(d => d.focoMin))
      if (mfBaixa > 5 && mfAlta > mfBaixa * 1.2) {
        const diff = Math.round((mfAlta / mfBaixa - 1) * 100)
        insights.push({
          tipo: "correlacao", confianca: 0.85,
          texto: `Você foca ${diff}% mais nos dias com clareza mental alta — ${Math.round(mfAlta)}min vs ${Math.round(mfBaixa)}min de média.`,
          dados: `${comClareza.length} dias analisados`,
        })
      }
    }
  }

  // 2. Sono → clareza do dia seguinte
  const comSono = dataset.filter(d => d.sono !== null)
  if (comSono.length >= 4) {
    const boaSono = comSono.filter(d => d.sono! >= 7)
    const maSono  = comSono.filter(d => d.sono! < 6)

    if (boaSono.length >= 2 && maSono.length >= 2) {
      const nextBoa = boaSono
        .map(d => {
          const i = dataset.indexOf(d)
          return i < dataset.length - 1 ? dataset[i + 1].clareza : null
        })
        .filter((v): v is number => v !== null)

      const nextMa = maSono
        .map(d => {
          const i = dataset.indexOf(d)
          return i < dataset.length - 1 ? dataset[i + 1].clareza : null
        })
        .filter((v): v is number => v !== null)

      if (nextBoa.length >= 2 && nextMa.length >= 2) {
        const diff = avg(nextBoa) - avg(nextMa)
        if (diff >= 1.5) {
          insights.push({
            tipo: "correlacao", confianca: 0.90,
            texto: `Noites com 7h+ de sono resultam em clareza ${Math.round(diff * 10) / 10} pontos mais alta no dia seguinte.`,
            dados: `${nextBoa.length + nextMa.length} transições analisadas`,
          })
        }
      }
    }

    // 2b. 2 noites ruins consecutivas → clareza cai
    let conseqBad = 0
    const posClar: number[] = []
    for (let i = 0; i < dataset.length - 1; i++) {
      if (dataset[i].sono !== null && dataset[i].sono! < 6) {
        conseqBad++
        if (conseqBad >= 2 && dataset[i + 1].clareza !== null) {
          posClar.push(dataset[i + 1].clareza!)
        }
      } else {
        conseqBad = 0
      }
    }
    if (posClar.length >= 2 && avg(posClar) < 5) {
      insights.push({
        tipo: "tendencia", confianca: 0.88,
        texto: `Sua clareza costuma cair após 2 noites consecutivas com menos de 6h de sono.`,
        dados: `Clareza média nesses dias: ${Math.round(avg(posClar) * 10) / 10}/10`,
      })
    }
  }

  // 3. Recaídas + noite anterior ruim
  const comRecaida = dataset.filter((d, i) => d.recaidas > 0 && i > 0)
  if (comRecaida.length >= 2) {
    const aposNoiteRuim = comRecaida.filter(d => {
      const i = dataset.indexOf(d)
      return i > 0 && dataset[i - 1].sono !== null && dataset[i - 1].sono! < 6
    })
    if (aposNoiteRuim.length >= 2) {
      const p = Math.round(aposNoiteRuim.length / comRecaida.length * 100)
      insights.push({
        tipo: "correlacao", confianca: 0.78,
        texto: `${p}% das suas recaídas ocorrem após noites com menos de 6h de sono.`,
        dados: `${aposNoiteRuim.length} de ${comRecaida.length} recaídas analisadas`,
      })
    }

    const recComAns = comRecaida.filter(d => d.ansiedade !== null)
    const semRecAns = dataset.filter(d => d.recaidas === 0 && d.ansiedade !== null)
    if (recComAns.length >= 2 && semRecAns.length >= 3) {
      const aR = avg(recComAns.map(d => d.ansiedade!))
      const aS = avg(semRecAns.map(d => d.ansiedade!))
      if (aR > aS + 1.5) {
        insights.push({
          tipo: "correlacao", confianca: 0.75,
          texto: `Em dias com recaídas, sua ansiedade média é ${Math.round(aR * 10) / 10}/10 — contra ${Math.round(aS * 10) / 10}/10 nos demais dias.`,
          dados: `Diferença de ${Math.round((aR - aS) * 10) / 10} pontos`,
        })
      }
    }
  }

  // 4. Hábitos concluídos → mais foco
  const comHab = comDados.filter(d => d.habitosTotal > 0)
  if (comHab.length >= 5) {
    const boaRot = comHab.filter(d => d.habitosConcluidos / d.habitosTotal >= 0.7)
    const maRot  = comHab.filter(d => d.habitosConcluidos / d.habitosTotal < 0.4)
    if (boaRot.length >= 2 && maRot.length >= 2) {
      const fB = avg(boaRot.map(d => d.focoMin))
      const fM = avg(maRot.map(d => d.focoMin))
      if (fM > 0 && fB > fM * 1.2) {
        const diff = Math.round((fB / fM - 1) * 100)
        insights.push({
          tipo: "correlacao", confianca: 0.72,
          texto: `Você foca ${diff}% mais nos dias em que conclui 70%+ dos hábitos.`,
          dados: `${boaRot.length} dias com boa rotina vs ${maRot.length} dias fracos`,
        })
      }
    }
  }

  // 5. Energia baixa → menos tarefas concluídas
  const comEnTar = comDados.filter(d => d.energia !== null && d.tarefasTotal > 0)
  if (comEnTar.length >= 5) {
    const enAlt = comEnTar.filter(d => d.energia! >= 7)
    const enBai = comEnTar.filter(d => d.energia! <= 4)
    if (enAlt.length >= 2 && enBai.length >= 2) {
      const pA = avg(enAlt.map(d => (d.tarefasConcluidas / d.tarefasTotal) * 100))
      const pB = avg(enBai.map(d => (d.tarefasConcluidas / d.tarefasTotal) * 100))
      if (pA > pB + 15) {
        insights.push({
          tipo: "correlacao", confianca: 0.70,
          texto: `Em dias com energia alta você conclui ${Math.round(pA)}% das tarefas — ${Math.round(pA - pB)}% mais do que em dias de energia baixa.`,
          dados: `${enAlt.length + enBai.length} dias analisados`,
        })
      }
    }
  }

  // 6. 3+ dias sem rotina → ciclo de baixo foco
  let conseqSemRot = 0
  const diasBaixoFoco: number[] = []
  for (let i = 0; i < dataset.length - 1; i++) {
    const d = dataset[i]
    if (d.habitosTotal > 0 && d.habitosConcluidos / d.habitosTotal < 0.3) {
      conseqSemRot++
      if (conseqSemRot >= 3) diasBaixoFoco.push(d.focoMin)
    } else {
      conseqSemRot = 0
    }
  }
  if (diasBaixoFoco.length >= 2 && avg(diasBaixoFoco) < 20) {
    insights.push({
      tipo: "tendencia", confianca: 0.73,
      texto: `Você entra em ciclos de baixo foco após 3+ dias consecutivos sem manter a rotina de hábitos.`,
      dados: `Padrão detectado ${diasBaixoFoco.length} vezes`,
    })
  }

  // 7. Tarefas acumuladas → ansiedade sobe
  const comAnsTask = comDados.filter(d => d.ansiedade !== null && d.tarefasTotal > 0)
  if (comAnsTask.length >= 5) {
    const muitasInc = comAnsTask.filter(d => d.tarefasTotal - d.tarefasConcluidas >= 3)
    const poucasInc = comAnsTask.filter(d => d.tarefasTotal - d.tarefasConcluidas <= 1)
    if (muitasInc.length >= 2 && poucasInc.length >= 2) {
      const aM = avg(muitasInc.map(d => d.ansiedade!))
      const aP = avg(poucasInc.map(d => d.ansiedade!))
      if (aM > aP + 1.5) {
        insights.push({
          tipo: "correlacao", confianca: 0.74,
          texto: `Sua ansiedade tende a ser mais alta em dias com 3+ tarefas incompletas — ${Math.round(aM * 10) / 10}/10 vs ${Math.round(aP * 10) / 10}/10 de média.`,
          dados: `${muitasInc.length + poucasInc.length} dias analisados`,
        })
      }
    }
  }

  // 8. Humor bom + foco → mais hábitos no dia seguinte
  const comHumorFoco = dataset.filter((d, i) =>
    d.humor !== null && d.focoMin > 30 && i < dataset.length - 1
  )
  if (comHumorFoco.length >= 3) {
    const humorAlto  = comHumorFoco.filter(d => d.humor! >= 7)
    const humorBaixo = comHumorFoco.filter(d => d.humor! <= 4)
    if (humorAlto.length >= 2 && humorBaixo.length >= 2) {
      const nextHabAlto = humorAlto
        .map(d => {
          const i = dataset.indexOf(d)
          const next = dataset[i + 1]
          return next.habitosTotal > 0 ? next.habitosConcluidos / next.habitosTotal : null
        })
        .filter((v): v is number => v !== null)
      const nextHabBaixo = humorBaixo
        .map(d => {
          const i = dataset.indexOf(d)
          const next = dataset[i + 1]
          return next.habitosTotal > 0 ? next.habitosConcluidos / next.habitosTotal : null
        })
        .filter((v): v is number => v !== null)
      if (nextHabAlto.length >= 2 && nextHabBaixo.length >= 2) {
        const diffHab = avg(nextHabAlto) - avg(nextHabBaixo)
        if (diffHab >= 0.2) {
          insights.push({
            tipo: "correlacao", confianca: 0.68,
            texto: `Dias com humor bom e foco ativo tendem a ser seguidos por maior consistência de hábitos no dia seguinte.`,
            dados: `+${Math.round(diffHab * 100)}% de consistência`,
          })
        }
      }
    }
  }

  return insights.sort((a, b) => b.confianca - a.confianca).slice(0, 4)
}

export function detectarEstadoMental(
  hoje: DaySnapshot,
  recente: DaySnapshot[]
): EstadoMental {
  const validos = recente.filter(d => d.energia !== null || d.clareza !== null)

  const h = (hoje.humor   ?? avg(validos.filter(d => d.humor   !== null).map(d => d.humor!)))   || 5
  const e = (hoje.energia ?? avg(validos.filter(d => d.energia !== null).map(d => d.energia!))) || 5
  const c = (hoje.clareza ?? avg(validos.filter(d => d.clareza !== null).map(d => d.clareza!))) || 5

  const habitosConsis = validos.length > 0
    ? avg(validos.map(d => d.habitosTotal > 0 ? d.habitosConcluidos / d.habitosTotal : 0))
    : 0
  const focoRecente   = avg(validos.map(d => d.focoMin))
  const recaidasRec   = recente.reduce((a, d) => a + d.recaidas, 0)
  const tarefasAcum   = recente.reduce((a, d) => a + Math.max(0, d.tarefasTotal - d.tarefasConcluidas), 0)
  const ansHoje       = hoje.ansiedade

  if (c >= 7 && h >= 7 && habitosConsis >= 0.6 && focoRecente >= 25)
    return { modo: "Produtivo estável", descricao: "Clareza alta, rotina consistente e foco ativo.", cor: "#10b981", icone: "🎯", score: 90 }

  if (e >= 7 && c <= 5 && (recaidasRec >= 2 || (ansHoje !== null && ansHoje >= 7)))
    return { modo: "Modo impulsivo", descricao: "Energia alta com clareza baixa. Atenção às decisões.", cor: "#f59e0b", icone: "⚡", score: 40 }

  if (e <= 4 && (tarefasAcum >= 5 || habitosConsis < 0.3))
    return { modo: "Modo vulnerável", descricao: "Energia baixa e rotina instável. Priorize o essencial.", cor: "#f43f5e", icone: "🌧️", score: 28 }

  if (c <= 4 && focoRecente < 15 && tarefasAcum >= 3)
    return { modo: "Modo disperso", descricao: "Pouco foco e clareza recente. Tente simplificar o dia.", cor: "#6366f1", icone: "🌀", score: 35 }

  if (e <= 5 && c >= 6 && habitosConsis >= 0.5)
    return { modo: "Recarregando", descricao: "Energia baixa, mas mantendo o essencial. Isso conta.", cor: "#3b82f6", icone: "🔋", score: 62 }

  if (habitosConsis >= 0.6 && focoRecente >= 20)
    return { modo: "Modo consistente", descricao: "Rotina mantida, progresso silencioso.", cor: "#7c3aed", icone: "✦", score: 75 }

  return { modo: "Calibrando", descricao: "Coletando dados. Padrões aparecem em alguns dias.", cor: "#6b6b8a", icone: "⋯", score: 50 }
}