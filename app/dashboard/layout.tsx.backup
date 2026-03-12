"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SidebarProvider, useSidebar } from "@/components/dashboard/sidebar-context"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { ReferenceDataProvider } from "@/contexts/reference-data-context"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Logo } from "@/components/logo"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const isLayoutBuilder = pathname?.includes('layout-builder')

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
 const { toggle } = useSidebar()
 
  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Set initial state
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <ReferenceDataProvider>
      <SidebarProvider>
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
          {!isLayoutBuilder && (
            <div className={`${isMobile && !sidebarOpen ? "hidden" : "block"}`}>
              <DashboardSidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
            </div>
          )}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* <MobileHeader /> */}
            <div className="md:hidden flex items-center justify-between p-4 border-b bg-background">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="mr-2" onClick={toggleSidebar}>
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center justify-center space-x-auto gap-2">
                  <Logo size={32} alwaysShow={true} />
                  <h1 className="text-lg font-medium">Worcoor</h1>
              </div>
              <ThemeSwitcher />
            </div>
            <main
              className="flex-1 h-full overflow-auto scrollbar-none dark:bg-background"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div
                className="p-6 space-y-6 min-h-full overflow-hidden scrollbar-none"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <div
                  className="max-w-[1366px] mx-auto overflow-hidden scrollbar-none"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ReferenceDataProvider>
  )
}



