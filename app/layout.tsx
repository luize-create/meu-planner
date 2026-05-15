import type { Metadata } from "next"
import "./globals.css"
import Sidebar from "./components/Sidebar"
import { PlannerProvider } from "./context/PlannerContext"

export const metadata: Metadata = {
  title: "Focus Planner",
  description: "Seu planner inteligente",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#0a0a0f", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh" }}>
        <PlannerProvider>
          <Sidebar />
          <main style={{ flex: 1, overflowY: "auto" }}>
            {children}
          </main>
        </PlannerProvider>
      </body>
    </html>
  )
}