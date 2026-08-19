import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "SalesK", template: "%s · SalesK" },
  description: "Advanced multi-branch POS & business management platform",
}

import { SWRProvider } from "@/components/swr-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SWRProvider>
          {children}
        </SWRProvider>
      </body>
    </html>
  )
}
