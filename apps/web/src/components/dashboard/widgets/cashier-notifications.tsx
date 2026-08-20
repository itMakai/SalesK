"use client"

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BellRing, Package, MessageSquare, Reply, Send, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuthStore } from "@/stores/auth-store";

export function CashierNotificationsWidget() {
  const user = useAuthStore(s => s.user);
  const userId = user?.id ?? "";
  const { notifications, mutate } = useNotifications();
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseMsg, setResponseMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);


  const handleRespond = async (id: string) => {
    if (!responseMsg.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/tenant/notifications/${id}/respond`, { message: responseMsg });
      setRespondingTo(null);
      setResponseMsg("");
      mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const markAsRead = async (id: string) => {
    await apiClient.patch(`/tenant/notifications/${id}/read`);
    mutate();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-indigo-500" />
          Cashier Notifications
        </CardTitle>
        <CardDescription>Alerts and requests from the floor</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.slice(0, 10).map((notif: any, i: number) => (
              <div key={notif.id || i} className={`flex gap-3 p-3 rounded-lg border transition-colors ${!notif.readBy?.[userId] ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                <div className="mt-0.5">
                  {notif.type === "low_stock" ? (
                    <div className={`rounded-full p-1.5 ${!notif.readBy?.[userId] ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-white/40'}`}>
                      <Package className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className={`rounded-full p-1.5 ${!notif.readBy?.[userId] ? 'bg-blue-500/20 text-blue-500' : 'bg-white/5 text-white/40'}`}>
                      <MessageSquare className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium leading-none ${!notif.readBy?.[userId] ? 'text-white' : 'text-white/70'}`}>
                      {notif.cashierName || "Cashier"} <span className="font-normal text-muted-foreground">at {notif.branchName || "Branch"}</span>
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : "recently"}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${!notif.readBy?.[userId] ? 'text-white/90' : 'text-white/50'}`}>
                    {notif.message}
                  </p>
                  
                  {notif.responses?.length > 0 && (
                    <div className="mt-2 space-y-1.5 border-l-2 border-indigo-500/30 pl-2">
                      {notif.responses.map((resp: any, ri: number) => (
                        <div key={ri} className="bg-white/5 p-2 rounded-md text-xs">
                          <span className="font-medium text-indigo-300">{resp.authorName || "Manager"}: </span>
                          <span className="text-white/80">{resp.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    {notif.id && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10" onClick={() => { setRespondingTo(respondingTo === notif.id ? null : notif.id); setResponseMsg(""); }}>
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    )}
                    {!notif.readBy?.[userId] && notif.id && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" onClick={() => markAsRead(notif.id)}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Mark Read
                      </Button>
                    )}
                  </div>

                  {respondingTo === notif.id && (
                    <div className="mt-2 flex gap-2 animate-in fade-in slide-in-from-top-1">
                      <Input 
                        size={1}
                        className="h-7 text-xs bg-black/40 border-indigo-500/30 focus-visible:ring-indigo-500/50" 
                        placeholder="Type response..." 
                        value={responseMsg}
                        onChange={(e) => setResponseMsg(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRespond(notif.id)}
                        autoFocus
                      />
                      <Button size="sm" className="h-7 px-2 bg-indigo-500 hover:bg-indigo-600 text-white" disabled={submitting || !responseMsg.trim()} onClick={() => handleRespond(notif.id)}>
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground space-y-2">
            <BellRing className="h-8 w-8 opacity-20" />
            <p className="text-sm">No notifications yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
