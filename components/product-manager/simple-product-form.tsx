"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { useReferenceData } from "@/contexts/reference-data-context"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

// SKU data directly from the SKU management page
const skusData = [
  {
    id: "SKU-001",
    parentResource: "Pallets",
    name: "Oak Wood Panel",
    brand: "Premium Woods Co.",
    procuredDate: "2024-01-15",
    location: "U1-W1-Z2-R3",
    skuCode: "OWP-001",
    availableQuantity: 150,
    skuUnit: "pieces",
    unit: "pcs",
    department: "Materials",
    wastageQuantity: "5",
    description: "High-quality oak wood panel for furniture",
    minQuantity: 20,
    type: "Primary",
    category: "Wood",
    unitCost: 45.50,
    currency: "USD",
    unitWeight: 2.5,
    weightUnit: "kg",
    quantityUnit: "pieces",
    qualityRating: "A",
    qualityCheckDone: true,
    qualityCheckDate: "2024-01-16",
    qualityCheckNotes: "Excellent quality, no defects",
    taggedForProduction: 30,
    wastage: 5,
    totalProcured: 180,
  },
  {
    id: "SKU-002",
    parentResource: "Packaging Material",
    name: "Steel Brackets",
    brand: "MetalWorks Inc.",
    procuredDate: "2024-01-20",
    location: "Packaging Store 1",
    skuCode: "SB-002",
    availableQuantity: 200,
    skuUnit: "pieces",
    unit: "pcs",
    department: "Hardware",
    wastageQuantity: "3",
    description: "Galvanized steel brackets for support",
    minQuantity: 50,
    type: "Secondary",
    category: "Metal",
    unitCost: 12.75,
    currency: "USD",
    unitWeight: 0.8,
    weightUnit: "kg",
    quantityUnit: "pieces",
    qualityRating: "B",
    qualityCheckDone: false,
    qualityCheckDate: "",
    qualityCheckNotes: "",
    taggedForProduction: 20,
    wastage: 3,
    totalProcured: 225,
  },
]

// Define types for the SKU options
type SkuOption = {
  label: string
  value: string
  category: string
  type: string
  unit: string
}

// Convert SKU data to dropdown options
const getSkuOptions = (): SkuOption[] => {
  return skusData.map((sku) => ({
    label: sku.name,
    value: sku.id,
    category: sku.category,
    type: sku.type,
    unit: sku.skuUnit?.toLowerCase() || ""
  }))
}

// Form schema
const formSchema = z.object({
  // Product details
  name: z.string().min(2, {
    message: "Product name must be at least 2 characters.",
  }),
  category: z.string({
    required_error: "Please select a product category.",
  }),
  status: z.enum(["active", "decommissioned"], {
    required_error: "Please select a status.",
  }),
  description: z.string().optional(),
  minimumProductionLot: z.string().min(1, {
    message: "Minimum production lot is required.",
  }),
  countPerLot: z.string().min(1, {
    message: "Count per lot is required.",
  }),
  perUnitWeightGrams: z.string().min(1, {
    message: "Per unit weight is required.",
  }),
  
  // SKU fields
  skuName: z.string({
    required_error: "Please select a SKU.",
  }),
  skuType: z.enum(["primary", "secondary"], {
    required_error: "Please select the SKU type.",
  }),
  quantityPerLot: z.string().min(1, {
    message: "Quantity per production lot is required.",
  }),
  unit: z.enum(["kg", "count"], {
    required_error: "Please select a unit.",
  }),
})

type ProductFormValues = z.infer<typeof formSchema>

interface SimpleProductFormProps {
  onSubmit: (data: ProductFormValues) => void
  onCancel: () => void
  initialValues?: any
}

