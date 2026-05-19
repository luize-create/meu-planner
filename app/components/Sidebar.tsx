"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { usePlanner } from "../context/PlannerContext"

const navOrganizacao = [
  { icon: "🏠", label: "Central", href: "/" },
  { icon: "⏱️", label: "Foco",    href: "/foco" },
]

const navAutoconhecimento = [
  { icon: "✨", label: "Insights",    href: "/insights" },
  { icon: "🧠", label: "Mapa Mental", href: "/mapa-mental" },
  { icon: "🌱", label: "Evolução",    href: "/evolucao" },
  { icon: "📖", label: "Diário",      href: "/diario" },
]

const diasSemana = ["S","T","Q","Q","S","S","D"]

function xpParaProximoNivel(xp: number) {
  const nivel = Math.floor(xp / 100) + 1
  const xpAtual = xp % 100
  return { nivel, xpAtual, falta: 100 - xpAtual }
}

const frasesSidebar = [
  "Você não precisa ter tudo resolvido.\nSó precisa seguir\num passo de cada vez.",
  "Clareza nasce\nda continuidade.\nContinue.",
  "Pequenas ações\nconstroem\ngrandes mudanças.",
  "Observe. Aprenda.\nCresça.\nRepita.",
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data } = usePlanner()
  const xp = data.xp || 0
  const habitos = (data.habitos || []) as any[]
  const hoje = new Date().toISOString().slice(0, 10)

  let streak = 0
  if (habitos.length > 0) {
    const d = new Date(hoje)
    while (true) {
      const k = d.toISOString().slice(0, 10)
      const tem = habitos.some((h: any) => (h.historico || []).includes(k))
      if (tem) { streak++; d.setDate(d.getDate() - 1) } else break
    }
  }

  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  const { nivel, xpAtual } = xpParaProximoNivel(xp)
  const frase = frasesSidebar[new Date().getDay() % frasesSidebar.length]

  function NavItem({ item }: { item: any }) {
    const ativo = pathname === item.href
    return (
      <Link href={item.href} style={{ textDecoration: "none" }}>
        <div style={{
          padding: "8px 12px", borderRadius: 9, display: "flex", alignItems: "center",
          gap: 10, marginBottom: 2, cursor: "pointer", transition: "all .15s",
          background: ativo ? "#7c3aed20" : "transparent",
          borderLeft: ativo ? "2px solid #7c3aed" : "2px solid transparent",
        }}>
          <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
          <span style={{ fontSize: 13, color: ativo ? "#c4b5fd" : "#6b6b8a", fontWeight: ativo ? 500 : 400 }}>
            {item.label}
          </span>
        </div>
      </Link>
    )
  }

  return (
    <div style={{
      width: 210, background: "#08080f", borderRight: "1px solid #0f0f22",
      display: "flex", flexDirection: "column", flexShrink: 0,
      minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto"
    }}>

      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #0f0f22" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, background: "linear-gradient(135deg, #7c3aed, #a855f7)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✦</div>
            <span style={{ fontWeight: 600, fontSize: 13, color: "#e2e8f0" }}>
              <span style={{ color: "#a855f7" }}>Focus</span> Planner
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        <div style={{ fontSize: 9, color: "#2a2a45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 12px 6px" }}>Organização</div>
        {navOrganizacao.map((item, i) => <NavItem key={i} item={item} />)}

        <div style={{ height: 1, background: "#0f0f22", margin: "10px 4px" }} />

        <div style={{ fontSize: 9, color: "#2a2a45", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 12px 6px" }}>Autoconhecimento</div>
        {navAutoconhecimento.map((item, i) => <NavItem key={i} item={item} />)}
      </div>

      {/* Bottom */}
      <div style={{ padding: "12px", borderTop: "1px solid #0f0f22" }}>

        {/* Streak */}
        <div style={{ background: "#0f0f1c", borderRadius: 12, padding: "12px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 15 }}>🔥</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{streak} dias</span>
            <span style={{ fontSize: 10, color: "#4a4a6a", marginLeft: 2 }}>seguidos</span>
          </div>
          <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
            {ultimos7.map((d, i) => {
              const tem = habitos.some((h: any) => (h.historico || []).includes(d))
              const ehHoje = d === hoje
              return (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 7, color: "#2a2a45", marginBottom: 3 }}>{diasSemana[i]}</div>
                  <div style={{ height: 5, borderRadius: 2, background: tem ? "#7c3aed" : "#1a1a2e", boxShadow: tem ? "0 0 4px #7c3aed50" : "none", border: ehHoje ? "1px solid #7c3aed50" : "none" }} />
                </div>
              )
            })}
          </div>
          {streak > 0 && <div style={{ fontSize: 10, color: "#f59e0b" }}>Incrível! Continue assim 🔥</div>}
        </div>

        {/* XP / Nível */}
        <div style={{ background: "#0f0f1c", borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>⚡</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>Nível {nivel}</span>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 20, height: 4, marginBottom: 4 }}>
            <div style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7)", height: 4, borderRadius: 20, width: `${xpAtual}%`, boxShadow: "0 0 6px #7c3aed60" }} />
          </div>
          <div style={{ fontSize: 10, color: "#4a4a6a" }}>{xp} XP · próximo nível em {100 - xpAtual} XP</div>
        </div>

        {/* Frase */}
        <div style={{ padding: "10px 4px" }}>
          <p style={{ fontSize: 11, color: "#3a3a5a", lineHeight: 1.6, margin: 0, fontStyle: "italic", whiteSpace: "pre-line", textAlign: "center" }}>{frase}</p>
        </div>
      </div>
    </div>
  )
}