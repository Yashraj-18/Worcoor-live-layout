import { Building2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const unitTypes = [
  { value: "warehouse", label: "Warehouse" },
  { value: "production", label: "Production" },
  { value: "office", label: "Office" },
  { value: "storage", label: "Storage" },
  { value: "other", label: "Other" },
]

export default function NewOrgUnitPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/reference-data/org-units">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Unit</h1>
          <p className="text-muted-foreground">
            Add a new organizational unit to your system
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Unit Information</CardTitle>
            <CardDescription>
              Enter the details for the new organizational unit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unitId">Org Unit ID <span className="text-red-500">*</span></Label>
                <Input 
                  id="unitId" 
                  placeholder="e.g. WH-001" 
                  required 
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Unique identifier for the organizational unit</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Org Unit Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Warehouse 1" 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Unit Type</Label>
              <Select>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {unitTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g. Building A, Floor 1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter a brief description of this unit..."
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="status-active"
                    name="status"
                    value="active"
                    className="h-4 w-4 text-primary"
                    defaultChecked
                  />
                  <Label htmlFor="status-active" className="font-normal">
                    Active
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="status-inactive"
                    name="status"
                    value="inactive"
                    className="h-4 w-4 text-primary"
                  />
                  <Label htmlFor="status-inactive" className="font-normal">
                    Inactive
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/reference-data/org-units">Cancel</Link>
          </Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
