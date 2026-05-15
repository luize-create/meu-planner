"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type Tarefa = {
  id: number; texto: string; descricao: string; categoria: string
  prioridade: string; hora: string; feita: boolean; data: string
}

type Meta = {
  id: number; titulo: string; descricao: string; categoria: string
  progresso: number; prazo: string; prioridade: string
}

type Habito = {
  id: number; nome: string; icone: string
  historico: string[] // datas concluídas
}

type Bloco = {
  id: number; titulo: string; data: string; horaInicio: string
  horaFim: string; categoria: string; cor: string
  recorrencia: string; concluido: boolean
}

type SessaoFoco = {
  id: number; tipo: string; hora: string; minutos: number; data: string
}

type EntradaDiario = {
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
  setTarefas: (t: Tarefa[]) => void
  setMetas: (m: Meta[]) => void
  setHabitos: (h: Habito[]) => void
  setBlocos: (b: Bloco[]) => void
  setSessoesFoco: (s: SessaoFoco[]) => void
  setDiario: (d: EntradaDiario[]) => void
  adicionarXP: (valor: number) => void
}

const defaultData: PlannerData = {
  tarefas: [], metas: [], habitos: [], blocos: [],
  sessoesFoco: [], diario: [], xp: 0
}

const PlannerContext = createContext<PlannerContextType>({} as PlannerContextType)

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PlannerData>(() => {
    if (typeof window === "undefined") return defaultData
    const salvo = localStorage.getItem("planner-global")
    return salvo ? { ...defaultData, ...JSON.parse(salvo) } : defaultData
  })

  useEffect(() => {
    localStorage.setItem("planner-global", JSON.stringify(data))
  }, [data])

  function setTarefas(tarefas: Tarefa[]) { setData(d => ({ ...d, tarefas })) }
  function setMetas(metas: Meta[]) { setData(d => ({ ...d, metas })) }
  function setHabitos(habitos: Habito[]) { setData(d => ({ ...d, habitos })) }
  function setBlocos(blocos: Bloco[]) { setData(d => ({ ...d, blocos })) }
  function setSessoesFoco(sessoesFoco: SessaoFoco[]) { setData(d => ({ ...d, sessoesFoco })) }
  function setDiario(diario: EntradaDiario[]) { setData(d => ({ ...d, diario })) }
  function adicionarXP(valor: number) { setData(d => ({ ...d, xp: d.xp + valor })) }

  return (
    <PlannerContext.Provider value={{ data, setTarefas, setMetas, setHabitos, setBlocos, setSessoesFoco, setDiario, adicionarXP }}>
      {children}
    </PlannerContext.Provider>
  )
}

export function usePlanner() {
  return useContext(PlannerContext)
}