"use client"

import type React from "react"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { FileUploadBox } from "@/components/file-uploaders/file-upload-box"
import { api_url } from "@/src/constants/api_url";
import { notification } from '@/src/services/notificationService'

// Form schema for adding/editing a SKU
const skuFormSchema = z.object({
  resourceId: z.string({
    required_error: "Please select a parent resource.",
  }).min(1, { message: "Please select a parent resource." }),
  name: z.string().min(2, { message: "SKU name is required." }).transform((val) => val.trim()),
  departmentId: z.string({
    required_error: "Please select a department.",
  }).min(1, { message: "Please select a department." }),
  categoryId: z.string({
    required_error: "Please select a category.",
  }).min(1, { message: "Please select a category." }),
  description: z.string().transform((val) => val.trim()),
  code: z.string().min(1, { message: "SKU ID is required." }).transform((val) => val.trim()),
  unitId: z.string({
    required_error: "Please select a unit.",
  }).min(1, { message: "Please select a unit." }),
  type: z.string(),
  quantity: z.number().min(0, { message: "Quantity must be a positive number." }),
  effectiveDate: z.string().min(1, { message: "Effective date is required." }),
  expiryDate: z.string().optional(),
  orgUnitId: z.string({
    required_error: "Please select an org unit.",
  }).min(1, { message: "Please select an org unit." }),
  locationTagId: z.string({
    required_error: "Please select a location tag.",
  }).min(1, { message: "Please select a location tag." }),
  attachments: z.array(z.string().url()).optional()
})

// Explicitly define the form values type to match zod schema
type SkuFormValues = z.infer<typeof skuFormSchema>

interface SkuFormProps {
  initialData?: Partial<SkuFormValues>
  onSubmit: (data: SkuFormValues) => void
  onCancel: () => void
  categories: { label: string; value: string }[]
  types: { label: string; value: string }[]
  units: { label: string; value: string }[]
  parentResources: { label: string; value: string }[]
  departments: { label: string; value: string }[]
  orgUnits: { label: string; value: string }[]
  locationTags: { label: string; value: string }[]
}

export function SkuForm({ initialData = {}, onSubmit, onCancel, categories, types, units, parentResources, departments, orgUnits, locationTags }: SkuFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  types = types.filter(t => t.value !== "000000000000000000000000");

  // Initialize form with default values or initial data
  const form = useForm<SkuFormValues>({
    resolver: zodResolver(skuFormSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      categoryId: initialData?.categoryId || "",
      type: initialData?.type || types[0].value,
      resourceId: initialData?.resourceId || "",
      code: initialData?.code || "",
      unitId: initialData?.unitId || "",
      departmentId: initialData?.departmentId || "",
      quantity: initialData?.quantity || 0,
      effectiveDate: initialData?.effectiveDate || "",
      expiryDate: initialData?.expiryDate || "",
      orgUnitId: initialData?.orgUnitId || "",
      locationTagId: initialData?.locationTagId || "",
      attachments: initialData?.attachments || []
    },
  })

  const isEditMode = !!initialData?.name;

  // Submit handler
  const handleSubmit = (data: SkuFormValues) => {
    // Since we're using z.coerce in the schema, the values should already be properly typed
    onSubmit(data)
    form.reset()
  }

  const onUploadSuccess = (res: any) => {
    if (res.length) {
      notification.success("Attachment Uploaded.");
    }
  };
  
  const onUploadError = (res: any) => {
    notification.error(res);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-6 flex-grow-1 overflow-y-auto px-4 md:px-6">
          <div className="space-y-4">
            {/* Parent Resource */}
            <FormField control={form.control} name="resourceId"
              render={({ field }) => (
                <FormItem className="space-y-1 gap-2">
                  <FormLabel className="text-sm font-medium leading-none">Parent Resource <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                        <SelectValue placeholder="Select Parent Resource" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parentResources.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* SKU Name and Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">SKU Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input disabled={isEditMode} className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" placeholder="Enter SKU name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control as any} name="code"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">SKU Code <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input disabled={isEditMode} className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" placeholder="Enter SKU Code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* SKU Code and Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="type"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">Type <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {types.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Primary SKUs are essential for production, while secondary SKUs are alternatives or supplements.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="categoryId"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">SKU Category <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                          <SelectValue placeholder="Select SKU Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* SKU Unit and Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="unitId"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">SKU Unit <span className="text-destructive">*</span></FormLabel>
                    <Select disabled={isEditMode} onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                          <SelectValue placeholder="Select SKU Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="departmentId"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">Department <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* SKU Quantity and Effective Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="quantity"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">SKU Quantity <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" placeholder="Enter quantity" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="effectiveDate"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">SKU Effective Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Expiry Date and Org Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="expiryDate"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="orgUnitId"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">Org Unit <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                          <SelectValue placeholder="Select Org Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orgUnits.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Location Tag */}
            <FormField control={form.control} name="locationTagId"
              render={({ field }) => (
                <FormItem className="space-y-1 gap-2">
                  <FormLabel className="text-sm font-medium leading-none">Location Tag <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                        <SelectValue placeholder="Select Location Tag" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locationTags.map((tag) => (
                        <SelectItem key={tag.value} value={tag.value}>
                          {tag.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Description */}
            <FormField control={form.control} name="description"
              render={({ field }) => (
                <FormItem className="space-y-1 gap-2">
                  <FormLabel className="text-sm font-medium leading-none">Description</FormLabel>
                  <FormControl>
                    <Textarea  className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" placeholder="Enter Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Attechments */}
            <FormField control={form.control} name="attachments"
              render={({ field }) => (
                <FileUploadBox
                  label="Upload Attachments"
                  uploadUrl={api_url.mediaService.dpvmu}
                  uploadType="multiple"
                  accept=".jpg,.jpeg,.png,.pdf"
                  maxFileSizeMB={5}
                  value={field.value}
                  onChange={field.onChange}
                  onUploadError={onUploadError}
                  onUploadSuccess= {onUploadSuccess}
                />
              )}
            />
          </div>
        </div>
        <DialogFooter className="px-2 md:px-6 py-4">
          <Button variant="outline" className="text-sm font-medium" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="bg-darkblue text-sm font-medium" type="submit">{initialData?.name ? "Update SKU" : "Add SKU"}</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default SkuForm
