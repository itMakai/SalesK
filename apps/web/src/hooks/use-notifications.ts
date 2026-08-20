"use client"

import { useEffect } from "react"
import { io } from "socket.io-client"
import useSWR from "swr"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"

export function useNotifications() {
  const tenantId = useAuthStore(s => s.tenantId)
  const branchId = useAuthStore(s => s.currentBranchId)
  const { data = [], mutate, ...state } = useSWR(
    tenantId ? ["notifications", branchId] : null,
    () => apiClient.get("/tenant/notifications", { params: branchId ? { branchId } : undefined }).then(r => r.data),
    { refreshInterval: 30000 },
  )

  useEffect(() => {
    if (!tenantId) return
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    const socket = io(`${apiUrl}/notifications`, { query: { tenantId }, transports: ["websocket", "polling"] })
    socket.on("notifications:changed", () => mutate())
    return () => { socket.disconnect() }
  }, [tenantId, mutate])

  return { notifications: data, mutate, ...state }
}
