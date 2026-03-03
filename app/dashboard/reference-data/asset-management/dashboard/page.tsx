"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Download, Settings, Package, Wrench, Trash2, LayoutDashboard } from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { PageHeader } from "@/components/dashboard/page-header"

// Sample data for asset categories
const assetCategoriesData = [
  { name: "Storing Assets", value: 45, color: "#3b82f6" }, // blue
  { name: "Lifting Assets", value: 30, color: "#10b981" }, // emerald
  { name: "Transportation Assets", value: 20, color: "#8b5cf6" }, // purple
  { name: "Manufacturing Assets", value: 15, color: "#f59e0b" }, // amber
  { name: "IT Assets", value: 10, color: "#6366f1" }, // indigo
  { name: "Office Assets", value: 8, color: "#14b8a6" }, // teal
]

// Sample data for asset acquisition trend
const assetAcquisitionData = [
  { month: "Jan", assets: 5 },
  { month: "Feb", assets: 8 },
  { month: "Mar", assets: 12 },
  { month: "Apr", assets: 7 },
  { month: "May", assets: 10 },
  { month: "Jun", assets: 15 },
  { month: "Jul", assets: 9 },
  { month: "Aug", assets: 11 },
  { month: "Sep", assets: 14 },
  { month: "Oct", assets: 18 },
  { month: "Nov", assets: 12 },
  { month: "Dec", assets: 9 },
]

// Sample data for asset value by department
const assetValueByDepartmentData = [
  { department: "Logistics", value: 120000 },
  { department: "Production", value: 180000 },
  { department: "Quality", value: 60000 },
  { department: "Maintenance", value: 90000 },
  { department: "Administration", value: 45000 },
]

// Sample data for status distribution
const statusDistributionData = [
  { name: "Active", value: 112, color: "#10b981" }, // emerald
  { name: "Under Maintenance", value: 12, color: "#f59e0b" }, // amber
  { name: "Decommissioned", value: 4, color: "#f43f5f" }, // rose
]

// Sample data for status changes over time
const statusChangesData = [
  { month: "Jan", active: 100, maintenance: 10, decommissioned: 2 },
  { month: "Feb", active: 102, maintenance: 8, decommissioned: 2 },
  { month: "Mar", active: 105, maintenance: 9, decommissioned: 2 },
  { month: "Apr", active: 108, maintenance: 7, decommissioned: 3 },
  { month: "May", active: 110, maintenance: 8, decommissioned: 3 },
  { month: "Jun", active: 112, maintenance: 12, decommissioned: 4 },
]

// Sample data for status by category
const statusByCategoryData = [
  { category: "Storing", active: 40, maintenance: 3, decommissioned: 2 },
  { category: "Lifting", active: 25, maintenance: 4, decommissioned: 1 },
  { category: "Transport", active: 18, maintenance: 2, decommissioned: 0 },
  { category: "Manufacturing", active: 12, maintenance: 2, decommissioned: 1 },
  { category: "IT", active: 10, maintenance: 0, decommissioned: 0 },
  { category: "Office", active: 7, maintenance: 1, decommissioned: 0 },
]

// Sample data for maintenance frequency
const maintenanceFrequencyData = [
  { month: "Jan", count: 8 },
  { month: "Feb", count: 12 },
  { month: "Mar", count: 10 },
  { month: "Apr", count: 15 },
  { month: "May", count: 9 },
  { month: "Jun", count: 14 },
  { month: "Jul", count: 11 },
  { month: "Aug", count: 13 },
  { month: "Sep", count: 10 },
  { month: "Oct", count: 12 },
  { month: "Nov", count: 8 },
  { month: "Dec", count: 10 },
]

// Sample data for maintenance types
const maintenanceTypesData = [
  { name: "Preventive", value: 65, color: "#10b981" }, // emerald
  { name: "Corrective", value: 25, color: "#f59e0b" }, // amber
  { name: "Repair", value: 10, color: "#f43f5f" }, // rose
]

// Sample data for location distribution
const locationDistributionData = [
  { name: "Warehouse 1", value: 50, color: "#3b82f6" }, // blue
  { name: "Warehouse 2", value: 35, color: "#10b981" }, // emerald
  { name: "Production Floor", value: 25, color: "#8b5cf6" }, // purple
  { name: "Office Building", value: 15, color: "#f59e0b" }, // amber
  { name: "Dump Yard", value: 3, color: "#6366f1" }, // indigo
]

// Sample data for assets by unit
const assetsByUnitData = [
  { unit: "Unit 1", count: 45 },
  { unit: "Unit 2", count: 35 },
  { unit: "Unit 3", count: 28 },
  { unit: "Unit 4", count: 15 },
  { unit: "Unit 5", count: 5 },
]

