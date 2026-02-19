// @ts-nocheck
"use client"

import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useSidebar } from "./sidebar-context"
import { Logo } from "@/components/logo"

export function MobileHeader() {
  const { toggle } = useSidebar()

  return (
    <div className="md:hidden flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="mr-2" onClick={toggle}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <h1 className="text-lg font-medium">Worcoor</h1>
        </div>
      </div>
      <ThemeSwitcher />
    </div>
  )
}
