"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePlanner } from "../context/PlannerContext"

const navOrganizacao = [
  { icon: "🏠", label: "Dashboard", href: "/" },
  { icon: "🎯", label: "Metas", href: "/metas" },
  { icon: "✅", label: "Tarefas", href: "/tarefas" },
  { icon: "📅", label: "Agenda", href: "/agenda" },
  { icon: "🔥", label: "Hábitos", href: "/habitos" },
  { icon: "🚀", label: "Projetos", href: "/projetos" },
  { icon: "⏱️", label: "Foco", href: "/foco" },
  { icon: "📖", label: "Diário", href: "/diario" },
]

const navAutoconhecimento = [
  { icon: "✨", label: "Insights", href: "/insights" },
  { icon: "🧠", label: "Mapa Mental", href: "/mapa-mental" },
  { icon: "🧪", label: "Laboratório", href: "/laboratorio" },
  { icon: "🌱", label: "Evolução", href: "/evolucao" },
]

const navConfig = [
  { icon: "⚙️", label: "Configurações", href: "/configuracoes" },
]

const diasSemana = ["S", "T", "Q", "Q", "S", "S", "D"]

export default function Sidebar() {
  const pathname = usePathname()
  const { data } = usePlanner()
  const xp = data.xp
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
    const d = new Date(hoje)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  function NavItem({ item }: { item: { icon: string; label: string; href: string } }) {
    const ativo = pathname === item.href
    return (
      <Link href={item.href} style={{ textDecoration: "none" }}>
        <div style={{
          padding: "7px 10px", borderRadius: 8, display: "flex", alignItems: "center",
          gap: 10, marginBottom: 1, cursor: "pointer", transition: "all .15s",
          background: ativo ? "#7c3aed18" : "transparent",
          borderLeft: ativo ? "2px solid #7c3aed" : "2px solid transparent"
        }}>
          <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
          <span style={{ fontSize: 13, color: ativo ? "#c4b5fd" : "#6b6b8a", fontWeight: ativo ? 500 : 400 }}>{item.label}</span>
        </div>
      </Link>
    )
  }

  return (
    <div style={{
      width: 200, background: "#0d0d14", borderRight: "1px solid #1a1a2e",
      display: "flex", flexDirection: "column", flexShrink: 0,
      minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto"
    }}>

      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #7c3aed, #a855f7)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#e2e8f0" }}>
            <span style={{ color: "#a855f7" }}>Focus</span> Planner
          </span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>

        <div style={{ fontSize: 9, color: "#3a3a5a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 10px 4px" }}>
          Organização
        </div>
        {navOrganizacao.map((item, i) => <NavItem key={i} item={item} />)}

        <div style={{ height: 1, background: "#1a1a2e", margin: "8px 4px" }} />

        <div style={{ fontSize: 9, color: "#3a3a5a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 10px 4px" }}>
          Autoconhecimento
        </div>
        {navAutoconhecimento.map((item, i) => <NavItem key={i} item={item} />)}

        <div style={{ height: 1, background: "#1a1a2e", margin: "8px 4px" }} />

        {navConfig.map((item, i) => <NavItem key={i} item={item} />)}
      </div>

      {/* Bottom */}
      <div style={{ padding: "12px", borderTop: "1px solid #1a1a2e" }}>
        <div style={{ background: "#12121f", borderRadius: 10, padding: "12px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{streak} dias</span>
          </div>
          <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 6 }}>sequência consciente</div>
          <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
            {ultimos7.map((d, i) => {
              const tem = habitos.some((h: any) => (h.historico || []).includes(d))
              return (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: "#4a4a6a", marginBottom: 3 }}>{diasSemana[i]}</div>
                  <div style={{ height: 6, borderRadius: 2, background: tem ? "#7c3aed" : "#1e1e35", boxShadow: tem ? "0 0 4px #7c3aed60" : "none" }} />
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: 11, color: "#6b6b8a" }}>⭐ {xp} XP total</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", cursor: "pointer" }}>
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