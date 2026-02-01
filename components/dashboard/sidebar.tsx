"use client"

import { useEffect, useState } from 'react'
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ShoppingCart, ReceiptText, FilePlus, BarChart3, Bell, ChevronRight, Database, FileText, LayoutDashboard, Layers, Truck, ChevronLeft, LineChart, Trash, Activity, PackageSearch, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThemeSwitcher } from "@/components/theme-switcher"
import type { AuthData } from '@/src/utils/AuthContext'
import localStorageService from '@/src/services/localStorageService'
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from '../ui/menubar'
import { notification } from '@/src/services/notificationService'
import { useRouter } from 'next/navigation'
import { apiService } from '@/src/services/apiService'
import { api_url } from '@/src/constants/api_url'
import { useAuth } from '@/src/utils/AuthContext'
import { Logo } from '../logo'

type SidebarProps = {
  isOpen: boolean
  toggle: () => void
}

export function DashboardSidebar({ isOpen, toggle }: SidebarProps) {
  const { authLogout, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const logout = async (e: React.FormEvent) => {
    try {
      // ✅ Mock logout - no external API call needed
      notification.success('Logout Successful');
      authLogout();
      router.replace('/login');
    } catch (error: any) {
      notification.error("Something went wrong. Please try again.");
    }
  }

  const navItems = [
    // Dashboard Menu
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
                // Task Management Menu
    // {
    //   title: "Task Management",
    //   href: "/dashboard/task-manager",
    //   icon: ClipboardList,
    // },
    // {
    //   title: "Task Alerts Management",
    //   href: "/dashboard/task-manager/alerts",
    //   icon: Bell,
    //   parent: "Task Management",
    // },
    // {
    //   title: "Task Repository",
    //   href: "/dashboard/task-manager/repository",
    //   icon: ClipboardList,
    //   parent: "Task Management",
    // },
    // {
    //   title: "Task Assignment",
    //   href: "/dashboard/task-manager/assignments",
    //   icon: Users,
    //   parent: "Task Management",
    // },
    // {
    //   title: "Task Dashboard",
    //   href: "/dashboard/task-manager/dashboards",
    //   icon: LayoutDashboard,
    //   parent: "Task Management",
    // },
    // {
    //   title: "Task Tracking",
    //   href: "/dashboard/task-manager/tracking",
    //   icon: Activity,
    //   parent: "Task Management",
    // },
    // {
    //   title: "Performance Analytics",
    //   href: "/dashboard/analytics",
    //   icon: LineChart,
    //   parent: "Task Management",
    // },
    // Reference Data Management Menu
    {
      title: "Reference Data Management",
      href: "/dashboard/reference-data",
      icon: Database,
    },
    {
      title: "Org Unit Data",
      href: "/dashboard/reference-data/org-units",
      icon: Layers,
      parent: "Reference Data Management",
    },
    {
      title: "Location Tag Data",
      href: "/dashboard/reference-data/location-tags",
      icon: Database,
      parent: "Reference Data Management",
    },
    {
      title: "SKU Data",
      href: "/dashboard/reference-data/skus",
      icon: Layers,
      parent: "Reference Data Management",
    },
    {
      title: "Asset Data",
      href: "/dashboard/reference-data/asset-management",
      icon: Database,
      parent: "Reference Data Management",
    },
    {
      title: "Bulk Upload",
      href: "/dashboard/reference-data/bulk-upload",
      icon: Upload,
      parent: "Reference Data Management",
    },
    // {
    //   title: "Wastage Tracking",
    //   href: "/dashboard/reference-data/wastage",
    //   icon: Trash,
    //   parent: "Reference Data Management",
    // },
    // {
    //   title: "Reference Data Analytics",
    //   href: "/dashboard/reference-data/analytics",
    //   icon: BarChart3,
    //   parent: "Reference Data Management",
    // },
    // Warehouse Management Menu
    {
      title: "Warehouse Management",
      href: "/dashboard/warehouse-management",
      icon: Layers,
    },
    // {
    //   title: "Warehouse Map",
    //   href: "/dashboard/warehouse-management/warehouse-map",
    //   icon: Layers,
    //   parent: "Warehouse Management",
    // },
    {
      title: "Layout Builder",
      href: "/dashboard/warehouse-management/layout-builder",
      icon: LayoutDashboard,
      parent: "Warehouse Management",
    },
    // Procurement Management Menu
    // {
    //   title: "Procurement Management",
    //   href: "/dashboard/procurement-management",
    //   icon: PackageSearch,
    // },
    // {
    //   title: "Purchase Order Management",
    //   href: "/dashboard/procurement-management/purchase-order",
    //   icon: ReceiptText,
    //   parent: "Procurement Management",
    // },
    // {
    //   title: "Procurement Request",
    //   href: "/dashboard/procurement-management/procurement-request",
    //   icon: FilePlus,
    //   parent: "Procurement Management",
    // },
    // Order Management Menu
    // {
    //   title: "Order Management",
    //   href: "/dashboard/order-management",
    //   icon: ClipboardList,
    // },
    // {
    //   title: "Sales Order Management",
    //   href: "/dashboard/order-management/sales-order",
    //   icon: ShoppingCart,
    //   parent: "Order Management",
    // },
    // Asset Management Menu
    // {
    //   title: "Asset Management",
    //   href: "/dashboard/asset-management",
    //   icon: Package,
    // },
    // {
    //   title: "Asset Management",
    //   href: "/dashboard/asset-management/assets",
    //   icon: Package,
    //   parent: "Asset Management",
    // },
    // {
    //   title: "Asset Dashboard",
    //   href: "/dashboard/asset-management/dashboard",
    //   icon: BarChart3,
    //   parent: "Asset Management",
    // },
    // Audit Management Menu
    // {
    //   title: "Audit Management",
    //   href: "/dashboard/audit",
    //   icon: FileText,
    // },
    // {
    //   title: "Audit Form Management",
    //   href: "/dashboard/audit/forms",
    //   icon: FileText,
    //   parent: "Audit Management",
    // },
    // {
    //   title: "Audit Report",
    //   href: "/dashboard/audit/reports",
    //   icon: BarChart3,
    //   parent: "Audit Management",
    // },
    ]

  const getInitials = (name?: string) => {
    if (!name) return 'A'; // fallback
    const words = name.trim().split(' ');
    return words.length > 1
      ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
      : words[0][0].toUpperCase();
  };

  // Filter main navigation items (those without a parent)
  const mainNavItems = navItems.filter((item) => !item.parent)

  // Check if a nav item is active or one of its children is active
  const isActiveOrHasActiveChild = (item: any) => {
    if (pathname && pathname === item.href) return true
    return navItems.some((child) => child.parent === item.title && pathname && pathname === child.href)
  }

  return (
    <div
      className={cn(
        "h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white border-r border-slate-700/50 transition-all duration-300 ease-in-out shadow-2xl",
        isOpen ? "w-72" : "w-20",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700/50 h-20 bg-slate-900/50">
        <div className={cn("flex items-center", !isOpen && "justify-center")}>
          {isOpen ? (
            <div className="relative h-10 w-48">
              <Image
                src="https://dwnn5f7i77za.cloudfront.net/assets-web/general/logo_full.svg"
                alt="Worcoor Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
                className="brightness-0 invert"
              />
            </div>
          ) : (
            <div className="relative h-8 w-8">
              {/* <Image
                src="https://dwnn5f7i77za.cloudfront.net/assets-web/general/logo_full.svg"
                alt="Worcoor Icon"
                fill
                style={{ objectFit: "contain" }}
                priority
                className="brightness-0 invert"
              /> */}
              <Logo/>
            </div>
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="text-slate-300 hover:bg-slate-800 dark:bg-slate-600 bg-darkblue-foreground hover:text-white  absolute -right-5 top-1/2 transform -translate-y-1/2 translate-x-4 rounded-lg transition-all duration-200 h-7 w-7"
          >
            {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="overflow-y-auto md:h-[calc(100vh-200px)] h-[calc(100vh-150px)] custom-scrollbar">
        <nav className="p-4 space-y-2">
          {mainNavItems.map((item) => (
            <div key={`nav-${item.href}`} className="space-y-1">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActiveOrHasActiveChild(item)
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
                  !isOpen && "justify-center px-3",
                )}
                title={!isOpen ? item.title : undefined}
              >
                <item.icon
                  className={cn(
                    "flex-shrink-0 transition-transform duration-200",
                    isActiveOrHasActiveChild(item) ? "h-5 w-5" : "h-4 w-4",
                    "group-hover:scale-110",
                  )}
                />
                {isOpen && (
                  <>
                    <span className="flex-1 truncate">{item.title}</span>
                    {navItems.some((child) => child.parent === item.title) && (
                      <div
                        className={cn(
                          "transition-transform duration-200",
                          isActiveOrHasActiveChild(item) && "rotate-90",
                        )}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </>
                )}
                {/* Active indicator */}
                {isActiveOrHasActiveChild(item) && !isOpen && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-l-full" />
                )}
              </Link>

              {/* Child items */}
              {isOpen && isActiveOrHasActiveChild(item) && (
                <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                  {navItems
                    .filter((child) => child.parent === item.title)
                    .map((child) => (
                      <Link
                        key={`child-${child.href}`}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group relative",
                          pathname === child.href
                            ? "bg-slate-800 text-blue-300 border-l-2 border-blue-400"
                            : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-l-2 border-transparent hover:border-slate-600",
                        )}
                      >
                        <child.icon className="h-4 w-4 group-hover:scale-105 transition-transform duration-200" />
                        <span className="truncate">{child.title}</span>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <div className="hidden md:block py-2 border-t border-slate-700/50">
        <ThemeSwitcher isOpen={isOpen} />
      </div>
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
        {isOpen ? (
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors duration-200">
            <Menubar className="w-full min-w-full bg-slate-800/50 border-0 p-1">
              <MenubarMenu>
                <MenubarTrigger className="w-full h-full bg-slate-800/50 p-2 py-6">
                  <div className="w-full flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold text-sm shadow-lg">
                      {getInitials(userData?.fullName)}
                    </div>
                    <div className="flex-1 flex items-center min-w-0 ml-2">
                      <div className="text-left">
                        <p className="text-[14px] font-md text-white truncate">{userData?.fullName || "Admin User"}</p>
                        <p className="text-[10px] text-slate-400 truncate">{userData?.maskEmail || "admin@worcoor.com"}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </div>
                  </div>
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem onClick={logout}>Logout</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold text-sm shadow-lg hover:scale-105 transition-transform duration-200">
              {getInitials(userData?.fullName)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
