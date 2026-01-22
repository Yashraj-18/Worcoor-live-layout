"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Tag, Plus, Search, Edit, Trash2 } from "lucide-react"

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

import { apiService } from "@/src/services/apiService"
import { api_url } from "@/src/constants/api_url"

const SKUS_STORAGE_KEY = "worcoor-skus"

type BackendSkuCategory = "raw_material" | "finished_good"
type BackendSkuUnit = "kg" | "liters" | "pieces"

interface BackendSku {
  id: string
  sku_name: string
  sku_category: BackendSkuCategory
  quantity: number
  sku_unit: BackendSkuUnit
  effective_date: string
  expiry_date?: string
  location_tag_id?: string
}

const sampleSkus: BackendSku[] = [
  {
    id: "SKU-001",
    sku_name: "Oak Wood Panel",
    sku_category: "raw_material",
    quantity: 150,
    sku_unit: "pieces",
    effective_date: "2024-01-15",
    expiry_date: "",
    location_tag_id: "",
  },
]

export default function SkuManagementPage() {
  const [skus, setSkus] = useState<BackendSku[]>([])
  const [locationTags, setLocationTags] = useState<{ value: string; label: string }[]>([])

  const [search, setSearch] = useState("")
  const [selectedSku, setSelectedSku] = useState<BackendSku | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SKUS_STORAGE_KEY)
    if (stored) {
      try {
        setSkus(JSON.parse(stored))
        return
      } catch {
      }
    }
    localStorage.setItem(SKUS_STORAGE_KEY, JSON.stringify(sampleSkus))
    setSkus(sampleSkus)
  }, [])

  useEffect(() => {
    if (skus.length > 0) {
      localStorage.setItem(SKUS_STORAGE_KEY, JSON.stringify(skus))
    }
  }, [skus])

  useEffect(() => {
    const fetchLocationTags = async () => {
      try {
        const apiId = "68565e75f70897486c46853b"
        const response = await apiService.get({
          path: `${api_url.worCoorService.referenceDataTable.listTableEntry}/${apiId}`,
          isAuth: true,
        })
        const rawData = response.data?.data || []
        const formatted = rawData.map((item: any) => ({
          value: item.id,
          label: item.detail?.name || "",
        }))
        setLocationTags(formatted)
      } catch {
        setLocationTags([])
      }
    }
    fetchLocationTags()
  }, [])

  const getLocationTagNameById = (id?: string) => {
    if (!id) return "-"
    const found = locationTags.find((t) => t.value === id)
    return found?.label || id
  }

  const filteredSkus = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return skus
    return skus.filter((s) => s.sku_name.toLowerCase().includes(q))
  }, [search, skus])

  const handleAddSku = (data: Omit<BackendSku, "id"> & Partial<Pick<BackendSku, "id">>) => {
    const newSku: BackendSku = {
      id: `SKU-${Date.now()}`,
      sku_name: data.sku_name,
      sku_category: data.sku_category,
      quantity: Number(data.quantity ?? 0),
      sku_unit: data.sku_unit,
      effective_date: data.effective_date,
      expiry_date: data.expiry_date || "",
      location_tag_id: data.location_tag_id || "",
    }
    setSkus((prev) => [newSku, ...prev])
    setIsAddOpen(false)
  }

  const handleEditSku = (data: any) => {
    if (!selectedSku) return
    setSkus((prev) =>
      prev.map((s) =>
        s.id === selectedSku.id
          ? {
              ...s,
              sku_name: data.sku_name,
              sku_category: data.sku_category,
              quantity: Number(data.quantity ?? 0),
              sku_unit: data.sku_unit,
              effective_date: data.effective_date,
              expiry_date: data.expiry_date || "",
              location_tag_id: data.location_tag_id || "",
            }
          : s,
      ),
    )
    setIsEditOpen(false)
    setSelectedSku(null)
  }

  const handleDeleteSku = () => {
    if (!selectedSku) return
    setSkus((prev) => prev.filter((s) => s.id !== selectedSku.id))
    setIsDeleteOpen(false)
    setSelectedSku(null)
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
                    <TableCell className="font-medium">{sku.sku_name}</TableCell>
                    <TableCell>{sku.sku_category}</TableCell>
                    <TableCell>{sku.quantity}</TableCell>
                    <TableCell>{sku.sku_unit}</TableCell>
                    <TableCell>{sku.effective_date || "-"}</TableCell>
                    <TableCell>{sku.expiry_date || "-"}</TableCell>
                    <TableCell>{getLocationTagNameById(sku.location_tag_id)}</TableCell>
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
                  <TableCell colSpan={8} className="h-24 text-center">
                    No SKUs found.
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
              <SkuForm onSubmit={handleAddSku as any} onCancel={() => setIsAddOpen(false)} locationTags={locationTags} />
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
                  initialData={selectedSku as any}
                  onSubmit={handleEditSku}
                  onCancel={() => {
                    setIsEditOpen(false)
                    setSelectedSku(null)
                  }}
                  locationTags={locationTags}
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
                  You are about to delete: <strong>{selectedSku.sku_name}</strong>
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