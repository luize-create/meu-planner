"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePlanner } from "../context/PlannerContext"

const navItems = [
  { icon: "🏠", label: "Central",     href: "/" },
  { icon: "⏱",  label: "Foco",        href: "/foco" },
  { icon: "✅", label: "Hábitos",     href: "/habitos" },
  { icon: "📁", label: "Projetos",    href: "/projetos" },
  { icon: "💡", label: "Ideias",      href: "/ideias" },
  { icon: "✨", label: "Insights",    href: "/insights" },
  { icon: "🧠", label: "Mapa Mental", href: "/mapa-mental" },
  { icon: "🌱", label: "Evolução",    href: "/evolucao" },
]

const diasSemana = ["S","T","Q","Q","S","S","D"]

function xpParaProximoNivel(xp: number) {
  const nivel  = Math.floor(xp / 100) + 1
  const xpAtual = xp % 100
  return { nivel, xpAtual }
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data }  = usePlanner()
  const xp        = data.xp || 0
  const habitos   = (data.habitos || []) as any[]
  const hoje      = new Date().toISOString().slice(0, 10)
  const nome      = typeof window !== "undefined"
    ? (localStorage.getItem("usuario-nome") || "")
    : ""
  const inicial   = nome ? nome[0].toUpperCase() : "U"

  let streak = 0
  if (habitos.length > 0) {
    const d = new Date()
    while (true) {
      const k = d.toISOString().slice(0, 10)
      const tem = habitos.some((h: any) => (h.historico || []).includes(k))
      if (tem) { streak++; d.setDate(d.getDate() - 1) } else break
      if (streak > 365) break
    }
  }

  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  const { nivel, xpAtual } = xpParaProximoNivel(xp)

  return (
    <div style={{
      width: 200, background: "#080810", borderRight: "1px solid #0f0f22",
      display: "flex", flexDirection: "column",
      minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{ padding: "22px 18px 18px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #7c3aed, #a855f7)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: "0 0 12px #7c3aed40" }}>✦</div>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#e2e8f0" }}>
          <span style={{ color: "#a855f7" }}>Focus</span> Planner
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 10px" }}>
        {navItems.map(item => {
          const ativo = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none", display: "block" }}>
              <div style={{
                padding: "9px 12px", borderRadius: 10,
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: 2, cursor: "pointer", transition: "all .15s",
                background: ativo ? "#7c3aed22" : "transparent",
                borderLeft: `2px solid ${ativo ? "#7c3aed" : "transparent"}`,
              }}>
                <span style={{ fontSize: 15, width: 20, textAlign: "center", opacity: ativo ? 1 : 0.7 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: ativo ? "#c4b5fd" : "#6b6b8a", fontWeight: ativo ? 500 : 400 }}>
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 14px 0", borderTop: "1px solid #0f0f1c" }}>

        {/* Streak */}
        <div style={{ background: "#0f0f1c", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>🔥</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{streak} dias</span>
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {ultimos7.map((d, i) => {
              const tem = habitos.some((h: any) => (h.historico || []).includes(d))
              return (
                <div key={i} style={{ flex: 1 }}>
                  <div style={{ fontSize: 7, color: "#2a2a45", marginBottom: 3, textAlign: "center" }}>{diasSemana[i]}</div>
                  <div style={{ height: 4, borderRadius: 2, background: tem ? "#7c3aed" : "#1a1a2e", boxShadow: tem ? "0 0 3px #7c3aed60" : "none" }} />
                </div>
              )
            })}
          </div>
        </div>

        {/* XP */}
        <div style={{ background: "#0f0f1c", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: 12 }}>⚡</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>Nível {nivel}</span>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 20, height: 3, marginBottom: 3 }}>
            <div style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7)", height: 3, borderRadius: 20, width: `${xpAtual}%` }} />
          </div>
          <div style={{ fontSize: 9, color: "#3a3a5a" }}>{xp} XP · {100 - xpAtual} para o próximo</div>
        </div>

        {/* Quote + decoration */}
        <div style={{ padding: "6px 4px 10px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, opacity: 0.15 }}>
            <svg width="100%" height="40" viewBox="0 0 180 40">
              <path d="M0,30 Q30,10 60,25 Q90,40 120,15 Q150,0 180,20 L180,40 L0,40 Z" fill="#7c3aed" />
            </svg>
          </div>
          <div style={{ fontSize: 10, color: "#3a3a5a", lineHeight: 1.6, fontStyle: "italic", textAlign: "center", position: "relative" }}>
            Progresso é constância, não perfeição.
          </div>
        </div>

        {/* User */}
        <div style={{ padding: "10px 4px 16px", display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid #0f0f1c" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
            {inicial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {nome || "Usuário"}
            </div>
            <div style={{ fontSize: 10, color: "#4a4a6a" }}>Ver perfil</div>
          </div>
        </div>
      </div>
    </div>
  )
}