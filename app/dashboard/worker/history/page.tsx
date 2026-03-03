"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileText,
  MoreHorizontal,
  Search,
  Star,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/simple-dropdown"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Sample completed tasks data
const initialTasks = [
  {
    id: "TASK-2023-001",
    product: "Office Chair - Standard",
    step: "Upholster Seat and Back",
    quantity: 5,
    startTime: "2023-11-01 09:00",
    endTime: "2023-11-01 14:30",
    duration: "5h 30m",
    quality: 95,
    feedback: "Excellent work, very precise stitching.",
    worker: "John Smith",
  },
  {
    id: "TASK-2023-002",
    product: "Office Chair - Standard",
    step: "Assemble Chair Base",
    quantity: 5,
    startTime: "2023-11-02 08:30",
    endTime: "2023-11-02 12:15",
    duration: "3h 45m",
    quality: 90,
    feedback: "Good assembly, one chair needed minor adjustments.",
    worker: "John Smith",
  },
  {
    id: "TASK-2023-003",
    product: "Office Desk - Adjustable",
    step: "Cut Wood Panels",
    quantity: 3,
    startTime: "2023-11-03 08:00",
    endTime: "2023-11-03 11:45",
    duration: "3h 45m",
    quality: 100,
    feedback: "Perfect cuts, all measurements were exact.",
    worker: "Robert Wilson",
  },
  {
    id: "TASK-2023-004",
    product: "Bookshelf - 5 Shelf",
    step: "Cut Wood Panels",
    quantity: 2,
    startTime: "2023-11-04 09:15",
    endTime: "2023-11-04 12:00",
    duration: "2h 45m",
    quality: 85,
    feedback: "One panel had a slight measurement issue, but was usable.",
    worker: "Robert Wilson",
  },
  {
    id: "TASK-2023-005",
    product: "Filing Cabinet - 3 Drawer",
    step: "Assemble Frame",
    quantity: 1,
    startTime: "2023-11-05 10:00",
    endTime: "2023-11-05 12:00",
    duration: "2h 00m",
    quality: 98,
    feedback: "Very solid assembly, well done.",
    worker: "Emily Johnson",
  },
  {
    id: "TASK-2023-006",
    product: "Executive Chair - Leather",
    step: "Upholster Seat and Back",
    quantity: 2,
    startTime: "2023-11-06 08:30",
    endTime: "2023-11-06 12:30",
    duration: "4h 00m",
    quality: 100,
    feedback: "Exceptional leather work, perfect stitching.",
    worker: "Sarah Davis",
  },
  {
    id: "TASK-2023-007",
    product: "Standing Desk Converter",
    step: "Install Adjustment Mechanism",
    quantity: 5,
    startTime: "2023-11-07 09:00",
    endTime: "2023-11-07 14:00",
    duration: "5h 00m",
    quality: 92,
    feedback: "Good installation, mechanisms work smoothly.",
    worker: "Michael Brown",
  },
  {
    id: "TASK-2023-008",
    product: "Monitor Stand - Dual",
    step: "Assemble Frame",
    quantity: 10,
    startTime: "2023-11-08 08:00",
    endTime: "2023-11-08 12:00",
    duration: "4h 00m",
    quality: 95,
    feedback: "Solid assembly, all stands are stable.",
    worker: "Emily Johnson",
  },
  {
    id: "TASK-2023-009",
    product: "Keyboard Tray - Adjustable",
    step: "Install Adjustment Mechanism",
    quantity: 8,
    startTime: "2023-11-09 09:30",
    endTime: "2023-11-09 13:30",
    duration: "4h 00m",
    quality: 88,
    feedback: "Two mechanisms needed adjustment, otherwise good.",
    worker: "Michael Brown",
  },
  {
    id: "TASK-2023-010",
    product: "Desk Lamp - LED",
    step: "Assemble Base and Arm",
    quantity: 15,
    startTime: "2023-11-10 08:30",
    endTime: "2023-11-10 12:30",
    duration: "4h 00m",
    quality: 96,
    feedback: "Clean assembly, all lamps function properly.",
    worker: "John Smith",
  },
]

