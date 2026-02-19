"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"

interface themeSwitcherProps {
  isOpen?: boolean
}

export function ThemeSwitcher({ isOpen }: themeSwitcherProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check initial theme
    const theme = localStorage.getItem("theme")
    const dark = theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setIsDark(dark)
    updateTheme(dark)
  }, [])

  const updateTheme = (dark: boolean) => {
    const root = document.documentElement
    if (dark) {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    updateTheme(newTheme)
  }

  return (
    // <Button variant="outline" size="icon" onClick={toggleTheme} className="h-9 w-9">
    //   {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    //   <span className="sr-only">Toggle theme</span>
    // </Button>

    //  <div className="flex items-center space-x-2" onClick={toggleTheme}>
       
    //     <Label htmlFor="theme-switch">Light</Label>
    //     <Switch
    //       id="theme-switch"
    //       className="relative h-[25px] w-[42px] cursor-pointer rounded-full bg-muted outline-none transition-colors duration-200 data-[state=checked]:bg-black dark:bg-slate-700"
    //     />
    //      <Label htmlFor="theme-switch">Dark</Label>
    //   </div>


   <div className="w-auto md:w-full flex items-center  md:justify-center space-x-2">
      {isOpen && (
        <span className="text-[10px] hidden md:block">Light</span>
      )}
      <button
        onClick={toggleTheme}
        role="switch"
        aria-checked={isDark}
        className="relative inline-flex h-[28px] min-h-[28px] max-h-[28px] w-[50px] min-w-[50px] max-w-[50px] items-center justify-between px-[6px] rounded-full bg-black transition-colors duration-300"
      >
        <Sun className={`h-3 w-3 z-10 left-[1px] transition-transform  relative ${!isDark ? 'text-black' : 'text-white' }`} />
        <Moon className="h-3 w-3 text-white z-10 right-[1.5px] relative" />
        <span
          className={`absolute top-[4px] h-[20px] w-[20px] rounded-full bg-blue-50 transition-transform duration-300 ${
            isDark ? "translate-x-[20px] bg-blue-700" : "translate-x-[-3px] "
          }`}
        />
      </button>
      {isOpen && (
        <span className="text-[10px] hidden md:block">Dark</span>
      )}
    </div>

  )
}
