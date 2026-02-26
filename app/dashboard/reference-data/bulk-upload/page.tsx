"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Upload, FileText, Database, Package, ArrowRight, CheckCircle, AlertCircle, Loader2, RefreshCw, Plus, Edit, Trash2, Save, X, Download, Clock } from "lucide-react"
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { orgUnitService } from "@/src/services/orgUnits"
import { locationTagService, type LocationTag, type MeasurementUnit, type CreateLocationTagInput } from "@/src/services/locationTags"
import { skuService, type Sku, type CreateSkuInput } from "@/src/services/skus"
import { assetService, type Asset, type CreateAssetInput } from "@/src/services/assets"

const emptyToUndefined = (value: unknown) => {
  if (value === undefined || value === null) return undefined
  const str = String(value).trim()
  return str.length === 0 ? undefined : str
}

const parseOptionalNumber = (value: unknown) => {
  const str = emptyToUndefined(value)
  if (str === undefined) return undefined
  const parsed = Number(str)
  return Number.isNaN(parsed) ? undefined : parsed
}

const measurementUnits: MeasurementUnit[] = ['meters', 'feet', 'inches', 'centimeters']
const MAX_FETCH_LIMIT = 100

const toMeasurementUnit = (value: unknown): MeasurementUnit | null => {
  const str = emptyToUndefined(value)
  if (!str) return null
  const lower = str.toLowerCase()
  return measurementUnits.includes(lower as MeasurementUnit) ? (lower as MeasurementUnit) : null
}

const normalizeIdentifier = (value: unknown) => {
  if (value === undefined || value === null) return ""
  return String(value).trim().toLowerCase()
}

const findSkuRecord = (records: Sku[], identifier: unknown) => {
  const normalized = normalizeIdentifier(identifier)
  if (!normalized) return null
  return (
    records.find(
      (sku) => normalizeIdentifier(sku.id) === normalized || normalizeIdentifier(sku.skuId) === normalized,
    ) ?? null
  )
}

const findAssetRecord = (records: Asset[], identifier: unknown) => {
  const normalized = normalizeIdentifier(identifier)
  if (!normalized) return null
  return (
    records.find(
      (asset) => normalizeIdentifier(asset.id) === normalized || normalizeIdentifier(asset.assetId) === normalized,
    ) ?? null
  )
}

const findLocationTagRecord = (records: LocationTag[], identifier: unknown) => {
  const normalized = normalizeIdentifier(identifier)
  if (!normalized) return null
  return (
    records.find(
      (tag) =>
        normalizeIdentifier(tag.id) === normalized || normalizeIdentifier(tag.locationTagName) === normalized,
    ) ?? null
  )
}

const mapSkuToDisplayRow = (sku: Sku) => ({
  sku_id: sku.skuId ?? "",
  sku_name: sku.skuName,
  sku_category: sku.skuCategory,
  sku_unit: sku.skuUnit,
  quantity: sku.quantity,
  effective_date: sku.effectiveDate,
  expiry_date: sku.expiryDate ?? "",
  location_tag_name: sku.locationTagName ?? "",
})

const mapAssetToDisplayRow = (asset: Asset) => ({
  asset_id: asset.assetId ?? "",
  asset_name: asset.assetName,
  asset_type: asset.assetType,
  location_tag_name: asset.locationTagName ?? "",
  description: "",
})

const mapLocationTagToDisplayRow = (tag: LocationTag, unitCode?: string | null) => {
  const length = tag.length ?? ""
  const breadth = tag.breadth ?? ""
  const height = tag.height ?? ""
  const hasDimensions = typeof tag.length === "number" && typeof tag.breadth === "number" && typeof tag.height === "number"
  const volume = hasDimensions ? Number((tag.length! * tag.breadth! * tag.height!).toFixed(3)) : ""

  return {
    location_tag_id: tag.id,
    location_tag: tag.locationTagName,
    unit_id: unitCode ?? tag.unitId,
    length,
    breadth,
    height,
    unit_of_measurement: tag.unitOfMeasurement ?? "",
    description: "",
    volume,
  }
}

// Normalize common SKU unit abbreviations to backend enum values
const SKU_UNIT_ALIASES: Record<string, string> = {
  pcs: 'pieces', pc: 'pieces', piece: 'pieces', pieces: 'pieces',
  kg: 'kg', kgs: 'kg',
  ltr: 'liters', ltrs: 'liters', liter: 'liters', litre: 'liters', litres: 'liters', liters: 'liters', l: 'liters',
  box: 'boxes', bx: 'boxes', boxes: 'boxes',
}

const normalizeSkuUnit = (value: string): string => {
  const key = String(value).trim().toLowerCase()
  return SKU_UNIT_ALIASES[key] ?? key
}

// Backend schema definitions - matching exact form fields
const BACKEND_SCHEMAS = {
  skus: {
    fields: ['sku_id', 'sku_name', 'sku_category', 'sku_unit', 'quantity', 'effective_date', 'expiry_date', 'location_tag_name'],
    required: ['sku_name', 'sku_category', 'sku_unit', 'quantity', 'effective_date'],
    types: {
      sku_id: 'varchar',
      sku_name: 'varchar',
      sku_category: 'varchar',
      sku_unit: 'varchar',
      quantity: 'numeric',
      effective_date: 'date',
      expiry_date: 'date',
      location_tag_name: 'varchar',
    }
  },
  location_tags: {
    fields: ['location_tag', 'unit_id', 'length', 'breadth', 'height', 'unit_of_measurement', 'description'],
    required: ['location_tag', 'unit_id'],
    types: {
      location_tag: 'varchar',
      unit_id: 'varchar',
      length: 'numeric',
      breadth: 'numeric', 
      height: 'numeric',
      unit_of_measurement: 'varchar',
      description: 'varchar'
    }
  },
  assets: {
    fields: ['asset_id', 'asset_name', 'asset_type', 'location_tag_name', 'description'],
    required: ['asset_name', 'asset_type'],
    types: {
      asset_id: 'varchar',
      asset_name: 'varchar',
      asset_type: 'varchar',
      location_tag_name: 'varchar',
      description: 'varchar'
    }
  }
}

