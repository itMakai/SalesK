"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, ScanLine } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> }
type DetectorConstructor = new (options?: { formats?: string[] }) => Detector

export function BarcodeScannerDialog({ open, onOpenChange, onDetected }: { open: boolean; onOpenChange: (open: boolean) => void; onDetected: (value: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [message, setMessage] = useState("Starting camera…")
  const [manualValue, setManualValue] = useState("")

  useEffect(() => {
    if (!open) return
    let stream: MediaStream | undefined
    let frameId = 0
    let active = true
    const DetectorClass = (window as typeof window & { BarcodeDetector?: DetectorConstructor }).BarcodeDetector

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } })
        if (!active || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        if (!DetectorClass) {
          setMessage("Camera preview is ready. Your browser does not support automatic decoding—use a hardware scanner or enter the code below.")
          return
        }
        const detector = new DetectorClass({ formats: ["qr_code", "code_128", "ean_13", "ean_8", "upc_a", "upc_e"] })
        setMessage("Point the camera at a QR code or barcode.")
        const scan = async () => {
          if (!active || !videoRef.current) return
          const codes = await detector.detect(videoRef.current).catch(() => [])
          if (codes[0]?.rawValue) {
            onDetected(codes[0].rawValue)
            onOpenChange(false)
            return
          }
          frameId = requestAnimationFrame(scan)
        }
        frameId = requestAnimationFrame(scan)
      } catch {
        setMessage("Camera access was unavailable. Allow camera permission or enter the code below.")
      }
    }
    start()
    return () => {
      active = false
      cancelAnimationFrame(frameId)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [open, onDetected, onOpenChange])

  const submitManual = (event: React.FormEvent) => {
    event.preventDefault()
    const value = manualValue.trim()
    if (!value) return
    onDetected(value)
    onOpenChange(false)
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><ScanLine className="h-5 w-5 text-primary" /> Scan code</DialogTitle>
        <DialogDescription>Use a QR code, barcode, or a connected handheld scanner.</DialogDescription>
      </DialogHeader>
      <div className="overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
      </div>
      <p className="flex items-start gap-2 text-sm text-muted-foreground"><Camera className="mt-0.5 h-4 w-4 shrink-0" />{message}</p>
      <form onSubmit={submitManual} className="flex gap-2">
        <Input value={manualValue} onChange={(event) => setManualValue(event.target.value)} placeholder="Enter or scan a code" autoFocus />
        <button type="submit" className="inline-flex items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">Use</button>
      </form>
    </DialogContent>
  </Dialog>
}
