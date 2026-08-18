"use client"

import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export default function SetupCompletePage() {
  const router = useRouter()

  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <CardTitle>You&apos;re all set!</CardTitle>
        <CardDescription>
          Your SalesK account is fully configured and ready to go.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          We&apos;ve loaded your default dashboard and set up the features tailored for your business type. Let&apos;s go to your dashboard to start managing your operations!
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={() => router.push("/")} size="lg">
          Go to Dashboard
        </Button>
      </CardFooter>
    </Card>
  )
}
