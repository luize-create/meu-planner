"use client"

import { useState, useEffect } from "react"
import { usePlanner } from "./context/PlannerContext"
import { useRouter } from "next/navigation"

const estadoConfig = {
  leve:     { cor: "#10b981", icone: "🌱", badge: "Dia leve"     },
  estavel:  { cor: "#7c3aed", icone: "💜", badge: "Estável"      },
  atencao:  { cor: "#f59e0b", icone: "⚡", badge: "Atenção"      },
  protecao: { cor: "#fb923c", icone: "🌊", badge: "Vai com calma"},
}

export default function Central() {
  const { data, setTarefas, decisao, inteligencia } = usePlanner()
  const router = useRouter()

  const tarefas = (data.tarefas || []) as any[]
  const habitos = (data.habitos || []) as any[]
  const metas   = (data.metas   || []) as any[]
  const diario  = (data.diario  || []) as any[]

  const [projetos,     setProjetos]     = useState<any[]>([])
  const [blocos,       setBlocos]       = useState<any[]>([])
  const [novaT,        setNovaT]        = useState("")
  const [mostrarNovaT, setMostrarNovaT] = useState(false)
  const [anotacao,     setAnotacao]     = useState("")

  const hoje     = new Date().toISOString().slice(0, 10)
  const hora     = new Date().getHours()
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite"
  const emoji    = hora < 12 ? "🌤️" : hora < 18 ? "☀️" : "🌙"

  useEffect(() => {
    const p = localStorage.getItem("projetos-v1")
    if (p) setProjetos(JSON.parse(p))
    const b = localStorage.getItem("agenda-v3")
    if (b) setBlocos(JSON.parse(b).filter((bl: any) => bl.data === hoje).sort((a: any, z: any) => (a.horaInicio || "").localeCompare(z.horaInicio || "")))
    const a = localStorage.getItem("anotacao-rapida")
    if (a) setAnotacao(a)
  }, [hoje])

  const config       = estadoConfig[inteligencia.estadoGeral as keyof typeof estadoConfig] ?? estadoConfig.estavel
  const corEstado    = config.cor
  const modoProtecao = inteligencia.mostrarModoProtecao

  const tarefasHoje    = tarefas.filter((t: any) => t.data === hoje)
  const tarefasPend    = tarefasHoje.filter((t: any) => !t.feita)
  const projetosAtivos = projetos.filter((p: any) => p.status === "Em andamento")
  const projetoAtivo   = projetosAtivos[0]
  const metasAtivas    = metas.filter((m: any) => (m.progresso || 0) < 100).slice(0, 3)
  const proximoHabito  = habitos.find((h: any) => !(h.historico || []).includes(hoje))

  const ultimaDiario = diario.filter((e: any) => e.data === hoje)[0]
    || [...diario].sort((a: any, b: any) => b.data.localeCompare(a.data))[0]
  const sono = ultimaDiario?.checkin?.sono ?? ultimaDiario?.sono ?? null

  function toggleTarefa(id: number) {
    setTarefas(tarefas.map((t: any) => t.id === id ? { ...t, feita: !t.feita } : t) as any)
  }

  function adicionarTarefa() {
    if (!novaT.trim()) return
    setTarefas([...tarefas, {
      id: Date.now(), texto: novaT.trim(), descricao: "",
      categoria: "Pessoal", prioridade: "Média",
      hora: "", feita: false, data: hoje
    }] as any)
    setNovaT("")
    setMostrarNovaT(false)
  }

  function salvarAnotacao(val: string) {
    setAnotacao(val)
    localStorage.setItem("anotacao-rapida", val)
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 260px",
      minHeight: "100vh",
      color: "#e2e8f0",
      background: "#07070f"
    }}>

      {/* ── COLUNA PRINCIPAL ─────────────────────────────────── */}
      <div style={{ padding: "22px 28px", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 3px" }}>
              {saudacao} {emoji}
            </h1>
            <p style={{ fontSize: 12, color: "#4a4a6a", margin: 0 }}>Foque no que importa hoje.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              background: `${corEstado}18`, border: `1px solid ${corEstado}35`,
              borderRadius: 20, padding: "5px 14px",
              fontSize: 12, color: corEstado,
              display: "flex", alignItems: "center", gap: 5
            }}>
              {config.icone} {config.badge}
            </div>
            <div style={{
              background: "#7c3aed18", border: "1px solid #7c3aed30",
              borderRadius: 20, padding: "5px 14px",
              fontSize: 12, color: "#a855f7"
            }}>
              ⚡ {data.xp} XP
            </div>
          </div>
        </div>

        {/* Card HOJE */}
        <div style={{
          background: "#0f0f1c", border: "1px solid #1a1a2e",
          borderRadius: 16, padding: "18px 22px", marginBottom: 14
        }}>
          <div style={{
            fontSize: 11, color: "#3a3a5a", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.08em",
            marginBottom: 16, display: "flex", alignItems: "center", gap: 6
          }}>
            📋 HOJE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>

            {/* Sono */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 5 }}>🌙</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>
                {sono != null ? `${sono}h` : "—"}
              </div>
              <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 5 }}>de sono</div>
              {sono != null && (
                <span style={{
                  fontSize: 9, padding: "2px 8px", borderRadius: 20,
                  background: sono >= 7 ? "#05906918" : "#f59e0b18",
                  color: sono >= 7 ? "#059669" : "#f59e0b",
                  border: `1px solid ${sono >= 7 ? "#05906930" : "#f59e0b30"}`
                }}>
                  {sono >= 7 ? "Bom" : "Pouco"}
                </span>
              )}
            </div>

            {/* Compromissos */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 5 }}>📅</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>
                {blocos.length}
              </div>
              <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 5 }}>compromissos</div>
              <span style={{
                fontSize: 9, padding: "2px 8px", borderRadius: 20,
                background: "#1a1a2e", color: "#6b6b8a"
              }}>
                {blocos.length === 0 ? "Dia livre" : `às ${blocos[0]?.horaInicio}`}
              </span>
            </div>

            {/* Tarefas */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 5 }}>✅</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>
                {tarefasPend.length}
              </div>
              <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 5 }}>pendentes</div>
              <span style={{
                fontSize: 9, padding: "2px 8px", borderRadius: 20,
                background: tarefasPend.length === 0 ? "#05906918" : "#7c3aed18",
                color: tarefasPend.length === 0 ? "#059669" : "#a855f7",
                border: `1px solid ${tarefasPend.length === 0 ? "#05906930" : "#7c3aed30"}`
              }}>
                {tarefasPend.length === 0 ? "Tudo feito!" : "Foque nisso"}
              </span>
            </div>

            {/* Próximo hábito */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 5 }}>
                {proximoHabito?.icone || "🏃"}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 600, color: "#e2e8f0",
                marginBottom: 2, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>
                {proximoHabito?.nome || "—"}
              </div>
              <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 5 }}>próximo hábito</div>
              {proximoHabito && (
                <span style={{
                  fontSize: 9, padding: "2px 8px", borderRadius: 20,
                  background: "#10b98118", color: "#10b981",
                  border: "1px solid #10b98130"
                }}>
                  Movimente-se
                </span>
              )}
            </div>

            {/* Projeto ativo */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 5 }}>
                {projetoAtivo?.icone || "💻"}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 600, color: "#e2e8f0",
                marginBottom: 2, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>
                {projetoAtivo?.nome || "—"}
              </div>
              <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 5 }}>projeto ativo</div>
              {projetoAtivo && (
                <span style={{
                  fontSize: 9, padding: "2px 8px", borderRadius: 20,
                  background: "#7c3aed18", color: "#a855f7",
                  border: "1px solid #7c3aed30"
                }}>
                  {projetoAtivo.progresso || 0}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Banner Modo Proteção */}
        {modoProtecao && (
          <div style={{
            background: `${corEstado}12`, border: `1px solid ${corEstado}35`,
            borderRadius: 12, padding: "12px 18px", marginBottom: 14,
            display: "flex", alignItems: "center", gap: 12
          }}>
            <span style={{ fontSize: 18 }}>{config.icone}</span>
            <p style={{ flex: 1, fontSize: 12, color: "#6b6b8a", margin: 0, fontStyle: "italic" }}>
              Vai com calma hoje. Uma coisa de cada vez.
            </p>
          </div>
        )}

        {/* ▶ Iniciar Foco */}
        <button
          onClick={() => router.push("/foco")}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            border: "none", borderRadius: 14,
            padding: "18px 24px", color: "#fff",
            cursor: "pointer", display: "flex",
            alignItems: "center", gap: 16,
            marginBottom: 14,
            boxShadow: "0 4px 20px #7c3aed35",
            transition: "opacity .15s"
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "#ffffff18",
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 20, flexShrink: 0
          }}>
            ▶
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>Iniciar foco</div>
            <div style={{ fontSize: 12, color: "#c4b5fd" }}>Sessão de foco com timer</div>
          </div>
          <div style={{
            background: "#ffffff18", borderRadius: 20,
            padding: "5px 16px", fontSize: 13, fontWeight: 500
          }}>
            25 min
          </div>
        </button>

        {/* Grid Tarefas + Agenda */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

          {/* Tarefas do dia */}
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>TAREFAS DO DIA</span>
              <span style={{ fontSize: 11, color: "#4a4a6a" }}>{tarefasPend.length} pendentes</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {tarefasHoje.slice(0, 6).map((t: any) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    onClick={() => toggleTarefa(t.id)}
                    style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: t.feita ? "none" : "1.5px solid #2e2e4e",
                      background: t.feita ? "#7c3aed" : "transparent",
                      cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: 10, color: "#fff"
                    }}
                  >
                    {t.feita ? "✓" : ""}
                  </div>
                  <span style={{
                    flex: 1, fontSize: 12,
                    color: t.feita ? "#3a3a5a" : "#94a3b8",
                    textDecoration: t.feita ? "line-through" : "none",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>
                    {t.texto}
                  </span>
                  {!t.feita && (
                    <span style={{
                      fontSize: 9, padding: "1px 7px", borderRadius: 20, flexShrink: 0,
                      background: t.prioridade === "Alta" ? "#7c3aed18" : "#f59e0b18",
                      color: t.prioridade === "Alta" ? "#a855f7" : "#f59e0b"
                    }}>
                      {t.prioridade}
                    </span>
                  )}
                </div>
              ))}
              {tarefasHoje.length === 0 && (
                <div style={{ fontSize: 12, color: "#4a4a6a" }}>Nenhuma tarefa para hoje.</div>
              )}
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {mostrarNovaT ? (
                <div style={{ display: "flex", gap: 6, width: "100%" }}>
                  <input
                    autoFocus value={novaT}
                    onChange={e => setNovaT(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && adicionarTarefa()}
                    placeholder="nova tarefa..."
                    style={{
                      flex: 1, background: "#12121f",
                      border: "1px solid #1e1e35", borderRadius: 7,
                      padding: "6px 10px", color: "#e2e8f0",
                      fontSize: 12, outline: "none"
                    }}
                  />
                  <button
                    onClick={adicionarTarefa}
                    style={{
                      background: "#7c3aed", border: "none",
                      borderRadius: 7, padding: "6px 12px",
                      color: "#fff", cursor: "pointer", fontSize: 12
                    }}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setMostrarNovaT(true)}
                  style={{ background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}
                >
                  + Nova tarefa
                </button>
              )}
              <button
                onClick={() => router.push("/tarefas")}
                style={{ background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}
              >
                Ver tudo
              </button>
            </div>
          </div>

          {/* Agenda de hoje */}
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>AGENDA DE HOJE</span>
              <button
                onClick={() => router.push("/agenda")}
                style={{ background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}
              >
                Ver tudo
              </button>
            </div>
            {blocos.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "18px 0", gap: 8
              }}>
                <span style={{ fontSize: 30, opacity: 0.25 }}>📅</span>
                <div style={{ fontSize: 13, color: "#3a3a5a", fontWeight: 500 }}>Sua agenda está livre!</div>
                <div style={{ fontSize: 11, color: "#2a2a45", textAlign: "center", lineHeight: 1.6 }}>
                  Aproveite o dia para focar no que realmente importa.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {blocos.slice(0, 5).map((b: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "#4a4a6a", width: 38, flexShrink: 0 }}>{b.horaInicio}</span>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: b.cor || "#7c3aed", flexShrink: 0 }} />
                    <span style={{
                      flex: 1, fontSize: 12, color: "#94a3b8",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>
                      {b.titulo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grid Hábitos + Projeto */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

          {/* Hábitos de hoje */}
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>HÁBITOS DE HOJE</span>
              <button
                onClick={() => router.push("/habitos")}
                style={{ background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}
              >
                Ver todos
              </button>
            </div>
            {habitos.length === 0 ? (
              <div style={{ fontSize: 12, color: "#4a4a6a" }}>Nenhum hábito cadastrado.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {habitos.slice(0, 5).map((h: any) => {
                  const feito = (h.historico || []).includes(hoje)
                  return (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{h.icone}</span>
                      <span style={{
                        flex: 1, fontSize: 12,
                        color: feito ? "#4a4a6a" : "#94a3b8",
                        textDecoration: feito ? "line-through" : "none"
                      }}>
                        {h.nome}
                      </span>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: feito ? "#7c3aed" : "#1a1a2e",
                        border: feito ? "none" : "1.5px solid #2e2e4e",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 10, color: "#fff"
                      }}>
                        {feito ? "✓" : ""}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Projeto atual */}
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>PROJETO ATUAL</span>
              <button
                onClick={() => router.push("/projetos")}
                style={{ background: "none", border: "none", color: "#4a4a6a", fontSize: 11, cursor: "pointer", padding: 0 }}
              >
                Ver detalhes
              </button>
            </div>
            {projetoAtivo ? (
              <div
                onClick={() => router.push(`/projetos/${projetoAtivo.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "#1a1a2e", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 20
                  }}>
                    {projetoAtivo.icone}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>{projetoAtivo.nome}</div>
                    <div style={{ fontSize: 11, color: "#4a4a6a" }}>Projeto ativo</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: projetoAtivo.cor || "#7c3aed" }}>
                    {projetoAtivo.progresso || 0}%
                  </div>
                </div>
                <div style={{ background: "#1a1a2e", borderRadius: 20, height: 5, marginBottom: 12 }}>
                  <div style={{
                    background: `linear-gradient(90deg, ${projetoAtivo.cor || "#7c3aed"}, #a855f7)`,
                    height: 5, borderRadius: 20,
                    width: `${projetoAtivo.progresso || 0}%`,
                    transition: "width .4s"
                  }} />
                </div>
                {projetoAtivo.proximoPasso && (
                  <div>
                    <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 4 }}>Próximo passo</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{projetoAtivo.proximoPasso}</span>
                      <span style={{ fontSize: 14, color: "#4a4a6a" }}>›</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#4a4a6a" }}>Nenhum projeto ativo.</div>
            )}
          </div>
        </div>

        {/* Mini diário */}
        <div style={{
          background: "#0f0f1c", border: "1px solid #1a1a2e",
          borderRadius: 14, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 16
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "#1a1a2e",
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 20, flexShrink: 0
          }}>
            🙂
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Como você está hoje?
            </div>
            <div style={{ fontSize: 12, color: "#6b6b8a" }}>
              Uma frase já ajuda a organizar o que você sente.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#3a3a5a" }}>Registro rápido</span>
            <button
              onClick={() => router.push("/diario")}
              style={{
                background: "#7c3aed", border: "none",
                borderRadius: 8, padding: "8px 18px",
                color: "#fff", fontSize: 12,
                cursor: "pointer", fontWeight: 500
              }}
            >
              Registrar
            </button>
          </div>
        </div>
      </div>

      {/* ── SIDEBAR DIREITA ───────────────────────────────────── */}
      <div style={{
        background: "#08080f",
        borderLeft: "1px solid #0f0f22",
        padding: "22px 16px",
        overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 14
      }}>

        {/* Resumo rápido */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16, textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: `${corEstado}18`, border: `2px solid ${corEstado}40`,
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 28,
            margin: "0 auto 10px"
          }}>
            {config.icone}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", marginBottom: 2 }}>
            {config.badge}
          </div>
          <div style={{ fontSize: 11, color: "#4a4a6a" }}>Continue assim!</div>
        </div>

        {/* Em foco */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{
            fontSize: 11, color: "#4a4a6a",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12
          }}>
            ✦ EM FOCO
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 4 }}>Prioridade de hoje</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
              {inteligencia.prioridadeAtual || "Manter consistência nos hábitos"}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 4 }}>💡 Lembrete</div>
            <div style={{ fontSize: 11, color: "#6b6b8a", lineHeight: 1.5, fontStyle: "italic" }}>
              Pequenas ações geram grandes mudanças.
            </div>
          </div>
        </div>

        {/* Próximo hábito */}
        {proximoHabito && (
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
            <div style={{
              fontSize: 11, color: "#4a4a6a",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12
            }}>
              🏃 PRÓXIMO HÁBITO
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <span>{proximoHabito.icone}</span> {proximoHabito.nome}
            </div>
            {proximoHabito.horario && (
              <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 12 }}>
                às {proximoHabito.horario}
              </div>
            )}
            <button
              onClick={() => router.push("/habitos")}
              style={{
                width: "100%", background: "#1a1a2e",
                border: "1px solid #2e2e4e", borderRadius: 8,
                padding: "8px", color: "#6b6b8a",
                fontSize: 12, cursor: "pointer"
              }}
            >
              Ver detalhes
            </button>
          </div>
        )}

        {/* Anotação rápida */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{
            fontSize: 11, color: "#4a4a6a",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10
          }}>
            ✏️ ANOTAÇÃO RÁPIDA
          </div>
          <textarea
            value={anotacao}
            onChange={e => salvarAnotacao(e.target.value)}
            placeholder="Escreva algo rápido..."
            style={{
              width: "100%", minHeight: 90,
              background: "#08080f", border: "1px solid #1a1a2e",
              borderRadius: 8, padding: "10px 12px",
              color: "#94a3b8", fontSize: 12, outline: "none",
              resize: "vertical", boxSizing: "border-box",
              fontFamily: "inherit", lineHeight: 1.6
            }}
          />
        </div>
      </div>
    </div>
  )
}