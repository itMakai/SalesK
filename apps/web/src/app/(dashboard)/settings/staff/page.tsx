"use client"

import { useState } from "react"
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

export default function StaffSettingsPage() {
  const user = useAuthStore((state) => state.user)
  const [isInviteModalOpen, setInviteModalOpen] = useState(false)
  
  // Mock data since we don't have a full GET /users endpoint in the backend for week 6
  // In a real app we would fetch this via apiClient.get('/tenant/users')
  const [staff, setStaff] = useState([
    {
      id: user?.id,
      name: `${user?.firstName} ${user?.lastName}`,
      email: user?.email,
      role: user?.role,
      branch: "All Branches",
      status: "Active"
    }
  ])

  const handleInviteSuccess = () => {
    // Mock adding to list
    setStaff([
      ...staff,
      {
        id: Math.random().toString(),
        name: "New Invite",
        email: "pending@example.com",
        role: "cashier",
        branch: "Pending",
        status: "Invited"
      }
    ])
  }

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
          Invite Staff
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
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span>{member.name}</span>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{member.role}</TableCell>
                <TableCell>{member.branch}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {member.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Edit</Button>
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
    </div>
  )
}
