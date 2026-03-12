"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Download, RefreshCw, LineChartIcon } from "lucide-react"
import { format, subMonths } from "date-fns"
import {
  LineChart,
  BarChart,
  AreaChart,
  ComposedChart,
  PieChart,
  ScatterChart,
  Line,
  Bar,
  Area,
  Cell,
  Pie,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
} from "recharts"
import { PageHeader } from "@/components/dashboard/page-header"

// Sample data for Production Trends
const productionData = [
  { month: "Jan", value: 4000, target: 4200, previousYear: 3800 },
  { month: "Feb", value: 4500, target: 4300, previousYear: 4000 },
  { month: "Mar", value: 5000, target: 4400, previousYear: 4200 },
  { month: "Apr", value: 4800, target: 4500, previousYear: 4300 },
  { month: "May", value: 5200, target: 4600, previousYear: 4400 },
  { month: "Jun", value: 5500, target: 4700, previousYear: 4500 },
  { month: "Jul", value: 6000, target: 4800, previousYear: 4600 },
  { month: "Aug", value: 6200, target: 4900, previousYear: 4700 },
  { month: "Sep", value: 6500, target: 5000, previousYear: 4800 },
  { month: "Oct", value: 6800, target: 5100, previousYear: 4900 },
  { month: "Nov", value: 7000, target: 5200, previousYear: 5000 },
  { month: "Dec", value: 7200, target: 5300, previousYear: 5100 },
]

// Sample data for Worker Efficiency
const workerData = [
  { name: "John Smith", efficiency: 92, tasks: 45, onTime: 95 },
  { name: "Maria Garcia", efficiency: 88, tasks: 38, onTime: 92 },
  { name: "David Lee", efficiency: 85, tasks: 42, onTime: 88 },
  { name: "Sarah Johnson", efficiency: 91, tasks: 40, onTime: 94 },
  { name: "Michael Brown", efficiency: 78, tasks: 35, onTime: 82 },
  { name: "Emily Davis", efficiency: 82, tasks: 37, onTime: 85 },
  { name: "Robert Wilson", efficiency: 89, tasks: 41, onTime: 90 },
  { name: "Jennifer Taylor", efficiency: 94, tasks: 44, onTime: 96 },
  { name: "James Anderson", efficiency: 76, tasks: 33, onTime: 80 },
  { name: "Lisa Martinez", efficiency: 87, tasks: 39, onTime: 89 },
  { name: "Thomas White", efficiency: 83, tasks: 36, onTime: 86 },
  { name: "Patricia Harris", efficiency: 90, tasks: 43, onTime: 93 },
]

// Sample data for Inventory Levels
const inventoryData = [
  { date: "Jan", stock: 2500, reorderPoint: 1800, incoming: 500 },
  { date: "Feb", stock: 2700, reorderPoint: 1800, incoming: 300 },
  { date: "Mar", stock: 2900, reorderPoint: 1800, incoming: 400 },
  { date: "Apr", stock: 2600, reorderPoint: 1800, incoming: 600 },
  { date: "May", stock: 2400, reorderPoint: 1800, incoming: 700 },
  { date: "Jun", stock: 2200, reorderPoint: 1800, incoming: 800 },
  { date: "Jul", stock: 2100, reorderPoint: 1800, incoming: 600 },
  { date: "Aug", stock: 2300, reorderPoint: 1800, incoming: 500 },
  { date: "Sep", stock: 2500, reorderPoint: 1800, incoming: 400 },
  { date: "Oct", stock: 2700, reorderPoint: 1800, incoming: 300 },
  { date: "Nov", stock: 2900, reorderPoint: 1800, incoming: 200 },
  { date: "Dec", stock: 3100, reorderPoint: 1800, incoming: 100 },
]

// Sample data for Financial Performance
const financialData = [
  {
    month: "Jan",
    revenue: 120000,
    costs: 80000,
    profit: 40,
    laborCost: 45000,
    materialCost: 25000,
    overheadCost: 10000,
  },
  {
    month: "Feb",
    revenue: 125000,
    costs: 82000,
    profit: 43,
    laborCost: 46000,
    materialCost: 26000,
    overheadCost: 10000,
  },
  {
    month: "Mar",
    revenue: 130000,
    costs: 85000,
    profit: 45,
    laborCost: 47000,
    materialCost: 27000,
    overheadCost: 11000,
  },
  {
    month: "Apr",
    revenue: 135000,
    costs: 87000,
    profit: 48,
    laborCost: 48000,
    materialCost: 28000,
    overheadCost: 11000,
  },
  {
    month: "May",
    revenue: 140000,
    costs: 90000,
    profit: 50,
    laborCost: 49000,
    materialCost: 29000,
    overheadCost: 12000,
  },
  {
    month: "Jun",
    revenue: 145000,
    costs: 92000,
    profit: 53,
    laborCost: 50000,
    materialCost: 30000,
    overheadCost: 12000,
  },
  {
    month: "Jul",
    revenue: 150000,
    costs: 95000,
    profit: 55,
    laborCost: 51000,
    materialCost: 31000,
    overheadCost: 13000,
  },
  {
    month: "Aug",
    revenue: 155000,
    costs: 97000,
    profit: 58,
    laborCost: 52000,
    materialCost: 32000,
    overheadCost: 13000,
  },
  {
    month: "Sep",
    revenue: 160000,
    costs: 100000,
    profit: 60,
    laborCost: 53000,
    materialCost: 33000,
    overheadCost: 14000,
  },
  {
    month: "Oct",
    revenue: 165000,
    costs: 102000,
    profit: 63,
    laborCost: 54000,
    materialCost: 34000,
    overheadCost: 14000,
  },
  {
    month: "Nov",
    revenue: 170000,
    costs: 105000,
    profit: 65,
    laborCost: 55000,
    materialCost: 35000,
    overheadCost: 15000,
  },
  {
    month: "Dec",
    revenue: 175000,
    costs: 107000,
    profit: 68,
    laborCost: 56000,
    materialCost: 36000,
    overheadCost: 15000,
  },
]

