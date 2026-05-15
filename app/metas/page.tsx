"use client"

import { useState } from "react"
import { usePlanner } from "../context/PlannerContext"

const TIPOS = [
  { label: "Leitura", icone: "📚", cor: "#7c3aed", sub: "Acompanhe sua leitura página por página" },
  { label: "Curso", icone: "🎓", cor: "#2563eb", sub: "Acompanhe seu progresso nas aulas" },
  { label: "Projeto", icone: "🎯", cor: "#d97706", sub: "Acompanhe o desenvolvimento do projeto" },
  { label: "Financeiro", icone: "💰", cor: "#059669", sub: "Acompanhe suas metas financeiras" },
  { label: "Academia", icone: "💪", cor: "#dc2626", sub: "Acompanhe sua evolução física" },
  { label: "Hábito", icone: "🔥", cor: "#f59e0b", sub: "Construa consistência todos os dias" },
  { label: "Programação", icone: "💻", cor: "#0891b2", sub: "Acompanhe seus estudos ou desenvolvimento" },
  { label: "Personalizado", icone: "◎", cor: "#6b6b8a", sub: "Crie uma meta do seu jeito" },
]

const statusOpcoes = ["Em andamento", "Pausado", "Concluído", "Planejado"]
const frequencias = ["Diário", "3x por semana", "5x por semana", "Semanal"]

type Meta = {
  id: number; titulo: string; tipo: string; icone: string; cor: string
  unidade: string; valorAtual: number; valorTotal: number
  metaDiaria: number; prazo: string; prioridade: string; progresso: number
  extra?: Record<string, any>
}

function calcPct(atual: number, total: number) {
  if (!total) return 0
  return Math.min(100, Math.round((atual / total) * 100))
}

function fmtMoney(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
}

const noSpinner: React.CSSProperties = {
  MozAppearance: "textfield" as any,
  WebkitAppearance: "none" as any,
}

function AreaChart({ data, cor, height = 56 }: { data: number[]; cor: string; height?: number }) {
  const max = Math.max(...data, 1)
  const w = 160
  const h = height
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 8)}`)
  const areaPath = `M ${pts.join(" L ")} L ${w},${h} L 0,${h} Z`
  const linePath = `M ${pts.join(" L ")}`
  const id = `gc${cor.replace(/[^a-z0-9]/gi, "")}`
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={cor} stopOpacity="0.02" />
        </linearGradient>
        <filter id={`glow${id}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={areaPath} fill={`url(#${id})`} />
      <path d={linePath} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#glow${id})`} />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - (v / max) * (h - 8)} r="3" fill={cor} />
      ))}
    </svg>
  )
}

function MetricCard({ label, value, cor }: { label: string; value: string | number; cor: string }) {
  return (
    <div style={{ background: "#0a0a12", border: "1px solid #1e1e35", borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: 9, color: "#4a4a6a", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: cor }}>{value}</div>
    </div>
  )
}

