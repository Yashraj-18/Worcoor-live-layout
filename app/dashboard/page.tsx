"use client"

import { useEffect, useState } from "react"
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


// Sample data for charts
// const inventoryData = [
//   { name: "Furniture", value: 45 },
//   { name: "Storage", value: 30 },
//   { name: "Accessories", value: 25 },
// ]

// Unused data for commented-out tabs
/*
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
*/

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#6366f1", "#14b8a6", "#f97316", "#f43f5f"]

import { usersData } from "@/lib/users-data"
import { skusData } from "@/lib/skus-data"

export default function DashboardPage() {

  const { isAuthenticated, isAuthLoading } = useAuth()
  const router = useRouter()

  const [timeRange, setTimeRange] = useState("month")

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
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-full">
          <CardContent className="p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-cyan-100">Storage Capacity</p>
                <p className="text-3xl font-bold text-white">78%</p>
                <p className="text-xs text-cyan-200 font-medium">22% available space</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  Manufacturing quality indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">Defect Rate</p>
                      <p className="text-sm font-medium">2.5%</p>
                    </div>
                    <Progress value={2.5} className="h-2" />
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
                    <Progress value={0.5} className="h-2" />
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

        {/* TASKS TAB - COMMENTED OUT */}
        {/*
        <TabsContent value="tasks" className="space-y-4">
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
        */}

        </Tabs>
    </div>
  )
}
