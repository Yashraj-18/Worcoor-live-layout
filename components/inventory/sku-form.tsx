"use client"

import type React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { notification } from '@/src/services/notificationService'

const LOCATION_TAG_NONE_VALUE = "__none__"

const skuFormSchema = z.object({
  sku_name: z.string().min(1, { message: "SKU Name is required." }).transform((val) => val.trim()),
  sku_category: z.enum(["raw_material", "finished_good"], {
    required_error: "Please select a SKU Category.",
  }),
  quantity: z.coerce.number().min(0, { message: "Quantity must be a positive number." }),
  sku_unit: z.enum(["kg", "liters", "pieces"], {
    required_error: "Please select a Unit of Measure.",
  }),
  effective_date: z.string().min(1, { message: "Effective Date is required." }),
  expiry_date: z.string().optional(),
  location_tag_id: z.string().optional(),
})

// Explicitly define the form values type to match zod schema
type SkuFormValues = z.infer<typeof skuFormSchema>

interface SkuFormProps {
  initialData?: Partial<SkuFormValues>
  onSubmit: (data: SkuFormValues) => void
  onCancel: () => void
  locationTags: { label: string; value: string }[]
}

export function SkuForm({ initialData = {}, onSubmit, onCancel, locationTags }: SkuFormProps) {
  // Initialize form with default values or initial data
  const form = useForm<SkuFormValues>({
    resolver: zodResolver(skuFormSchema) as any,
    defaultValues: {
      sku_name: initialData?.sku_name || "",
      sku_category: (initialData?.sku_category as any) || "raw_material",
      quantity: (initialData?.quantity as any) ?? 0,
      sku_unit: (initialData?.sku_unit as any) || "kg",
      effective_date: initialData?.effective_date || "",
      expiry_date: initialData?.expiry_date || "",
      location_tag_id: initialData?.location_tag_id || undefined,
    },
  })

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
            {/* SKU Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="sku_name"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">SKU Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" placeholder="Enter SKU name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="sku_category"
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
                        <SelectItem value="raw_material">raw_material</SelectItem>
                        <SelectItem value="finished_good">finished_good</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Quantity + Unit of Measure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="quantity"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">Quantity <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700"
                        placeholder="Enter quantity"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="sku_unit"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">Unit of Measure <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="liters">liters</SelectItem>
                        <SelectItem value="pieces">pieces</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Effective Date + Expiry Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="effective_date"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">Effective Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="expiry_date"
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
              <div />
            </div>
            {/* Location Tag (optional) */}
            <FormField control={form.control} name="location_tag_id"
              render={({ field }) => (
                <FormItem className="space-y-1 gap-2">
                  <FormLabel className="text-sm font-medium leading-none">Location Tag</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === LOCATION_TAG_NONE_VALUE ? undefined : val)}
                    value={field.value || LOCATION_TAG_NONE_VALUE}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                        <SelectValue placeholder="Select Location Tag" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={LOCATION_TAG_NONE_VALUE}>None</SelectItem>
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
          </div>
        </div>
        <DialogFooter className="px-2 md:px-6 py-4">
          <Button variant="outline" className="text-sm font-medium" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="bg-darkblue text-sm font-medium" type="submit">{initialData?.sku_name ? "Update SKU" : "Add SKU"}</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default SkuForm
