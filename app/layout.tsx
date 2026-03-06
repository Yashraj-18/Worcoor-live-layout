import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from '@/src/utils/AuthContext'
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Worcoor - Asset & Inventory Management",
  description: "A comprehensive asset and inventory management system",
  generator: "v0.dev",
  icons: [
    {url: "https://dwnn5f7i77za.cloudfront.net/assets-web/general/favicon.ico"}, // path from public folder
    { url: "https://dwnn5f7i77za.cloudfront.net/assets-web/general/favicon.png", type: "image/png" }
  ]
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}