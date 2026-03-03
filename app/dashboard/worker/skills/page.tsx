"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

// Define worker skill types
type WorkerSkillWithCertification = {
  id: number;
  worker: string;
  skill: string;
  proficiency: string;
  certified: true;
  certificationDate: string;
  expiryDate: string;
  trainingHours: number;
};

type WorkerSkillWithoutCertification = {
  id: number;
  worker: string;
  skill: string;
  proficiency: string;
  certified: false;
  certificationDate: null;
  expiryDate: null;
  trainingHours: number;
};

type WorkerSkill = WorkerSkillWithCertification | WorkerSkillWithoutCertification;

// Sample worker skills data
const initialWorkerSkills: WorkerSkill[] = [
  {
    id: 1,
    worker: "John Smith",
    skill: "Woodworking",
    proficiency: "Expert",
    certified: true,
    certificationDate: "2022-05-15",
    expiryDate: "2024-05-15",
    trainingHours: 120,
  },
  {
    id: 2,
    worker: "John Smith",
    skill: "Assembly",
    proficiency: "Advanced",
    certified: true,
    certificationDate: "2022-06-20",
    expiryDate: "2024-06-20",
    trainingHours: 80,
  },
  {
    id: 3,
    worker: "Emily Johnson",
    skill: "Assembly",
    proficiency: "Expert",
    certified: true,
    certificationDate: "2022-04-10",
    expiryDate: "2024-04-10",
    trainingHours: 150,
  },
  {
    id: 4,
    worker: "Emily Johnson",
    skill: "Finishing",
    proficiency: "Advanced",
    certified: true,
    certificationDate: "2022-07-05",
    expiryDate: "2024-07-05",
    trainingHours: 90,
  },
  {
    id: 5,
    worker: "Michael Brown",
    skill: "Mechanical",
    proficiency: "Expert",
    certified: true,
    certificationDate: "2022-03-15",
    expiryDate: "2024-03-15",
    trainingHours: 200,
  },
  {
    id: 6,
    worker: "Michael Brown",
    skill: "Electrical",
    proficiency: "Intermediate",
    certified: false,
    certificationDate: null,
    expiryDate: null,
    trainingHours: 60,
  },
  {
    id: 7,
    worker: "Sarah Davis",
    skill: "Upholstery",
    proficiency: "Expert",
    certified: true,
    certificationDate: "2022-08-10",
    expiryDate: "2024-08-10",
    trainingHours: 180,
  },
  {
    id: 8,
    worker: "Sarah Davis",
    skill: "Finishing",
    proficiency: "Advanced",
    certified: true,
    certificationDate: "2022-09-20",
    expiryDate: "2024-09-20",
    trainingHours: 100,
  },
  {
    id: 9,
    worker: "Robert Wilson",
    skill: "Woodworking",
    proficiency: "Advanced",
    certified: true,
    certificationDate: "2022-10-05",
    expiryDate: "2024-10-05",
    trainingHours: 110,
  },
  {
    id: 10,
    worker: "Robert Wilson",
    skill: "CNC Operation",
    proficiency: "Expert",
    certified: true,
    certificationDate: "2022-11-15",
    expiryDate: "2024-11-15",
    trainingHours: 160,
  },
]

// Sample workers
const workers = [
  { value: "john-smith", label: "John Smith" },
  { value: "emily-johnson", label: "Emily Johnson" },
  { value: "michael-brown", label: "Michael Brown" },
  { value: "sarah-davis", label: "Sarah Davis" },
  { value: "robert-wilson", label: "Robert Wilson" },
]

// Sample skills
const skills = [
  { value: "woodworking", label: "Woodworking" },
  { value: "metalworking", label: "Metalworking" },
  { value: "assembly", label: "Assembly" },
  { value: "finishing", label: "Finishing" },
  { value: "quality-control", label: "Quality Control" },
  { value: "packaging", label: "Packaging" },
  { value: "electrical", label: "Electrical" },
  { value: "mechanical", label: "Mechanical" },
  { value: "upholstery", label: "Upholstery" },
  { value: "cnc-operation", label: "CNC Operation" },
]

