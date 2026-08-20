"use client"

import { useState } from "react"
import { Bell, Package, MessageSquare, CheckCircle2, Send } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { useNotifications } from "@/hooks/use-notifications"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NotificationBell() {
  const user = useAuthStore(s => s.user)
  const userId = user?.id ?? ""
  const isCashier = user?.role === "cashier"

  const { notifications, mutate } = useNotifications()
  const unread = notifications.filter((n: any) => !n.readBy?.[userId])

  const [selectedNotif, setSelectedNotif] = useState<any | null>(null)
  const [responseMsg, setResponseMsg] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!id) return;
    await apiClient.patch(`/tenant/notifications/${id}/read`)
    mutate()
  }

  const markAllAsRead = async () => {
    for (const n of unread) {
      if (n.id) await apiClient.patch(`/tenant/notifications/${n.id}/read`)
    }
    mutate()
  }

  const handleRespond = async () => {
    if (!responseMsg.trim() || !selectedNotif) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/tenant/notifications/${selectedNotif.id}/respond`, { message: responseMsg });
      setResponseMsg("");
      mutate();
      // Re-fetch local state if dialog stays open
      const updatedNotifs = await apiClient.get("/tenant/notifications").then(res => res.data);
      const updatedSelected = updatedNotifs.find((n: any) => n.id === selectedNotif.id);
      if (updatedSelected) setSelectedNotif(updatedSelected);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotificationClick = (n: any) => {
    setSelectedNotif(n);
    if (!n.readBy?.[userId]) {
      markAsRead(n.id);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="relative p-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all focus:outline-none">
          <Bell className="w-4 h-4" />
          {unread.length > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#0f1117]" aria-label={`${unread.length} unread notifications`}>
              {unread.length > 99 ? "99+" : unread.length}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 bg-[#0f1117] border-white/10 text-white p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <p className="text-sm font-semibold">Notifications</p>
            {unread.length > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.slice(0, 10).map((n: any) => (
                <div 
                  key={n.id || n.createdAt} 
                  onClick={() => handleNotificationClick(n)}
                  className={`flex gap-3 px-4 py-3 border-b border-white/5 cursor-pointer transition-colors ${!n.readBy?.[userId] ? 'bg-cyan-500/5 hover:bg-cyan-500/10' : 'hover:bg-white/[0.04]'}`}
                >
                  <div className="mt-0.5">
                    {n.type === "low_stock" ? (
                      <Package className="h-4 w-4 text-amber-400" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-[13px] leading-tight">
                      <span className="font-medium text-white/90">{n.cashierName || "Cashier"}</span> 
                      <span className="text-white/50"> ({n.branchName})</span>
                    </p>
                    <p className="text-[13px] text-white/70 line-clamp-1">{n.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-white/40">
                        {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : "recently"}
                      </p>
                      {n.responses?.length > 0 && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-sm">
                          {n.responses.length} {n.responses.length === 1 ? 'reply' : 'replies'}
                        </span>
                      )}
                    </div>
                  </div>
                  {!n.readBy?.[userId] && n.id && (
                    <button onClick={(e) => markAsRead(n.id, e)} className="self-center p-1 text-white/30 hover:text-cyan-400 transition-colors" title="Mark as read">
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-white/40">
                No notifications
              </div>
            )}
          </div>
          {!isCashier && (
            <div className="p-2 border-t border-white/5">
              <a href="/" className="block text-center text-xs text-white/50 hover:text-white/80 transition-colors py-1">
                View all on dashboard
              </a>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!selectedNotif} onOpenChange={(open) => !open && setSelectedNotif(null)}>
        <DialogContent className="sm:max-w-md bg-[#0f1117] border-white/10 text-white p-0 overflow-hidden flex flex-col h-[500px]">
          <DialogHeader className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
            <DialogTitle className="flex items-center gap-3">
              <div className="bg-cyan-500/20 p-2 rounded-full">
                {selectedNotif?.type === "low_stock" ? (
                  <Package className="h-5 w-5 text-amber-400" />
                ) : (
                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-base">{selectedNotif?.cashierName || "Cashier"} - {selectedNotif?.branchName}</span>
                <span className="text-xs text-white/50 font-normal">
                  {selectedNotif?.createdAt ? formatDistanceToNow(new Date(selectedNotif.createdAt), { addSuffix: true }) : "recently"}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-4 bg-[#0a0d14]">
            <div className="space-y-4 pr-3 pb-4">
              {/* Original Notification Bubble */}
              <div className={`flex w-full ${selectedNotif?.createdBy === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 ${selectedNotif?.createdBy === user?.id ? 'bg-cyan-600 text-white rounded-tr-sm' : 'bg-white/10 text-white/90 rounded-tl-sm'}`}>
                  <p className="text-sm break-words">{selectedNotif?.message}</p>
                  <p className="text-[10px] text-white/50 text-right mt-1">
                    {selectedNotif?.createdAt ? formatDistanceToNow(new Date(selectedNotif.createdAt), { addSuffix: true }) : ""}
                  </p>
                </div>
              </div>

              {/* Responses Bubbles */}
              {selectedNotif?.responses?.map((resp: any, idx: number) => {
                const isMe = resp.createdBy === user?.id;
                return (
                  <div key={idx} className={`flex w-full flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-[10px] text-white/40 ml-1 mb-1">{resp.authorName || "Manager"}</span>}
                    <div className={`max-w-[80%] rounded-2xl p-3 ${isMe ? 'bg-cyan-600 text-white rounded-tr-sm' : 'bg-white/10 text-white/90 rounded-tl-sm'}`}>
                      <p className="text-sm break-words">{resp.message}</p>
                      <p className="text-[10px] text-white/50 text-right mt-1">
                        {resp.createdAt ? formatDistanceToNow(new Date(resp.createdAt), { addSuffix: true }) : ""}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          <div className="p-3 bg-white/[0.02] border-t border-white/10 flex items-center gap-2">
            <Input 
              value={responseMsg}
              onChange={(e) => setResponseMsg(e.target.value)}
              placeholder="Type a message..." 
              className="bg-black/40 border-white/10 focus-visible:ring-cyan-500/50 rounded-full h-10 px-4"
              onKeyDown={(e) => e.key === 'Enter' && handleRespond()}
            />
            <Button 
              onClick={handleRespond} 
              disabled={submitting || !responseMsg.trim()} 
              className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full h-10 w-10 p-0 shrink-0"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
