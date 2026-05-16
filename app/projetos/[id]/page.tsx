"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

type Projeto = {
  id: string; nome: string; frase: string; icone: string
  cor: string; status: string; progresso: number; criado: string
}

type Ideia = { id: number; texto: string }
type DiarioEntry = { id: number; data: string; texto: string }

const fases = [
  { label: "Ideia", icone: "💡" },
  { label: "Construção", icone: "🔨" },
  { label: "Testes", icone: "🧪" },
  { label: "Lançamento", icone: "🚀" },
  { label: "Melhoria contínua", icone: "⭐" },
]

const statusOpcoes = ["Planejado", "Em andamento", "Pausado", "Concluído"]

export default function ProjetoDetalhe() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [ideias, setIdeias] = useState<Ideia[]>([])
  const [proximaAcao, setProximaAcao] = useState("")
  const [editandoAcao, setEditandoAcao] = useState(false)
  const [diario, setDiario] = useState<DiarioEntry[]>([])
  const [novaEntrada, setNovaEntrada] = useState("")
  const [editandoProgresso, setEditandoProgresso] = useState(false)
  const [faseAtual, setFaseAtual] = useState(1)
  const [novaIdeia, setNovaIdeia] = useState("")
  const [showNovaIdeia, setShowNovaIdeia] = useState(false)

  useEffect(() => {
    const projetos = JSON.parse(localStorage.getItem("projetos-v1") || "[]")
    const p = projetos.find((x: Projeto) => x.id === id)
    if (p) {
      setProjeto(p)
      const faseMap: Record<string, number> = { "Planejado": 0, "Em andamento": 1, "Testes": 2, "Lançamento": 3, "Concluído": 4 }
      setFaseAtual(faseMap[p.status] || 1)
    }
    const i = localStorage.getItem(`ideias-${id}`)
    if (i) setIdeias(JSON.parse(i))
    const a = localStorage.getItem(`acao-${id}`)
    if (a) setProximaAcao(a)
    const d = localStorage.getItem(`diario-projeto-${id}`)
    if (d) setDiario(JSON.parse(d))
  }, [id])

  function salvarProjeto(atualizado: Projeto) {
    const lista = JSON.parse(localStorage.getItem("projetos-v1") || "[]")
    localStorage.setItem("projetos-v1", JSON.stringify(lista.map((p: Projeto) => p.id === id ? atualizado : p)))
    setProjeto(atualizado)
  }

  function adicionarIdeia() {
    if (!novaIdeia.trim()) return
    const novas = [...ideias, { id: Date.now(), texto: novaIdeia }]
    setIdeias(novas)
    localStorage.setItem(`ideias-${id}`, JSON.stringify(novas))
    setNovaIdeia("")
    setShowNovaIdeia(false)
  }

  function deletarIdeia(ideiaId: number) {
    const novas = ideias.filter(i => i.id !== ideiaId)
    setIdeias(novas)
    localStorage.setItem(`ideias-${id}`, JSON.stringify(novas))
  }

  function salvarAcao() {
    localStorage.setItem(`acao-${id}`, proximaAcao)
    setEditandoAcao(false)
  }

  function adicionarEntrada() {
    if (!novaEntrada.trim()) return
    const entrada: DiarioEntry = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      texto: novaEntrada
    }
    const novo = [entrada, ...diario]
    setDiario(novo)
    localStorage.setItem(`diario-projeto-${id}`, JSON.stringify(novo))
    setNovaEntrada("")
  }

  function mudarFase(i: number) {
    if (!projeto) return
    const s = i === 0 ? "Planejado" : i === 4 ? "Concluído" : "Em andamento"
    setFaseAtual(i)
    salvarProjeto({ ...projeto, status: s })
  }

  if (!projeto) return (
    <div style={{ padding: 40, color: "#4a4a6a", textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
      <div>Projeto não encontrado.</div>
      <button onClick={() => router.push("/projetos")} style={{ marginTop: 16, background: "#7c3aed", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", cursor: "pointer" }}>← Voltar</button>
    </div>
  )

  const cor = projeto.cor || "#7c3aed"

  return (
    <div style={{ color: "#e2e8f0", minHeight: "100%" }}>

      {/* Banner */}
      <div style={{ background: `linear-gradient(135deg, ${cor}18, #0a0a0f)`, borderBottom: `1px solid ${cor}20`, padding: "28px 40px 32px" }}>
        <button onClick={() => router.push("/projetos")} style={{ background: "none", border: "none", color: "#6b6b8a", cursor: "pointer", fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
          ← Voltar
        </button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "start" }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: cor + "20", border: `1px solid ${cor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, flexShrink: 0, boxShadow: `0 0 30px ${cor}30` }}>
              {projeto.icone}
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 8px", letterSpacing: -1 }}>{projeto.nome}</h1>
              <p style={{ margin: "0 0 16px", fontSize: 15, color: "#6b6b8a", fontStyle: "italic" }}>{projeto.frase}</p>
              <div style={{ display: "flex", gap: 10 }}>
                <select value={projeto.status} onChange={e => salvarProjeto({ ...projeto, status: e.target.value })} style={{ background: cor + "18", border: `1px solid ${cor}40`, borderRadius: 20, padding: "4px 12px", color: cor, fontSize: 12, fontWeight: 500, cursor: "pointer", outline: "none" }}>
                  {statusOpcoes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 4 }}>Progresso geral</div>
            <div style={{ fontSize: 44, fontWeight: 700, color: cor, lineHeight: 1 }}>{projeto.progresso}%</div>
            <div style={{ background: "#1a1a2e", borderRadius: 20, height: 6, width: 200, marginTop: 10, marginLeft: "auto" }}>
              <div style={{ background: `linear-gradient(90deg, ${cor}, ${cor}88)`, height: 6, borderRadius: 20, width: `${projeto.progresso}%`, transition: "width .4s", boxShadow: `0 0 8px ${cor}60` }} />
            </div>
            {editandoProgresso ? (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10, alignItems: "center" }}>
                <input type="range" min={0} max={100} step={5} value={projeto.progresso}
                  onChange={e => salvarProjeto({ ...projeto, progresso: Number(e.target.value) })}
                  style={{ accentColor: cor, width: 120 }} />
                <button onClick={() => setEditandoProgresso(false)} style={{ background: cor, border: "none", borderRadius: 6, padding: "4px 10px", color: "#fff", cursor: "pointer", fontSize: 11 }}>✓</button>
              </div>
            ) : (
              <button onClick={() => setEditandoProgresso(true)} style={{ background: cor + "18", border: `1px solid ${cor}30`, borderRadius: 8, padding: "4px 10px", color: cor, cursor: "pointer", fontSize: 11, marginTop: 10 }}>Atualizar progresso</button>
            )}
            <div style={{ fontSize: 11, color: "#4a4a6a", marginTop: 6 }}>Criado em {projeto.criado}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "32px 40px" }}>

        {/* Timeline */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: "24px 32px", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
            <span style={{ fontSize: 16 }}>🚩</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Fases do projeto</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: 24, left: 24, right: 24, height: 2, background: "#1a1a2e", zIndex: 0 }} />
            <div style={{ position: "absolute", top: 24, left: 24, height: 2, width: `${faseAtual > 0 ? (faseAtual / (fases.length - 1)) * 90 : 0}%`, background: `linear-gradient(90deg, ${cor}, ${cor}88)`, zIndex: 1, transition: "width .4s", boxShadow: `0 0 8px ${cor}60` }} />
            {fases.map((fase, i) => {
              const ativa = i === faseAtual
              const concluida = i < faseAtual
              return (
                <div key={i} onClick={() => mudarFase(i)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer", position: "relative", zIndex: 2 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: ativa ? cor + "20" : concluida ? cor + "30" : "#0a0a14", border: `2px solid ${ativa ? cor : concluida ? cor + "80" : "#1e1e35"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: ativa ? `0 0 20px ${cor}50` : "none", transition: "all .2s" }}>
                    {fase.icone}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: ativa ? 600 : 400, color: ativa ? "#e2e8f0" : concluida ? "#6b6b8a" : "#4a4a6a" }}>{fase.label}</div>
                    {ativa && <div style={{ fontSize: 10, color: cor, marginTop: 2 }}>Atual</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 3 cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 40 }}>

          {/* Brain Dump */}
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>🧠</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Brain dump</span>
              </div>
              <button onClick={() => setShowNovaIdeia(!showNovaIdeia)} style={{ background: cor + "18", border: `1px solid ${cor}30`, borderRadius: 6, padding: "3px 10px", color: cor, cursor: "pointer", fontSize: 11 }}>+ Nova ideia</button>
            </div>
            {showNovaIdeia && (
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input autoFocus value={novaIdeia} onChange={e => setNovaIdeia(e.target.value)} onKeyDown={e => e.key === "Enter" && adicionarIdeia()} placeholder="Sua ideia..." style={{ flex: 1, background: "#12121f", border: `1px solid ${cor}30`, borderRadius: 6, padding: "7px 10px", color: "#e2e8f0", fontSize: 12, outline: "none" }} />
                <button onClick={adicionarIdeia} style={{ background: cor, border: "none", borderRadius: 6, padding: "7px 10px", color: "#fff", cursor: "pointer", fontSize: 12 }}>✓</button>
              </div>
            )}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {ideias.length === 0 && <div style={{ fontSize: 13, color: "#4a4a6a", fontStyle: "italic" }}>Jogue suas ideias aqui...</div>}
              {ideias.map(ideia => (
                <div key={ideia.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: cor, flexShrink: 0, marginTop: 6 }} />
                  <span style={{ flex: 1, fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{ideia.texto}</span>
                  <button onClick={() => deletarIdeia(ideia.id)} style={{ background: "none", border: "none", color: "#2e2e4e", cursor: "pointer", fontSize: 12, padding: 0 }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Próxima ação */}
          <div style={{ background: "#0f0f1c", border: `1px solid ${cor}30`, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", boxShadow: `0 0 20px ${cor}10` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span>⚡</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Próxima ação</span>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12 }}>
              <div style={{ fontSize: 32, opacity: 0.4 }}>⚡</div>
              {editandoAcao ? (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                  <input autoFocus value={proximaAcao} onChange={e => setProximaAcao(e.target.value)} placeholder="Qual a próxima ação?" onKeyDown={e => e.key === "Enter" && salvarAcao()} style={{ width: "100%", background: "#12121f", border: `1px solid ${cor}40`, borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none", textAlign: "center" }} />
                  <button onClick={salvarAcao} style={{ background: cor, border: "none", borderRadius: 8, padding: "8px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Salvar</button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>{proximaAcao || "Nenhuma ação definida"}</div>
                  {proximaAcao && <div style={{ fontSize: 12, color: "#6b6b8a" }}>Essa ação vai mover o projeto para a frente.</div>}
                  <button onClick={() => setEditandoAcao(true)} style={{ background: cor, border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, boxShadow: `0 4px 16px ${cor}50`, display: "flex", alignItems: "center", gap: 6 }}>
                    ▶ {proximaAcao ? "Alterar ação" : "Definir ação"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Diário */}
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span>📓</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Diário do projeto</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input placeholder="Registre sua evolução..." value={novaEntrada} onChange={e => setNovaEntrada(e.target.value)} onKeyDown={e => e.key === "Enter" && adicionarEntrada()} style={{ flex: 1, background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "8px 10px", color: "#e2e8f0", fontSize: 12, outline: "none" }} />
              <button onClick={adicionarEntrada} style={{ background: cor, border: "none", borderRadius: 8, padding: "8px 10px", color: "#fff", cursor: "pointer", fontSize: 12 }}>+</button>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", maxHeight: 180 }}>
              {diario.length === 0 && <div style={{ fontSize: 13, color: "#4a4a6a", fontStyle: "italic" }}>Nenhuma entrada ainda...</div>}
              {diario.slice(0, 4).map(entry => (
                <div key={entry.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, textAlign: "center" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: cor }}>{entry.data}</div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cor, margin: "4px auto 0" }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{entry.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Frase */}
        <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
          <p style={{ fontSize: 18, color: "#4a4a6a", fontStyle: "italic", margin: "0 0 12px" }}>"Um dia isso será parte da minha história."</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ height: 1, width: 60, background: `linear-gradient(90deg, transparent, ${cor})` }} />
            <span style={{ color: cor, fontSize: 16 }}>◆</span>
            <div style={{ height: 1, width: 60, background: `linear-gradient(90deg, ${cor}, transparent)` }} />
          </div>
        </div>
      </div>
    </div>
  )
}