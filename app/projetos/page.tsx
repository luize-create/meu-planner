"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type Projeto = {
  id: string
  nome: string
  frase: string
  icone: string
  cor: string
  status: string
  progresso: number
  criado: string
}

const coresOpcoes = [
  { valor: "#7c3aed" }, { valor: "#2563eb" }, { valor: "#059669" },
  { valor: "#d97706" }, { valor: "#db2777" }, { valor: "#0891b2" },
  { valor: "#dc2626" }, { valor: "#ca8a04" },
]

const icones = ["💻", "🧠", "🚀", "🎯", "📱", "🌐", "⚡", "🔮", "🎨", "📊", "🏗️", "💡"]

const statusCores: Record<string, string> = {
  "Em andamento": "#7c3aed",
  "Planejado": "#0891b2",
  "Pausado": "#d97706",
  "Concluído": "#059669",
}

export default function Projetos() {
  const router = useRouter()
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [modal, setModal] = useState(false)
  const [novo, setNovo] = useState({ nome: "", frase: "", icone: "💻", cor: "#7c3aed", status: "Em andamento" })

  useEffect(() => {
    const salvo = localStorage.getItem("projetos-v1")
    if (salvo) setProjetos(JSON.parse(salvo))
  }, [])

  function salvar(lista: Projeto[]) {
    setProjetos(lista)
    localStorage.setItem("projetos-v1", JSON.stringify(lista))
  }

  function criarProjeto() {
    if (!novo.nome.trim()) return
    const p: Projeto = {
      id: Date.now().toString(),
      nome: novo.nome, frase: novo.frase,
      icone: novo.icone, cor: novo.cor,
      status: novo.status, progresso: 0,
      criado: new Date().toLocaleDateString("pt-BR"),
    }
    salvar([...projetos, p])
    setNovo({ nome: "", frase: "", icone: "💻", cor: "#7c3aed", status: "Em andamento" })
    setModal(false)
  }

  function deletar(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm("Excluir este projeto?")) salvar(projetos.filter(p => p.id !== id))
  }

  return (
    <div style={{ padding: "32px 40px", color: "#e2e8f0", minHeight: "100%" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: -1 }}>Projetos</h1>
          <p style={{ fontSize: 14, color: "#4a4a6a", margin: "6px 0 0" }}>Seus projetos, sua evolução.</p>
        </div>
        <button onClick={() => setModal(true)} style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          + Novo projeto
        </button>
      </div>

      {projetos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#4a4a6a" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>Nenhum projeto ainda</div>
          <div style={{ fontSize: 13, marginBottom: 24 }}>Crie seu primeiro projeto e comece a construir algo incrível.</div>
          <button onClick={() => setModal(true)} style={{ background: "#7c3aed22", border: "1px solid #7c3aed44", borderRadius: 10, padding: "10px 20px", color: "#a855f7", cursor: "pointer", fontSize: 13 }}>
            + Criar primeiro projeto
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {projetos.map(p => (
            <div key={p.id} onClick={() => router.push(`/projetos/${p.id}`)} style={{ background: "#0f0f1c", border: `1px solid ${p.cor}30`, borderRadius: 20, padding: 24, cursor: "pointer", transition: "all .2s", position: "relative", boxShadow: `0 0 30px ${p.cor}10` }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${p.cor}, ${p.cor}44)`, borderRadius: "20px 20px 0 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: p.cor + "18", border: `1px solid ${p.cor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{p.icone}</div>
                <button onClick={e => deletar(p.id, e)} style={{ background: "none", border: "none", color: "#2e2e4e", cursor: "pointer", fontSize: 16, padding: "4px 8px" }}>✕</button>
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 600, color: "#e2e8f0" }}>{p.nome}</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6b6b8a", lineHeight: 1.5, fontStyle: "italic" }}>{p.frase || "Sem descrição"}</p>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#4a4a6a" }}>Progresso</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: p.cor }}>{p.progresso}%</span>
                </div>
                <div style={{ background: "#1a1a2e", borderRadius: 20, height: 4 }}>
                  <div style={{ background: `linear-gradient(90deg, ${p.cor}, ${p.cor}88)`, height: 4, borderRadius: 20, width: `${p.progresso}%`, transition: "width .3s", boxShadow: `0 0 8px ${p.cor}60` }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: (statusCores[p.status] || "#7c3aed") + "20", color: statusCores[p.status] || "#a855f7", fontWeight: 500 }}>{p.status}</span>
                <span style={{ fontSize: 11, color: "#4a4a6a" }}>Criado {p.criado}</span>
              </div>
            </div>
          ))}
          <div onClick={() => setModal(true)} style={{ background: "transparent", border: "1px dashed #1e1e35", borderRadius: 20, padding: 24, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 200 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, border: "1px dashed #2e2e4e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#4a4a6a" }}>+</div>
            <span style={{ fontSize: 13, color: "#4a4a6a" }}>Novo projeto</span>
          </div>
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000090", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(8px)" }}>
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 20, padding: 28, width: 460, maxWidth: "92vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Novo projeto</h2>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 8 }}>Ícone</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {icones.map(ic => (
                    <button key={ic} onClick={() => setNovo({ ...novo, icone: ic })} style={{ width: 38, height: 38, borderRadius: 9, border: "1px solid", borderColor: novo.icone === ic ? novo.cor : "#1e1e35", background: novo.icone === ic ? novo.cor + "20" : "#12121f", cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: novo.icone === ic ? `0 0 10px ${novo.cor}40` : "none" }}>{ic}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 6 }}>Nome do projeto</div>
                <input autoFocus placeholder="Ex: Focus Planner" value={novo.nome} onChange={e => setNovo({ ...novo, nome: e.target.value })} onKeyDown={e => e.key === "Enter" && criarProjeto()} style={{ width: "100%", background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 6 }}>Frase do projeto</div>
                <input placeholder="Ex: Transformar caos mental em clareza visual." value={novo.frase} onChange={e => setNovo({ ...novo, frase: e.target.value })} style={{ width: "100%", background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 8 }}>Cor do projeto</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {coresOpcoes.map(c => (
                    <button key={c.valor} onClick={() => setNovo({ ...novo, cor: c.valor })} style={{ width: 28, height: 28, borderRadius: "50%", background: c.valor, border: novo.cor === c.valor ? "3px solid #fff" : "2px solid transparent", cursor: "pointer", boxShadow: novo.cor === c.valor ? `0 0 10px ${c.valor}80` : "none" }} />
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 6 }}>Status inicial</div>
                <select value={novo.status} onChange={e => setNovo({ ...novo, status: e.target.value })} style={{ width: "100%", background: "#12121f", border: "1px solid #1e1e35", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 13, outline: "none" }}>
                  {["Planejado", "Em andamento", "Pausado", "Concluído"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {novo.nome && (
                <div style={{ padding: "12px 16px", background: novo.cor + "10", border: `1px solid ${novo.cor}25`, borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{novo.icone}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{novo.nome}</div>
                    {novo.frase && <div style={{ fontSize: 11, color: "#6b6b8a", fontStyle: "italic" }}>{novo.frase}</div>}
                  </div>
                </div>
              )}
              <button onClick={criarProjeto} disabled={!novo.nome.trim()} style={{ background: novo.nome.trim() ? `linear-gradient(135deg, ${novo.cor}, ${novo.cor}aa)` : "#1e1e35", border: "none", borderRadius: 10, padding: "12px", color: novo.nome.trim() ? "#fff" : "#4a4a6a", cursor: novo.nome.trim() ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 500, boxShadow: novo.nome.trim() ? `0 4px 20px ${novo.cor}40` : "none" }}>
                Criar projeto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}