// Sample data for Quality Control
const qualityData = [
  { month: "Jan", defectRate: 2.1, reworkRate: 1.5, customerReturns: 0.8 },
  { month: "Feb", defectRate: 2.0, reworkRate: 1.4, customerReturns: 0.7 },
  { month: "Mar", defectRate: 1.9, reworkRate: 1.3, customerReturns: 0.7 },
  { month: "Apr", defectRate: 1.8, reworkRate: 1.2, customerReturns: 0.6 },
  { month: "May", defectRate: 1.7, reworkRate: 1.1, customerReturns: 0.6 },
  { month: "Jun", defectRate: 1.6, reworkRate: 1.0, customerReturns: 0.5 },
  { month: "Jul", defectRate: 1.5, reworkRate: 0.9, customerReturns: 0.5 },
  { month: "Aug", defectRate: 1.4, reworkRate: 0.8, customerReturns: 0.4 },
  { month: "Sep", defectRate: 1.3, reworkRate: 0.7, customerReturns: 0.4 },
  { month: "Oct", defectRate: 1.2, reworkRate: 0.6, customerReturns: 0.3 },
  { month: "Nov", defectRate: 1.1, reworkRate: 0.5, customerReturns: 0.3 },
  { month: "Dec", defectRate: 1.0, reworkRate: 0.4, customerReturns: 0.2 },
]

// Sample data for Operational Efficiency
const operationalData = [
  { month: "Jan", machineUtilization: 75, downtime: 5.2, setupTime: 8.3 },
  { month: "Feb", machineUtilization: 76, downtime: 5.0, setupTime: 8.1 },
  { month: "Mar", machineUtilization: 77, downtime: 4.8, setupTime: 7.9 },
  { month: "Apr", machineUtilization: 78, downtime: 4.6, setupTime: 7.7 },
  { month: "May", machineUtilization: 79, downtime: 4.4, setupTime: 7.5 },
  { month: "Jun", machineUtilization: 80, downtime: 4.2, setupTime: 7.3 },
  { month: "Jul", machineUtilization: 81, downtime: 4.0, setupTime: 7.1 },
  { month: "Aug", machineUtilization: 82, downtime: 3.8, setupTime: 6.9 },
  { month: "Sep", machineUtilization: 83, downtime: 3.6, setupTime: 6.7 },
  { month: "Oct", machineUtilization: 84, downtime: 3.4, setupTime: 6.5 },
  { month: "Nov", machineUtilization: 85, downtime: 3.2, setupTime: 6.3 },
  { month: "Dec", machineUtilization: 86, downtime: 3.0, setupTime: 6.1 },
]

// Sample data for Product Performance
const productPerformanceData = [
  { name: "Office Desk", sales: 1200, profit: 25000, growth: 15 },
  { name: "Executive Chair", sales: 950, profit: 19000, growth: 12 },
  { name: "Filing Cabinet", sales: 850, profit: 17000, growth: 8 },
  { name: "Bookshelf", sales: 750, profit: 15000, growth: 10 },
  { name: "Conference Table", sales: 350, profit: 14000, growth: 5 },
  { name: "Desk Lamp", sales: 1500, profit: 12000, growth: 20 },
  { name: "Monitor Stand", sales: 1100, profit: 11000, growth: 18 },
  { name: "Keyboard Tray", sales: 1300, profit: 10000, growth: 22 },
]

// Sample data for Workforce Distribution
const workforceDistributionData = [
  { name: "Production", value: 45 },
  { name: "Quality Control", value: 15 },
  { name: "Maintenance", value: 10 },
  { name: "Logistics", value: 12 },
  { name: "Administration", value: 18 },
]

// Sample data for Skill Distribution
const skillDistributionData = [
  { skill: "Assembly", workers: 25, demand: 30 },
  { skill: "Machining", workers: 20, demand: 18 },
  { skill: "Welding", workers: 15, demand: 12 },
  { skill: "Finishing", workers: 18, demand: 20 },
  { skill: "Quality Inspection", workers: 12, demand: 15 },
  { skill: "Packaging", workers: 10, demand: 8 },
]

