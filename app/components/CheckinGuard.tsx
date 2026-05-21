"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "./Sidebar"

export default function CheckinGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [estado, setEstado] = useState<"carregando" | "pronto">("carregando")

  useEffect(() => {
    const hoje = new Date().toISOString().slice(0, 10)
    const feito = localStorage.getItem(`checkin-dia-${hoje}`)

    if (pathname === "/checkin") {
      setEstado("pronto")
      return
    }

    if (!feito) {
      router.replace("/checkin")
    } else {
      setEstado("pronto")
    }
  }, [pathname])

  if (estado === "carregando") {
    return <div style={{ minHeight: "100vh", background: "#07070f" }} />
  }

  const isCheckin = pathname === "/checkin"

  return (
    <>
      {!isCheckin && <Sidebar />}
      <main style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </main>
    </>
  )
}