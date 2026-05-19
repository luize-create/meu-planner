"use client"

import { useState, useEffect, useMemo } from "react"
import { usePlanner } from "./context/PlannerContext"
import { useRouter } from "next/navigation"

const estadoConfig = {
  leve: {
    cor: "#10b981", icone: "🌱",
    bordaHero: "#10b98120",
    badge: "Dia leve",
  },
  estavel: {
    cor: "#7c3aed", icone: "💜",
    bordaHero: "#7c3aed20",
    badge: "Estável",
  },
  sobrecarregado: {
    cor: "#f59e0b", icone: "⚡",
    bordaHero: "#f59e0b20",
    badge: "Atenção",
  },
  critico: {
    cor: "#fb923c", icone: "🌊",
    bordaHero: "#fb923c20",
    badge: "Modo proteção",
  },
}

export default function Central() {
  const { data, setTarefas, analise, decisao } = usePlanner()
  const router = useRouter()

  const tarefas = (data.tarefas  || []) as any[]
  const habitos = (data.habitos  || []) as any[]
  const metas   = (data.metas    || []) as any[]
  const diario  = (data.diario   || []) as any[]

  const [projetos,     setProjetos]     = useState<any[]>([])
  const [blocos,       setBlocos]       = useState<any[]>([])
  const [intencao,     setIntencao]     = useState("Manter clareza e disciplina.")
  const [editIntencao, setEditIntencao] = useState(false)
  const [novaT,        setNovaT]        = useState("")
  const [mostrarNovaT, setMostrarNovaT] = useState(false)

  const hoje    = new Date().toISOString().slice(0, 10)
  const hora    = new Date().getHours()
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite"

  useEffect(() => {
    const p = localStorage.getItem("projetos-v1")
    if (p) setProjetos(JSON.parse(p))
    const b = localStorage.getItem("agenda-v3")
    if (b) setBlocos(JSON.parse(b)
      .filter((bl: any) => bl.data === hoje)
      .sort((a: any, z: any) => (a.horaInicio || "").localeCompare(z.horaInicio || "")))
    const i = localStorage.getItem("foco-intencao")
    if (i) setIntencao(i)
  }, [hoje])

  // ── Estado atual ──
  const config        = estadoConfig[decisao.estadoAtual]
  const modoProtecao  = decisao.modoProtecao
  const corEstado     = config.cor
  const badgeEstado   = config.badge

  // ── Métricas ──
  const tarefasHoje   = tarefas.filter((t: any) => t.data === hoje)
  const tarefasPend   = tarefasHoje.filter((t: any) => !t.feita)
  const proximaTarefa = tarefasPend[0]
  const projetosAtivos = projetos.filter((p: any) => p.status === "Em andamento").slice(0, 3)
  const metasAtivas    = metas.filter((m: any) => (m.progresso || 0) < 100).slice(0, 3)

  // Energia / Clareza / Motivação
  const ultimaDiario = diario.filter((e: any) => e.data === hoje)[0]
    || [...diario].sort((a: any, b: any) => b.data.localeCompare(a.data))[0]
  const energia   = ultimaDiario?.checkin?.energia   || 6
  const clareza   = ultimaDiario?.checkin?.clareza   || 7
  const motivacao = ultimaDiario?.checkin?.humor     || 6

  // ── Insights ──
  const ajudando = useMemo(() => {
    const lista: { icone: string; label: string; descricao: string; valor: string }[] = []
    analise.correlacoes.filter(c => c.tipo === "positiva").slice(0, 3).forEach(c => {
      lista.push({
        icone: c.origem === "exercicio" ? "🏃" : c.origem === "sono" ? "🌙" : c.origem === "rotina" ? "📅" : "✨",
        label: c.origem.charAt(0).toUpperCase() + c.origem.slice(1),
        descricao: c.descricao,
        valor: `+${Math.round(c.intensidade * 100)}%`
      })
    })
    if (!lista.length) {
      lista.push({ icone: "🌙", label: "Sono",    descricao: "Noites bem dormidas parecem melhorar sua clareza mental.", valor: "+28%" })
      lista.push({ icone: "🏃", label: "Exercício",descricao: "Dias de treino tendem a ter mais energia registrada.",     valor: "+23%" })
    }
    return lista.slice(0, 3)
  }, [analise.correlacoes])

  const prejudicando = useMemo(() => {
    const lista: { icone: string; label: string; descricao: string; valor: string }[] = []
    analise.correlacoes.filter(c => c.tipo === "negativa").slice(0, 2).forEach(c => {
      lista.push({
        icone: c.origem === "tela" ? "📱" : "🌀",
        label: c.origem.charAt(0).toUpperCase() + c.origem.slice(1),
        descricao: c.descricao,
        valor: `-${Math.round(c.intensidade * 100)}%`
      })
    })
    if (!lista.length) {
      lista.push({ icone: "📱", label: "Excesso de tela", descricao: "Excesso de tela parece aumentar ansiedade nos dias seguintes.", valor: "-21%" })
      lista.push({ icone: "😴", label: "Pouco sono",      descricao: "Dormir menos de 6h impacta o humor do dia seguinte.",          valor: "-17%" })
    }
    return lista.slice(0, 3)
  }, [analise.correlacoes])

  function toggleTarefa(id: number) {
    setTarefas(tarefas.map((t: any) => t.id === id ? { ...t, feita: !t.feita } : t) as any)
  }

  function adicionarTarefa() {
    if (!novaT.trim()) return
    setTarefas([...tarefas, { id: Date.now(), texto: novaT.trim(), descricao: "", categoria: "Pessoal", prioridade: "Média", hora: "", feita: false, data: hoje }] as any)
    setNovaT(""); setMostrarNovaT(false)
  }

  function salvarIntencao(val: string) {
    setIntencao(val)
    localStorage.setItem("foco-intencao", val)
    setEditIntencao(false)
  }

  const circ = 2 * Math.PI * 38

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", minHeight: "100vh", color: "#e2e8f0", background: "#07070f" }}>

      {/* COLUNA PRINCIPAL */}
      <div style={{ padding: "22px 28px", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Central</h1>
              <span style={{ fontSize: 14, color: "#7c3aed" }}>✦</span>
            </div>
            <p style={{ fontSize: 12, color: "#3a3a5a", margin: 0 }}>Tudo o que importa, no lugar certo.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 13, color: "#6b6b8a" }}>{saudacao} ☀️</div>
            <div style={{ background: `${corEstado}18`, border: `1px solid ${corEstado}35`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: corEstado, display: "flex", alignItems: "center", gap: 5 }}>
              <span>{config.icone}</span> {badgeEstado}
            </div>
            <div style={{ background: "#7c3aed20", border: "1px solid #7c3aed30", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#a855f7" }}>
              ⚡ {data.xp} XP
            </div>
          </div>
        </div>

        {/* MODO PROTEÇÃO — banner */}
        {modoProtecao && (
          <div style={{ background: `${corEstado}12`, border: `1px solid ${corEstado}35`, borderRadius: 12, padding: "12px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>{config.icone}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: corEstado, marginBottom: 2 }}>Modo proteção ativo</div>
              <div style={{ fontSize: 12, color: "#6b6b8a" }}>Hoje sua missão é atravessar o dia com menos ruído. Uma coisa de cada vez.</div>
            </div>
            <button onClick={() => router.push("/foco")} style={{ background: `${corEstado}20`, border: `1px solid ${corEstado}40`, borderRadius: 8, padding: "6px 14px", color: corEstado, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}>
              Entrar em foco →
            </button>
          </div>
        )}

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #0d0d1e, #12101e)", border: `1px solid ${config.bordaHero}`, borderRadius: 18, padding: "22px 26px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 65% 50%, ${corEstado}0a, transparent 60%)`, pointerEvents: "none" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 28, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: corEstado, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span>✦</span> Foco da sua vida hoje
              </div>
              {editIntencao ? (
                <input autoFocus defaultValue={intencao}
                  onBlur={e => salvarIntencao(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && salvarIntencao((e.target as HTMLInputElement).value)}
                  style={{ fontSize: 22, fontWeight: 300, background: "none", border: "none", borderBottom: `1px solid ${corEstado}40`, color: "#e2e8f0", outline: "none", width: "100%", marginBottom: 8 }} />
              ) : (
                <h2 style={{ fontSize: 24, fontWeight: 300, margin: "0 0 8px", color: "#e2e8f0", lineHeight: 1.3, cursor: "pointer" }} onClick={() => setEditIntencao(true)}>
                  {intencao}
                </h2>
              )}
              {/* Mensagem principal do decisionEngine */}
              <p style={{ fontSize: 13, color: "#6b6b8a", margin: "0 0 16px", fontStyle: "italic", lineHeight: 1.6 }}>
                {decisao.mensagemPrincipal}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditIntencao(true)} style={{ background: `${corEstado}18`, border: `1px solid ${corEstado}35`, borderRadius: 20, padding: "7px 16px", color: corEstado, fontSize: 12, cursor: "pointer" }}>
                  ✦ Definir intenção
                </button>
                <button onClick={() => router.push("/foco")} style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 20, padding: "7px 16px", color: "#6b6b8a", fontSize: 12, cursor: "pointer" }}>
                  ⏱ Iniciar foco
                </button>
              </div>
            </div>

            {/* Barras de estado */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 190 }}>
              {[
                { label: "Energia",        valor: energia,   cor: "#f59e0b", icone: "⚡" },
                { label: "Clareza mental", valor: clareza,   cor: "#7c3aed", icone: "🧠" },
                { label: "Motivação",      valor: motivacao, cor: "#10b981", icone: "✨" },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13 }}>{m.icone}</span>
                  <span style={{ fontSize: 11, color: "#6b6b8a", minWidth: 100 }}>{m.label}</span>
                  <div style={{ flex: 1, background: "#1a1a2e", borderRadius: 20, height: 5 }}>
                    <div style={{ background: m.cor, height: 5, borderRadius: 20, width: `${m.valor * 10}%`, transition: "width .4s", boxShadow: `0 0 5px ${m.cor}50` }} />
                  </div>
                  <span style={{ fontSize: 10, color: m.cor, minWidth: 28, textAlign: "right" }}>{m.valor}/10</span>
                </div>
              ))}
              <div style={{ fontSize: 9, color: "#2a2a45", textAlign: "right" }}>
                {ultimaDiario ? "do diário" : "registre no diário"}
              </div>
            </div>
          </div>
        </div>

        {/* O QUE FAZER AGORA — card de ação imediata */}
        <div style={{ background: `linear-gradient(135deg, ${corEstado}10, ${corEstado}06)`, border: `1px solid ${corEstado}30`, borderRadius: 14, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${corEstado}20`, border: `1.5px solid ${corEstado}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
            {config.icone}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: corEstado, fontWeight: 600, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.07em" }}>O que fazer agora</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{decisao.sugestaoImediata}</div>
          </div>
          {!modoProtecao && (
            <button onClick={() => router.push("/foco")} style={{ background: `${corEstado}20`, border: `1px solid ${corEstado}40`, borderRadius: 8, padding: "7px 14px", color: corEstado, fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
              Começar →
            </button>
          )}
        </div>

        {/* Grid principal — esconde itens secundários no modo proteção */}
        <div style={{ display: "grid", gridTemplateColumns: modoProtecao ? "1fr 1fr" : "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

          {/* Próxima ação — prioridade do decisao */}
          <div style={{ background: "#0f0f1c", border: `1px solid ${modoProtecao ? corEstado + "40" : "#1a1a2e"}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 14 }}>✦</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {modoProtecao ? "Uma prioridade só" : "Próxima ação importante"}
              </span>
            </div>
            {modoProtecao ? (
              // Modo proteção: mostra só prioridade do dia
              <div>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, margin: "0 0 12px", fontStyle: "italic" }}>
                  {decisao.prioridadeDoDia}
                </p>
                {proximaTarefa && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: `${corEstado}10`, borderRadius: 10, border: `1px solid ${corEstado}25` }}>
                    <div onClick={() => toggleTarefa(proximaTarefa.id)} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${corEstado}60`, flexShrink: 0, marginTop: 1, cursor: "pointer" }} />
                    <span style={{ fontSize: 13, color: "#e2e8f0" }}>{proximaTarefa.texto}</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                {proximaTarefa ? (
                  <>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                      <div onClick={() => toggleTarefa(proximaTarefa.id)} style={{ width: 17, height: 17, borderRadius: 5, border: "1.5px solid #2e2e4e", flexShrink: 0, marginTop: 2, cursor: "pointer" }} />
                      <span style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.5 }}>{proximaTarefa.texto}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      {proximaTarefa.categoria && <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 20, background: "#7c3aed18", color: "#a855f7" }}>{proximaTarefa.categoria}</span>}
                      {proximaTarefa.prioridade && <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 20, background: "#f59e0b18", color: "#f59e0b" }}>{proximaTarefa.prioridade}</span>}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "#4a4a6a", marginBottom: 8 }}>
                    {tarefasHoje.length > 0 ? "✓ Todas concluídas hoje!" : "Nenhuma tarefa para hoje."}
                  </div>
                )}
                <p style={{ fontSize: 11, color: "#3a3a5a", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>
                  {decisao.prioridadeDoDia}
                </p>
              </>
            )}
            <button onClick={() => router.push("/tarefas")} style={{ marginTop: 12, background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}>
              Ver todas as tarefas →
            </button>
          </div>

          {/* Agenda */}
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>📅</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Agenda de hoje</span>
              </div>
              <button onClick={() => router.push("/agenda")} style={{ background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver →</button>
            </div>
            {blocos.length === 0 ? (
              <div style={{ fontSize: 12, color: "#4a4a6a" }}>Nenhum compromisso hoje.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {blocos.slice(0, 4).map((b: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "#4a4a6a", width: 36, flexShrink: 0 }}>{b.horaInicio}</span>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: b.cor || "#7c3aed", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.titulo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projetos — oculto no modo proteção */}
          {!modoProtecao && (
            <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🚀</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Projetos ativos</span>
                </div>
                <button onClick={() => router.push("/projetos")} style={{ background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver →</button>
              </div>
              {projetosAtivos.length === 0 ? (
                <div style={{ fontSize: 12, color: "#4a4a6a" }}>Nenhum projeto ativo.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {projetosAtivos.map((p: any) => (
                    <div key={p.id} onClick={() => router.push(`/projetos/${p.id}`)} style={{ cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14 }}>{p.icone}</span>
                        <span style={{ flex: 1, fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</span>
                        <span style={{ fontSize: 11, color: p.cor || "#7c3aed" }}>{p.progresso || 0}%</span>
                      </div>
                      <div style={{ background: "#1a1a2e", borderRadius: 20, height: 3 }}>
                        <div style={{ background: p.cor || "#7c3aed", height: 3, borderRadius: 20, width: `${p.progresso || 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metas + Tarefas — simplificado no modo proteção */}
        {!modoProtecao && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🎯</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Metas em progresso</span>
                </div>
                <button onClick={() => router.push("/metas")} style={{ background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver →</button>
              </div>
              {metasAtivas.length === 0 ? (
                <div style={{ fontSize: 12, color: "#4a4a6a" }}>Nenhuma meta ativa.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {metasAtivas.map((m: any) => (
                    <div key={m.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "78%" }}>{m.titulo}</span>
                        <span style={{ fontSize: 11, color: "#7c3aed" }}>{m.progresso || 0}%</span>
                      </div>
                      <div style={{ background: "#1a1a2e", borderRadius: 20, height: 4 }}>
                        <div style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7)", height: 4, borderRadius: 20, width: `${m.progresso || 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>✅</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Tarefas de hoje</span>
                </div>
                <button onClick={() => router.push("/tarefas")} style={{ background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver →</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tarefasHoje.slice(0, 5).map((t: any) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div onClick={() => toggleTarefa(t.id)} style={{ width: 15, height: 15, borderRadius: 4, border: t.feita ? "none" : "1.5px solid #2e2e4e", background: t.feita ? "#7c3aed" : "transparent", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>
                      {t.feita ? "✓" : ""}
                    </div>
                    <span style={{ flex: 1, fontSize: 12, color: t.feita ? "#4a4a6a" : "#94a3b8", textDecoration: t.feita ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.texto}</span>
                    <span style={{ fontSize: 9, padding: "1px 7px", borderRadius: 20, background: t.prioridade === "Alta" ? "#7c3aed18" : "#f59e0b18", color: t.prioridade === "Alta" ? "#a855f7" : "#f59e0b", flexShrink: 0 }}>{t.prioridade}</span>
                  </div>
                ))}
              </div>
              {mostrarNovaT ? (
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <input autoFocus value={novaT} onChange={e => setNovaT(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && adicionarTarefa()}
                    placeholder="Nova tarefa..."
                    style={{ flex: 1, background: "#12121f", border: "1px solid #1e1e35", borderRadius: 7, padding: "6px 10px", color: "#e2e8f0", fontSize: 12, outline: "none" }} />
                  <button onClick={adicionarTarefa} style={{ background: "#7c3aed", border: "none", borderRadius: 7, padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 12 }}>+</button>
                </div>
              ) : (
                <button onClick={() => setMostrarNovaT(true)} style={{ marginTop: 10, background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}>
                  + Nova tarefa
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modo proteção: tarefas simplificadas */}
        {modoProtecao && (
          <div style={{ background: "#0f0f1c", border: `1px solid ${corEstado}25`, borderRadius: 14, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "#94a3b8" }}>
              Tarefas essenciais de hoje
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tarefasHoje.filter((t: any) => t.prioridade === "Alta" && !t.feita).slice(0, 3).map((t: any) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div onClick={() => toggleTarefa(t.id)} style={{ width: 15, height: 15, borderRadius: 4, border: "1.5px solid #2e2e4e", flexShrink: 0, cursor: "pointer" }} />
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>{t.texto}</span>
                </div>
              ))}
              {tarefasHoje.filter((t: any) => t.prioridade === "Alta" && !t.feita).length === 0 && (
                <div style={{ fontSize: 12, color: "#4a4a6a", fontStyle: "italic" }}>Nenhuma tarefa de alta prioridade hoje.</div>
              )}
            </div>
          </div>
        )}

        {/* Lembrete do sistema */}
        <div style={{ background: "linear-gradient(135deg, #0f0f1c, #12111e)", border: `1px solid ${corEstado}20`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${corEstado}, ${corEstado}aa)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: `0 0 14px ${corEstado}35` }}>
            {config.icone}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: corEstado, fontWeight: 600, marginBottom: 3 }}>Lembrete do sistema ✦</div>
            <p style={{ fontSize: 12, color: "#6b6b8a", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>{decisao.sugestaoImediata}</p>
          </div>
          <button onClick={() => router.push("/evolucao")} style={{ background: `${corEstado}15`, border: `1px solid ${corEstado}30`, borderRadius: 8, padding: "7px 14px", color: corEstado, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            Ver evolução →
          </button>
        </div>
      </div>

      {/* COLUNA DIREITA */}
      <div style={{ background: "#08080f", borderLeft: "1px solid #0f0f22", padding: "22px 16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Sobrecarga */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <span style={{ fontSize: 13 }}>✦</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Como está sua sobrecarga?</span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
            <div style={{ position: "relative", width: 82, height: 82, flexShrink: 0 }}>
              <svg width="82" height="82" viewBox="0 0 82 82">
                <circle cx="41" cy="41" r="38" fill="none" stroke="#1a1a2e" strokeWidth="6" />
                <circle cx="41" cy="41" r="38" fill="none" stroke={
                  decisao.estadoAtual === "critico" ? "#dc2626" :
                  decisao.estadoAtual === "sobrecarregado" ? "#f59e0b" :
                  decisao.estadoAtual === "leve" ? "#10b981" : "#7c3aed"
                } strokeWidth="6"
                  strokeDasharray={`${circ * decisao.sobrecargaScore / 100} ${circ}`}
                  strokeLinecap="round" transform="rotate(-90 41 41)"
                  style={{ filter: `drop-shadow(0 0 5px ${corEstado}60)`, transition: "stroke-dasharray .5s" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: corEstado }}>{decisao.sobrecargaScore}%</div>
                <div style={{ fontSize: 9, color: corEstado }}>{badgeEstado}</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: "#6b6b8a", lineHeight: 1.6, margin: "0 0 8px" }}>
                {decisao.mensagemPrincipal}
              </p>
              {decisao.motivos.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {decisao.motivos.map((m, i) => (
                    <div key={i} style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 3, display: "flex", gap: 4 }}>
                      <span style={{ color: corEstado }}>·</span><span>{m}</span>
                    </div>
                  ))}
                </div>
              )}
              {modoProtecao && (
                <button onClick={() => router.push("/tarefas")} style={{ background: `${corEstado}18`, border: `1px solid ${corEstado}35`, borderRadius: 8, padding: "5px 12px", color: corEstado, fontSize: 11, cursor: "pointer" }}>
                  Reduzir sobrecarga
                </button>
              )}
            </div>
          </div>
        </div>

        {/* O que está ajudando */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>✦ O que está te ajudando</span>
            <button onClick={() => router.push("/insights")} style={{ background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver insights →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ajudando.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{a.icone}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0", marginBottom: 2 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: "#6b6b8a", lineHeight: 1.5 }}>{a.descricao}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981", flexShrink: 0 }}>{a.valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* O que pode estar prejudicando */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>⚠️ O que pode estar prejudicando</span>
            <button onClick={() => router.push("/insights")} style={{ background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {prejudicando.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{p.icone}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0", marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: "#6b6b8a", lineHeight: 1.5 }}>{p.descricao}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fb923c", flexShrink: 0 }}>{p.valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hábitos rápidos */}
        {habitos.length > 0 && (
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>🔥 Hábitos hoje</span>
              <button onClick={() => router.push("/habitos")} style={{ background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}>Ver todos →</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {habitos.slice(0, 4).map((h: any) => {
                const feito = (h.historico || []).includes(hoje)
                return (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{h.icone}</span>
                    <span style={{ flex: 1, fontSize: 12, color: feito ? "#e2e8f0" : "#4a4a6a" }}>{h.nome}</span>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: feito ? "#7c3aed" : "#1a1a2e", border: feito ? "none" : "1px solid #2e2e4e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff" }}>
                      {feito ? "✓" : ""}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}