// Sample data for Lead Time Analysis
const leadTimeData = [
  { product: "Office Desk", procurement: 5, production: 8, quality: 2, shipping: 3 },
  { product: "Executive Chair", procurement: 4, production: 6, quality: 2, shipping: 2 },
  { product: "Filing Cabinet", procurement: 6, production: 7, quality: 2, shipping: 3 },
  { product: "Bookshelf", procurement: 5, production: 5, quality: 1, shipping: 2 },
  { product: "Conference Table", procurement: 8, production: 10, quality: 3, shipping: 4 },
]

// Sample data for Wastage Analysis
const wastageData = [
  { category: "Raw Materials", value: 35, cost: 12500 },
  { category: "Work in Progress", value: 25, cost: 9000 },
  { category: "Finished Goods", value: 15, cost: 7500 },
  { category: "Packaging", value: 10, cost: 3500 },
  { category: "Other", value: 15, cost: 5000 },
]

// Sample data for Supplier Performance
const supplierData = [
  { name: "Supplier A", onTimeDelivery: 95, qualityRating: 92, costIndex: 88 },
  { name: "Supplier B", onTimeDelivery: 88, qualityRating: 90, costIndex: 92 },
  { name: "Supplier C", onTimeDelivery: 92, qualityRating: 85, costIndex: 90 },
  { name: "Supplier D", onTimeDelivery: 85, qualityRating: 88, costIndex: 95 },
  { name: "Supplier E", onTimeDelivery: 90, qualityRating: 94, costIndex: 85 },
]

