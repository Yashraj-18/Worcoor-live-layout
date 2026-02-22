"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, Box, Database, Package, Trash, Upload, Warehouse } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { referenceDataService, type ReferenceDataCounts } from "@/src/services/referenceData"

export default function InventoryManagementPage() {
  const [counts, setCounts] = useState<ReferenceDataCounts | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchCounts = async () => {
      setIsLoading(true)
      try {
        const data = await referenceDataService.getCounts()
        if (!cancelled) {
          setCounts(data)
        }
      } catch (error) {
        console.error('Failed to fetch reference data counts:', error)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchCounts()

    return () => {
      cancelled = true
    }
  }, [])

  const displayCount = (value: number | undefined) => {
    if (isLoading) return '...'
    return value ?? 0
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reference Data Management"
        description="Manage units, location tags, SKU's across your manufacturing operations"
        icon={Warehouse}
      />

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-100">Total Org Units</p>
                <p className="text-3xl font-bold text-white">{displayCount(counts?.totalUnits)}</p>
                <p className="text-xs text-orange-200 font-medium">Warehouses, production units, offices</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Warehouse className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-100">Total SKUs</p>
                <p className="text-3xl font-bold text-white">{displayCount(counts?.totalSkus)}</p>
                <p className="text-xs text-blue-200 font-medium">Active inventory items</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Box className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-indigo-100">Total Location Tags</p>
                <p className="text-3xl font-bold text-white">{displayCount(counts?.totalLocationTags)}</p>
                <p className="text-xs text-indigo-200 font-medium">Organized location categories</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-teal-100">Total Assets</p>
                <p className="text-3xl font-bold text-white">{displayCount(counts?.totalAssets)}</p>
                <p className="text-xs text-teal-200 font-medium">Warehouse equipment & resources</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Database className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
          <CardContent className="p-8 flex flex-col justify-between h-full">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
                  <Warehouse className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-foreground dark:text-slate-50 text-lg">Org Unit Data</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-200 leading-relaxed">
                    Define units or places for layouts (warehouses, production units, office floors)
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex items-center gap-2 pt-3 mt-auto">
                <span className="text-xs text-muted-foreground dark:text-slate-300">Total units:</span>
                <Badge variant="secondary" className="text-xs font-medium">
                  {displayCount(counts?.totalUnits)} units
                </Badge>
              </div>
              <Button
                asChild
                className="w-full mt-16 mx-2 px-6 py-3 border border-slate-200/50 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <Link href="/reference-data/org-units" className="flex items-center justify-center gap-2">
                  Org Unit Data
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
          <CardContent className="p-8 flex flex-col justify-between h-full">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Package className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-foreground dark:text-slate-50 text-lg">Location Tag Data</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-200 leading-relaxed">
                    Manage and organize location tags and categories
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex items-center gap-2 pt-3 mt-auto">
                <span className="text-xs text-muted-foreground dark:text-slate-300">Total tags:</span>
                <Badge variant="secondary" className="text-xs font-medium">
                  {displayCount(counts?.totalLocationTags)} tags
                </Badge>
              </div>
              <Button
                asChild
                className="w-full mt-16 mx-2 px-6 py-3 border border-slate-200/50 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <Link href="/reference-data/location-tags" className="flex items-center justify-center gap-2">
                  Location Tag Data
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
          <CardContent className="p-8 flex flex-col justify-between h-full">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Box className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-foreground dark:text-slate-50 text-lg">SKU Data</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-200 leading-relaxed">
                    Manage SKUs and inventory levels
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex items-center gap-2 pt-3 mt-auto">
                <span className="text-xs text-muted-foreground dark:text-slate-300">Available SKUs:</span>
                <Badge variant="secondary" className="text-xs font-medium">
                  {displayCount(counts?.totalSkus)} SKUs
                </Badge>
              </div>
              <Button
                asChild
                className="w-full mt-16 mx-2 px-6 py-3 border border-slate-200/50 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <Link href="/reference-data/skus" className="flex items-center justify-center gap-2">
                  SKU Data
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
          <CardContent className="p-8 flex flex-col justify-between h-full">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
                  <Package className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-foreground dark:text-slate-50 text-lg">Asset Data</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-200 leading-relaxed">
                    Manage and track warehouse assets and equipment
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex items-center gap-2 pt-3 mt-auto">
                <span className="text-xs text-muted-foreground dark:text-slate-300">Total assets:</span>
                <Badge variant="secondary" className="text-xs font-medium">
                  {displayCount(counts?.totalAssets)} assets
                </Badge>
              </div>
              <Button
                asChild
                className="w-full mt-16 mx-2 px-6 py-3 border border-slate-200/50 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <Link href="/reference-data/asset-management" className="flex items-center justify-center gap-2">
                  Asset Data
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
          <CardContent className="p-8 flex flex-col justify-between h-full">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white shadow-sm">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-foreground dark:text-slate-50 text-lg">Bulk Upload</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-200 leading-relaxed">
                    Upload and import multiple SKUs, locations, or assets in bulk from CSV or Excel files
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex items-center gap-2 pt-3 mt-auto">
                <span className="text-xs text-muted-foreground dark:text-slate-300">Supported formats:</span>
                <Badge variant="secondary" className="text-xs font-medium">
                  CSV & Excel
                </Badge>
              </div>
              <Button
                asChild
                className="w-full mt-16 mx-2 px-6 py-3 border border-slate-200/50 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <Link href="/reference-data/bulk-upload" className="flex items-center justify-center gap-2">
                  Bulk Upload
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
