"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "./Sidebar"
import { profileIsComplete } from "../lib/profileEngine"

export default function CheckinGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    const paginasLivres = ["/onboarding", "/checkin"]
    if (paginasLivres.some(p => pathname.startsWith(p))) {
      setPronto(true)
      return
    }

    // 1. Verifica se o onboarding foi feito
    if (!profileIsComplete()) {
      router.replace("/onboarding")
      return
    }

    // 2. Verifica check-in do dia
    const hoje = new Date().toISOString().slice(0, 10)
    const feito = localStorage.getItem(`checkin-dia-${hoje}`)
    if (!feito) {
      router.replace("/checkin")
      return
    }

    setPronto(true)
  }, [pathname])

  const esconderSidebar = pathname.startsWith("/onboarding") || pathname.startsWith("/checkin")

  if (!pronto) return null

  if (esconderSidebar) return <>{children}</>

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#07070f" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
    </div>
  )
}