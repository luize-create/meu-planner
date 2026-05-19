"use client"

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react"
import { analisarDados, ResultadoAnalise } from "../lib/patternEngine"

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

  // ── CÉREBRO: roda análise sempre que dados mudam ──
  const analise = useMemo((): ResultadoAnalise => {
    if (typeof window === "undefined") return defaultAnalise
    try {
      return analisarDados(
        data.habitos,
        data.sessoesFoco,
        data.tarefas,
        data.diario,
        projetos,
        30
      )
    } catch {
      return defaultAnalise
    }
  }, [data.habitos, data.sessoesFoco, data.tarefas, data.diario, projetos])

  function setTarefas(tarefas: any[]) { setData(d => ({ ...d, tarefas })) }
  function setMetas(metas: Meta[]) { setData(d => ({ ...d, metas })) }
  function setHabitos(habitos: any[]) { setData(d => ({ ...d, habitos })) }
  function setBlocos(blocos: Bloco[]) { setData(d => ({ ...d, blocos })) }
  function setSessoesFoco(sessoesFoco: any[]) { setData(d => ({ ...d, sessoesFoco })) }
  function setDiario(diario: EntradaDiario[]) { setData(d => ({ ...d, diario })) }
  function adicionarXP(valor: number) { setData(d => ({ ...d, xp: d.xp + valor })) }

  return (
    <PlannerContext.Provider value={{
      data, analise,
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