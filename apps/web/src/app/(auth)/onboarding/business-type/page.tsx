"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Store, UtensilsCrossed, Scissors, Stethoscope, Pill, Box } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

const templates = [
  { id: "retail", name: "Retail Store", description: "Standard POS with barcode scanning", icon: Store },
  { id: "restaurant", name: "Restaurant / Cafe", description: "Table management, KDS, modifiers", icon: UtensilsCrossed },
  { id: "salon", name: "Salon / Spa", description: "Appointments and staff scheduling", icon: Scissors },
  { id: "clinic", name: "Clinic / Hospital", description: "Patient records and billing", icon: Stethoscope },
  { id: "pharmacy", name: "Pharmacy", description: "Batch tracking and prescriptions", icon: Pill },
  { id: "generic", name: "Generic Business", description: "Basic invoicing and tracking", icon: Box },
]

export default function BusinessTypePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const handleNext = () => {
    if (selected) {
      // We will save this locally and send it all at the end, 
      // or we can pass it via URL query/localStorage.
      localStorage.setItem("onboarding_businessType", selected)
      router.push("/onboarding/business-details")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>What type of business are you running?</CardTitle>
        <CardDescription>
          We&apos;ll customize your dashboard and features based on your selection.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const Icon = template.icon
          const isSelected = selected === template.id
          
          return (
            <div
              key={template.id}
              onClick={() => setSelected(template.id)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all
                ${isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleNext} disabled={!selected}>
          Continue
        </Button>
      </CardFooter>
    </Card>
  )
}
