"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { PageTitle } from "@/components/page-title"
import { DarkModeLogo } from "@/components/ui/dark-mode-logo"
import {
  BarChart3,
  ClipboardList,
  Database,
  Users,
  TrendingUp,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Layers,
  Truck,
  Activity,
  LayoutDashboard,
} from "lucide-react"
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/utils/AuthContext'
import { apiService } from '@/src/services/apiService'
import { api_url } from '@/src/constants/api_url'

// Storage keys for data
const ORG_UNITS_STORAGE_KEY = "worcoor-org-units"
const LOCATION_TAGS_STORAGE_KEY = "worcoor-location-tags"
const SKUS_STORAGE_KEY = "worcoor-skus"

// Type definitions
type OrgUnit = {
  unit_name?: string
  unit_type?: string
  status?: string
  description?: string
}

type LocationTag = {
  location_tag_name?: string
  capacity?: number
  current_items?: number
}

type BackendSku = {
  id: string
  sku_name?: string
  sku_category?: string
  quantity?: number
  sku_unit?: string
  location_tag_id?: string
}

type BackendAsset = {
  id?: string
  asset_name?: string
  asset_type?: string
  location_tag_id?: string
  name?: string
  type?: string
  locationId?: string
}


// Sample data for charts
const productionTrend = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 4500 },
  { name: "Mar", value: 5000 },
  { name: "Apr", value: 4800 },
  { name: "May", value: 5200 },
  { name: "Jun", value: 5500 },
  { name: "Jul", value: 6000 },
]

const inventoryData = [
  { name: "Furniture", value: 45 },
  { name: "Storage", value: 30 },
  { name: "Accessories", value: 25 },
]

const workerEfficiencyData = [
  { name: "Mon", efficiency: 85 },
  { name: "Tue", efficiency: 88 },
  { name: "Wed", efficiency: 92 },
  { name: "Thu", efficiency: 90 },
  { name: "Fri", efficiency: 94 },
  { name: "Sat", efficiency: 87 },
  { name: "Sun", efficiency: 82 },
]

const taskCompletionData = [
  { name: "Week 1", completed: 42, total: 50 },
  { name: "Week 2", completed: 45, total: 52 },
  { name: "Week 3", completed: 48, total: 53 },
  { name: "Week 4", completed: 51, total: 55 },
]

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#6366f1", "#14b8a6", "#f97316", "#f43f5f"]

import { usersData } from "@/lib/users-data"
import { skusData } from "@/lib/skus-data"