type UploadType = keyof typeof BACKEND_SCHEMAS

interface OrgUnitOption {
  id: string
  unitCode: string | null
  unitName: string
  unitType: "warehouse" | "production" | "office"
  status: "LIVE" | "OFFLINE" | "MAINTENANCE" | "PLANNING"
  description?: string | null
  area?: string | null
}

type ApiRecordCache = {
  skus: Sku[]
  assets: Asset[]
  location_tags: LocationTag[]
}

type CrudOperation = "create" | "update" | "delete"

export default function BulkUploadPage() {
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState<UploadType>("skus")
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [uploadResults, setUploadResults] = useState<{
    success: number
    errors: string[]
    total: number
  } | null>(null)
  const [crudOperation, setCrudOperation] = useState<CrudOperation>("create")
  const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string>("")
  const [isOperationConfirmed, setIsOperationConfirmed] = useState(false)
  const [isCreatingOrgUnit, setIsCreatingOrgUnit] = useState(false)
  const [newOrgUnitId, setNewOrgUnitId] = useState("")
  const [newOrgUnitName, setNewOrgUnitName] = useState("")
  const [newOrgUnitType, setNewOrgUnitType] = useState<"warehouse" | "production" | "office">("warehouse")
  const [newOrgUnitStatus, setNewOrgUnitStatus] = useState<"LIVE" | "OFFLINE" | "MAINTENANCE" | "PLANNING">("LIVE")
  const [newOrgUnitDescription, setNewOrgUnitDescription] = useState("")
  const [newOrgUnitArea, setNewOrgUnitArea] = useState("")
  const [importResults, setImportResults] = useState<{
    imported: number
    failed: number
    errors: string[]
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([])
  const [isLoadingOrgUnits, setIsLoadingOrgUnits] = useState(false)
  const [apiRecords, setApiRecords] = useState<ApiRecordCache>({ skus: [], assets: [], location_tags: [] })
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [displayedData, setDisplayedData] = useState<any[]>([])
  const [unitLocationTags, setUnitLocationTags] = useState<Record<string, LocationTag[]>>({})
  const [isLoadingLocationTags, setIsLoadingLocationTags] = useState(false)
  const unitLocationTagsRef = useRef<Record<string, LocationTag[]>>({})
  const selectedOrgUnit = useMemo(() => orgUnits.find((unit) => unit.id === selectedOrgUnitId) ?? null, [orgUnits, selectedOrgUnitId])
  const locationTagsForSelectedUnit = useMemo(
    () => (selectedOrgUnitId ? unitLocationTags[selectedOrgUnitId] ?? [] : []),
    [selectedOrgUnitId, unitLocationTags],
  )

  const orgUnitsById = useMemo(() => {
    const map: Record<string, OrgUnitOption> = {}
    orgUnits.forEach((unit) => {
      map[unit.id] = unit
    })
    return map
  }, [orgUnits])

  const orgUnitsByCode = useMemo(() => {
    const map: Record<string, OrgUnitOption> = {}
    orgUnits.forEach((unit) => {
      if (unit.unitCode) {
        map[normalizeIdentifier(unit.unitCode)] = unit
      }
    })
    return map
  }, [orgUnits])

  const getOrgUnitCodeByInternalId = useCallback(
    (internalId?: string | null) => {
      if (!internalId) return null
      return orgUnitsById[internalId]?.unitCode ?? null
    },
    [orgUnitsById],
  )

  const resolveOrgUnitInternalIdByCode = useCallback(
    (value: unknown) => {
      const normalized = normalizeIdentifier(value)
      if (!normalized) return null
      return orgUnitsByCode[normalized]?.id ?? null
    },
    [orgUnitsByCode],
  )

  const cacheLocationTags = useCallback((unitId: string, tags: LocationTag[]) => {
    unitLocationTagsRef.current = { ...unitLocationTagsRef.current, [unitId]: tags }
    setUnitLocationTags((prev) => ({ ...prev, [unitId]: tags }))
  }, [])

  const loadLocationTagsForUnit = useCallback(
    async (unitId: string) => {
      if (!unitId) return null
      if (unitLocationTagsRef.current[unitId]) {
        return unitLocationTagsRef.current[unitId]
      }

      setIsLoadingLocationTags(true)
      try {
        const tags = await locationTagService.listByUnit(unitId)
        cacheLocationTags(unitId, tags)
        return tags
      } catch (error) {
        console.error('Failed to load location tags for unit', unitId, error)
        toast({
          title: 'Failed to load location tags',
          description: 'Location tag names are required for SKU uploads. Please try again.',
          variant: 'destructive',
        })
        return null
      } finally {
        setIsLoadingLocationTags(false)
      }
    },
    [cacheLocationTags, toast],
  )

  useEffect(() => {
    if (!selectedOrgUnitId) return
    if (unitLocationTagsRef.current[selectedOrgUnitId]) return
    void loadLocationTagsForUnit(selectedOrgUnitId)
  }, [selectedOrgUnitId, loadLocationTagsForUnit])

  const resolveLocationTagId = useCallback(
    (value: unknown) => {
      if (!selectedOrgUnitId) return null
      const tags = unitLocationTagsRef.current[selectedOrgUnitId] ?? []
      const record = findLocationTagRecord(tags, value)
      return record?.id ?? null
    },
    [selectedOrgUnitId],
  )

  const getRecordsForType = (type: UploadType) => {
    if (type === "skus") return apiRecords.skus
    if (type === "assets") return apiRecords.assets
    return apiRecords.location_tags
  }

  const updateRecordCache = (type: UploadType, records: Sku[] | Asset[] | LocationTag[]) => {
    setApiRecords((prev) => {
      if (type === "skus") {
        return { ...prev, skus: records as Sku[] }
      }
      if (type === "assets") {
        return { ...prev, assets: records as Asset[] }
      }
      return { ...prev, location_tags: records as LocationTag[] }
    })
  }

  // Reset operation confirmation when org unit or operation changes
  useEffect(() => {
    setIsOperationConfirmed(false)
  }, [selectedOrgUnitId, crudOperation])

  const loadOrgUnits = useCallback(async () => {
    setIsLoadingOrgUnits(true)
    try {
      const units = await orgUnitService.list()
      const warehouseUnits = units.filter((unit) => unit.unitType === "warehouse")
      setOrgUnits(
        warehouseUnits.map((unit) => ({
          id: unit.id,
          unitCode: unit.unitId ?? null,
          unitName: unit.unitName,
          unitType: unit.unitType,
          status: unit.status,
          description: unit.description ?? null,
          area: unit.area ?? null,
        })),
      )
      if (!selectedOrgUnitId && warehouseUnits.length > 0) {
        setSelectedOrgUnitId(warehouseUnits[0].id)
      }
    } catch (error) {
      console.error("Failed to load org units", error)
      toast({
        title: "Failed to load org units",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingOrgUnits(false)
    }
  }, [selectedOrgUnitId, toast])

  useEffect(() => {
    void loadOrgUnits()
  }, [loadOrgUnits])

  const loadDisplayedData = useCallback(async () => {
    if (!selectedOrgUnitId) {
      setDisplayedData([])
      updateRecordCache(uploadType, [])
      return
    }

    setIsLoadingData(true)
    try {
      if (uploadType === "skus") {
        await loadLocationTagsForUnit(selectedOrgUnitId)
        const response = await skuService.list({ unitId: selectedOrgUnitId, limit: MAX_FETCH_LIMIT })
        updateRecordCache("skus", response.items)
        const rows = response.items.map(mapSkuToDisplayRow)
        setDisplayedData(rows)
      } else if (uploadType === "assets") {
        await loadLocationTagsForUnit(selectedOrgUnitId)
        const response = await assetService.list({ unitId: selectedOrgUnitId, limit: MAX_FETCH_LIMIT })
        updateRecordCache("assets", response.items)
        const rows = response.items.map(mapAssetToDisplayRow)
        setDisplayedData(rows)
      } else if (uploadType === "location_tags") {
        const tags = await locationTagService.listByUnit(selectedOrgUnitId)
        cacheLocationTags(selectedOrgUnitId, tags)
        updateRecordCache("location_tags", tags)
        const rows = tags.map((tag) => mapLocationTagToDisplayRow(tag, getOrgUnitCodeByInternalId(tag.unitId)))
        setDisplayedData(rows)
      }
    } catch (error) {
      console.error("Failed to load data", error)
      toast({
        title: "Failed to load data",
        description: "Showing demo data instead.",
        variant: "destructive",
      })
      updateRecordCache(uploadType, [])
      setDisplayedData([])
    } finally {
      setIsLoadingData(false)
    }
  }, [uploadType, selectedOrgUnitId, loadLocationTagsForUnit, cacheLocationTags, getOrgUnitCodeByInternalId, toast])

  // Load displayed data whenever uploadType or selected org unit changes
  useEffect(() => {
    void loadDisplayedData()
  }, [loadDisplayedData])

  const validateDataType = (value: any, type: string, fieldName: string): { valid: boolean; error?: string } => {
    if (value === null || value === undefined || value === '') {
      return { valid: true }
    }

    switch (type) {
      case 'uuid4':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(String(value))) {
          return { valid: false, error: `${fieldName} must be a valid UUID` }
        }
        break
      case 'varchar':
        if (typeof value !== 'string') {
          return { valid: false, error: `${fieldName} must be a string` }
        }
        break
      case 'int4':
        const intValue = parseInt(String(value))
        if (isNaN(intValue) || !Number.isInteger(intValue)) {
          return { valid: false, error: `${fieldName} must be an integer` }
        }
        break
      case 'numeric':
        const numValue = parseFloat(String(value))
        if (isNaN(numValue)) {
          return { valid: false, error: `${fieldName} must be a number` }
        }
        break
      case 'date':
        const dateStr = String(value).trim()
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(dateStr)) {
          // Try to parse other common date formats from Excel
          const parsed = new Date(dateStr)
          if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
            // Parseable date but wrong format — will be normalized later
            return { valid: true }
          }
          return { valid: false, error: `${fieldName} must be in YYYY-MM-DD format` }
        }
        break
      case 'timestamptz':
        const timestamp = new Date(String(value))
        if (isNaN(timestamp.getTime())) {
          return { valid: false, error: `${fieldName} must be a valid timestamp` }
        }
        break
    }
    return { valid: true }
  }

  const downloadErrorReport = () => {
    if (!uploadResults || uploadResults.errors.length === 0) return

    const errorReport = [
      'Error Report - Bulk Upload',
      `Date: ${new Date().toLocaleString()}`,
      `Upload Type: ${uploadType}`,
      `Total Rows: ${uploadResults.total}`,
      `Valid Rows: ${uploadResults.success}`,
      `Errors Found: ${uploadResults.errors.length}`,
      '',
      'Detailed Errors:',
      '-------------------',
      ...uploadResults.errors
    ].join('\n')

    const blob = new Blob([errorReport], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-report-${uploadType}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCreateOrgUnit = async () => {
    if (!newOrgUnitId.trim() || !newOrgUnitName.trim()) return

    try {
      const created = await orgUnitService.create({
        unitId: newOrgUnitId.trim(),
        unitName: newOrgUnitName.trim(),
        unitType: newOrgUnitType,
        status: newOrgUnitStatus,
        description: emptyToUndefined(newOrgUnitDescription) ?? null,
        area: emptyToUndefined(newOrgUnitArea) ?? null,
      })

      setOrgUnits((prev) => [
        ...prev,
        {
          id: created.id,
          unitCode: created.unitId ?? null,
          unitName: created.unitName,
          unitType: created.unitType,
          status: created.status,
          description: created.description,
          area: created.area,
        },
      ])
      setSelectedOrgUnitId(created.id)

      setNewOrgUnitId("")
      setNewOrgUnitName("")
      setNewOrgUnitType("warehouse")
      setNewOrgUnitStatus("LIVE")
      setNewOrgUnitDescription("")
      setNewOrgUnitArea("")
      setIsCreatingOrgUnit(false)
      toast({ title: "Org unit created", description: `${created.unitName} is ready for uploads.` })
    } catch (error) {
      console.error("Error creating org unit:", error)
      toast({ title: "Failed to create org unit", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const parseFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()

      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => {
            if (results.errors.length > 0) {
              reject(new Error(`CSV parsing errors: ${results.errors.map((e: any) => e.message).join(', ')}`))
            } else {
              resolve(results.data)
            }
          },
          error: (error: any) => reject(error)
        })
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: 'array', cellDates: true })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' })

            const headers = jsonData[0] as string[]
            const rows = jsonData.slice(1) as any[][]
            const objects = rows.map(row => {
              const obj: any = {}
              headers.forEach((header, index) => {
                let value = row[index]
                // Normalize date values: convert Date objects or Excel serial numbers to YYYY-MM-DD
                if (value instanceof Date && !isNaN(value.getTime())) {
                  const yyyy = value.getFullYear()
                  const mm = String(value.getMonth() + 1).padStart(2, '0')
                  const dd = String(value.getDate()).padStart(2, '0')
                  value = `${yyyy}-${mm}-${dd}`
                } else if (typeof value === 'number' && value > 25569 && value < 2958466) {
                  // Excel serial number range — convert to date
                  const excelEpoch = new Date(Date.UTC(1899, 11, 30))
                  const jsDate = new Date(excelEpoch.getTime() + value * 86400000)
                  const yyyy = jsDate.getUTCFullYear()
                  const mm = String(jsDate.getUTCMonth() + 1).padStart(2, '0')
                  const dd = String(jsDate.getUTCDate()).padStart(2, '0')
                  value = `${yyyy}-${mm}-${dd}`
                }
                obj[header] = value
              })
              return obj
            })

            resolve(objects)
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = () => reject(new Error('Failed to read Excel file'))
        reader.readAsArrayBuffer(file)
      } else {
        reject(new Error('Unsupported file format. Please use CSV or Excel files.'))
      }
    })
  }

  const validateData = (
    data: any[],
    type: UploadType,
    operation: CrudOperation,
    existingRecords: Sku[] | Asset[] | LocationTag[],
    defaultUnitCode?: string,
  ): { valid: any[]; errors: string[] } => {
    const errors: string[] = []
    const valid: any[] = []

    const schema = BACKEND_SCHEMAS[type as keyof typeof BACKEND_SCHEMAS]
    if (!schema) {
      errors.push(`Unknown upload type: ${type}`)
      return { valid: [], errors }
    }

    data.forEach((row, index) => {
      if (type === 'location_tags' && !row.unit_id && defaultUnitCode) {
        row.unit_id = defaultUnitCode
      }

      let isValid = true
      const rowErrors: string[] = []

      const rowFields = Object.keys(row)
      const invalidFields = rowFields.filter(field => !schema.fields.includes(field))
      if (invalidFields.length > 0) {
        rowErrors.push(`Invalid fields: ${invalidFields.join(', ')}. Expected fields: ${schema.fields.join(', ')}`)
        isValid = false
      }

      for (const requiredField of schema.required) {
        if (!row[requiredField] || String(row[requiredField]).trim() === '') {
          rowErrors.push(`Missing required field: ${requiredField}`)
          isValid = false
        }
      }

      for (const field of schema.fields) {
        if (row[field] !== null && row[field] !== undefined && row[field] !== '') {
          const fieldType = schema.types[field as keyof typeof schema.types]
          const typeValidation = validateDataType(row[field], fieldType, field)
          if (!typeValidation.valid) {
            rowErrors.push(typeValidation.error!)
            isValid = false
          }
          // Normalize date fields to YYYY-MM-DD if they passed validation but aren't in the right format
          if (fieldType === 'date' && typeValidation.valid) {
            const dStr = String(row[field]).trim()
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
              const d = new Date(dStr)
              if (!isNaN(d.getTime())) {
                row[field] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              }
            }
          }
        }
      }

      if (type === 'location_tags') {
        const providedUnitCode = emptyToUndefined(row.unit_id)
        if (providedUnitCode) {
          const resolvedUnitId = resolveOrgUnitInternalIdByCode(providedUnitCode)
          if (!resolvedUnitId) {
            rowErrors.push(`unit_id "${row.unit_id}" was not found among your warehouses`)
            isValid = false
          }
        }
      } else if (type === 'assets' && operation !== 'delete') {
        const providedLocationTagName = emptyToUndefined(row.location_tag_name)
        if (providedLocationTagName) {
          const resolvedId = resolveLocationTagId(providedLocationTagName)
          if (!resolvedId) {
            rowErrors.push(`location_tag_name "${row.location_tag_name}" was not found in the selected warehouse`)
            isValid = false
          }
        }
      }

      // CRUD operation validation - use appropriate ID field for each type
      if (operation === 'delete' || operation === 'update') {
        let identifier: string | null = null
        if (type === 'skus') {
          identifier = emptyToUndefined(row.sku_id) ?? null
          if (!identifier) {
            rowErrors.push(`Missing sku_id for ${operation} operation`)
            isValid = false
          } else if (!findSkuRecord(existingRecords as Sku[], identifier)) {
            rowErrors.push(`SKU ${identifier} not found for ${operation}`)
            isValid = false
          }
          if (operation !== 'delete') {
            const providedLocationTagName = emptyToUndefined(row.location_tag_name)
            if (providedLocationTagName) {
              const resolvedId = resolveLocationTagId(providedLocationTagName)
              if (!resolvedId) {
                rowErrors.push(`location_tag_name "${row.location_tag_name}" was not found in the selected warehouse`)
                isValid = false
              }
            }
          }
        } else if (type === 'assets') {
          identifier = emptyToUndefined(row.asset_id) ?? null
          if (!identifier) {
            rowErrors.push(`Missing asset_id for ${operation} operation`)
            isValid = false
          } else if (!findAssetRecord(existingRecords as Asset[], identifier)) {
            rowErrors.push(`Asset ${identifier} not found for ${operation}`)
            isValid = false
          }
        } else if (type === 'location_tags') {
          identifier = emptyToUndefined(row.location_tag_id) ?? emptyToUndefined(row.location_tag) ?? null
          if (!identifier) {
            rowErrors.push(`Missing location_tag for ${operation} operation`)
            isValid = false
          } else if (!findLocationTagRecord(existingRecords as LocationTag[], identifier)) {
            rowErrors.push(`Location tag ${identifier} not found for ${operation}`)
            isValid = false
          }
        }
      }

      // L×B×H validation for location tags (matching form validation)
      if (type === 'location_tags') {
        const length = parseFloat(row.length) || 0
        const breadth = parseFloat(row.breadth) || 0
        const height = parseFloat(row.height) || 0

        const hasAnyDimension = row.length || row.breadth || row.height

        if (hasAnyDimension) {
          if (!row.length || !row.breadth || !row.height) {
            rowErrors.push('If you provide one dimension, you must provide all three (Length, Breadth, Height)')
            isValid = false
          } else if (length <= 0 || breadth <= 0 || height <= 0) {
            rowErrors.push('All dimensions must be positive numbers')
            isValid = false
          } else {
            if (!row.unit_of_measurement) {
              rowErrors.push('Unit of measurement is required when dimensions are provided')
              isValid = false
            } else if (!toMeasurementUnit(row.unit_of_measurement)) {
              rowErrors.push('Unit of measurement must be one of meters, feet, inches, or centimeters')
              isValid = false
            }
          }
        } else if (row.unit_of_measurement && !toMeasurementUnit(row.unit_of_measurement)) {
          rowErrors.push('Unit of measurement must be one of meters, feet, inches, or centimeters')
          isValid = false
        }
      }

      if (rowErrors.length > 0) {
        errors.push(`Row ${index + 1}: ${rowErrors.join('; ')}`)
      }

      if (isValid) {
        valid.push(row)
      }
    })

    return { valid, errors }
  }

  const getRecordForRow = (
    type: UploadType,
    row: any,
    existingRecords: Sku[] | Asset[] | LocationTag[],
  ) => {
    if (type === 'skus') {
      return findSkuRecord(existingRecords as Sku[], row.sku_id)
    }
    if (type === 'assets') {
      return findAssetRecord(existingRecords as Asset[], row.asset_id)
    }
    return findLocationTagRecord(existingRecords as LocationTag[], row.location_tag_id ?? row.location_tag)
  }

  const importData = async (
    data: any[],
    type: UploadType,
    operation: CrudOperation,
    unitId: string,
    existingRecords: Sku[] | Asset[] | LocationTag[],
  ): Promise<{ imported: number; failed: number; errors: string[] }> => {
    const errors: string[] = []
    let imported = 0
    let failed = 0

    try {
      if (type === 'skus') {
        if (operation === 'delete') {
          for (const row of data) {
            try {
              const record = getRecordForRow('skus', row, existingRecords)
              if (!record) {
                failed++
                errors.push(`SKU ${row.sku_id}: Not found for delete`)
                continue
              }
              await skuService.remove(record.id)
              imported++
            } catch (error) {
              failed++
              errors.push(`SKU ${row.sku_id}: ${error instanceof Error ? error.message : 'Delete failed'}`)
            }
          }
        } else {
          for (const row of data) {
            try {
              const hasLocationTagColumn = Object.prototype.hasOwnProperty.call(row, 'location_tag_name')
              const normalizedLocationTagName = emptyToUndefined(row.location_tag_name)
              const resolvedLocationTagId = normalizedLocationTagName ? resolveLocationTagId(normalizedLocationTagName) : null
              if (normalizedLocationTagName && !resolvedLocationTagId) {
                throw new Error(`Location tag "${row.location_tag_name}" not found for the selected warehouse`)
              }

              if (operation === 'create') {
                const payload: CreateSkuInput = {
                  skuId: emptyToUndefined(row.sku_id) ?? null,
                  skuName: row.sku_name,
                  skuCategory: row.sku_category,
                  skuUnit: normalizeSkuUnit(row.sku_unit) as any,
                  quantity: Number(row.quantity) || 0,
                  effectiveDate: row.effective_date,
                  expiryDate: emptyToUndefined(row.expiry_date) ?? null,
                  locationTagId: normalizedLocationTagName ? resolvedLocationTagId : null,
                }
                await skuService.create(payload)
              } else {
                const quantity = Number(row.quantity)
                const payload: Partial<CreateSkuInput> = {
                  skuName: row.sku_name,
                  skuCategory: row.sku_category,
                  skuUnit: row.sku_unit ? normalizeSkuUnit(row.sku_unit) as any : undefined,
                  quantity: Number.isNaN(quantity) ? undefined : quantity,
                  effectiveDate: row.effective_date,
                  expiryDate: emptyToUndefined(row.expiry_date) ?? null,
                  locationTagId:
                    hasLocationTagColumn
                      ? normalizedLocationTagName
                        ? resolvedLocationTagId
                        : null
                      : undefined,
                }
                const record = getRecordForRow('skus', row, existingRecords)
                if (!record) {
                  throw new Error('Record not found for update')
                }
                await skuService.update(record.id, payload)
              }
              imported++
            } catch (error) {
              failed++
              errors.push(`SKU ${row.sku_id || row.sku_name}: ${error instanceof Error ? error.message : 'Failed to import'}`)
            }
          }
        }
      } else if (type === 'assets') {
        if (operation === 'delete') {
          for (const row of data) {
            try {
              const record = getRecordForRow('assets', row, existingRecords)
              if (!record) {
                failed++
                errors.push(`Asset ${row.asset_id}: Not found for delete`)
                continue
              }
              await assetService.remove(record.id)
              imported++
            } catch (error) {
              failed++
              errors.push(`Asset ${row.asset_id}: ${error instanceof Error ? error.message : 'Delete failed'}`)
            }
          }
        } else {
          for (const row of data) {
            try {
              const hasLocationTagColumn = Object.prototype.hasOwnProperty.call(row, 'location_tag_name')
              const normalizedLocationTagName = emptyToUndefined(row.location_tag_name)
              const resolvedLocationTagId = normalizedLocationTagName ? resolveLocationTagId(normalizedLocationTagName) : null
              if (normalizedLocationTagName && !resolvedLocationTagId) {
                throw new Error(`Location tag "${row.location_tag_name}" not found for the selected warehouse`)
              }

              if (operation === 'create') {
                const payload: CreateAssetInput = {
                  assetId: emptyToUndefined(row.asset_id) ?? null,
                  assetName: row.asset_name,
                  assetType: row.asset_type,
                  locationTagId: normalizedLocationTagName ? resolvedLocationTagId : null,
                }
                await assetService.create(payload)
              } else {
                const payload: Partial<CreateAssetInput> = {
                  assetName: row.asset_name,
                  assetType: row.asset_type,
                  locationTagId:
                    hasLocationTagColumn
                      ? normalizedLocationTagName
                        ? resolvedLocationTagId
                        : null
                      : undefined,
                }
                const record = getRecordForRow('assets', row, existingRecords)
                if (!record) {
                  throw new Error('Record not found for update')
                }
                await assetService.update(record.id, payload)
              }
              imported++
            } catch (error) {
              failed++
              errors.push(`Asset ${row.asset_id || row.asset_name}: ${error instanceof Error ? error.message : 'Failed to import'}`)
            }
          }
        }
      } else if (type === 'location_tags') {
        if (operation === 'delete') {
          for (const row of data) {
            try {
              const record = getRecordForRow('location_tags', row, existingRecords)
              if (!record) {
                failed++
                errors.push(`Location tag ${row.location_tag}: Not found for delete`)
                continue
              }
              await locationTagService.remove(record.id)
              imported++
            } catch (error) {
              failed++
              errors.push(`Location tag ${row.location_tag}: ${error instanceof Error ? error.message : 'Delete failed'}`)
            }
          }
        } else {
          for (const row of data) {
            try {
              const measurementUnit = toMeasurementUnit(row.unit_of_measurement)
              const providedUnitCode = emptyToUndefined(row.unit_id)
              const resolvedUnitId = providedUnitCode
                ? resolveOrgUnitInternalIdByCode(providedUnitCode)
                : unitId
              if (!resolvedUnitId) {
                throw new Error(`unit_id "${row.unit_id ?? 'N/A'}" could not be matched to any warehouse`)
              }
              const payload: CreateLocationTagInput = {
                unitId: resolvedUnitId,
                locationTagName: row.location_tag,
                length: parseOptionalNumber(row.length),
                breadth: parseOptionalNumber(row.breadth),
                height: parseOptionalNumber(row.height),
                unitOfMeasurement: measurementUnit,
              }
              if (!payload.length && !payload.breadth && !payload.height) {
                payload.unitOfMeasurement = null
              }

              if (operation === 'create') {
                await locationTagService.create(payload)
              } else {
                const record = getRecordForRow('location_tags', row, existingRecords)
                if (!record) {
                  throw new Error('Record not found for update')
                }
                await locationTagService.update(record.id, payload)
              }
              imported++
            } catch (error) {
              failed++
              errors.push(`Location tag ${row.location_tag}: ${error instanceof Error ? error.message : 'Failed to import'}`)
            }
          }
        }
      }
    } catch (error) {
      console.error("Import error:", error)
      errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { imported, failed, errors }
  }

  const handleImport = async () => {
    if (parsedData.length === 0 || !selectedOrgUnitId) {
      console.log("Import blocked: parsedData empty or no org unit selected")
      return
    }

    if (uploadType === 'skus' || uploadType === 'assets') {
      const locationTags = await loadLocationTagsForUnit(selectedOrgUnitId)
      if (locationTags === null) {
        toast({
          title: 'Location tags unavailable',
          description: 'Could not load location tags for the selected warehouse. Please try again.',
          variant: 'destructive',
        })
        return
      }
    }

    console.log("Starting import with:", {
      dataCount: parsedData.length,
      uploadType,
      selectedOrgUnitId,
      operation: crudOperation
    })

    setIsImporting(true)
    setImportResults(null)

    try {
      const existingRecords = getRecordsForType(uploadType)
      const results = await importData(parsedData, uploadType, crudOperation, selectedOrgUnitId, existingRecords)
      console.log("Import results:", results)
      setImportResults(results)

      if (results.imported > 0) {
        console.log("Import successful, clearing form")
        setSelectedFile(null)
        setParsedData([])
        setUploadResults(null)
        await loadDisplayedData()
      }
    } catch (error) {
      console.error("Import error:", error)
      setImportResults({
        imported: 0,
        failed: parsedData.length,
        errors: [error instanceof Error ? error.message : 'Import failed']
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    if (uploadType === 'skus' || uploadType === 'assets') {
      if (!selectedOrgUnitId) {
        toast({
          title: 'Select a warehouse first',
          description: 'Location tag names are specific to a warehouse. Please pick one to continue.',
          variant: 'destructive',
        })
        return
      }

      const locationTags = await loadLocationTagsForUnit(selectedOrgUnitId)
      if (locationTags === null) {
        toast({
          title: 'Location tags unavailable',
          description: 'Could not load location tags for the selected warehouse. Please try again.',
          variant: 'destructive',
        })
        return
      }
    }

    setIsUploading(true)
    setParsedData([])
    setUploadResults(null)

    try {
      const data = await parseFile(selectedFile)
      const existingRecords = getRecordsForType(uploadType)
      const { valid, errors } = validateData(
        data,
        uploadType,
        crudOperation,
        existingRecords,
        selectedOrgUnit?.unitCode ?? undefined,
      )

      setParsedData(valid)
      setUploadResults({
        success: valid.length,
        errors,
        total: data.length
      })
    } catch (error) {
      setUploadResults({
        success: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        total: 0
      })
    } finally {
      setIsUploading(false)
    }
  }

  const uploadTypes = [
    {
      id: "skus" as UploadType,
      name: "SKUs",
      icon: Package,
      description: "Upload SKU data from CSV/Excel",
      color: "blue"
    },
    {
      id: "location_tags" as UploadType,
      name: "Location Tags",
      icon: Database,
      description: "Upload location tags data",
      color: "green"
    },
    {
      id: "assets" as UploadType,
      name: "Assets",
      icon: FileText,
      description: "Upload asset and equipment data",
      color: "purple"
    }
  ]

  const getTableTitle = () => {
    switch (uploadType) {
      case 'skus':
        return 'SKUs Data'
      case 'location_tags':
        return 'Location Tags Data'
      case 'assets':
        return 'Assets Data'
      default:
        return 'Data'
    }
  }

  const formatCellValue = (value: any, field: string): string => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    // Format dates
    if (field.includes('date') || field.includes('created_at') || field.includes('updated_at')) {
      if (typeof value === 'string') {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        }
      }
    }

    // Format UUIDs (show shorter version for display)
    if (field.includes('id') && typeof value === 'string' && value.length > 20) {
      return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
    }

    // Format numbers
    if (field.includes('quantity') || field.includes('capacity')) {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        return num.toLocaleString()
      }
    }

    // Default: convert to string and truncate if too long
    const stringValue = String(value)
    return stringValue.length > 50 ? `${stringValue.substring(0, 47)}...` : stringValue
  }

  // Custom table helper functions
  const getCustomTableHeaders = (uploadType: string) => {
    const schema = BACKEND_SCHEMAS[uploadType as keyof typeof BACKEND_SCHEMAS];
    const hasDimensions = uploadType === 'location_tags';
    
    if (hasDimensions) {
      // Filter out individual dimension fields and replace with combined dimensions
      const dimensionFields = ['length', 'breadth', 'height', 'volume'];
      const filteredFields = schema.fields.filter(field => !dimensionFields.includes(field));
      
      return [
        ...filteredFields.map(field => ({
          field,
          label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })),
        {
          field: 'dimensions',
          label: 'Dimensions (L×B×H = Volume)'
        }
      ];
    }
    
    return schema.fields.map(field => ({
      field,
      label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
  }

  const getCustomCellValue = (row: any, field: string, uploadType: string) => {
    if (field === 'dimensions') {
      const length = parseFloat(row.length)
      const breadth = parseFloat(row.breadth)
      const height = parseFloat(row.height)

      if (Number.isFinite(length) && length > 0 && Number.isFinite(breadth) && breadth > 0 && Number.isFinite(height) && height > 0) {
        const volumeValue = row.volume !== undefined && row.volume !== null && row.volume !== ''
          ? parseFloat(row.volume)
          : Number((length * breadth * height).toFixed(3))
        const volume = Number.isFinite(volumeValue) ? volumeValue : Number((length * breadth * height).toFixed(3))
        return `${length} × ${breadth} × ${height} = ${volume}`
      }

      return '-'
    }
    
    return formatCellValue(row[field], field)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bulk Upload"
        description="Import multiple items or data in bulk using CSV or Excel files"
        icon={Upload}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Target Org Unit</CardTitle>
          </CardHeader>
          <CardContent>
            {!isCreatingOrgUnit ? (
              <div className="space-y-3">
                <Select value={selectedOrgUnitId || undefined} onValueChange={setSelectedOrgUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select org unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgUnits.filter(unit => unit.status === "LIVE").map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unitName} ({unit.unitType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingOrgUnit(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Org Unit
                </Button>
                {orgUnits.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No org units available. Create one to get started.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Create New Org Unit</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreatingOrgUnit(false)
                      setNewOrgUnitId("")
                      setNewOrgUnitName("")
                      setNewOrgUnitType("warehouse")
                      setNewOrgUnitStatus("LIVE")
                      setNewOrgUnitDescription("")
                      setNewOrgUnitArea("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <Input
                    placeholder="Unit Id"
                    value={newOrgUnitId}
                    onChange={(e) => setNewOrgUnitId(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    placeholder="Unit Name"
                    value={newOrgUnitName}
                    onChange={(e) => setNewOrgUnitName(e.target.value)}
                    className="w-full"
                  />
                  <Select value={newOrgUnitType} onValueChange={(value: "warehouse" | "production" | "office") => setNewOrgUnitType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Unit Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newOrgUnitStatus} onValueChange={(value: "LIVE" | "OFFLINE" | "MAINTENANCE" | "PLANNING") => setNewOrgUnitStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LIVE">LIVE</SelectItem>
                      <SelectItem value="OFFLINE">OFFLINE</SelectItem>
                      <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                      <SelectItem value="PLANNING">PLANNING</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Description (optional)"
                    value={newOrgUnitDescription}
                    onChange={(e) => setNewOrgUnitDescription(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    placeholder="Area (optional)"
                    value={newOrgUnitArea}
                    onChange={(e) => setNewOrgUnitArea(e.target.value)}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateOrgUnit}
                      disabled={!newOrgUnitId.trim() || !newOrgUnitName.trim()}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCreatingOrgUnit(false)
                        setNewOrgUnitId("")
                        setNewOrgUnitName("")
                        setNewOrgUnitType("warehouse")
                        setNewOrgUnitStatus("LIVE")
                        setNewOrgUnitDescription("")
                        setNewOrgUnitArea("")
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Operation</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={crudOperation} onValueChange={(value: CrudOperation) => setCrudOperation(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New
                  </div>
                </SelectItem>
                <SelectItem value="update">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Update Existing
                  </div>
                </SelectItem>
                <SelectItem value="delete">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Records
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-4 pt-4 border-t">
              <Button 
                className={`w-full ${isOperationConfirmed ? "bg-green-600 hover:bg-green-700" : ""}`}
                onClick={() => {
                  // Confirm operation - could trigger validation or proceed to next step
                  if (!selectedOrgUnitId) {
                    toast({ title: 'No warehouse selected', description: 'Please select an organizational unit first.', variant: 'destructive' })
                    return
                  }
                  if (!isOperationConfirmed) {
                    setIsOperationConfirmed(true)
                    console.log('Operation confirmed:', {
                      unit: selectedOrgUnitId,
                      type: uploadType,
                      operation: crudOperation
                    })
                  }
                }}
                disabled={!selectedOrgUnitId}
              >
                {isOperationConfirmed ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Configuration Confirmed
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Configuration
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Operation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Unit:</span>
                <Badge variant="outline">
                  {selectedOrgUnit?.unitName || "None"}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Type:</span>
                <Badge variant="outline" className="capitalize">
                  {uploadType}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Operation:</span>
                <Badge variant={crudOperation === "delete" ? "destructive" : "default"} className="capitalize">
                  {crudOperation}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant={isOperationConfirmed ? "default" : "secondary"} className={isOperationConfirmed ? "bg-green-100 text-green-800 border-green-200" : ""}>
                  {isOperationConfirmed ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Confirmed
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {uploadTypes.map((type) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all duration-200 ${
              uploadType === type.id
                ? "ring-2 ring-blue-500 border-blue-500"
                : "hover:shadow-md"
            }`}
            onClick={() => setUploadType(type.id)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br from-${type.color}-500 to-${type.color}-600 flex items-center justify-center text-white shadow-sm mb-4`}>
                <type.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{type.name}</h3>
              <p className="text-sm text-muted-foreground">{type.description}</p>
              {uploadType === type.id && (
                <Badge variant="secondary" className="mt-3">
                  Selected
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
          <CardDescription>
            Select or drag and drop your CSV or Excel file to upload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedFile ? "File Selected" : "Drop your file here"}
            </h3>
            <p className="text-gray-500 mb-4">
              {selectedFile
                ? selectedFile.name
                : "or click to browse files (CSV, XLS, XLSX)"}
            </p>
            <div className="flex gap-4 justify-center">
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Choose File
              </Button>
              {selectedFile && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Upload File
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {selectedFile && (
            <div className="mt-6 h-full grow rounded-2xl border-0 sm:border border-slate-200 backdrop-blur-sm shadow-soft dark:border-slate-700 dark:bg-slate-800/80 p-0 sm:p-6 overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">File Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Information about the uploaded file
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{selectedFile.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Size:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{selectedFile.type || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Type:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{uploadTypes.find(t => t.id === uploadType)?.name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {uploadResults && (
        <div className="h-full grow rounded-2xl border-0 sm:border border-slate-200 backdrop-blur-sm shadow-soft dark:border-slate-700 dark:bg-slate-800/80 p-0 sm:p-6 overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              {uploadResults.errors.length === 0 ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-500" />
              )}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Upload Results</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Processing completed for {uploadResults.total} rows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-6 bg-green-50/50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{uploadResults.success}</div>
              <div className="text-sm text-green-700 dark:text-green-300 font-medium">Valid Rows</div>
            </div>
            <div className="text-center p-6 bg-red-50/50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{uploadResults.errors.length}</div>
              <div className="text-sm text-red-700 dark:text-red-300 font-medium">Errors</div>
            </div>
            <div className="text-center p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{uploadResults.total}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Total Rows</div>
            </div>
          </div>

          {uploadResults.errors.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-3">Errors Found</h4>
              <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 max-h-64 overflow-y-auto">
                <ul className="list-disc list-inside space-y-2 text-sm text-red-700 dark:text-red-300">
                  {uploadResults.errors.map((error, index) => (
                    <li key={index} className="leading-relaxed">{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Data Preview (first 5 rows)</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getCustomTableHeaders(uploadType).map((header) => (
                        <TableHead key={header.field}>
                          {header.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        {getCustomTableHeaders(uploadType).map((header) => (
                          <TableCell key={header.field}>
                            {getCustomCellValue(row, header.field, uploadType)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {parsedData.length > 5 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                  ... and {parsedData.length - 5} more rows
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
              onClick={handleImport}
              disabled={isImporting || uploadResults.success === 0}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  Import {uploadResults.success} Valid Records
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={downloadErrorReport} 
              disabled={uploadResults.errors.length === 0}
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Error Report
            </Button>
          </div>
        </div>
      )}

      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResults.failed === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              Import Results
            </CardTitle>
            <CardDescription>
              Import completed for {parsedData.length} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResults.imported}</div>
                <div className="text-sm text-green-700">Successfully Imported</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                <div className="text-sm text-red-700">Failed to Import</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{parsedData.length}</div>
                <div className="text-sm text-blue-700">Total Processed</div>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-red-700 mb-2">Import Errors:</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-32 overflow-y-auto">
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {importResults.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {importResults.imported > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-700">Import Successful!</h4>
                </div>
                <p className="text-sm text-green-700">
                  {importResults.imported} {uploadTypes.find(t => t.id === uploadType)?.name} records have been successfully imported and added to the data table below.
                </p>
                <div className="mt-4 flex gap-4">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <Link href={`/dashboard/reference-data/${uploadType === 'skus' ? 'skus' : uploadType === 'assets' ? 'asset-management' : 'location-tags'}`}>
                      View Imported Data
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImportResults(null)
                      setSelectedFile(null)
                      setParsedData([])
                      setUploadResults(null)
                    }}
                  >
                    Upload Another File
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="h-full grow rounded-2xl border-0 sm:border border-slate-200 backdrop-blur-sm shadow-soft dark:border-slate-700 dark:bg-slate-800/80 p-0 sm:p-6 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{getTableTitle()}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {selectedOrgUnitId
              ? displayedData.length > 0
                ? `Showing ${displayedData.length} record${displayedData.length === 1 ? '' : 's'} for the selected org unit`
                : 'No records found for the selected org unit yet'
              : 'Select a warehouse to load existing records'}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {getCustomTableHeaders(uploadType).map((header) => (
                  <TableHead key={header.field}>
                    {header.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedData.length > 0 ? (
                displayedData.map((row, index) => (
                  <TableRow 
                    key={index} 
                    className={index < 2 ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}
                  >
                    {getCustomTableHeaders(uploadType).map((header) => (
                      <TableCell key={header.field} className="font-medium">
                        {getCustomCellValue(row, header.field, uploadType)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={getCustomTableHeaders(uploadType).length} 
                    className="h-24 text-center text-gray-500 dark:text-gray-400"
                  >
                    No data available. Upload a file to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