function PreviewPanel({ tipo, form, cor, icone }: any) {
  const atual = Number(form.valorAtual) || 0
  const total = Number(form.valorTotal) || 0
  const pct = calcPct(atual, total)
  const falta = total - atual
  const titulo = form.titulo || "..."
  const meta = Number(form.metaDiaria) || 0
  const diasRestantes = meta > 0 && falta > 0 ? Math.ceil(falta / meta) : null

  const evolucao = [0, Math.round(atual * 0.1), Math.round(atual * 0.25), Math.round(atual * 0.45), Math.round(atual * 0.65), Math.round(atual * 0.85), atual]

  const Header = () => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: "#4a4a6a", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Preview</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: cor + "20", border: "1px solid " + cor + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icone}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: titulo === "..." ? "#4a4a6a" : "#e2e8f0" }}>{titulo}</div>
      </div>
    </div>
  )

  const ProgressBar = () => (
    <div style={{ background: "#1a1a2e", borderRadius: 20, height: 6, margin: "8px 0" }}>
      <div style={{ background: `linear-gradient(90deg, ${cor}, ${cor}99)`, height: 6, borderRadius: 20, width: `${pct}%`, transition: "width .3s", boxShadow: `0 0 8px ${cor}60` }} />
    </div>
  )

  if (tipo === "Leitura") return (
    <div>
      <Header />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: cor }}>{atual}</span>
        <span style={{ fontSize: 12, color: "#4a4a6a" }}>/ {total} páginas</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: cor }}>{pct}%</span>
      </div>
      <ProgressBar />
      {falta > 0 && <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 12 }}>Faltam <span style={{ color: cor, fontWeight: 500 }}>{falta} páginas</span></div>}
      <AreaChart data={evolucao} cor={cor} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
        <MetricCard label="Páginas/dia" value={meta || "—"} cor={cor} />
        <MetricCard label="Restantes" value={falta || "—"} cor={cor} />
        {diasRestantes && <MetricCard label="Conclusão em" value={`${diasRestantes} dias`} cor={cor} />}
        {total > 0 && <MetricCard label="Progresso" value={`${pct}%`} cor={cor} />}
      </div>
    </div>
  )

  if (tipo === "Curso") return (
    <div>
      <Header />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: cor }}>{atual}</span>
        <span style={{ fontSize: 12, color: "#4a4a6a" }}>/ {total} aulas</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: cor }}>{pct}%</span>
      </div>
      <ProgressBar />
      {falta > 0 && <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 12 }}>Faltam <span style={{ color: cor, fontWeight: 500 }}>{falta} aulas</span></div>}
      <AreaChart data={evolucao} cor={cor} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
        <MetricCard label="Aulas/semana" value={meta || "—"} cor={cor} />
        <MetricCard label="Aulas restantes" value={falta || "—"} cor={cor} />
        {form.plataforma && <MetricCard label="Plataforma" value={form.plataforma} cor={cor} />}
        {diasRestantes && <MetricCard label="Conclusão em" value={`${diasRestantes} sem.`} cor={cor} />}
      </div>
    </div>
  )

  if (tipo === "Projeto") return (
    <div>
      <Header />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: cor }}>{atual}</span>
        <span style={{ fontSize: 12, color: "#4a4a6a" }}>/ {total} func.</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: cor }}>{pct}%</span>
      </div>
      <ProgressBar />
      {falta > 0 && <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 12 }}>Faltam <span style={{ color: cor, fontWeight: 500 }}>{falta} funcionalidades</span></div>}
      <AreaChart data={evolucao} cor={cor} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
        <MetricCard label="Status" value={form.status || "Em andamento"} cor={cor} />
        <MetricCard label="Restantes" value={falta || "—"} cor={cor} />
        {diasRestantes && <MetricCard label="Conclusão em" value={`${diasRestantes} sem.`} cor={cor} />}
        <MetricCard label="Concluídas" value={`${pct}%`} cor={cor} />
      </div>
    </div>
  )

  if (tipo === "Financeiro") return (
    <div>
      <Header />
      <div style={{ marginBottom: 2 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: cor }}>{fmtMoney(atual)}</span>
        <span style={{ fontSize: 11, color: "#4a4a6a" }}> / {fmtMoney(total)}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: cor, marginBottom: 2 }}>{pct}%</div>
      <ProgressBar />
      {falta > 0 && <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 12 }}>Faltam <span style={{ color: cor, fontWeight: 500 }}>{fmtMoney(falta)}</span></div>}
      <AreaChart data={evolucao} cor={cor} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
        <MetricCard label="Valor mensal" value={meta ? fmtMoney(meta) : "—"} cor={cor} />
        <MetricCard label="Faltam" value={falta ? fmtMoney(falta) : "✓"} cor={cor} />
        {meta > 0 && falta > 0 && <MetricCard label="Conclusão em" value={`${Math.ceil(falta / meta)} sem.`} cor={cor} />}
        <MetricCard label="Progresso" value={`${pct}%`} cor={cor} />
      </div>
    </div>
  )

  if (tipo === "Academia") {
    const modo = form.modo || "Por semanas"
    const unid = modo === "Por peso" ? "kg" : "semanas"
    return (
      <div>
        <Header />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: cor }}>{atual}</span>
          <span style={{ fontSize: 12, color: "#4a4a6a" }}>/ {total} {unid}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: cor }}>{pct}%</span>
        </div>
        <ProgressBar />
        {falta > 0 && <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 12 }}>Faltam <span style={{ color: cor, fontWeight: 500 }}>{falta} {unid}</span></div>}
        <AreaChart data={evolucao} cor={cor} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
          <MetricCard label="Frequência" value={form.frequencia || "—"} cor={cor} />
          <MetricCard label="Restam" value={`${falta} ${unid}`} cor={cor} />
          {diasRestantes && <MetricCard label="Conclusão em" value={`${diasRestantes} dias`} cor={cor} />}
          <MetricCard label="Concluído" value={`${pct}%`} cor={cor} />
        </div>
      </div>
    )
  }

  if (tipo === "Hábito") {
    const streak = Number(form.streak) || 0
    const consistencia = total > 0 ? Math.round((atual / total) * 100) : 0
    const heatmap = Array.from({ length: 28 }, (_, i) => i < atual)
    return (
      <div>
        <Header />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: cor }}>{atual}</span>
          <span style={{ fontSize: 12, color: "#4a4a6a" }}>/ {total} dias</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: cor }}>{pct}%</span>
        </div>
        <ProgressBar />
        <div style={{ fontSize: 13, color: cor, marginBottom: 12 }}>🔥 Sequência atual: {streak > 0 ? `${streak} dias` : "—"}</div>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 12 }}>
          {heatmap.map((done, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: done ? cor : "#1a1a2e", boxShadow: done ? `0 0 4px ${cor}60` : "none" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 4 }}>
          <MetricCard label="Dias restantes" value={falta} cor={cor} />
          <MetricCard label="Consistência" value={`${consistencia}%`} cor={cor} />
          <MetricCard label="Seq. atual" value={streak > 0 ? `${streak} dias` : "—"} cor={cor} />
          <MetricCard label="Frequência" value={form.frequencia || "—"} cor={cor} />
        </div>
      </div>
    )
  }

  if (tipo === "Programação") {
    const modo = form.modo || "Módulos"
    const unid = modo === "Funcionalidades" ? "funcionalidades" : "módulos"
    return (
      <div>
        <Header />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: cor }}>{atual}</span>
          <span style={{ fontSize: 12, color: "#4a4a6a" }}>/ {total} {unid}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: cor }}>{pct}%</span>
        </div>
        <ProgressBar />
        {falta > 0 && <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 12 }}>Faltam <span style={{ color: cor, fontWeight: 500 }}>{falta} {unid}</span></div>}
        <AreaChart data={evolucao} cor={cor} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
          <MetricCard label={`${modo}/semana`} value={meta || "—"} cor={cor} />
          <MetricCard label="Restantes" value={falta || "—"} cor={cor} />
          {diasRestantes && <MetricCard label="Conclusão em" value={`${diasRestantes} sem.`} cor={cor} />}
          <MetricCard label="Progresso" value={`${pct}%`} cor={cor} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: cor }}>{atual}</span>
        <span style={{ fontSize: 12, color: "#4a4a6a" }}>/ {total} {form.unidade || "unidades"}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: cor }}>{pct}%</span>
      </div>
      <ProgressBar />
      {falta > 0 && <div style={{ fontSize: 12, color: "#4a4a6a", marginBottom: 12 }}>Faltam <span style={{ color: cor, fontWeight: 500 }}>{falta} {form.unidade || "unidades"}</span></div>}
      <AreaChart data={evolucao} cor={cor} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
        <MetricCard label="Atual" value={atual} cor={cor} />
        <MetricCard label="Restantes" value={falta} cor={cor} />
        {diasRestantes && <MetricCard label="Conclusão em" value={`${diasRestantes} dias`} cor={cor} />}
        <MetricCard label="Progresso" value={`${pct}%`} cor={cor} />
      </div>
      {titulo === "..." && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <span style={{ fontSize: 32 }}>🚀</span>
          <div style={{ fontSize: 12, color: "#4a4a6a", marginTop: 8 }}>Você está no início da sua jornada!</div>
        </div>
      )}
    </div>
  )
}

