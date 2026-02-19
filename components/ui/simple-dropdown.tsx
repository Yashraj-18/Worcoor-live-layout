// @ts-nocheck
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, ChevronRight, Circle } from "lucide-react"

interface DropdownContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined)

export const SimpleDropdown = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export const SimpleDropdownTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error("SimpleDropdownTrigger must be used within SimpleDropdown")
  
  const handleClick = () => context.setOpen(!context.open)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref,
      onClick: handleClick,
      'data-dropdown-trigger': true,
      ...props,
    })
  }
  
  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      data-dropdown-trigger
      className={cn("inline-flex justify-center", className)}
      {...props}
    >
      {children}
    </button>
  )
})
SimpleDropdownTrigger.displayName = "SimpleDropdownTrigger"

export const SimpleDropdownContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" | "center" }
>(({ className, align = "start", children, ...props }, ref) => {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error("SimpleDropdownContent must be used within SimpleDropdown")
  
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  
  // Callback for setting refs
  const setRefs = React.useCallback((node: HTMLDivElement) => {
    dropdownRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }, [ref])
  
  // Handle click outside
  React.useEffect(() => {
    if (!context.open) return
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Check if click is on trigger
        const trigger = (event.target as Element).closest('[data-dropdown-trigger]')
        if (!trigger) {
          context.setOpen(false)
        }
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [context.open, context])
  
  if (!context.open) return null
  
  const alignmentClasses = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2"
  }
  
  return (
    <div
      ref={setRefs}
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "opacity-0 animate-[fadeIn_150ms_ease-out_forwards]",
        alignmentClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SimpleDropdownContent.displayName = "SimpleDropdownContent"

export const SimpleDropdownItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error("SimpleDropdownItem must be used within SimpleDropdown")
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        inset && "pl-8",
        className
      )}
      onClick={() => context.setOpen(false)}
      {...props}
    >
      {children}
    </div>
  )
})
SimpleDropdownItem.displayName = "SimpleDropdownItem"

export const SimpleDropdownSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SimpleDropdownSeparator.displayName = "SimpleDropdownSeparator"

export const SimpleDropdownLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props}
  />
))
SimpleDropdownLabel.displayName = "SimpleDropdownLabel"

// Re-export with names matching the original components for easy replacement
export {
  SimpleDropdown as DropdownMenu,
  SimpleDropdownTrigger as DropdownMenuTrigger,
  SimpleDropdownContent as DropdownMenuContent,
  SimpleDropdownItem as DropdownMenuItem,
  SimpleDropdownSeparator as DropdownMenuSeparator,
  SimpleDropdownLabel as DropdownMenuLabel,
}