// Colors
const COLORS = {
  primary: "#1a365d",
  secondary: "#ffc107",
  tertiary: "#64748b",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("year")
  const [department, setDepartment] = useState("all")
  const [productCategory, setProductCategory] = useState("all")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })

  return (
    <div className="analytics flex flex-col gap-3">
      <PageHeader
        title="Manufacturing Analytics Dashboard"
        description="Comprehensive analytics and insights for manufacturing operations"
        icon={LineChartIcon}
      />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div></div>
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center rounded-xl gap-2 font-light">
                <CalendarIcon className="h-4 w-4" />
                {timeRange === "custom" ? (
                  <span>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </span>
                ) : (
                  <span>
                    {timeRange === "year" ? "Last 12 Months" : timeRange === "quarter" ? "Last Quarter" : "Last Month"}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b">
                <div className="flex items-center gap-2">
                  <Button
                    variant={timeRange === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange("month")}
                  >
                    Month
                  </Button>
                  <Button
                    variant={timeRange === "quarter" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange("quarter")}
                  >
                    Quarter
                  </Button>
                  <Button
                    variant={timeRange === "year" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange("year")}
                  >
                    Year
                  </Button>
                  <Button
                    variant={timeRange === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange("custom")}
                  >
                    Custom
                  </Button>
                </div>
              </div>
              {timeRange === "custom" && (
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange(range as { from: Date; to: Date })
                    }
                  }}
                  numberOfMonths={2}
                />
              )}
            </PopoverContent>
          </Popover>

          <div className="relative">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger  className="w-[160px] bg-background border text-left border-input focus:outline-none focus:ring-0 focus:border-input focus:ring-transparent">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="quality">Quality Control</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="logistics">Logistics</SelectItem>
            </SelectContent>
          </Select>
             <label
              htmlFor="status"
              className={`absolute left-2.5 z-10 bg-background px-1 text-sm text-muted-foreground transition-all duration-200 
                ${department ? '-top-2 text-xs scale-90' : 'top-4 text-sm'}
              `}
            >
              Department
          </label>
        </div>

          <div className="relative">
            <Select value={productCategory} onValueChange={setProductCategory}>
              <SelectTrigger  className="w-[160px] bg-background border text-left border-input focus:outline-none focus:ring-0 focus:border-input focus:ring-transparent">
                <SelectValue placeholder="Product Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="furniture">Furniture</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
            <label
                htmlFor="Product Category"
                className={`absolute left-2.5 z-10 bg-background px-1 text-sm text-muted-foreground transition-all duration-200 
                  ${productCategory ? '-top-2 text-xs scale-90' : 'top-4 text-sm'}
                `}
              >
                Product Category
            </label>
        </div>

          <Button className="rounded-xl" variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button className="rounded-xl" variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="flex flex-col justify-between bg-gradient-to-br from-indigo-100  to-rose-50/10  dark:from-slate-500 dark:to-indigo-200/10 ">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7,200 units</div>
            <div className="flex items-center">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                +5.8% from last period
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-between bg-gradient-to-br from-indigo-100  to-rose-50/10  dark:from-slate-500 dark:to-indigo-200/10 ">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worker Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.2%</div>
            <div className="flex items-center">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                +2.1% from last period
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-between bg-gradient-to-br from-indigo-100  to-rose-50/10  dark:from-slate-500 dark:to-indigo-200/10 ">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.5%</div>
            <div className="flex items-center">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                +1.5% from last period
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-between bg-gradient-to-br from-indigo-100  to-rose-50/10  dark:from-slate-500 dark:to-indigo-200/10 ">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32.4%</div>
            <div className="flex items-center">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                -0.8% from last period
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full flex justify-start h-14 bg-gray-200 p-0 dark:bg-gray-900 overflow-y-auto rounded-xl dark:[&::-webkit-scrollbar-thumb]:bg-slate-500  scrollbar-thumb-hover dark-scrollbar-thumb-hover dark:[&::-webkit-scrollbar]y:w-[4px] [&::-webkit-scrollbar]:h-[2px] mb-4">
          <TabsTrigger className="w-full h-fill-available transition-transform m-[5px] duration-800 px-8 data-[state=active]:bg-darkblue-foreground rounded-lg  data-[state=active]:text-gray-50 dark:data-[state=active]:bg-gray-600 hover:bg-gray/300" value="overview">Overview</TabsTrigger>
          <TabsTrigger className="w-full h-fill-available transition-transform m-[5px] duration-800 px-8 data-[state=active]:bg-darkblue-foreground rounded-lg  data-[state=active]:text-gray-50 dark:data-[state=active]:bg-gray-600 hover:bg-gray/300" value="productivity">Worker Productivity</TabsTrigger>
          <TabsTrigger className="w-full h-fill-available transition-transform m-[5px] duration-800 px-8 data-[state=active]:bg-darkblue-foreground rounded-lg  data-[state=active]:text-gray-50 dark:data-[state=active]:bg-gray-600 hover:bg-gray/300" value="inventory">Inventory</TabsTrigger>
          <TabsTrigger className="w-full h-fill-available transition-transform m-[5px] duration-800 px-8 data-[state=active]:bg-darkblue-foreground rounded-lg  data-[state=active]:text-gray-50 dark:data-[state=active]:bg-gray-600 hover:bg-gray/300" value="financial">Financial</TabsTrigger>
          <TabsTrigger className="w-full h-fill-available transition-transform m-[5px] duration-800 px-8 data-[state=active]:bg-darkblue-foreground rounded-lg  data-[state=active]:text-gray-50 dark:data-[state=active]:bg-gray-600 hover:bg-gray/300" value="quality">Quality Control</TabsTrigger>
          <TabsTrigger className="w-full h-fill-available transition-transform m-[5px] duration-800 px-8 data-[state=active]:bg-darkblue-foreground rounded-lg  data-[state=active]:text-gray-50 dark:data-[state=active]:bg-gray-600 hover:bg-gray/300" value="operational">Operational Efficiency</TabsTrigger>
          <TabsTrigger className="w-full h-fill-available transition-transform m-[5px] duration-800 px-8 data-[state=active]:bg-darkblue-foreground rounded-lg  data-[state=active]:text-gray-50 dark:data-[state=active]:bg-gray-600 hover:bg-gray/300" value="products">Product Performance</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Production Trends</CardTitle>
                <CardDescription>Monthly production output vs target and previous year</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart className="text-xs" data={productionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      activeDot={{ r: 8, fill: COLORS.secondary }}
                      name="Current Year"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke={COLORS.success}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                    />
                    <Line
                      type="monotone"
                      dataKey="previousYear"
                      stroke={COLORS.tertiary}
                      strokeWidth={2}
                      name="Previous Year"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Workforce Distribution</CardTitle>
                <CardDescription>Distribution of workforce by department</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart className="text-xs">
                    <Pie
                      data={workforceDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill={COLORS.primary}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {workforceDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? COLORS.primary
                              : index === 1
                                ? COLORS.secondary
                                : index === 2
                                  ? COLORS.tertiary
                                  : index === 3
                                    ? COLORS.success
                                    : COLORS.info
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="space-y-0.5">
                <CardTitle>Top Performing Products</CardTitle>
                <CardDescription>Products with highest sales and profit</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart className="text-xs" data={productPerformanceData.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="sales" fill={COLORS.primary} name="Sales (Units)" />
                    <Bar yAxisId="right" dataKey="profit" fill={COLORS.secondary} name="Profit ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="space-y-0.5">
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Current inventory levels and reorder points</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart className="text-xs" data={inventoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="stock"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                      name="Current Stock"
                    />
                    <Area
                      type="monotone"
                      dataKey="reorderPoint"
                      stroke={COLORS.warning}
                      fill={COLORS.warning}
                      fillOpacity={0.3}
                      name="Reorder Point"
                    />
                    <Area
                      type="monotone"
                      dataKey="incoming"
                      stroke={COLORS.success}
                      fill={COLORS.success}
                      fillOpacity={0.3}
                      name="Incoming Stock"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="space-y-0.5">
              <CardTitle>Quality Metrics Trend</CardTitle>
              <CardDescription>Defect rate, rework rate, and customer returns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart className="text-xs" data={qualityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="defectRate"
                    stroke={COLORS.danger}
                    strokeWidth={2}
                    name="Defect Rate (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="reworkRate"
                    stroke={COLORS.warning}
                    strokeWidth={2}
                    name="Rework Rate (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="customerReturns"
                    stroke={COLORS.tertiary}
                    strokeWidth={2}
                    name="Customer Returns (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WORKER PRODUCTIVITY TAB */}
        <TabsContent value="productivity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="space-y-0.5">
                <CardTitle>Worker Efficiency</CardTitle>
                <CardDescription>Efficiency rating by worker</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart className="text-xs" data={workerData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="efficiency" fill={COLORS.primary} name="Efficiency (%)">
                      {workerData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.efficiency > 90
                              ? COLORS.success
                              : entry.efficiency > 80
                                ? COLORS.primary
                                : entry.efficiency > 70
                                  ? COLORS.warning
                                  : COLORS.danger
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="space-y-0.5">
                <CardTitle>Worker Performance Metrics</CardTitle>
                <CardDescription>Tasks completed and on-time percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart className="text-xs" data={workerData.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="tasks" fill={COLORS.primary} name="Tasks Completed" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="onTime"
                      stroke={COLORS.success}
                      strokeWidth={2}
                      name="On-Time (%)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="space-y-0.5">
                <CardTitle>Skill Distribution vs Demand</CardTitle>
                <CardDescription>Available workers with skills vs current demand</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart className="text-xs" data={skillDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="skill" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="workers" fill={COLORS.primary} name="Available Workers" />
                    <Bar dataKey="demand" fill={COLORS.secondary} name="Current Demand" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="space-y-0.5">
                <CardTitle>Worker Efficiency Distribution</CardTitle>
                <CardDescription>Distribution of workers by efficiency rating</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart className="text-xs">
                    <Pie
                      data={[
                        { name: "Excellent (90-100%)", value: 25 },
                        { name: "Good (80-89%)", value: 40 },
                        { name: "Average (70-79%)", value: 25 },
                        { name: "Below Average (<70%)", value: 10 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill={COLORS.primary}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill={COLORS.success} />
                      <Cell fill={COLORS.primary} />
                      <Cell fill={COLORS.warning} />
                      <Cell fill={COLORS.danger} />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader  className="space-y-0.5">
              <CardTitle>Worker Productivity Trends</CardTitle>
              <CardDescription>Average worker productivity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart className="text-xs"
                  data={[
                    { month: "Jan", efficiency: 82, onTime: 88, utilization: 85 },
                    { month: "Feb", efficiency: 83, onTime: 89, utilization: 86 },
                    { month: "Mar", efficiency: 84, onTime: 90, utilization: 87 },
                    { month: "Apr", efficiency: 85, onTime: 91, utilization: 88 },
                    { month: "May", efficiency: 86, onTime: 92, utilization: 89 },
                    { month: "Jun", efficiency: 87, onTime: 93, utilization: 90 },
                    { month: "Jul", efficiency: 88, onTime: 94, utilization: 91 },
                    { month: "Aug", efficiency: 89, onTime: 95, utilization: 92 },
                    { month: "Sep", efficiency: 90, onTime: 96, utilization: 93 },
                    { month: "Oct", efficiency: 91, onTime: 97, utilization: 94 },
                    { month: "Nov", efficiency: 92, onTime: 98, utilization: 95 },
                    { month: "Dec", efficiency: 93, onTime: 99, utilization: 96 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name="Efficiency (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="onTime"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    name="On-Time Completion (%)"
                  />
                  <Line
                    type="monotone"
                    dataKey="utilization"
                    stroke={COLORS.info}
                    strokeWidth={2}
                    name="Utilization (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVENTORY TAB */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="space-y-0.5">
                <CardTitle>Inventory Levels</CardTitle>
                <CardDescription>Stock levels and movement patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart className="text-xs" data={inventoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="stock"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                      name="Current Stock"
                    />
                    <Area
                      type="monotone"
                      dataKey="reorderPoint"
                      stroke={COLORS.warning}
                      fill={COLORS.warning}
                      fillOpacity={0.3}
                      name="Reorder Point"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Wastage Analysis</CardTitle>
                <CardDescription>Breakdown of wastage by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart className="text-xs">
                    <Pie
                      data={wastageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill={COLORS.primary}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {wastageData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? COLORS.danger
                              : index === 1
                                ? COLORS.warning
                                : index === 2
                                  ? COLORS.primary
                                  : index === 3
                                    ? COLORS.tertiary
                                    : COLORS.info
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${value}%`, props.payload.category]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader  className="space-y-0.5">
              <CardTitle>Inventory Turnover by Category</CardTitle>
              <CardDescription>Turnover ratio by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart className="text-xs"
                  data={[
                    { category: "Furniture", turnover: 4.2, industry: 3.8 },
                    { category: "Storage", turnover: 5.1, industry: 4.5 },
                    { category: "Accessories", turnover: 6.3, industry: 5.8 },
                    { category: "Electronics", turnover: 7.2, industry: 6.5 },
                    { category: "Lighting", turnover: 3.9, industry: 3.5 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="turnover" fill={COLORS.primary} name="Our Turnover" />
                  <Bar dataKey="industry" fill={COLORS.secondary} name="Industry Average" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="space-y-0.5">
                <CardTitle>Inventory Aging</CardTitle>
                <CardDescription>Age distribution of inventory items</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart className="text-xs"
                    data={[
                      { age: "0-30 days", value: 65 },
                      { age: "31-60 days", value: 20 },
                      { age: "61-90 days", value: 10 },
                      { age: "91+ days", value: 5 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Bar dataKey="value" fill={COLORS.primary}>
                      <Cell fill={COLORS.primary} />
                      <Cell fill={COLORS.info} />
                      <Cell fill={COLORS.warning} />
                      <Cell fill={COLORS.danger} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Supplier Performance</CardTitle>
                <CardDescription>Key metrics for top suppliers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart className="text-xs" cx="50%" cy="50%" outerRadius="80%" data={supplierData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="On-Time Delivery"
                      dataKey="onTimeDelivery"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Quality Rating"
                      dataKey="qualityRating"
                      stroke={COLORS.success}
                      fill={COLORS.success}
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Cost Index"
                      dataKey="costIndex"
                      stroke={COLORS.info}
                      fill={COLORS.info}
                      fillOpacity={0.6}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FINANCIAL TAB */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Financial Performance</CardTitle>
                <CardDescription>Revenue, costs, and profit margins</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart className="text-xs" data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "profit" ? `${value}%` : `$${value.toLocaleString()}`,
                        name,
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill={COLORS.primary} name="Revenue" />
                    <Bar yAxisId="left" dataKey="costs" fill={COLORS.warning} name="Costs" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="profit"
                      stroke={COLORS.success}
                      strokeWidth={2}
                      name="Profit Margin (%)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Distribution of costs by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart className="text-xs">
                    <Pie
                      data={[
                        { name: "Labor", value: 45 },
                        { name: "Materials", value: 30 },
                        { name: "Overhead", value: 15 },
                        { name: "Other", value: 10 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill={COLORS.primary}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill={COLORS.primary} />
                      <Cell fill={COLORS.secondary} />
                      <Cell fill={COLORS.tertiary} />
                      <Cell fill={COLORS.info} />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader  className="space-y-0.5">
              <CardTitle>Cost Trends by Category</CardTitle>
              <CardDescription>Monthly cost breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart className="text-xs" data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Cost"]} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="laborCost"
                    stackId="1"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    name="Labor Cost"
                  />
                  <Area
                    type="monotone"
                    dataKey="materialCost"
                    stackId="1"
                    stroke={COLORS.secondary}
                    fill={COLORS.secondary}
                    name="Material Cost"
                  />
                  <Area
                    type="monotone"
                    dataKey="overheadCost"
                    stackId="1"
                    stroke={COLORS.tertiary}
                    fill={COLORS.tertiary}
                    name="Overhead Cost"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Revenue by Product Category</CardTitle>
                <CardDescription>Distribution of revenue across product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart className="text-xs"
                    data={[
                      { category: "Furniture", revenue: 450000 },
                      { category: "Storage", revenue: 320000 },
                      { category: "Accessories", revenue: 280000 },
                      { category: "Electronics", revenue: 150000 },
                      { category: "Lighting", revenue: 100000 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill={COLORS.primary}>
                      {[0, 1, 2, 3, 4].map((index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? COLORS.primary : COLORS.secondary} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="space-y-0.5">
                <CardTitle>Profit Margin by Product</CardTitle>
                <CardDescription>Profit margin percentage by product</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart className="text-xs" layout="vertical" data={productPerformanceData.sort((a, b) => b.growth - a.growth)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 25]} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value) => [`${value}%`, "Profit Margin"]} />
                    <Bar dataKey="growth" fill={COLORS.success} name="Profit Margin (%)">
                      {productPerformanceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.growth > 15
                              ? COLORS.success
                              : entry.growth > 10
                                ? COLORS.primary
                                : entry.growth > 5
                                  ? COLORS.warning
                                  : COLORS.danger
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* QUALITY CONTROL TAB */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader className="space-y-0.5">
                <CardTitle>Quality Metrics Trend</CardTitle>
                <CardDescription>Defect rate, rework rate, and customer returns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart className="text-xs" data={qualityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, "Rate"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="defectRate"
                      stroke={COLORS.danger}
                      strokeWidth={2}
                      name="Defect Rate (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="reworkRate"
                      stroke={COLORS.warning}
                      strokeWidth={2}
                      name="Rework Rate (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="customerReturns"
                      stroke={COLORS.tertiary}
                      strokeWidth={2}
                      name="Customer Returns (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Quality Issues by Category</CardTitle>
                <CardDescription>Distribution of quality issues by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart className="text-xs">
                    <Pie
                      data={[
                        { name: "Manufacturing Defects", value: 45 },
                        { name: "Material Issues", value: 25 },
                        { name: "Assembly Errors", value: 20 },
                        { name: "Packaging Problems", value: 10 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill={COLORS.primary}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill={COLORS.danger} />
                      <Cell fill={COLORS.warning} />
                      <Cell fill={COLORS.tertiary} />
                      <Cell fill={COLORS.info} />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader  className="space-y-0.5">
              <CardTitle>Quality Performance by Product</CardTitle>
              <CardDescription>Defect rates by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart className="text-xs"
                  data={[
                    { product: "Office Desk", defectRate: 1.8, reworkRate: 1.2 },
                    { product: "Executive Chair", defectRate: 2.1, reworkRate: 1.5 },
                    { product: "Filing Cabinet", defectRate: 1.5, reworkRate: 0.9 },
                    { product: "Bookshelf", defectRate: 1.2, reworkRate: 0.7 },
                    { product: "Conference Table", defectRate: 2.4, reworkRate: 1.8 },
                    { product: "Desk Lamp", defectRate: 0.9, reworkRate: 0.5 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "Rate"]} />
                  <Legend />
                  <Bar dataKey="defectRate" fill={COLORS.danger} name="Defect Rate (%)" />
                  <Bar dataKey="reworkRate" fill={COLORS.warning} name="Rework Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>First Pass Yield</CardTitle>
                <CardDescription>Percentage of units manufactured correctly the first time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart className="text-xs"
                    data={[
                      { month: "Jan", yield: 92.5 },
                      { month: "Feb", yield: 93.0 },
                      { month: "Mar", yield: 93.5 },
                      { month: "Apr", yield: 94.0 },
                      { month: "May", yield: 94.5 },
                      { month: "Jun", yield: 95.0 },
                      { month: "Jul", yield: 95.5 },
                      { month: "Aug", yield: 96.0 },
                      { month: "Sep", yield: 96.5 },
                      { month: "Oct", yield: 97.0 },
                      { month: "Nov", yield: 97.5 },
                      { month: "Dec", yield: 98.0 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, "First Pass Yield"]} />
                    <Line type="monotone" dataKey="yield" stroke={COLORS.success} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Quality Control Inspection Results</CardTitle>
                <CardDescription>Pass/fail rates by inspection stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart className="text-xs"
                    data={[
                      { stage: "Raw Materials", pass: 95, fail: 5 },
                      { stage: "In-Process", pass: 92, fail: 8 },
                      { stage: "Final Product", pass: 97, fail: 3 },
                      { stage: "Packaging", pass: 99, fail: 1 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Legend />
                    <Bar dataKey="pass" stackId="a" fill={COLORS.success} name="Pass (%)" />
                    <Bar dataKey="fail" stackId="a" fill={COLORS.danger} name="Fail (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* OPERATIONAL EFFICIENCY TAB */}
        <TabsContent value="operational" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Machine Utilization</CardTitle>
                <CardDescription>Utilization percentage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart className="text-xs" data={operationalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 90]} />
                    <Tooltip formatter={(value) => [`${value}%`, "Utilization"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="machineUtilization"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      name="Machine Utilization (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Downtime Analysis</CardTitle>
                <CardDescription>Machine downtime and setup time trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart className="text-xs" data={operationalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} hours`, "Time"]} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="downtime"
                      stroke={COLORS.danger}
                      fill={COLORS.danger}
                      fillOpacity={0.3}
                      name="Downtime (hours)"
                    />
                    <Area
                      type="monotone"
                      dataKey="setupTime"
                      stroke={COLORS.warning}
                      fill={COLORS.warning}
                      fillOpacity={0.3}
                      name="Setup Time (hours)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader  className="space-y-0.5">
              <CardTitle>Lead Time Analysis</CardTitle>
              <CardDescription>Breakdown of lead time by process stage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart className="text-xs" data={leadTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} days`, "Time"]} />
                  <Legend />
                  <Bar dataKey="procurement" stackId="a" fill={COLORS.primary} name="Procurement" />
                  <Bar dataKey="production" stackId="a" fill={COLORS.secondary} name="Production" />
                  <Bar dataKey="quality" stackId="a" fill={COLORS.tertiary} name="Quality Control" />
                  <Bar dataKey="shipping" stackId="a" fill={COLORS.info} name="Shipping" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Overall Equipment Effectiveness (OEE)</CardTitle>
                <CardDescription>Availability, performance, and quality metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart className="text-xs"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={[
                      { metric: "Availability", value: 85, benchmark: 90 },
                      { metric: "Performance", value: 82, benchmark: 85 },
                      { metric: "Quality", value: 95, benchmark: 95 },
                      { metric: "Setup Time", value: 78, benchmark: 80 },
                      { metric: "Changeover", value: 75, benchmark: 85 },
                    ]}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Current"
                      dataKey="value"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Benchmark"
                      dataKey="benchmark"
                      stroke={COLORS.secondary}
                      fill={COLORS.secondary}
                      fillOpacity={0.6}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Process Cycle Efficiency</CardTitle>
                <CardDescription>Value-added time vs. total lead time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart className="text-xs"
                    layout="vertical"
                    data={[
                      { product: "Office Desk", valueAdded: 65, nonValueAdded: 35 },
                      { product: "Executive Chair", valueAdded: 70, nonValueAdded: 30 },
                      { product: "Filing Cabinet", valueAdded: 60, nonValueAdded: 40 },
                      { product: "Bookshelf", valueAdded: 75, nonValueAdded: 25 },
                      { product: "Conference Table", valueAdded: 55, nonValueAdded: 45 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="product" type="category" />
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Legend />
                    <Bar dataKey="valueAdded" stackId="a" fill={COLORS.success} name="Value-Added (%)" />
                    <Bar dataKey="nonValueAdded" stackId="a" fill={COLORS.warning} name="Non-Value-Added (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PRODUCT PERFORMANCE TAB */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Top Performing Products</CardTitle>
                <CardDescription>Products with highest sales and profit</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart className="text-xs" data={productPerformanceData.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "sales" ? `${value} units` : `$${value.toLocaleString()}`,
                        name,
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="sales" fill={COLORS.primary} name="Sales (Units)" />
                    <Bar yAxisId="right" dataKey="profit" fill={COLORS.secondary} name="Profit ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Product Growth Rate</CardTitle>
                <CardDescription>Year-over-year growth rate by product</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart className="text-xs" layout="vertical" data={productPerformanceData.sort((a, b) => b.growth - a.growth)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 25]} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value) => [`${value}%`, "Growth Rate"]} />
                    <Bar dataKey="growth" fill={COLORS.success} name="Growth Rate (%)">
                      {productPerformanceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.growth > 15
                              ? COLORS.success
                              : entry.growth > 10
                                ? COLORS.primary
                                : entry.growth > 5
                                  ? COLORS.warning
                                  : COLORS.danger
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader  className="space-y-0.5">
              <CardTitle>Product Performance Matrix</CardTitle>
              <CardDescription>Sales volume vs. profit margin</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart className="text-xs">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="sales" name="Sales Volume" domain={["auto", "auto"]} />
                  <YAxis type="number" dataKey="growth" name="Profit Margin" domain={[0, 25]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(value, name, props) => [
                      name === "Sales Volume" ? `${value} units` : `${value}%`,
                      props.payload.name,
                    ]}
                  />
                  <Legend />
                  <Scatter name="Products" data={productPerformanceData} fill={COLORS.primary}>
                    {productPerformanceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.growth > 15
                            ? COLORS.success
                            : entry.growth > 10
                              ? COLORS.primary
                              : entry.growth > 5
                                ? COLORS.warning
                                : COLORS.danger
                        }
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Product Defect Rates</CardTitle>
                <CardDescription>Defect rates by product</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart className="text-xs"
                    data={[
                      { name: "Office Desk", defectRate: 1.8 },
                      { name: "Executive Chair", defectRate: 2.1 },
                      { name: "Filing Cabinet", defectRate: 1.5 },
                      { name: "Bookshelf", defectRate: 1.2 },
                      { name: "Conference Table", defectRate: 2.4 },
                      { name: "Desk Lamp", defectRate: 0.9 },
                      { name: "Monitor Stand", defectRate: 1.1 },
                      { name: "Keyboard Tray", defectRate: 0.8 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 3]} />
                    <Tooltip formatter={(value) => [`${value}%`, "Defect Rate"]} />
                    <Bar dataKey="defectRate" fill={COLORS.danger}>
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? COLORS.danger : "#ff6b6b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-2 lg:col-span-1">
              <CardHeader  className="space-y-0.5">
                <CardTitle>Product Profitability</CardTitle>
                <CardDescription>Profit contribution by product</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <Treemap className="text-xs"
                    data={productPerformanceData.map((item) => ({
                      name: item.name,
                      size: item.profit,
                      value: item.profit,
                    }))}
                    dataKey="size"
                    stroke="#fff"
                    fill={COLORS.primary}
                  >
                    {({ root, depth, x, y, width, height, index, payload, colors, rank, name }: { 
                      root: any; 
                      depth: number; 
                      x: number; 
                      y: number; 
                      width: number; 
                      height: number; 
                      index: number; 
                      payload: any; 
                      colors: any; 
                      rank: any; 
                      name: string;
                    }) => (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          style={{
                            fill:
                              index % 4 === 0
                                ? COLORS.primary
                                : index % 4 === 1
                                  ? COLORS.secondary
                                  : index % 4 === 2
                                    ? COLORS.tertiary
                                    : COLORS.info,
                            stroke: "#fff",
                            strokeWidth: 2 / (depth + 1e-10),
                            strokeOpacity: 1 / (depth + 1e-10),
                          }}
                        />
                        {width > 30 && height > 30 && (
                          <text
                            x={x + width / 2}
                            y={y + height / 2 + 7}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize={12}
                          >
                            {name}
                          </text>
                        )}
                      </g>
                    )}
                  </Treemap>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