function PrioritySelect({ value, onChange }: any) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[{ l: "Alta", c: "#7c3aed" }, { l: "Média", c: "#d97706" }, { l: "Baixa", c: "#475569" }].map(({ l, c }) => (
        <button key={l} onClick={() => onChange(l)} style={{
          flex: 1, padding: "7px 6px", borderRadius: 8, border: "1px solid", cursor: "pointer", fontSize: 11,
          borderColor: value === l ? c : "#1e1e35",
          background: value === l ? c + "20" : "#0a0a14",
          color: value === l ? c : "#6b6b8a",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: value === l ? c : "#4a4a6a" }} />
          {l}
        </button>
      ))}
    </div>
  )
}

function FormularioAdaptativo({ tipo, form, setForm }: any) {
  const s: React.CSSProperties = {
    background: "#0a0a14", border: "1px solid #1e1e35", borderRadius: 8,
    padding: "9px 12px", color: "#e2e8f0", fontSize: 13, outline: "none", width: "100%"
  }
  const ns: React.CSSProperties = { ...s, ...noSpinner }
  const lbl = (t: string) => <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 4, fontWeight: 500 }}>{t}</div>
  const f = (label: string, el: React.ReactNode) => <div style={{ marginBottom: 12 }}>{lbl(label)}{el}</div>
  const row = (a: React.ReactNode, b: React.ReactNode) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
      <div>{a}</div><div>{b}</div>
    </div>
  )

  if (tipo === "Leitura") return <>
    {f("Nome do livro", <input placeholder="Ex: Mindset" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={s} />)}
    {row(<>{lbl("Página atual")}<input type="number" value={form.valorAtual} onChange={e => setForm({ ...form, valorAtual: e.target.value })} style={ns} /></>, <>{lbl("Total de páginas")}<input type="number" value={form.valorTotal} onChange={e => setForm({ ...form, valorTotal: e.target.value })} style={ns} /></>)}
    {f("Páginas por dia (meta)", <input type="number" value={form.metaDiaria} placeholder="12" onChange={e => setForm({ ...form, metaDiaria: e.target.value })} style={ns} />)}
    {f("Prazo (opcional)", <input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} style={s} />)}
    {f("Prioridade", <PrioritySelect value={form.prioridade} onChange={(v: string) => setForm({ ...form, prioridade: v })} />)}
  </>

  if (tipo === "Curso") return <>
    {f("Nome do curso", <input placeholder="Ex: React Completo" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={s} />)}
    {row(<>{lbl("Aulas concluídas")}<input type="number" value={form.valorAtual} onChange={e => setForm({ ...form, valorAtual: e.target.value, unidade: "aulas" })} style={ns} /></>, <>{lbl("Total de aulas")}<input type="number" value={form.valorTotal} onChange={e => setForm({ ...form, valorTotal: e.target.value })} style={ns} /></>)}
    {f("Aulas por semana (meta)", <input type="number" value={form.metaDiaria} placeholder="3" onChange={e => setForm({ ...form, metaDiaria: e.target.value })} style={ns} />)}
    {f("Plataforma (opcional)", <input placeholder="Ex: Udemy" value={form.plataforma || ""} onChange={e => setForm({ ...form, plataforma: e.target.value })} style={s} />)}
    {f("Prazo (opcional)", <input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} style={s} />)}
    {f("Prioridade", <PrioritySelect value={form.prioridade} onChange={(v: string) => setForm({ ...form, prioridade: v })} />)}
  </>

  if (tipo === "Projeto") return <>
    {f("Nome do projeto", <input placeholder="Ex: Focus Planner" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={s} />)}
    {row(<>{lbl("Concluídas")}<input type="number" value={form.valorAtual} onChange={e => setForm({ ...form, valorAtual: e.target.value, unidade: "funcionalidades" })} style={ns} /></>, <>{lbl("Total")}<input type="number" value={form.valorTotal} onChange={e => setForm({ ...form, valorTotal: e.target.value })} style={ns} /></>)}
    {f("Status", <select value={form.status || "Em andamento"} onChange={e => setForm({ ...form, status: e.target.value })} style={s}>{statusOpcoes.map(o => <option key={o}>{o}</option>)}</select>)}
    {f("Prazo (opcional)", <input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} style={s} />)}
    {f("Prioridade", <PrioritySelect value={form.prioridade} onChange={(v: string) => setForm({ ...form, prioridade: v })} />)}
  </>

  if (tipo === "Financeiro") return <>
    {f("Nome da meta", <input placeholder="Ex: Reserva de Emergência" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={s} />)}
    {f("Valor atual (R$)", <input type="number" value={form.valorAtual} onChange={e => setForm({ ...form, valorAtual: e.target.value, unidade: "reais" })} style={ns} />)}
    {f("Valor desejado (R$)", <input type="number" value={form.valorTotal} onChange={e => setForm({ ...form, valorTotal: e.target.value })} style={ns} />)}
    {f("Valor mensal (meta)", <input type="number" value={form.metaDiaria} placeholder="800" onChange={e => setForm({ ...form, metaDiaria: e.target.value })} style={ns} />)}
    {f("Prazo (opcional)", <input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} style={s} />)}
    {f("Prioridade", <PrioritySelect value={form.prioridade} onChange={(v: string) => setForm({ ...form, prioridade: v })} />)}
  </>

  if (tipo === "Academia") return <>
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      {["Por semanas", "Por peso"].map(m => {
        const ativo = (form.modo || "Por semanas") === m
        return <button key={m} onClick={() => setForm({ ...form, modo: m, unidade: m === "Por peso" ? "kg" : "semanas" })} style={{ flex: 1, padding: "7px", borderRadius: 8, border: "1px solid " + (ativo ? "#dc2626" : "#1e1e35"), background: ativo ? "#dc262620" : "#0a0a14", color: ativo ? "#dc2626" : "#6b6b8a", cursor: "pointer", fontSize: 12 }}>{m}</button>
      })}
    </div>
    {f("Nome da meta", <input placeholder="Ex: Projeto Shape" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={s} />)}
    {(form.modo || "Por semanas") === "Por semanas"
      ? row(<>{lbl("Semanas concluídas")}<input type="number" value={form.valorAtual} onChange={e => setForm({ ...form, valorAtual: e.target.value, unidade: "semanas" })} style={ns} /></>, <>{lbl("Total de semanas")}<input type="number" value={form.valorTotal} onChange={e => setForm({ ...form, valorTotal: e.target.value })} style={ns} /></>)
      : row(<>{lbl("Peso atual (kg)")}<input type="number" value={form.valorAtual} onChange={e => setForm({ ...form, valorAtual: e.target.value, unidade: "kg" })} style={ns} /></>, <>{lbl("Peso desejado (kg)")}<input type="number" value={form.valorTotal} onChange={e => setForm({ ...form, valorTotal: e.target.value })} style={ns} /></>)
    }
    {f("Frequência semanal", <select value={form.frequencia || "5x por semana"} onChange={e => setForm({ ...form, frequencia: e.target.value })} style={s}>{frequencias.map(f => <option key={f}>{f}</option>)}</select>)}
    {f("Prazo (opcional)", <input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} style={s} />)}
    {f("Prioridade", <PrioritySelect value={form.prioridade} onChange={(v: string) => setForm({ ...form, prioridade: v })} />)}
  </>

  if (tipo === "Hábito") return <>
    {f("Nome do hábito", <input placeholder="Ex: Estudar 1h por dia" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={s} />)}
    {row(<>{lbl("Meta de dias")}<input type="number" value={form.valorTotal} onChange={e => setForm({ ...form, valorTotal: e.target.value, unidade: "dias" })} style={ns} /></>, <>{lbl("Dias concluídos")}<input type="number" value={form.valorAtual} onChange={e => setForm({ ...form, valorAtual: e.target.value })} style={ns} /></>)}
    {row(<>{lbl("Seq. atual (dias)")}<input type="number" value={form.streak || 0} onChange={e => setForm({ ...form, streak: e.target.value })} style={ns} /></>, <>{lbl("Melhor sequência")}<input type="number" value={form.melhorStreak || 0} onChange={e => setForm({ ...form, melhorStreak: e.target.value })} style={ns} /></>)}
    {f("Frequência", <select value={form.frequencia || "Diário"} onChange={e => setForm({ ...form, frequencia: e.target.value })} style={s}>{frequencias.map(f => <option key={f}>{f}</option>)}</select>)}
    {f("Horário (opcional)", <input type="time" value={form.horario || ""} onChange={e => setForm({ ...form, horario: e.target.value })} style={s} />)}
    {f("Prioridade", <PrioritySelect value={form.prioridade} onChange={(v: string) => setForm({ ...form, prioridade: v })} />)}
  </>

  if (tipo === "Programação") return <>
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      {["Módulos", "Funcionalidades"].map(m => {
        const ativo = (form.modo || "Módulos") === m
        return <button key={m} onClick={() => setForm({ ...form, modo: m, unidade: m === "Módulos" ? "módulos" : "funcionalidades" })} style={{ flex: 1, padding: "7px", borderRadius: 8, border: "1px solid " + (ativo ? "#0891b2" : "#1e1e35"), background: ativo ? "#0891b220" : "#0a0a14", color: ativo ? "#0891b2" : "#6b6b8a", cursor: "pointer", fontSize: 12 }}>{m}</button>
      })}
    </div>
    {f("Nome do objetivo", <input placeholder="Ex: Machine Learning" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={s} />)}
    {row(<>{lbl("Concluídos")}<input type="number" value={form.valorAtual} onChange={e => setForm({ ...form, valorAtual: e.target.value })} style={ns} /></>, <>{lbl("Total")}<input type="number" value={form.valorTotal} onChange={e => setForm({ ...form, valorTotal: e.target.value })} style={ns} /></>)}
    {f(`${form.modo === "Funcionalidades" ? "Funcionalidades" : "Módulos"} por semana`, <input type="number" value={form.metaDiaria} placeholder="1" onChange={e => setForm({ ...form, metaDiaria: e.target.value })} style={ns} />)}
    {f("Prazo (opcional)", <input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} style={s} />)}
    {f("Prioridade", <PrioritySelect value={form.prioridade} onChange={(v: string) => setForm({ ...form, prioridade: v })} />)}
  </>

  return <>
    {f("Nome da meta", <input placeholder="Ex: Meditar mais" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={s} />)}
    {f("Unidade", <input placeholder="Ex: minutos, páginas..." value={form.unidade || ""} onChange={e => setForm({ ...form, unidade: e.target.value })} style={s} />)}
    {row(<>{lbl("Valor atual")}<input type="number" value={form.valorAtual} onChange={e => setForm({ ...form, valorAtual: e.target.value })} style={ns} /></>, <>{lbl("Meta total")}<input type="number" value={form.valorTotal} onChange={e => setForm({ ...form, valorTotal: e.target.value })} style={ns} /></>)}
    {f("Meta por período (opcional)", <input placeholder="Ex: 10 por dia" value={form.metaTexto || ""} onChange={e => setForm({ ...form, metaTexto: e.target.value })} style={s} />)}
    {f("Prazo (opcional)", <input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} style={s} />)}
    {f("Prioridade", <PrioritySelect value={form.prioridade} onChange={(v: string) => setForm({ ...form, prioridade: v })} />)}
  </>
}

