"use client"

import { usePlanner } from "./context/PlannerContext"

const grafico = [45, 60, 35, 80, 90, 55, 70]
const diasSemana = ["S", "T", "Q", "Q", "S", "S", "D"]

export default function Dashboard() {
  const { data } = usePlanner()
  const hoje = new Date().toISOString().slice(0, 10)

  const tarefasHoje = data.tarefas.filter(t => t.data === hoje)
  const tarefasFeitas = tarefasHoje.filter(t => t.feita).length
  const progresso = tarefasHoje.length === 0 ? 0 : Math.round(tarefasFeitas / tarefasHoje.length * 100)

  const sessoesHoje = data.sessoesFoco.filter(s => s.data === hoje)
  const minFoco = sessoesHoje.reduce((a, s) => a + s.minutos, 0)
  const horaFoco = Math.floor(minFoco / 60)
  const minFocoRest = minFoco % 60

  const proximosCompromissos = data.blocos
    .filter(b => b.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data) || a.horaInicio.localeCompare(b.horaInicio))
    .slice(0, 3)

  const habitosHoje = data.habitos.slice(0, 3)
  const maxGraf = Math.max(...grafico)

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite"

  return (
    <div style={{ padding: "24px 28px", color: "#e2e8f0", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0, letterSpacing: -0.5 }}>{saudacao}, Lu! 🌙</h1>
          <p style={{ fontSize: 13, color: "#4a4a6a", margin: "4px 0 0" }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["♪", "🔔", "+"].map((icon, i) => (
            <button key={i} style={{
              width: 34, height: 34, borderRadius: 8, border: "1px solid #1a1a2e",
              background: i === 2 ? "#7c3aed" : "#12121f",
              color: i === 2 ? "#fff" : "#6b6b8a", cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>{icon}</button>
          ))}
        </div>
      </div>

      {/* Stats principais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>

        {/* Progresso */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#1a1a2e" strokeWidth="5" />
              <circle cx="28" cy="28" r="22" fill="none" stroke="#7c3aed" strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 22 * progresso / 100} ${2 * Math.PI * 22}`}
                strokeLinecap="round" transform="rotate(-90 28 28)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#a855f7" }}>{progresso}%</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 2 }}>Progresso do dia</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{progresso}%</div>
            <div style={{ fontSize: 11, color: "#6b6b8a" }}>Quase lá!</div>
          </div>
        </div>

        {/* Foco */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#7c3aed18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>⏱</div>
          <div>
            <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 2 }}>Tempo focado</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{horaFoco}h {minFocoRest}m</div>
            <div style={{ fontSize: 11, color: "#6b6b8a" }}>hoje</div>
          </div>
        </div>

        {/* XP */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#7c3aed18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>⭐</div>
          <div>
            <div style={{ fontSize: 11, color: "#4a4a6a", marginBottom: 2 }}>XP conquistado</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{data.xp}</div>
            <div style={{ fontSize: 11, color: "#6b6b8a" }}>XP hoje</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Resumo do dia */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: "#c4b5fd" }}>Resumo do dia</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "☑", label: "Tarefas concluídas", valor: `${tarefasFeitas} / ${tarefasHoje.length}`, cor: "#7c3aed" },
              { icon: "📅", label: "Compromissos", valor: `${data.blocos.filter(b => b.data === hoje && b.concluido).length} / ${data.blocos.filter(b => b.data === hoje).length}`, cor: "#2563eb" },
              { icon: "🌿", label: "Tempo livre", valor: `${Math.max(0, Math.floor((16 * 60 - data.blocos.filter(b => b.data === hoje).reduce((a, b) => a + Math.max(0, parseInt(b.horaFim) * 60 - parseInt(b.horaInicio) * 60), 0)) / 60))}h disponível`, cor: "#059669" },
              { icon: "◉", label: "Foco", valor: minFoco >= 120 ? "Excelente" : minFoco >= 60 ? "Bom" : minFoco > 0 ? "Iniciando" : "Sem sessões", cor: "#a855f7" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, width: 20 }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: "#8888a8" }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: item.cor }}>{item.valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico semanal */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: "#c4b5fd" }}>Foco esta semana</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
            {grafico.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: "100%", borderRadius: "4px 4px 0 0",
                  height: `${(v / maxGraf) * 64}px`,
                  background: i === 4 ? "linear-gradient(180deg, #a855f7, #7c3aed)" : "#1e1e35",
                  transition: "height .3s"
                }} />
                <span style={{ fontSize: 9, color: "#4a4a6a" }}>{diasSemana[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Próximos compromissos */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: "#c4b5fd" }}>Próximos compromissos</div>
          {proximosCompromissos.length === 0 ? (
            <div style={{ fontSize: 13, color: "#4a4a6a", padding: "12px 0" }}>Nenhum compromisso agendado</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {proximosCompromissos.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.cor, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{c.titulo}</span>
                  <span style={{ fontSize: 12, color: "#6b6b8a" }}>{c.horaInicio}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hábitos do dia */}
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, color: "#c4b5fd" }}>Hábitos do dia</div>
          {habitosHoje.length === 0 ? (
            <div style={{ fontSize: 13, color: "#4a4a6a", padding: "12px 0" }}>Nenhum hábito cadastrado</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {habitosHoje.map((h, i) => {
                const feito = h.historico?.includes(hoje)
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16, width: 22 }}>{h.icone}</span>
                    <span style={{ flex: 1, fontSize: 13 }}>{h.nome}</span>
                    <span style={{ fontSize: 11, color: "#7c3aed" }}>🔥 {h.historico?.length || 0} dias</span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {[0,1,2,3,4,5,6].map(j => (
                        <div key={j} style={{ width: 8, height: 8, borderRadius: 2, background: j < (h.historico?.length || 0) % 7 + (feito ? 1 : 0) ? "#7c3aed" : "#1e1e35" }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}