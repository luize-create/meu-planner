import type { Metadata } from "next"
import "./globals.css"
import { PlannerProvider } from "./context/PlannerContext"
import CheckinGuard from "./components/CheckinGuard"

export const metadata: Metadata = {
  title: "Focus Planner",
  description: "Seu planner inteligente",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#07070f", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh" }}>
        <PlannerProvider>
          <CheckinGuard>{children}</CheckinGuard>
        </PlannerProvider>
      </body>
    </html>
  )
}