export default function CompletedTasksPage() {
  const [tasks, setTasks] = useState(initialTasks)
  const [searchTerm, setSearchTerm] = useState("")
  const [workerFilter, setWorkerFilter] = useState("All")
  const [productFilter, setProductFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  const itemsPerPage = 5

  // Filter tasks based on search term, worker filter, and product filter
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.step.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesWorker = workerFilter === "All" || task.worker === workerFilter
    const matchesProduct = productFilter === "All" || task.product === productFilter

    return matchesSearch && matchesWorker && matchesProduct
  })

  // Paginate tasks
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredTasks.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)

  // Handle pagination
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // Get quality badge color
  const getQualityBadge = (quality: number) => {
    if (quality >= 95) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excellent</Badge>
    } else if (quality >= 85) {
      return <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Good</Badge>
    } else if (quality >= 75) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Satisfactory</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Needs Improvement</Badge>
    }
  }

  // Render stars based on quality
  const renderQualityStars = (quality: number) => {
    const stars = Math.round(quality / 20) // Convert to 1-5 scale
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < stars ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Completed Tasks History</h1>
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(tasks.reduce((sum, task) => sum + task.quality, 0) / tasks.length)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks
                .reduce((sum, task) => {
                  const hours = Number.parseInt(task.duration.split("h")[0])
                  const minutes = Number.parseInt(task.duration.split("h ")[1].split("m")[0]) || 0
                  return sum + hours + minutes / 60
                }, 0)
                .toFixed(1)}
              h
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units Produced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.reduce((sum, task) => sum + task.quantity, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed Tasks</CardTitle>
          <CardDescription>View history of completed manufacturing tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="worker-filter" className="whitespace-nowrap">
                    Worker:
                  </Label>
                  <Select onValueChange={(value) => setWorkerFilter(value)} defaultValue="All">
                    <SelectTrigger id="worker-filter" className="w-[180px]">
                      <SelectValue placeholder="All Workers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Workers</SelectItem>
                      <SelectItem value="John Smith">John Smith</SelectItem>
                      <SelectItem value="Emily Johnson">Emily Johnson</SelectItem>
                      <SelectItem value="Michael Brown">Michael Brown</SelectItem>
                      <SelectItem value="Sarah Davis">Sarah Davis</SelectItem>
                      <SelectItem value="Robert Wilson">Robert Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="product-filter" className="whitespace-nowrap">
                    Product:
                  </Label>
                  <Select onValueChange={(value) => setProductFilter(value)} defaultValue="All">
                    <SelectTrigger id="product-filter" className="w-[180px]">
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Products</SelectItem>
                      <SelectItem value="Office Chair - Standard">Office Chair - Standard</SelectItem>
                      <SelectItem value="Office Desk - Adjustable">Office Desk - Adjustable</SelectItem>
                      <SelectItem value="Filing Cabinet - 3 Drawer">Filing Cabinet - 3 Drawer</SelectItem>
                      <SelectItem value="Bookshelf - 5 Shelf">Bookshelf - 5 Shelf</SelectItem>
                      <SelectItem value="Executive Chair - Leather">Executive Chair - Leather</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.length > 0 ? (
                    currentItems.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.id}</TableCell>
                        <TableCell>
                          <div className="max-w-[150px] truncate" title={task.product}>
                            {task.product}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[150px] truncate" title={task.step}>
                            {task.step}
                          </div>
                        </TableCell>
                        <TableCell>{task.worker}</TableCell>
                        <TableCell>{task.duration}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getQualityBadge(task.quality)}
                            <span className="text-sm">{task.quality}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTask(task)
                                  setIsDetailsDialogOpen(true)
                                }}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No completed tasks found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredTasks.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTasks.length)} of{" "}
                  {filteredTasks.length} tasks
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      {selectedTask && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Task Details - {selectedTask.id}</DialogTitle>
              <DialogDescription>Detailed information about the completed task</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-medium">{selectedTask.product}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Step</Label>
                  <p className="font-medium">{selectedTask.step}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Worker</Label>
                  <p className="font-medium">{selectedTask.worker}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{selectedTask.quantity} units</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Start Time</Label>
                  <p className="font-medium">{selectedTask.startTime}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">End Time</Label>
                  <p className="font-medium">{selectedTask.endTime}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Duration</Label>
                  <p className="font-medium">{selectedTask.duration}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quality Score</Label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{selectedTask.quality}%</p>
                    {renderQualityStars(selectedTask.quality)}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Feedback</Label>
                <p className="font-medium">{selectedTask.feedback}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
