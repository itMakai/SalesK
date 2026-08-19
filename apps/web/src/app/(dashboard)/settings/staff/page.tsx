"use client"

import { useState } from "react"
import useSWR from "swr"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { InviteStaffModal } from "./components/invite-modal"
import { EditStaffModal } from "./components/edit-staff-modal"

export default function StaffSettingsPage() {
  const user = useAuthStore((state) => state.user)
  const [isInviteModalOpen, setInviteModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any | null>(null)
  
  const { data: staff = [], mutate } = useSWR("/api/v1/users", () => apiClient.get("/users").then((response) => response.data))

  const handleInviteSuccess = () => mutate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff & Users</h2>
          <p className="text-muted-foreground">
            Manage your team members, assign them to branches, and configure their permissions.
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)}>
          Add Staff
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch Assignment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member: any) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                    <AvatarFallback>{member.firstName?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>{member.firstName} {member.lastName}</span>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{member.role}</TableCell>
                <TableCell>{member.staffAssignments?.length ? member.staffAssignments.map((assignment: any) => assignment.branch.name).join(", ") : "Unassigned"}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    member.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                  {member.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditingMember(member)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InviteStaffModal 
        open={isInviteModalOpen} 
        onOpenChange={setInviteModalOpen}
        onSuccess={handleInviteSuccess}
      />
      <EditStaffModal member={editingMember} open={Boolean(editingMember)} onOpenChange={(open) => !open && setEditingMember(null)} onSuccess={() => mutate()} />
    </div>
  )
}
