"use client"

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react"
import { analisarDados, ResultadoAnalise } from "../lib/patternEngine"
import { generateDecision, DecisionState } from "../lib/decisionEngine"
import { generateMemories, BehavioralMemory } from "../lib/memoryEngine"
import { generateForecast, ForecastState } from "../lib/forecastEngine"
import { generateInterventions, Intervention } from "../lib/interventionEngine"
import { generatePersonalProfile, PersonalProfile } from "../lib/personalProfileEngine"

export type Tarefa = {
  id: number; texto: string; descricao: string; categoria: string
  prioridade: string; hora: string; feita: boolean; data: string
}
export type Meta = {
  id: number; titulo: string; descricao: string; categoria: string
  progresso: number; prazo: string; prioridade: string
}
export type Habito = {
  id: number; nome: string; icone: string; tipo?: string
  historico: string[]
}
export type Bloco = {
  id: number; titulo: string; data: string; horaInicio: string
  horaFim: string; categoria: string; cor: string
  recorrencia: string; concluido: boolean
}
export type SessaoFoco = {
  id: number; tipo: string; hora: string; minutos: number; data: string
  tarefa?: string; estadoAntes?: string; estadoDepois?: string
  distracao?: string; observacao?: string
}
export type EntradaDiario = {
  id: number; data: string; hora: string; titulo: string
  texto: string; humor: string; tags: string[]
}

type PlannerData = {
  tarefas: Tarefa[]
  metas: Meta[]
  habitos: Habito[]
  blocos: Bloco[]
  sessoesFoco: SessaoFoco[]
  diario: EntradaDiario[]
  xp: number
}

type PlannerContextType = {
  data: PlannerData
  analise: ResultadoAnalise
  decisao: DecisionState
  memorias: BehavioralMemory[]
  previsao: ForecastState
  intervencoes: Intervention[]
  perfil: PersonalProfile
  setTarefas: (t: Tarefa[] | any[]) => void
  setMetas: (m: Meta[]) => void
  setHabitos: (h: Habito[] | any[]) => void
  setBlocos: (b: Bloco[]) => void
  setSessoesFoco: (s: SessaoFoco[] | any[]) => void
  setDiario: (d: EntradaDiario[]) => void
  adicionarXP: (valor: number) => void
}

const defaultData: PlannerData = {
  tarefas: [], metas: [], habitos: [], blocos: [],
  sessoesFoco: [], diario: [], xp: 0
}

const defaultAnalise: ResultadoAnalise = {
  correlacoes: [], padroes: [], evolucao: [],
  melhorDiaSemana: "—", melhorHorarioFoco: "—",
  habitoAncora: null, consistenciaGeral: 0, diasAnalisados: 0
}

const defaultDecisao: DecisionState = {
  estadoAtual: "estavel",
  sobrecargaScore: 0,
  clarezaScore: 50,
  energiaScore: 50,
  estabilidadeScore: 50,
  modoProtecao: false,
  prioridadeDoDia: "Manter a consistência de hoje.",
  mensagemPrincipal: "Seu sistema parece estável. Continue protegendo o básico.",
  sugestaoImediata: "Continue no ritmo.",
  motivos: [],
}

const defaultPrevisao: ForecastState = {
  riscoSobrecarga: 0,
  riscoRecaida: 0,
  riscoAbandono: 0,
  tendenciaClareza: "estavel",
  tendenciaEnergia: "estavel",
  estabilidadePrevista: "moderada",
  mensagemPrevisiva: "Seu sistema parece em equilíbrio.",
  sinaisDetectados: [],
}

const defaultPerfil: PersonalProfile = {
  melhorHorarioFoco: "—",
  habitosReguladores: [],
  gatilhosPrincipais: [],
  sinaisDeSobrecarga: [],
  formasDeRecuperacao: [],
  padraoDeEnergia: "—",
  estiloDeProdutividade: "—",
  resumoHumano: "Continue registrando para o sistema aprender como você funciona.",
}