export default function Metas() {
  const { data, setMetas, adicionarXP } = usePlanner()
  const metas = data.metas as unknown as Meta[]

  const [filtro, setFiltro] = useState("Todas")
  const [modal, setModal] = useState(false)
  const [tipoSel, setTipoSel] = useState("Leitura")
  const [atualizandoId, setAtualizandoId] = useState<number | null>(null)
  const [novoValor, setNovoValor] = useState(0)
  const [form, setForm] = useState<any>({ titulo: "", valorAtual: 0, valorTotal: 100, metaDiaria: 0, prazo: "", prioridade: "Alta", unidade: "páginas", modo: null })

  const tipoInfo = TIPOS.find(t => t.label === tipoSel) || TIPOS[0]

  function abrirModal() {
    setTipoSel("Leitura")
    setForm({ titulo: "", valorAtual: 0, valorTotal: 100, metaDiaria: 0, prazo: "", prioridade: "Alta", unidade: "páginas", modo: null })
    setModal(true)
  }

  function handleTipo(label: string) {
    setTipoSel(label)
    const u = label === "Leitura" ? "páginas" : label === "Curso" ? "aulas" : label === "Financeiro" ? "reais" : label === "Academia" ? "semanas" : label === "Hábito" ? "dias" : label === "Programação" ? "módulos" : label === "Projeto" ? "funcionalidades" : "unidades"
    setForm((f: any) => ({ ...f, unidade: u, modo: null }))
  }

  function adicionarMeta() {
    if (!form.titulo?.trim()) return
    const m: Meta = {
      id: Date.now(), titulo: form.titulo, tipo: tipoSel,
      icone: tipoInfo.icone, cor: tipoInfo.cor,
      unidade: form.unidade || "unidades",
      valorAtual: Number(form.valorAtual) || 0,
      valorTotal: Number(form.valorTotal) || 100,
      metaDiaria: Number(form.metaDiaria) || 0,
      prazo: form.prazo, prioridade: form.prioridade,
      progresso: calcPct(Number(form.valorAtual), Number(form.valorTotal)),
      extra: form,
    }
    setMetas([...(metas as any), m] as any)
    setModal(false)
  }

  function salvarProgresso(id: number) {
    const m = metas.find(x => x.id === id)
    if (!m) return
    const v = Math.max(0, Math.min(m.valorTotal, novoValor))
    const p = calcPct(v, m.valorTotal)
    if (m.progresso < 100 && p === 100) adicionarXP(100)
    setMetas(metas.map(x => x.id === id ? { ...x, valorAtual: v, progresso: p } as any : x) as any)
    setAtualizandoId(null)
  }

  function deletar(id: number) { setMetas(metas.filter(x => x.id !== id) as any) }

  const filtradas = metas.filter(m => {
    const p = calcPct(m.valorAtual, m.valorTotal)
    if (filtro === "Em andamento") return p > 0 && p < 100
    if (filtro === "Concluídas") return p === 100
    if (filtro === "Não iniciadas") return p === 0
    return true
  })

  const concluidas = metas.filter(m => calcPct(m.valorAtual, m.valorTotal) === 100).length
  const emAnd = metas.filter(m => { const p = calcPct(m.valorAtual, m.valorTotal); return p > 0 && p < 100 }).length
  const geral = metas.length === 0 ? 0 : Math.round(metas.reduce((a, m) => a + calcPct(m.valorAtual, m.valorTotal), 0) / metas.length)
  const graf = [10, 22, 18, 35, 30, 45, geral]
  const maxG = Math.max(...graf, 1)
  const dicas = ["Progresso é progresso.", "Consistência supera intensidade.", "Cada passo conta."]
  const dica = dicas[new Date().getDay() % 3]
  const cats = TIPOS.map(t => ({ ...t, count: metas.filter(m => m.tipo === t.label).length })).filter(c => c.count > 0)

  return (
    <div style={{ display: "flex", gap: 20, padding: "24px 28px", color: "#e2e8f0" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Minhas metas</h1>
            <p style={{ fontSize: 13, color: "#4a4a6a", margin: "4px 0 0" }}>{metas.length} metas · {concluidas} concluídas · {geral}% geral</p>
          </div>
          <button onClick={abrirModal} style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "9px 18px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>+ Nova meta</button>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {["Todas", "Em andamento", "Não iniciadas", "Concluídas"].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: "1px solid", borderColor: filtro === f ? "#7c3aed" : "#1a1a2e", background: filtro === f ? "#7c3aed22" : "transparent", color: filtro === f ? "#a855f7" : "#6b6b8a", fontWeight: filtro === f ? 500 : 400 }}>{f}</button>
          ))}
        </div>

        {filtradas.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#4a4a6a" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>◎</div>
            <div style={{ fontSize: 14, marginBottom: 12 }}>Nenhuma meta aqui</div>
            <button onClick={abrirModal} style={{ background: "#7c3aed22", border: "1px solid #7c3aed44", borderRadius: 8, padding: "8px 16px", color: "#a855f7", cursor: "pointer", fontSize: 13 }}>+ Criar primeira meta</button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtradas.map(m => {
            const pct = calcPct(m.valorAtual, m.valorTotal)
            const falta = m.valorTotal - m.valorAtual
            const concluida = pct === 100
            const cor = m.cor || "#7c3aed"
            const editando = atualizandoId === m.id
            const fv = (v: number) => m.tipo === "Financeiro" ? fmtMoney(v) : String(v)

            return (
              <div key={m.id} style={{ background: "#0f0f1c", border: "1px solid " + (concluida ? "#05906930" : "#1a1a2e"), borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: cor + "18", border: "1px solid " + cor + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{m.icone}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: cor, fontWeight: 500 }}>{m.tipo}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: (m.prioridade === "Alta" ? "#7c3aed" : m.prioridade === "Média" ? "#d97706" : "#475569") + "18", color: m.prioridade === "Alta" ? "#a855f7" : m.prioridade === "Média" ? "#d97706" : "#475569" }}>{m.prioridade} prioridade</span>
                    </div>
                    <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 600, color: concluida ? "#6b6b8a" : "#e2e8f0", textDecoration: concluida ? "line-through" : "none" }}>{m.titulo}</h3>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div><span style={{ fontSize: 22, fontWeight: 700, color: cor }}>{fv(m.valorAtual)}</span><span style={{ fontSize: 13, color: "#4a4a6a" }}> / {fv(m.valorTotal)} {m.unidade}</span></div>
                      <span style={{ fontSize: 18, fontWeight: 700, color: cor }}>{pct}%</span>
                    </div>
                    <div style={{ background: "#1a1a2e", borderRadius: 20, height: 5, marginBottom: 10 }}>
                      <div style={{ background: concluida ? "#059669" : `linear-gradient(90deg, ${cor}, ${cor}88)`, height: 5, borderRadius: 20, width: `${pct}%`, transition: "width .4s", boxShadow: `0 0 6px ${cor}40` }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        {!concluida && falta > 0 && <span style={{ fontSize: 12, color: "#4a4a6a" }}>Faltam <span style={{ color: cor, fontWeight: 500 }}>{fv(falta)} {m.unidade}</span></span>}
                        {m.prazo && <span style={{ fontSize: 11, color: "#4a4a6a" }}>📅 {new Date(m.prazo).toLocaleDateString("pt-BR")}</span>}
                        {concluida && <span style={{ fontSize: 12, color: "#059669" }}>✓ Concluída!</span>}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {!concluida && (editando ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <input type="number" autoFocus defaultValue={m.valorAtual} min={0} max={m.valorTotal} onChange={e => setNovoValor(Number(e.target.value))} onKeyDown={e => e.key === "Enter" && salvarProgresso(m.id)} style={{ width: 80, background: "#1a1a2e", border: "1px solid " + cor, borderRadius: 6, padding: "5px 8px", color: "#e2e8f0", fontSize: 13, outline: "none", textAlign: "center", ...noSpinner }} />
                            <button onClick={() => salvarProgresso(m.id)} style={{ background: cor, border: "none", borderRadius: 6, padding: "5px 10px", color: "#fff", cursor: "pointer", fontSize: 12 }}>✓</button>
                            <button onClick={() => setAtualizandoId(null)} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer" }}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => { setAtualizandoId(m.id); setNovoValor(m.valorAtual) }} style={{ background: cor + "18", border: "1px solid " + cor + "30", borderRadius: 8, padding: "5px 12px", color: cor, cursor: "pointer", fontSize: 12, fontWeight: 500 }}>+ Atualizar progresso</button>
                        ))}
                        <button onClick={() => deletar(m.id)} style={{ background: "none", border: "none", color: "#2e2e4e", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>⋮</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ width: 210, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#c4b5fd", marginBottom: 12 }}>Visão geral</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[{ l: "Total", v: metas.length }, { l: "Em andamento", v: emAnd }, { l: "Concluídas", v: concluidas }, { l: "Conclusão geral", v: `${geral}%` }].map((s, i) => (
              <div key={i} style={{ background: "#12121f", borderRadius: 8, padding: "10px" }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#e2e8f0" }}>{s.v}</div>
                <div style={{ fontSize: 10, color: "#4a4a6a", marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#c4b5fd", marginBottom: 10 }}>Evolução semanal</div>
          <AreaChart data={graf} cor="#7c3aed" height={52} />
        </div>

        <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><span>🤖</span><span style={{ fontSize: 12, fontWeight: 500, color: "#c4b5fd" }}>Dica para hoje</span></div>
          <p style={{ fontSize: 12, color: "#6b6b8a", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>"{dica}"</p>
        </div>

        {cats.length > 0 && (
          <div style={{ background: "#0f0f1c", border: "1px solid #1a1a2e", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#c4b5fd", marginBottom: 10 }}>Categorias</div>
            {cats.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.cor }} />
                <span style={{ flex: 1, fontSize: 12, color: "#94a3b8" }}>{c.label}</span>
                <span style={{ fontSize: 12, color: "#4a4a6a" }}>{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "#00000092", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(8px)" }}>
          <div style={{ background: "#0d0d18", border: "1px solid #1a1a2e", borderRadius: 20, width: 700, maxWidth: "96vw", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 40px 100px #00000090" }}>

            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #1a1a2e" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Nova meta</h2>
                <button onClick={() => setModal(false)} style={{ background: "none", border: "none", color: "#4a4a6a", cursor: "pointer", fontSize: 20 }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {TIPOS.map(t => (
                  <button key={t.label} onClick={() => handleTipo(t.label)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid", cursor: "pointer", fontSize: 11, borderColor: tipoSel === t.label ? t.cor : "#1e1e35", background: tipoSel === t.label ? t.cor + "20" : "#12121f", color: tipoSel === t.label ? t.cor : "#6b6b8a", display: "flex", alignItems: "center", gap: 5, fontWeight: tipoSel === t.label ? 500 : 400, boxShadow: tipoSel === t.label ? `0 0 10px ${t.cor}30` : "none", transition: "all .15s" }}>
                    {t.icone} {t.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: tipoInfo.cor + "20", border: "1px solid " + tipoInfo.cor + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{tipoInfo.icone}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: tipoInfo.cor }}>{tipoInfo.label}</div>
                  <div style={{ fontSize: 11, color: "#4a4a6a" }}>{tipoInfo.sub}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", overflowY: "auto", borderRight: "1px solid #1a1a2e" }}>
                <FormularioAdaptativo tipo={tipoSel} form={form} setForm={setForm} />
              </div>
              <div style={{ padding: "20px 24px", background: "#0a0a12", overflowY: "auto" }}>
                <PreviewPanel tipo={tipoSel} form={form} cor={tipoInfo.cor} icone={tipoInfo.icone} />
              </div>
            </div>

            <div style={{ padding: "14px 24px", borderTop: "1px solid #1a1a2e" }}>
              <button onClick={adicionarMeta} disabled={!form.titulo?.trim()} style={{ width: "100%", background: form.titulo?.trim() ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "#1e1e35", border: "none", borderRadius: 10, padding: "12px", color: form.titulo?.trim() ? "#fff" : "#4a4a6a", cursor: form.titulo?.trim() ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 500, transition: "all .2s" }}>
                Criar meta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}