export function SimpleProductForm({ onSubmit, onCancel, initialValues }: SimpleProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addedSkus, setAddedSkus] = useState<Array<{
    skuName: string;
    skuType: 'primary' | 'secondary';
    quantityPerLot: string;
    unit: string;
    displayName?: string;
  }>>([])
  const { productCategories, skuCategories, skuTypes, skuUnits } = useReferenceData()
  
  // Generate the SKU options using our helper function
  const skuOptions = getSkuOptions()
  
  // Helper function to update form fields based on selected SKU
  const updateFormWithSkuData = (skuId: string) => {
    // Find the selected SKU from the original data
    const selectedSku = skusData.find(sku => sku.id === skuId)
    
    if (selectedSku) {
      // Update SKU type field - ensure it matches our enum values
      const skuType = selectedSku.type?.toLowerCase() === 'primary' ? 'primary' : 'secondary'
      form.setValue('skuType', skuType as 'primary' | 'secondary')
      
      // Update unit field - determine the appropriate unit value based on SKU data
      let unit = 'count'
      if (selectedSku.skuUnit?.toLowerCase() === 'kg' || 
          selectedSku.weightUnit?.toLowerCase() === 'kg') {
        unit = 'kg'
      }
      form.setValue('unit', unit as 'kg' | 'count')
      
      // Populate quantity per lot based on available quantity
      if (selectedSku.availableQuantity) {
        form.setValue('quantityPerLot', selectedSku.availableQuantity.toString())
      }
    }
  }
  
  // Function to save the current SKU details
  const saveSkuDetails = () => {
    // Get current SKU values from form
    const skuName = form.getValues('skuName');
    const skuType = form.getValues('skuType');
    const quantityPerLot = form.getValues('quantityPerLot');
    const unit = form.getValues('unit');
    
    // Validate that all required SKU fields are filled
    if (!skuName || !skuType || !quantityPerLot || !unit) {
      // Show validation errors
      form.trigger(['skuName', 'skuType', 'quantityPerLot', 'unit']);
      return;
    }
    
    // Find the display name for the selected SKU
    const selectedSkuOption = skuOptions.find(option => option.value === skuName);
    const displayName = selectedSkuOption?.label || skuName;
    
    // Add the SKU to the list
    setAddedSkus([...addedSkus, {
      skuName,
      skuType,
      quantityPerLot,
      unit,
      displayName
    }]);
    
    // Reset the SKU form fields
    form.setValue('skuName', '');
    form.setValue('skuType', 'primary');
    form.setValue('quantityPerLot', '');
    form.setValue('unit', 'count');
  }

  // Default form values
  const defaultValues: Partial<ProductFormValues> = {
    name: "",
    category: "",
    status: "active",
    description: "",
    minimumProductionLot: "1",
    countPerLot: "1",
    perUnitWeightGrams: "0",
    skuName: "",
    skuType: "primary",
    quantityPerLot: "1",
    unit: "kg",
  }

  // Initialize form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues ? {
      name: initialValues.name || "",
      category: initialValues.category || "",
      status: initialValues.status || "active",
      description: initialValues.description || "",
      minimumProductionLot: initialValues.minimumProductionLot || "1",
      countPerLot: initialValues.countPerLot || "1",
      perUnitWeightGrams: initialValues.perUnitWeightGrams || "0",
      skuName: initialValues.skuName || "",
      skuType: initialValues.skuType || "primary",
      quantityPerLot: initialValues.quantityPerLot || "1",
      unit: initialValues.unit || "count",
    } : {
      name: "",
      category: "",
      status: "active",
      description: "",
      minimumProductionLot: "1",
      countPerLot: "1",
      perUnitWeightGrams: "0",
      skuName: "",
      skuType: "primary",
      quantityPerLot: "1",
      unit: "count",
    },
    mode: "onChange",
  })

  // Handle form submission
  const onSubmitForm = async (data: ProductFormValues) => {
    setIsSubmitting(true)
    try {
      // Check if there are unsaved SKU details in the form
      const currentSkuName = form.getValues('skuName');
      const currentSkuType = form.getValues('skuType');
      const currentQuantityPerLot = form.getValues('quantityPerLot');
      const currentUnit = form.getValues('unit');
      
      // If there are values in the SKU fields, prompt user to save them first
      if (currentSkuName && currentSkuType && currentQuantityPerLot && currentUnit) {
        if (confirm('You have unsaved SKU details. Would you like to save them before continuing?')) {
          saveSkuDetails();
        }
      }
      
      // Include the list of added SKUs with the form data
      const productData = {
        ...data,
        skus: addedSkus
      };
      
      await onSubmit(productData);
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-background text-foreground">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4">
          <h3 className="text-lg font-medium">Product Details</h3>
          
          {/* Product Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground dark:text-gray-200">Product Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter product name"
                    className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-gray-100 placeholder:text-muted-foreground dark:placeholder:text-gray-400"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-destructive dark:text-red-400" />
              </FormItem>
            )}
          />

          {/* Product Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground dark:text-gray-200">Product Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-gray-100">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background dark:bg-gray-800 border-border dark:border-gray-600">
                    {productCategories.map((category) => (
                      <SelectItem
                        key={category.prcId}
                        value={category.prcId}
                        className="text-foreground dark:text-gray-100 hover:bg-accent dark:hover:bg-gray-700 focus:bg-accent dark:focus:bg-gray-700"
                      >
                        {category.prcName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-destructive dark:text-red-400" />
              </FormItem>
            )}
          />

          {/* Product Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground dark:text-gray-200">Product Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-gray-100">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background dark:bg-gray-800 border-border dark:border-gray-600">
                    <SelectItem value="active" className="text-foreground dark:text-gray-100 hover:bg-accent dark:hover:bg-gray-700">Active</SelectItem>
                    <SelectItem value="decommissioned" className="text-foreground dark:text-gray-100 hover:bg-accent dark:hover:bg-gray-700">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-destructive dark:text-red-400" />
              </FormItem>
            )}
          />

          {/* Product Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground dark:text-gray-200">Product Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter product description"
                    className="min-h-[100px] bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-gray-100 placeholder:text-muted-foreground dark:placeholder:text-gray-400"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-destructive dark:text-red-400" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            {/* Minimum Production Lot */}
            <FormField
              control={form.control}
              name="minimumProductionLot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-gray-200">Minimum Production Lot</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1"
                      className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-gray-100 placeholder:text-muted-foreground dark:placeholder:text-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-destructive dark:text-red-400" />
                </FormItem>
              )}
            />

            {/* Count per Lot */}
            <FormField
              control={form.control}
              name="countPerLot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-gray-200">Count per Lot</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1"
                      className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-gray-100 placeholder:text-muted-foreground dark:placeholder:text-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-destructive dark:text-red-400" />
                </FormItem>
              )}
            />

            {/* Per Unit Weight */}
            <FormField
              control={form.control}
              name="perUnitWeightGrams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-gray-200">Per Unit Weight (g)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-gray-100 placeholder:text-muted-foreground dark:placeholder:text-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-destructive dark:text-red-400" />
                </FormItem>
              )}
            />
          </div>

          <h3 className="text-lg font-medium mt-8">SKU Details</h3>
          
          {/* Display added SKUs */}
          {addedSkus.length > 0 && (
            <div className="mt-4 mb-6 border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
              <h4 className="text-md font-medium mb-2">Added SKUs</h4>
              <div className="space-y-2">
                {addedSkus.map((sku, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded border">
                    <div>
                      <span className="font-medium">{sku.displayName}</span>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
                        {sku.skuType}, {sku.quantityPerLot} {sku.unit}(s)
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        // Remove this SKU from the list
                        const newSkus = [...addedSkus];
                        newSkus.splice(index, 1);
                        setAddedSkus(newSkus);
                      }}
                      className="text-destructive dark:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* SKU Name */}
          <FormField
            control={form.control}
            name="skuName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground dark:text-gray-200">SKU Name</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Update other form fields based on selected SKU
                    updateFormWithSkuData(value);
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-gray-100">
                      <SelectValue placeholder="Select an SKU" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background dark:bg-gray-800 border-border dark:border-gray-600">
                    {skuOptions.map((sku) => (
                      <SelectItem
                        key={sku.value}
                        value={sku.value}
                        className="text-foreground dark:text-gray-100 hover:bg-accent dark:hover:bg-gray-700 focus:bg-accent dark:focus:bg-gray-700"
                      >
                        {sku.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-destructive dark:text-red-400" />
              </FormItem>
            )}
          />

          {/* SKU Type */}
          <FormField
            control={form.control}
            name="skuType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground dark:text-gray-200">SKU Type</FormLabel>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="primary-sku"
                      value="primary"
                      checked={field.value === "primary"}
                      onChange={() => field.onChange("primary")}
                      className="h-4 w-4 text-primary border-gray-600 focus:ring-primary"
                    />
                    <label htmlFor="primary-sku" className="text-foreground dark:text-gray-200">Primary SKU</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="secondary-sku"
                      value="secondary"
                      checked={field.value === "secondary"}
                      onChange={() => field.onChange("secondary")}
                      className="h-4 w-4 text-primary border-gray-600 focus:ring-primary"
                    />
                    <label htmlFor="secondary-sku" className="text-foreground dark:text-gray-200">Secondary SKU</label>
                  </div>
                </div>
                <FormMessage className="text-destructive dark:text-red-400" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity per Production Lot */}
            <FormField
              control={form.control}
              name="quantityPerLot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-gray-200">Quantity per Production Lot</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1"
                      className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-gray-100 placeholder:text-muted-foreground dark:placeholder:text-gray-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-destructive dark:text-red-400" />
                </FormItem>
              )}
            />

            {/* Unit */}
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-gray-200">Unit</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background dark:bg-gray-800 border-border dark:border-gray-600 text-foreground dark:text-gray-100">
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background dark:bg-gray-800 border-border dark:border-gray-600">
                      <SelectItem value="kg" className="text-foreground dark:text-gray-100 hover:bg-accent dark:hover:bg-gray-700">KG</SelectItem>
                      <SelectItem value="count" className="text-foreground dark:text-gray-100 hover:bg-accent dark:hover:bg-gray-700">Count</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-destructive dark:text-red-400" />
                </FormItem>
              )}
            />
          </div>
          
          {/* Save SKU Details Button */}
          <div className="flex justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={saveSkuDetails}
              className="bg-accent hover:bg-accent/90 text-accent-foreground border-accent-foreground/20"
            >
              Save SKU
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-border dark:border-gray-600 text-foreground dark:text-gray-200 hover:bg-accent dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
