// app/lib/profileEngine.ts

export interface UserProfile {
  id: string
  name: string
  age?: number
  occupation?: string
  mainGoal: string

  sleepTargetHours: number
  usualWakeTime: string
  usualSleepTime: string
  bestFocusPeriod: "morning" | "afternoon" | "night" | "late_night"

  productivityBlockers: string[]
  triggers: string[]
  positiveHabits: string[]
  negativeHabits: string[]

  trackedMetrics: string[]
  lifeAreas: string[]
  insightPreferences: string[]

  onboardingComplete: boolean
  createdAt: string
  updatedAt: string
}

const KEY = "user-profile-v1"

export function saveProfile(profile: Partial<UserProfile>): UserProfile {
  const existing = loadProfile()
  const updated: UserProfile = {
    id: existing?.id || Date.now().toString(),
    name: "",
    mainGoal: "",
    sleepTargetHours: 8,
    usualWakeTime: "07:00",
    usualSleepTime: "23:00",
    bestFocusPeriod: "morning",
    productivityBlockers: [],
    triggers: [],
    positiveHabits: [],
    negativeHabits: [],
    trackedMetrics: ["humor", "energia", "clareza"],
    lifeAreas: [],
    insightPreferences: [],
    onboardingComplete: false,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...existing,
    ...profile,
  }
  localStorage.setItem(KEY, JSON.stringify(updated))
  if (updated.name) localStorage.setItem("usuario-nome", updated.name)
  return updated
}

export function loadProfile(): UserProfile | null {
  try {
    const p = localStorage.getItem(KEY)
    return p ? JSON.parse(p) : null
  } catch { return null }
}

export function profileIsComplete(): boolean {
  const p = loadProfile()
  return !!(p?.onboardingComplete)
}

// Usado pelo insightEngine para personalizar análises
export function getProfileContext() {
  const p = loadProfile()
  if (!p) return null
  return {
    sleepTarget:        p.sleepTargetHours,
    bestFocusPeriod:    p.bestFocusPeriod,
    negativeHabits:     p.negativeHabits,
    triggers:           p.triggers,
    trackedMetrics:     p.trackedMetrics,
    productivityBlockers: p.productivityBlockers,
    lifeAreas:          p.lifeAreas,
  }
}