const PlannerContext = createContext<PlannerContextType>({} as PlannerContextType)

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PlannerData>(() => {
    if (typeof window === "undefined") return defaultData
    const salvo = localStorage.getItem("planner-global")
    return salvo ? { ...defaultData, ...JSON.parse(salvo) } : defaultData
  })

  const [projetos, setProjetos] = useState<any[]>([])

  useEffect(() => {
    localStorage.setItem("planner-global", JSON.stringify(data))
  }, [data])

  useEffect(() => {
    const p = localStorage.getItem("projetos-v1")
    if (p) setProjetos(JSON.parse(p))
  }, [])

  // ── Análise de padrões ──
  const analise = useMemo((): ResultadoAnalise => {
    if (typeof window === "undefined") return defaultAnalise
    try {
      return analisarDados(
        data.habitos, data.sessoesFoco, data.tarefas,
        data.diario, projetos, 30
      )
    } catch { return defaultAnalise }
  }, [data.habitos, data.sessoesFoco, data.tarefas, data.diario, projetos])

  // ── Decisão inteligente ──
  const decisao = useMemo((): DecisionState => {
    if (typeof window === "undefined") return defaultDecisao
    try {
      return generateDecision({
        tarefas: data.tarefas, habitos: data.habitos,
        diario: data.diario, sessoesFoco: data.sessoesFoco,
        projetos, analise,
      })
    } catch { return defaultDecisao }
  }, [data.tarefas, data.habitos, data.diario, data.sessoesFoco, projetos, analise])

  // ── Memória comportamental ──
  const memorias = useMemo((): BehavioralMemory[] => {
    if (typeof window === "undefined") return []
    try {
      return generateMemories({
        diario: data.diario, habitos: data.habitos,
        sessoesFoco: data.sessoesFoco, tarefas: data.tarefas,
        projetos, analise, decisao,
      })
    } catch { return [] }
  }, [data.diario, data.habitos, data.sessoesFoco, data.tarefas, projetos, analise, decisao])

  // ── Previsão comportamental ──
  const previsao = useMemo((): ForecastState => {
    if (typeof window === "undefined") return defaultPrevisao
    try {
      return generateForecast({
        diario: data.diario, habitos: data.habitos,
        tarefas: data.tarefas, sessoesFoco: data.sessoesFoco,
        analise, decisao, memorias,
      })
    } catch { return defaultPrevisao }
  }, [data.diario, data.habitos, data.tarefas, data.sessoesFoco, analise, decisao, memorias])

  // ── Intervenções inteligentes ──
  const intervencoes = useMemo((): Intervention[] => {
    if (typeof window === "undefined") return []
    try {
      return generateInterventions({
        analise, decisao, memorias, previsao,
        tarefas: data.tarefas, habitos: data.habitos,
        diario: data.diario, sessoesFoco: data.sessoesFoco,
        projetos,
      })
    } catch { return [] }
  }, [analise, decisao, memorias, previsao, data.tarefas, data.habitos, data.diario, data.sessoesFoco, projetos])

  // ── Perfil pessoal ──
  const perfil = useMemo((): PersonalProfile => {
    if (typeof window === "undefined") return defaultPerfil
    try {
      return generatePersonalProfile({
        analise, decisao, memorias, previsao, intervencoes,
        diario: data.diario, habitos: data.habitos,
        tarefas: data.tarefas, sessoesFoco: data.sessoesFoco,
        projetos,
      })
    } catch { return defaultPerfil }
  }, [analise, decisao, memorias, previsao, intervencoes, data.diario, data.habitos, data.tarefas, data.sessoesFoco, projetos])

  function setTarefas(tarefas: any[]) { setData(d => ({ ...d, tarefas })) }
  function setMetas(metas: Meta[]) { setData(d => ({ ...d, metas })) }
  function setHabitos(habitos: any[]) { setData(d => ({ ...d, habitos })) }
  function setBlocos(blocos: Bloco[]) { setData(d => ({ ...d, blocos })) }
  function setSessoesFoco(sessoesFoco: any[]) { setData(d => ({ ...d, sessoesFoco })) }
  function setDiario(diario: EntradaDiario[]) { setData(d => ({ ...d, diario })) }
  function adicionarXP(valor: number) { setData(d => ({ ...d, xp: d.xp + valor })) }

  return (
    <PlannerContext.Provider value={{
      data, analise, decisao, memorias, previsao, intervencoes, perfil,
      setTarefas, setMetas, setHabitos, setBlocos,
      setSessoesFoco, setDiario, adicionarXP
    }}>
      {children}
    </PlannerContext.Provider>
  )
}

export function usePlanner() {
  return useContext(PlannerContext)
}