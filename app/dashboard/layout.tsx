"use client"

import type React from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Simple Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen p-4">
          <h2 className="text-xl font-bold mb-6">Worcoor</h2>
          <nav className="space-y-2">
            <a href="/dashboard/reference-data" className="block p-2 rounded hover:bg-gray-100">Reference Data</a>
            <a href="/dashboard/warehouse-management" className="block p-2 rounded hover:bg-gray-100">Warehouse Management</a>
            <a href="/dashboard/analytics" className="block p-2 rounded hover:bg-gray-100">Analytics</a>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