export default function DashboardPage() {

  const { isAuthenticated, isAuthLoading } = useAuth()
  const router = useRouter()

  const [timeRange, setTimeRange] = useState("month")

  // State for summary statistics data
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
  const [locationTags, setLocationTags] = useState<LocationTag[]>([])
  const [skus, setSkus] = useState<BackendSku[]>([])
  const [assets, setAssets] = useState<BackendAsset[]>([])

  // Data fetching and localStorage management
  useEffect(() => {
    const readJsonArray = <T,>(key: string): T[] => {
      const raw = localStorage.getItem(key)
      if (!raw) return []
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    const refreshFromLocalStorage = () => {
      setOrgUnits(readJsonArray<OrgUnit>(ORG_UNITS_STORAGE_KEY))
      setLocationTags(readJsonArray<LocationTag>(LOCATION_TAGS_STORAGE_KEY))
      setSkus(readJsonArray<BackendSku>(SKUS_STORAGE_KEY))
    }

    refreshFromLocalStorage()

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return
      if (
        e.key === ORG_UNITS_STORAGE_KEY ||
        e.key === LOCATION_TAGS_STORAGE_KEY ||
        e.key === SKUS_STORAGE_KEY
      ) {
        refreshFromLocalStorage()
      }
    }

    window.addEventListener("storage", onStorage)
    const poll = window.setInterval(refreshFromLocalStorage, 2500)

    return () => {
      window.removeEventListener("storage", onStorage)
      window.clearInterval(poll)
    }
  }, [])

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await apiService.post({
          path: api_url.worCoorService.asset.assetlist,
          data: { page: 0, limit: 100 },
          isAuth: true,
        })
        const list = Array.isArray(response.data?.data?.list)
          ? response.data.data.list
          : Array.isArray(response.data?.data)
            ? response.data.data
            : []
        setAssets(list)
      } catch {
        setAssets([])
      }
    }

    fetchAssets()
    const poll = window.setInterval(fetchAssets, 10000)

    return () => {
      window.clearInterval(poll)
    }
  }, [])

  // Memoized calculations for summary statistics
  const orgUnitsCount = useMemo(() => orgUnits.length, [orgUnits])
  const skusCount = useMemo(() => skus.length, [skus])
  const locationTagsCount = useMemo(() => locationTags.length, [locationTags])
  const assetsCount = useMemo(() => assets.length, [assets])

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login') // redirect if not authenticated
    }
  }, [isAuthenticated, isAuthLoading, router])

  if (isAuthLoading) return null // or loading spinner
  if (!isAuthenticated) return null


  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <PageTitle
          title="Dashboard"
          description="Welcome to your Workforce & Inventory Management System"
          icon={LayoutDashboard}
        />
        {/* Logo only displays on the dashboard page (this is already /dashboard) */}
        <div className="relative">
          {/* Light mode logo */}
          <Image
            src="https://worcoor.s3.ap-south-1.amazonaws.com/assets-web/general/logo_full_b.png"
            alt="WC WorCoor Logo"
            width={180}
            height={60}
            className="h-auto dark:hidden"
            priority
          />
          {/* Dark mode logo - using custom SVG component for reliability */}
          <div className="h-auto hidden dark:block">
            <DarkModeLogo className="h-auto w-auto" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm font-medium">
            Last Updated: Today, 09:45 AM
          </Badge>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-100">Total Users</p>
                <p className="text-3xl font-bold text-white">{usersData.length}</p>
                <p className="text-xs text-blue-200 font-medium">+14% from last month</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-100">Active Tasks</p>
                <p className="text-3xl font-bold text-white">45</p>
                <p className="text-xs text-emerald-200 font-medium">+5% from last week</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-100">Inventory Items</p>
                <p className="text-3xl font-bold text-white">{skusData.length}</p>
                <p className="text-xs text-purple-200 font-medium">+2.5% from last month</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Database className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-100">Productivity</p>
                <p className="text-3xl font-bold text-white">87%</p>
                <p className="text-xs text-amber-200 font-medium">+3% from last month</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row of KPIs */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-indigo-100">Production Output</p>
                <p className="text-3xl font-bold text-white">7,200</p>
                <p className="text-xs text-indigo-200 font-medium">+5.8% from last period</p>
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
                <p className="text-sm font-medium text-teal-100">On-Time Delivery</p>
                <p className="text-3xl font-bold text-white">94.5%</p>
                <p className="text-xs text-teal-200 font-medium">+1.5% from last period</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-100">Low Stock Items</p>
                <p className="text-3xl font-bold text-white">12</p>
                <p className="text-xs text-orange-200 font-medium">Requires attention</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-rose-100">Profit Margin</p>
                <p className="text-3xl font-bold text-white">32.4%</p>
                <p className="text-xs text-rose-200 font-medium">-0.8% from last period</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200/60 bg-white/50 px-3 py-2 text-xs dark:border-slate-700/60 dark:bg-slate-900/20">
          <div className="text-muted-foreground">Org Units</div>
          <div className="font-mono tabular-nums text-sm text-foreground">{orgUnitsCount.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-slate-200/60 bg-white/50 px-3 py-2 text-xs dark:border-slate-700/60 dark:bg-slate-900/20">
          <div className="text-muted-foreground">Tags</div>
          <div className="font-mono tabular-nums text-sm text-foreground">{locationTagsCount.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-slate-200/60 bg-white/50 px-3 py-2 text-xs dark:border-slate-700/60 dark:bg-slate-900/20">
          <div className="text-muted-foreground">Assets</div>
          <div className="font-mono tabular-nums text-sm text-foreground">{assetsCount.toLocaleString()}</div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full md:col-span-2">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Production Trends</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">
                  Monthly production output
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={productionTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Inventory Distribution</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">By category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={inventoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {inventoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Upcoming Deadlines</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">Tasks due soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Office Chairs (10)</p>
                      <p className="text-xs text-muted-foreground">PO-2023-001</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Due in 2 days</Badge>
                  </div>
                  <Progress value={75} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Bookshelves (8)</p>
                      <p className="text-xs text-muted-foreground">PO-2023-002</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">Due in 5 days</Badge>
                  </div>
                  <Progress value={45} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Filing Cabinets (3)</p>
                      <p className="text-xs text-muted-foreground">PO-2023-003</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Due in 10 days</Badge>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/task-manager/orders">
                    View All Orders <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Worker Performance</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">
                  Top performers this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-2">
                        EJ
                      </div>
                      <div>
                        <p className="text-sm font-medium">Emma Johnson</p>
                        <p className="text-xs text-muted-foreground">Assembly</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">98%</p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                  </div>
                  <Progress value={98} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-2">
                        MC
                      </div>
                      <div>
                        <p className="text-sm font-medium">Michael Chen</p>
                        <p className="text-xs text-muted-foreground">Quality Control</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">96%</p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                  </div>
                  <Progress value={96} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-2">
                        SW
                      </div>
                      <div>
                        <p className="text-sm font-medium">Sarah Williams</p>
                        <p className="text-xs text-muted-foreground">Packaging</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">95%</p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/worker/performance">
                    View All Workers <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Critical Inventory</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">
                  Items that need attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Wooden Panels - Oak</p>
                      <p className="text-xs text-muted-foreground">SKU: WD-FRAME-01</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                  </div>
                  <Progress value={15} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Upholstery Fabric - Black</p>
                      <p className="text-xs text-muted-foreground">SKU: UPH-FAB-02</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                  </div>
                  <Progress value={20} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Metal Legs - Chrome</p>
                      <p className="text-xs text-muted-foreground">SKU: MT-LEG-01</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">Reorder Soon</Badge>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/inventory/levels">
                    View Inventory <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Quality Metrics</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">
                  Current quality performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">Defect Rate</p>
                      <p className="text-sm font-medium">1.2%</p>
                    </div>
                    <Progress value={12} className="h-2" />
                    <p className="text-xs text-green-600 mt-1">-0.3% from last month</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">First Pass Yield</p>
                      <p className="text-sm font-medium">97.5%</p>
                    </div>
                    <Progress value={97.5} className="h-2" />
                    <p className="text-xs text-green-600 mt-1">+0.8% from last month</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">Customer Returns</p>
                      <p className="text-sm font-medium">0.5%</p>
                    </div>
                    <Progress value={5} className="h-2" />
                    <p className="text-xs text-green-600 mt-1">-0.2% from last month</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/analytics">
                    View Analytics <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Upcoming Events</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">
                  Schedule for the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Quality Audit</p>
                      <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Inventory Stocktake</p>
                      <p className="text-xs text-muted-foreground">Wednesday, 9:00 AM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Production Planning Meeting</p>
                      <p className="text-xs text-muted-foreground">Thursday, 2:00 PM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Supplier Meeting</p>
                      <p className="text-xs text-muted-foreground">Friday, 11:00 AM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  View Calendar <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full col-span-2">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Quick Access</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">
                  Frequently used sections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/dashboard/task-manager/orders">
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <ClipboardList className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium text-center">Manage Orders</span>
                    </div>
                  </Link>
                  <Link href="/dashboard/inventory/levels">
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <Layers className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium text-center">Inventory Levels</span>
                    </div>
                  </Link>
                  <Link href="/dashboard/worker/performance">
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <Activity className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium text-center">Worker Performance</span>
                    </div>
                  </Link>
                  <Link href="/dashboard/inventory/procurement">
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <Truck className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-sm font-medium text-center">Procurement</span>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full col-span-2">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">System Status</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">Current system health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">Production Module</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">Inventory Management</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">Worker Management</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">Analytics Engine</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Operational
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PRODUCTION TAB */}
        <TabsContent value="production" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Production Output</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">
                  Monthly production trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={productionTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#10b981" name="Units Produced" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Manufacturing Progress</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">
                  Current production status by product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Office Chair - Standard</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Overall Progress</span>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Office Desk - Adjustable</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Overall Progress</span>
                        <span className="text-sm font-medium">60%</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Filing Cabinet</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Overall Progress</span>
                        <span className="text-sm font-medium">40%</span>
                      </div>
                      <Progress value={40} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/task-manager/tracking">
                    View All Products <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Production Schedule</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-200">Upcoming production runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Product</th>
                      <th className="py-3 px-4 text-left font-medium">Order ID</th>
                      <th className="py-3 px-4 text-left font-medium">Quantity</th>
                      <th className="py-3 px-4 text-left font-medium">Start Date</th>
                      <th className="py-3 px-4 text-left font-medium">Due Date</th>
                      <th className="py-3 px-4 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">Office Chairs</td>
                      <td className="py-3 px-4">PO-2023-001</td>
                      <td className="py-3 px-4">10</td>
                      <td className="py-3 px-4">Nov 1, 2023</td>
                      <td className="py-3 px-4">Nov 10, 2023</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-white text-blue-800 border border-blue-200">In Progress</Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Bookshelves</td>
                      <td className="py-3 px-4">PO-2023-002</td>
                      <td className="py-3 px-4">8</td>
                      <td className="py-3 px-4">Nov 5, 2023</td>
                      <td className="py-3 px-4">Nov 15, 2023</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-white text-blue-800 border border-blue-200">In Progress</Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Filing Cabinets</td>
                      <td className="py-3 px-4">PO-2023-003</td>
                      <td className="py-3 px-4">3</td>
                      <td className="py-3 px-4">Nov 10, 2023</td>
                      <td className="py-3 px-4">Nov 20, 2023</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-yellow-100 text-yellow-800">Materials Prep</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Conference Tables</td>
                      <td className="py-3 px-4">PO-2023-004</td>
                      <td className="py-3 px-4">2</td>
                      <td className="py-3 px-4">Nov 15, 2023</td>
                      <td className="py-3 px-4">Nov 25, 2023</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-yellow-100 text-yellow-800">Materials Prep</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVENTORY TAB */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Inventory Distribution</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">By category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={inventoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {inventoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Critical Inventory Items</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">
                  Items that are low in stock or need reordering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Wooden Panels - Oak</h3>
                        <p className="text-sm text-muted-foreground">SKU: WD-FRAME-01</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                    </div>
                    <Progress value={15} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Current: 15 units</span>
                      <span className="text-muted-foreground">Minimum: 50 units</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Upholstery Fabric - Black</h3>
                        <p className="text-sm text-muted-foreground">SKU: UPH-FAB-02</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                    </div>
                    <Progress value={20} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Current: 25 yards</span>
                      <span className="text-muted-foreground">Minimum: 100 yards</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Metal Legs - Chrome</h3>
                        <p className="text-sm text-muted-foreground">SKU: MT-LEG-01</p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">Reorder Soon</Badge>
                    </div>
                    <Progress value={35} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Current: 45 sets</span>
                      <span className="text-muted-foreground">Minimum: 30 sets</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/inventory/levels">
                    View All Inventory <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Recent Inventory Movements</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-200">Latest stock changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Item</th>
                      <th className="py-3 px-4 text-left font-medium">SKU</th>
                      <th className="py-3 px-4 text-left font-medium">Type</th>
                      <th className="py-3 px-4 text-left font-medium">Quantity</th>
                      <th className="py-3 px-4 text-left font-medium">Date</th>
                      <th className="py-3 px-4 text-left font-medium">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">Wooden Panels - Oak</td>
                      <td className="py-3 px-4">WD-FRAME-01</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-red-100 text-red-800">Outbound</Badge>
                      </td>
                      <td className="py-3 px-4">-15 units</td>
                      <td className="py-3 px-4">Nov 5, 2023</td>
                      <td className="py-3 px-4">John Smith</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Metal Legs - Chrome</td>
                      <td className="py-3 px-4">MT-LEG-01</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Inbound</Badge>
                      </td>
                      <td className="py-3 px-4">+50 sets</td>
                      <td className="py-3 px-4">Nov 3, 2023</td>
                      <td className="py-3 px-4">Sarah Davis</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Upholstery Fabric - Black</td>
                      <td className="py-3 px-4">UPH-FAB-02</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-red-100 text-red-800">Outbound</Badge>
                      </td>
                      <td className="py-3 px-4">-30 yards</td>
                      <td className="py-3 px-4">Nov 2, 2023</td>
                      <td className="py-3 px-4">Michael Brown</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Adjustment Mechanisms</td>
                      <td className="py-3 px-4">ADJ-MECH-01</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Inbound</Badge>
                      </td>
                      <td className="py-3 px-4">+25 units</td>
                      <td className="py-3 px-4">Nov 1, 2023</td>
                      <td className="py-3 px-4">Emily Johnson</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WORKFORCE TAB */}
        <TabsContent value="workforce" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Worker Efficiency</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">
                  Daily efficiency trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={workerEfficiencyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[70, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Efficiency (%)"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Worker Performance</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">
                  Top performers this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-2">
                        EJ
                      </div>
                      <div>
                        <p className="text-sm font-medium">Emma Johnson</p>
                        <p className="text-xs text-muted-foreground">Assembly</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">98%</p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                  </div>
                  <Progress value={98} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-2">
                        MC
                      </div>
                      <div>
                        <p className="text-sm font-medium">Michael Chen</p>
                        <p className="text-xs text-muted-foreground">Quality Control</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">96%</p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                  </div>
                  <Progress value={96} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-2">
                        SW
                      </div>
                      <div>
                        <p className="text-sm font-medium">Sarah Williams</p>
                        <p className="text-xs text-muted-foreground">Packaging</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">95%</p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                  </div>
                  <Progress value={95} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-2">
                        DR
                      </div>
                      <div>
                        <p className="text-sm font-medium">David Rodriguez</p>
                        <p className="text-xs text-muted-foreground">Assembly</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">94%</p>
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                    </div>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/worker/performance">
                    View All Workers <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Worker Utilization</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-200">
                Current workload and availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Worker</th>
                      <th className="py-3 px-4 text-left font-medium">Department</th>
                      <th className="py-3 px-4 text-left font-medium">Current Task</th>
                      <th className="py-3 px-4 text-left font-medium">Workload</th>
                      <th className="py-3 px-4 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">John Smith</td>
                      <td className="py-3 px-4">Assembly</td>
                      <td className="py-3 px-4">Office Chair Assembly</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Progress value={65} className="h-2 w-24" />
                          <span>65%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-orange-100 text-orange-800">Medium Load</Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Emily Johnson</td>
                      <td className="py-3 px-4">Quality Control</td>
                      <td className="py-3 px-4">Final Inspection</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Progress value={35} className="h-2 w-24" />
                          <span>35%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Low Load</Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Michael Brown</td>
                      <td className="py-3 px-4">Assembly</td>
                      <td className="py-3 px-4">Desk Frame Construction</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Progress value={85} className="h-2 w-24" />
                          <span>85%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-red-100 text-red-800">High Load</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Sarah Davis</td>
                      <td className="py-3 px-4">Packaging</td>
                      <td className="py-3 px-4">Product Packaging</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Progress value={30} className="h-2 w-24" />
                          <span>30%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">Low Load</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Task Completion</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">
                  Weekly task completion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={taskCompletionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" fill="#f59e0b" name="Tasks Completed" />
                      <Bar dataKey="total" fill="#6366f1" name="Total Tasks" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Upcoming Deadlines</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-200">Tasks due soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Office Chairs (10)</p>
                      <p className="text-xs text-muted-foreground">PO-2023-001</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Due in 2 days</Badge>
                  </div>
                  <Progress value={75} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Bookshelves (8)</p>
                      <p className="text-xs text-muted-foreground">PO-2023-002</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">Due in 5 days</Badge>
                  </div>
                  <Progress value={45} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Filing Cabinets (3)</p>
                      <p className="text-xs text-muted-foreground">PO-2023-003</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Due in 10 days</Badge>
                  </div>
                  <Progress value={25} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Conference Tables (2)</p>
                      <p className="text-xs text-muted-foreground">PO-2023-004</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Due in 14 days</Badge>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/task-manager/orders">
                    View All Orders <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card className="group relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-medium transition-all duration-300 h-full">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-50 text-lg">Recent Task Activities</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-200">Latest updates on tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    EJ
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Emma Johnson</span> completed the assembly of 5 office chairs
                    </p>
                    <p className="text-xs text-muted-foreground">Today, 09:15 AM</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    MC
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Michael Chen</span> approved quality check for bookshelf order
                    </p>
                    <p className="text-xs text-muted-foreground">Today, 08:45 AM</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    SD
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Sarah Davis</span> started packaging for order PO-2023-001
                    </p>
                    <p className="text-xs text-muted-foreground">Yesterday, 04:30 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    JS
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">John Smith</span> requested additional materials for desk assembly
                    </p>
                    <p className="text-xs text-muted-foreground">Yesterday, 02:15 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                View All Activities <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