// Sample data for location changes
const locationChangesData = [
  { month: "Jan", changes: 5 },
  { month: "Feb", changes: 8 },
  { month: "Mar", changes: 6 },
  { month: "Apr", changes: 10 },
  { month: "May", changes: 7 },
  { month: "Jun", changes: 9 },
  { month: "Jul", changes: 12 },
  { month: "Aug", changes: 8 },
  { month: "Sep", changes: 11 },
  { month: "Oct", changes: 7 },
  { month: "Nov", changes: 9 },
  { month: "Dec", changes: 6 },
]

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground p-2 border border-border rounded shadow-lg backdrop-blur-sm">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color || entry.fill }}>
            {entry.name || entry.dataKey}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Custom pie chart label
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function AssetDashboardPage() {
  const [dateRange, setDateRange] = useState("last30days")
  const [categoryFilter, setCategoryFilter] = useState("all")

  return (
    <div className="space-y-6 pl-4">
      <PageHeader
        title="Asset Dashboard"
        description="Comprehensive analytics and reports about your assets"
        icon={LayoutDashboard}
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4 pl-2">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date-range">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger id="date-range" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
                <SelectItem value="lastYear">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category-filter">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="category-filter" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="storing">Storing Assets</SelectItem>
                <SelectItem value="lifting">Lifting Assets</SelectItem>
                <SelectItem value="transportation">Transportation Assets</SelectItem>
                <SelectItem value="manufacturing">Manufacturing Assets</SelectItem>
                <SelectItem value="it">IT Assets</SelectItem>
                <SelectItem value="office">Office Assets</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="flex items-center gap-2 mt-auto">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pl-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
            <Progress value={85} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">112</div>
            <p className="text-xs text-muted-foreground">87.5% of total assets</p>
            <Progress value={87.5} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">9.4% of total assets</p>
            <Progress value={9.4} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decommissioned</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">3.1% of total assets</p>
            <Progress value={3.1} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full pl-2">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
          <TabsTrigger value="location">Location Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Asset Categories</CardTitle>
                <CardDescription>Distribution of assets by category</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetCategoriesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetCategoriesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Acquisition Trend</CardTitle>
                <CardDescription>Number of assets acquired over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={assetAcquisitionData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="assets"
                        name="Assets Acquired"
                        stroke="#3b82f6"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Asset Value by Department</CardTitle>
              <CardDescription>Total value of assets by department</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={assetValueByDepartmentData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Value"]} />
                    <Legend />
                    <Bar dataKey="value" name="Value ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Distribution of assets by status</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Changes</CardTitle>
                <CardDescription>Status changes over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={statusChangesData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="active" name="Active" stroke="#10b981" strokeWidth={2} />
                      <Line
                        type="monotone"
                        dataKey="maintenance"
                        name="Under Maintenance"
                        stroke="#f59e0b"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="decommissioned"
                        name="Decommissioned"
                        stroke="#f43f5f"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status by Category</CardTitle>
              <CardDescription>Status distribution by asset category</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statusByCategoryData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="active" name="Active" stackId="a" fill="#10b981" radius={[4, 0, 0, 0]} />
                    <Bar
                      dataKey="maintenance"
                      name="Under Maintenance"
                      stackId="a"
                      fill="#f59e0b"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="decommissioned"
                      name="Decommissioned"
                      stackId="a"
                      fill="#f43f5f"
                      radius={[0, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Frequency</CardTitle>
                <CardDescription>Number of maintenance activities over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={maintenanceFrequencyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Maintenance Count"
                        stroke="#8b5cf6"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Types</CardTitle>
                <CardDescription>Distribution of maintenance by type</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={maintenanceTypesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {maintenanceTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Maintenance</CardTitle>
              <CardDescription>Assets scheduled for maintenance in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Forklift Machine-001</p>
                    <p className="text-sm text-muted-foreground">Scheduled for: 2024-01-15</p>
                  </div>
                  <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">In 5 days</Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Conveyor Belt-002</p>
                    <p className="text-sm text-muted-foreground">Scheduled for: 2024-01-20</p>
                  </div>
                  <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">In 10 days</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Packaging Machine-001</p>
                    <p className="text-sm text-muted-foreground">Scheduled for: 2024-02-01</p>
                  </div>
                  <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">In 22 days</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-6 pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Location Distribution</CardTitle>
                <CardDescription>Distribution of assets by location</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={locationDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {locationDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assets by Unit</CardTitle>
                <CardDescription>Distribution of assets by unit</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={assetsByUnitData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="unit" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="count" name="Asset Count" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Location Changes</CardTitle>
              <CardDescription>Asset location changes over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={locationChangesData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="changes"
                      name="Location Changes"
                      stroke="#14b8a6"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recent Asset Activities</CardTitle>
          <CardDescription>Latest activities related to assets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Asset Maintenance Completed</p>
                <p className="text-sm text-muted-foreground">Forklift Machine-001 maintenance completed</p>
              </div>
              <Badge className="bg-green-100 text-green-800">2 hours ago</Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">New Asset Added</p>
                <p className="text-sm text-muted-foreground">Pallet-005 added to inventory</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">6 hours ago</Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Asset Status Changed</p>
                <p className="text-sm text-muted-foreground">Forklift Machine-003 marked as decommissioned</p>
              </div>
              <Badge className="bg-amber-100 text-amber-800">Yesterday</Badge>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Asset Location Updated</p>
                <p className="text-sm text-muted-foreground">Pallet-002 moved to Warehouse 2</p>
              </div>
              <Badge className="bg-purple-100 text-purple-800">2 days ago</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Maintenance Scheduled</p>
                <p className="text-sm text-muted-foreground">Conveyor Belt-002 scheduled for maintenance</p>
              </div>
              <Badge className="bg-indigo-100 text-indigo-800">3 days ago</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
