"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Tag, Plus, Search, Edit, Trash2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import PageHeader from "@/components/layout/page-header"
import SkuForm from "@/components/inventory/sku-form"
import { skuService, type Sku } from "@/src/services/skus"
import { locationTagService } from "@/src/services/locationTags"
import { orgUnitService } from "@/src/services/orgUnits"
import { useToast } from "@/components/ui/use-toast"

export default function SkuManagementPage() {
  const [skus, setSkus] = useState<Sku[]>([])
  const [locationTags, setLocationTags] = useState<{ value: string; label: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const [search, setSearch] = useState("")
  const [selectedSku, setSelectedSku] = useState<Sku | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const loadLocationTags = useCallback(async () => {
    try {
      const units = await orgUnitService.list()
      const tagOptions: { value: string; label: string }[] = []

      await Promise.all(
        units.map(async (unit) => {
          try {
            const tags = await locationTagService.listByUnit(unit.id)
            tags.forEach((tag) => {
              tagOptions.push({
                value: tag.id,
                label: `${unit.unitName} • ${tag.locationTagName}`,
              })
            })
          } catch (error) {
            console.error(`Failed to load location tags for unit ${unit.unitName}`, error)
          }
        }),
      )

      setLocationTags(tagOptions)
    } catch (error) {
      console.error("Failed to load organization units for location tags", error)
      setLocationTags([])
    }
  }, [])

  const loadSkus = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await skuService.list()
      setSkus(response.items)
    } catch (error) {
      console.error("Failed to load SKUs", error)
      setErrorMessage("Failed to load SKUs. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSkus()
    loadLocationTags()
  }, [loadSkus, loadLocationTags])

  const getLocationTagLabel = (sku: Sku) => {
    if (sku.locationTagName) return sku.locationTagName
    if (!sku.locationTagId) return "-"
    return locationTags.find((tag) => tag.value === sku.locationTagId)?.label ?? sku.locationTagId
  }

  const filteredSkus = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return skus
    return skus.filter((s) => s.skuName.toLowerCase().includes(q))
  }, [search, skus])

  const mapFormValuesToPayload = (values: any) => ({
    skuId: values.skuId ?? null,
    skuName: values.skuName,
    skuCategory: values.skuCategory,
    quantity: values.quantity,
    skuUnit: values.skuUnit,
    effectiveDate: values.effectiveDate,
    expiryDate: values.expiryDate ? values.expiryDate : null,
    locationTagId: values.locationTagId ?? null,
  })

  const handleAddSku = async (data: any) => {
    setIsSubmitting(true)
    try {
      const created = await skuService.create(mapFormValuesToPayload(data))
      setSkus((prev) => [created, ...prev])
      setIsAddOpen(false)
      toast({ title: "SKU created", description: `${created.skuName} has been added successfully.` })
    } catch (error: any) {
      console.error("Failed to create SKU", error)
      toast({
        title: "Failed to create SKU",
        description: error?.response?.data?.error ?? "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSku = async (data: any) => {
    if (!selectedSku) return
    setIsSubmitting(true)
    try {
      const updated = await skuService.update(selectedSku.id, mapFormValuesToPayload(data))
      setSkus((prev) => prev.map((sku) => (sku.id === updated.id ? updated : sku)))
      setIsEditOpen(false)
      setSelectedSku(null)
      toast({ title: "SKU updated", description: `${updated.skuName} has been updated.` })
    } catch (error: any) {
      console.error("Failed to update SKU", error)
      toast({
        title: "Failed to update SKU",
        description: error?.response?.data?.error ?? "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSku = async () => {
    if (!selectedSku) return
    try {
      await skuService.remove(selectedSku.id)
      setSkus((prev) => prev.filter((sku) => sku.id !== selectedSku.id))
      toast({ title: "SKU deleted", description: `${selectedSku.skuName} has been removed.` })
    } catch (error: any) {
      console.error("Failed to delete SKU", error)
      toast({
        title: "Failed to delete SKU",
        description: error?.response?.data?.error ?? "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteOpen(false)
      setSelectedSku(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading SKUs...</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden">
      <div className="h-full skus flex flex-col gap-2">
        <div className="flex items-center pb-2 sm:pb-4">
          <PageHeader title="SKU Management" description="Manage SKUs and inventory levels" icon={Tag} />
          <div className="flex items-center ml-auto gap-2">
            <Button className="border border-primary bg-darkblue text-white hover:bg-darkblue/90" onClick={() => setIsAddOpen(true)}>
              <span className="hidden md:block">Add SKU</span>
              <Plus className="h-4 w-4 block text-white md:hidden" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute align-middle h-full text-muted-foreground left-1 pl-1" size={22} />
            <Input
              type="search"
              placeholder="Search SKUs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 bg-background border-input rounded-xl pl-8 focus:outline-transparent focus:ring-0"
            />
          </div>
        </div>

        <div className="h-full grow rounded-2xl border-0 sm:border border-slate-200 backdrop-blur-sm shadow-soft dark:border-slate-700 dark:bg-slate-800/80 p-0 sm:p-6 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU ID</TableHead>
                <TableHead>SKU Name</TableHead>
                <TableHead>SKU Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Location Tag</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSkus.length ? (
                filteredSkus.map((sku) => (
                  <TableRow key={sku.id}>
                    <TableCell>{sku.skuId || "-"}</TableCell>
                    <TableCell className="font-medium">{sku.skuName}</TableCell>
                    <TableCell>{sku.skuCategory}</TableCell>
                    <TableCell>{sku.quantity}</TableCell>
                    <TableCell>{sku.skuUnit}</TableCell>
                    <TableCell>{sku.effectiveDate || "-"}</TableCell>
                    <TableCell>{sku.expiryDate || "-"}</TableCell>
                    <TableCell>{getLocationTagLabel(sku)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSku(sku)
                            setIsEditOpen(true)
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedSku(sku)
                            setIsDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    {errorMessage ?? "No SKUs found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={() => setIsAddOpen(false)}
            className="max-w-3xl md:max-h-[90dvh] min-h-[60dvh] md:h-[70dvh] h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden dark:bg-modal p-0 gap-0"
          >
            <DialogHeader className="px-2 md:px-6 pt-6 pb-[1.1rem] border-b">
              <DialogTitle>Add SKU</DialogTitle>
              <DialogDescription>Add a new SKU to the inventory system.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pt-4">
              <SkuForm onSubmit={handleAddSku} onCancel={() => setIsAddOpen(false)} locationTags={locationTags} isSubmitting={isSubmitting} />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={() => setIsEditOpen(false)}
            className="max-w-3xl md:max-h-[90dvh] min-h-[60dvh] md:h-[70dvh] h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden dark:bg-modal p-0 gap-0"
          >
            <DialogHeader className="px-2 md:px-6 pt-6 pb-[1.1rem] border-b">
              <DialogTitle>Edit SKU</DialogTitle>
              <DialogDescription>Make changes to the SKU details.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pt-4">
              {selectedSku && (
                <SkuForm
                  initialData={{
                    skuId: selectedSku.skuId ?? undefined,
                    skuName: selectedSku.skuName,
                    skuCategory: selectedSku.skuCategory,
                    quantity: selectedSku.quantity,
                    skuUnit: selectedSku.skuUnit,
                    effectiveDate: selectedSku.effectiveDate,
                    expiryDate: selectedSku.expiryDate ?? undefined,
                    locationTagId: selectedSku.locationTagId ?? undefined,
                  }}
                  onSubmit={handleEditSku}
                  onCancel={() => {
                    setIsEditOpen(false)
                    setSelectedSku(null)
                  }}
                  locationTags={locationTags}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="dark:bg-modal max-w-full sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete SKU</DialogTitle>
              <DialogDescription>Are you sure you want to delete this SKU? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            {selectedSku && (
              <div className="pb-4 pt-2">
                <p className="text-sm/10 leading-[1.4] mb-3">
                  You are about to delete: <strong>{selectedSku.skuName}</strong>
                </p>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteSku}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}