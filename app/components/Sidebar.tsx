"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePlanner } from "../context/PlannerContext"

const navItems = [
  { icon: "⊞", label: "Dashboard", href: "/" },
  { icon: "◎", label: "Metas", href: "/metas" },
  { icon: "☑", label: "Tarefas", href: "/tarefas" },
  { icon: "📅", label: "Agenda", href: "/agenda" },
  { icon: "◈", label: "Disciplinas", href: "/disciplinas" },
  { icon: "○", label: "Hábitos", href: "/habitos" },
  { icon: "⬡", label: "Projetos", href: "/projetos" },
  { icon: "◉", label: "Foco", href: "/foco" },
  { icon: "↗", label: "Relatórios", href: "/relatorios" },
  { icon: "✎", label: "Diário", href: "/diario" },
  { icon: "⚙", label: "Configurações", href: "/configuracoes" },
]

const diasSemana = ["S", "T", "Q", "Q", "S", "S", "D"]

export default function Sidebar() {
  const pathname = usePathname()
  const { data } = usePlanner()
  const xp = data.xp

  return (
    <div style={{
      width: 200, background: "#0d0d14", borderRight: "1px solid #1a1a2e",
      padding: "0", display: "flex", flexDirection: "column", flexShrink: 0,
      minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto"
    }}>

      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #7c3aed, #a855f7)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>◆</div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#e2e8f0" }}>
            <span style={{ color: "#a855f7" }}>Focus</span> Planner
          </span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "8px 8px" }}>
        {navItems.map((item, i) => {
          const ativo = pathname === item.href
          return (
            <Link key={i} href={item.href} style={{ textDecoration: "none" }}>
              <div style={{
                padding: "8px 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 10,
                marginBottom: 2, cursor: "pointer", transition: "all .15s",
                background: ativo ? "#7c3aed18" : "transparent",
                borderLeft: ativo ? "2px solid #7c3aed" : "2px solid transparent",
              }}>
                <span style={{ fontSize: 13, color: ativo ? "#a855f7" : "#4a4a6a", width: 16, textAlign: "center" }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: ativo ? "#c4b5fd" : "#6b6b8a", fontWeight: ativo ? 500 : 400 }}>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Sequência */}
      <div style={{ padding: "12px", borderTop: "1px solid #1a1a2e" }}>
        <div style={{ background: "#12121f", borderRadius: 10, padding: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>12 dias</span>
          </div>
          <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
            {diasSemana.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: "#4a4a6a", marginBottom: 3 }}>{d}</div>
                <div style={{ height: 6, borderRadius: 2, background: i < 5 ? "#7c3aed" : "#1e1e35" }} />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#6b6b8a" }}>⭐ {xp} XP total</div>
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, padding: "6px 4px", cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#fff", flexShrink: 0 }}>Lu</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#c4b5fd" }}>Luize</div>
            <div style={{ fontSize: 10, color: "#4a4a6a" }}>Ver perfil</div>
          </div>
        </div>
      </div>
    </div>
  )
}