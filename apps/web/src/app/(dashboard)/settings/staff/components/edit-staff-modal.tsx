"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function EditStaffModal({ member, open, onOpenChange, onSuccess }: { member: any | null; open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void }) {
  const [branches, setBranches] = useState<any[]>([])
  const [values, setValues] = useState({ firstName: "", lastName: "", phone: "", role: "cashier", isActive: "true", branchId: "unassigned" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || !member) return
    apiClient.get("/branches").then((response) => setBranches(response.data)).catch(console.error)
    setValues({ firstName: member.firstName || "", lastName: member.lastName || "", phone: member.phone || "", role: member.role || "cashier", isActive: member.isActive ? "true" : "false", branchId: member.staffAssignments?.[0]?.branch?.id || "unassigned" })
    setError("")
  }, [open, member])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!member) return
    try {
      setSaving(true)
      setError("")
      await apiClient.patch(`/users/${member.id}`, {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        role: values.role,
        isActive: values.isActive === "true",
        branchIds: values.branchId === "all" ? branches.map((branch) => branch.id) : values.branchId === "unassigned" ? [] : [values.branchId],
      })
      onSuccess()
      onOpenChange(false)
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || "Unable to update this staff member.")
    } finally { setSaving(false) }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>Edit staff member</DialogTitle><DialogDescription>Update account details, access level, and branch assignment.</DialogDescription></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>First name</Label><Input value={values.firstName} onChange={(event) => setValues({ ...values, firstName: event.target.value })} /></div><div className="space-y-2"><Label>Last name</Label><Input value={values.lastName} onChange={(event) => setValues({ ...values, lastName: event.target.value })} /></div></div>
        <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Role</Label><Select value={values.role} onValueChange={(role) => setValues({ ...values, role: role || "cashier" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="cashier">Cashier</SelectItem><SelectItem value="viewer">Viewer</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Status</Label><Select value={values.isActive} onValueChange={(isActive) => setValues({ ...values, isActive: isActive || "true" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent></Select></div>
        </div>
        <div className="space-y-2"><Label>Branch assignment</Label><Select value={values.branchId} onValueChange={(branchId) => setValues({ ...values, branchId: branchId || "unassigned" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem><SelectItem value="all">All branches</SelectItem>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectContent></Select></div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