export default function WorkerSkillsPage() {
  const [workerSkills, setWorkerSkills] = useState(initialWorkerSkills)
  const [searchTerm, setSearchTerm] = useState("")
  const [workerFilter, setWorkerFilter] = useState("All")
  const [skillFilter, setSkillFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSkill, setSelectedSkill] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newSkill, setNewSkill] = useState({
    worker: "",
    skill: "",
    proficiency: "Beginner",
    certified: false,
    certificationDate: "",
    expiryDate: "",
    trainingHours: 0,
    notes: "",
  })

  const itemsPerPage = 5

  // Filter worker skills based on search term, worker filter, and skill filter
  const filteredSkills = workerSkills.filter((workerSkill) => {
    const matchesSearch =
      workerSkill.worker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workerSkill.skill.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesWorker = workerFilter === "All" || workerSkill.worker === workerFilter
    const matchesSkill = skillFilter === "All" || workerSkill.skill === skillFilter

    return matchesSearch && matchesWorker && matchesSkill
  })

  // Paginate worker skills
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredSkills.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredSkills.length / itemsPerPage)

  // Handle pagination
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // Get proficiency badge color
  const getProficiencyBadge = (proficiency: string) => {
    switch (proficiency) {
      case "Beginner":
        return <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Beginner</Badge>
      case "Intermediate":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Intermediate</Badge>
      case "Advanced":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Advanced</Badge>
      case "Expert":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Expert</Badge>
      default:
        return <Badge>{proficiency}</Badge>
    }
  }

  // Handle adding a new skill
  const handleAddSkill = () => {
    const id = workerSkills.length > 0 ? Math.max(...workerSkills.map((skill) => skill.id)) + 1 : 1

    const selectedWorker = workers.find((worker) => worker.value === newSkill.worker)
    const selectedSkillItem = skills.find((skill) => skill.value === newSkill.skill)

    if (!selectedWorker || !selectedSkillItem) {
      toast({
        title: "Error",
        description: "Please select a valid worker and skill.",
        variant: "destructive",
      })
      return
    }

    // Create properly typed worker skill based on certification status
    const newWorkerSkill: WorkerSkill = newSkill.certified
      ? {
        id,
        worker: selectedWorker.label,
        skill: selectedSkillItem.label,
        proficiency: newSkill.proficiency,
        certified: true,
        certificationDate: newSkill.certificationDate || new Date().toISOString().split('T')[0],
        expiryDate: newSkill.expiryDate || new Date().toISOString().split('T')[0],
        trainingHours: Number(newSkill.trainingHours),
      }
      : {
        id,
        worker: selectedWorker.label,
        skill: selectedSkillItem.label,
        proficiency: newSkill.proficiency,
        certified: false,
        certificationDate: null,
        expiryDate: null,
        trainingHours: Number(newSkill.trainingHours),
      }

    setWorkerSkills([...workerSkills, newWorkerSkill])
    setIsAddDialogOpen(false)
    setNewSkill({
      worker: "",
      skill: "",
      proficiency: "Beginner",
      certified: false,
      certificationDate: "",
      expiryDate: "",
      trainingHours: 0,
      notes: "",
    })

    toast({
      title: "Skill added",
      description: `${selectedSkillItem.label} skill has been added for ${selectedWorker.label}.`,
    })
  }

  // Handle editing a skill
  const handleEditSkill = () => {
    if (!selectedSkill) return

    setWorkerSkills(
      workerSkills.map((workerSkill) =>
        workerSkill.id === selectedSkill.id
          ? {
            ...workerSkill,
            proficiency: selectedSkill.proficiency,
            certified: selectedSkill.certified,
            certificationDate: selectedSkill.certified ? selectedSkill.certificationDate : null,
            expiryDate: selectedSkill.certified ? selectedSkill.expiryDate : null,
            trainingHours: Number(selectedSkill.trainingHours),
          }
          : workerSkill,
      ),
    )

    setIsEditDialogOpen(false)

    toast({
      title: "Skill updated",
      description: `${selectedSkill.skill} skill has been updated for ${selectedSkill.worker}.`,
    })
  }

  // Handle deleting a skill
  const handleDeleteSkill = () => {
    if (!selectedSkill) return

    setWorkerSkills(workerSkills.filter((workerSkill) => workerSkill.id !== selectedSkill.id))
    setIsDeleteDialogOpen(false)

    toast({
      title: "Skill deleted",
      description: `${selectedSkill.skill} skill has been deleted for ${selectedSkill.worker}.`,
    })
  }

  // Calculate proficiency percentage
  const calculateProficiencyPercentage = (proficiency: string) => {
    switch (proficiency) {
      case "Beginner":
        return 25
      case "Intermediate":
        return 50
      case "Advanced":
        return 75
      case "Expert":
        return 100
      default:
        return 0
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Worker Skills Management</h1>
        <Button className="flex items-center gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Skill
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workerSkills.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certified Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workerSkills.filter((skill) => skill.certified).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expert Level Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workerSkills.filter((skill) => skill.proficiency === "Expert").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Training Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workerSkills.reduce((total, skill) => total + skill.trainingHours, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Worker Skills</CardTitle>
          <CardDescription>Manage worker skills, certifications, and proficiency levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search skills..."
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
                      {workers.map((worker) => (
                        <SelectItem key={worker.value} value={worker.label}>
                          {worker.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="skill-filter" className="whitespace-nowrap">
                    Skill:
                  </Label>
                  <Select onValueChange={(value) => setSkillFilter(value)} defaultValue="All">
                    <SelectTrigger id="skill-filter" className="w-[180px]">
                      <SelectValue placeholder="All Skills" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Skills</SelectItem>
                      {skills.map((skill) => (
                        <SelectItem key={skill.value} value={skill.label}>
                          {skill.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Skill</TableHead>
                    <TableHead>Proficiency</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Certified</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.length > 0 ? (
                    currentItems.map((workerSkill) => (
                      <TableRow key={workerSkill.id}>
                        <TableCell className="font-medium">{workerSkill.worker}</TableCell>
                        <TableCell>{workerSkill.skill}</TableCell>
                        <TableCell>{getProficiencyBadge(workerSkill.proficiency)}</TableCell>
                        <TableCell>
                          <div className="w-full max-w-[100px]">
                            <Progress value={calculateProficiencyPercentage(workerSkill.proficiency)} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>{workerSkill.certified ? "Yes" : "No"}</TableCell>
                        <TableCell>{workerSkill.expiryDate || "-"}</TableCell>
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
                                  setSelectedSkill(workerSkill)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSkill(workerSkill)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No worker skills found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredSkills.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSkills.length)} of{" "}
                  {filteredSkills.length} skills
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

      {/* Add Skill Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Worker Skill</DialogTitle>
            <DialogDescription>Add a new skill for a worker.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="worker">Worker</Label>
              <Select onValueChange={(value) => setNewSkill({ ...newSkill, worker: value })} value={newSkill.worker}>
                <SelectTrigger id="worker">
                  <SelectValue placeholder="Select a worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.value} value={worker.value}>
                      {worker.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill">Skill</Label>
              <Select onValueChange={(value) => setNewSkill({ ...newSkill, skill: value })} value={newSkill.skill}>
                <SelectTrigger id="skill">
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill.value} value={skill.value}>
                      {skill.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proficiency">Proficiency Level</Label>
              <Select
                onValueChange={(value) => setNewSkill({ ...newSkill, proficiency: value })}
                value={newSkill.proficiency}
              >
                <SelectTrigger id="proficiency">
                  <SelectValue placeholder="Select proficiency level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="certified">Certified</Label>
                <input
                  type="checkbox"
                  id="certified"
                  checked={newSkill.certified}
                  onChange={(e) => setNewSkill({ ...newSkill, certified: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>
            </div>
            {newSkill.certified && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="certification-date">Certification Date</Label>
                  <Input
                    id="certification-date"
                    type="date"
                    value={newSkill.certificationDate}
                    onChange={(e) => setNewSkill({ ...newSkill, certificationDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Expiry Date</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={newSkill.expiryDate}
                    onChange={(e) => setNewSkill({ ...newSkill, expiryDate: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="training-hours">Training Hours</Label>
              <Input
                id="training-hours"
                type="number"
                min={0}
                value={newSkill.trainingHours}
                onChange={(e) => setNewSkill({ ...newSkill, trainingHours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional notes..."
                value={newSkill.notes}
                onChange={(e) => setNewSkill({ ...newSkill, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSkill}>Add Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Skill Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Worker Skill</DialogTitle>
            <DialogDescription>Update skill details for this worker.</DialogDescription>
          </DialogHeader>
          {selectedSkill && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Worker</Label>
                  <p className="text-base font-medium">{selectedSkill.worker}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Skill</Label>
                  <p className="text-base font-medium">{selectedSkill.skill}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-proficiency">Proficiency Level</Label>
                <Select
                  value={selectedSkill.proficiency}
                  onValueChange={(value) => setSelectedSkill({ ...selectedSkill, proficiency: value })}
                >
                  <SelectTrigger id="edit-proficiency">
                    <SelectValue placeholder="Select proficiency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="edit-certified">Certified</Label>
                  <input
                    type="checkbox"
                    id="edit-certified"
                    checked={selectedSkill.certified}
                    onChange={(e) => setSelectedSkill({ ...selectedSkill, certified: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
              </div>
              {selectedSkill.certified && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-certification-date">Certification Date</Label>
                    <Input
                      id="edit-certification-date"
                      type="date"
                      value={selectedSkill.certificationDate || ""}
                      onChange={(e) => setSelectedSkill({ ...selectedSkill, certificationDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-expiry-date">Expiry Date</Label>
                    <Input
                      id="edit-expiry-date"
                      type="date"
                      value={selectedSkill.expiryDate || ""}
                      onChange={(e) => setSelectedSkill({ ...selectedSkill, expiryDate: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-training-hours">Training Hours</Label>
                <Input
                  id="edit-training-hours"
                  type="number"
                  min={0}
                  value={selectedSkill.trainingHours}
                  onChange={(e) => setSelectedSkill({ ...selectedSkill, trainingHours: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSkill}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Skill Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Worker Skill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this skill? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedSkill && (
            <div className="py-4">
              <p>
                You are about to delete the <strong>{selectedSkill.skill}</strong> skill for{" "}
                <strong>{selectedSkill.worker}</strong>.
              </p>
              {selectedSkill.certified && (
                <p className="text-destructive mt-2">
                  Warning: This is a certified skill with {selectedSkill.trainingHours} training hours.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSkill}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
