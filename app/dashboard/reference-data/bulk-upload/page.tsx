"use client"

import { useState, useEffect } from "react"
import { Upload, FileText, Database, Package, ArrowRight, CheckCircle, AlertCircle, Loader2, RefreshCw, Plus, Edit, Trash2, Building, Save, X, Download, Clock } from "lucide-react"
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import localStorageService from "@/src/services/localStorageService"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

// Backend schema definitions - matching exact form fields
const BACKEND_SCHEMAS = {
  org_units: {
    fields: ['unit_id', 'unit_name', 'unit_type', 'status', 'description', 'area'],
    required: ['unit_id', 'unit_name', 'unit_type', 'status'],
    types: {
      unit_id: 'varchar',
      unit_name: 'varchar',
      unit_type: 'varchar',
      status: 'varchar',
      description: 'varchar',
      area: 'varchar'
    }
  },
  skus: {
    fields: ['sku_id', 'sku_name', 'sku_category', 'sku_unit', 'quantity', 'effective_date', 'expiry_date', 'location_tag_id', 'description'],
    required: ['sku_name', 'sku_category', 'sku_unit', 'quantity', 'effective_date'],
    types: {
      sku_id: 'varchar',
      sku_name: 'varchar',
      sku_category: 'varchar',
      sku_unit: 'varchar',
      quantity: 'numeric',
      effective_date: 'date',
      expiry_date: 'date',
      location_tag_id: 'varchar',
      description: 'varchar'
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
    fields: ['asset_id', 'asset_name', 'asset_type', 'location_tag_id', 'length', 'breadth', 'height', 'unit_of_measurement', 'description'],
    required: ['asset_name', 'asset_type'],
    types: {
      asset_id: 'varchar',
      asset_name: 'varchar',
      asset_type: 'varchar',
      location_tag_id: 'varchar',
      length: 'numeric',
      breadth: 'numeric',
      height: 'numeric',
      unit_of_measurement: 'varchar',
      description: 'varchar'
    }
  }
}

// Demo data for each type - matching exact form fields
const DEMO_DATA = {
  org_units: [
    {
      unit_id: 'WH-001',
      unit_name: 'Warehouse 1',
      unit_type: 'warehouse',
      status: 'LIVE',
      description: 'Main warehouse facility for storage operations',
      area: 'North Wing'
    },
    {
      unit_id: 'OFF-001',
      unit_name: 'Main Office',
      unit_type: 'office',
      status: 'LIVE',
      description: 'Administrative office building',
      area: 'Building A'
    },
    {
      unit_id: 'PROD-001',
      unit_name: 'Production Line 1',
      unit_type: 'production',
      status: 'MAINTENANCE',
      description: 'Primary manufacturing facility',
      area: 'Factory Floor'
    }
  ],
  skus: [
    {
      sku_id: 'SKU-001',
      sku_name: 'Oak Wood Panel',
      sku_category: 'raw_material',
      sku_unit: 'pieces',
      quantity: 150,
      effective_date: '2024-01-15',
      expiry_date: '',
      location_tag_id: 'LOC-001',
      description: 'Premium oak wood panels for furniture manufacturing'
    },
    {
      sku_id: 'SKU-002',
      sku_name: 'Steel Beam',
      sku_category: 'raw_material',
      sku_unit: 'kg',
      quantity: 500,
      effective_date: '2024-01-10',
      expiry_date: '',
      location_tag_id: 'LOC-002',
      description: 'Structural steel beams for construction'
    },
    {
      sku_id: 'SKU-003',
      sku_name: 'Office Chair',
      sku_category: 'finished_good',
      sku_unit: 'pieces',
      quantity: 25,
      effective_date: '2024-01-20',
      expiry_date: '',
      location_tag_id: 'LOC-003',
      description: 'Ergonomic office chairs with lumbar support'
    }
  ],
  location_tags: [
    {
      location_tag: 'Warehouse Zone A',
      unit_id: 'WH-001',
      length: 10.5,
      breadth: 8.2,
      height: 4.0,
      unit_of_measurement: 'meters',
      description: 'Primary storage zone for raw materials'
    },
    {
      location_tag: 'Cold Storage Unit',
      unit_id: 'WH-001',
      length: 6.0,
      breadth: 5.0,
      height: 3.5,
      unit_of_measurement: 'meters',
      description: 'Temperature-controlled storage for perishable items'
    },
    {
      location_tag: 'Office Storage',
      unit_id: 'OFF-001',
      length: 4.2,
      breadth: 3.8,
      height: 2.5,
      unit_of_measurement: 'meters',
      description: 'Storage area for office supplies and equipment'
    }
  ],
  assets: [
    {
      asset_id: 'AST-001',
      asset_name: 'Forklift 001',
      asset_type: 'forklift',
      location_tag_id: 'LOC-001',
      length: 2.5,
      breadth: 1.2,
      height: 3.0,
      unit_of_measurement: 'meters',
      description: 'Heavy-duty forklift for warehouse operations'
    },
    {
      asset_id: 'AST-002',
      asset_name: 'Pallet Jack 001',
      asset_type: 'pallet_jack',
      location_tag_id: 'LOC-002',
      length: 1.8,
      breadth: 0.8,
      height: 1.5,
      unit_of_measurement: 'meters',
      description: 'Manual pallet jack for small loads'
    },
    {
      asset_id: 'AST-003',
      asset_name: 'Barcode Scanner 001',
      asset_type: 'scanner',
      location_tag_id: 'LOC-003',
      length: 0.15,
      breadth: 0.08,
      height: 0.25,
      unit_of_measurement: 'meters',
      description: 'Handheld barcode scanner for inventory management'
    }
  ]
}

interface OrgUnit {
  unit_id: string
  unit_name: string
  unit_type: "warehouse" | "production" | "office"
  status: "LIVE" | "OFFLINE" | "MAINTENANCE" | "PLANNING"
  description?: string
  area?: string
}

type CrudOperation = "create" | "update" | "delete"

export default function BulkUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState<string>("org_units")
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [uploadResults, setUploadResults] = useState<{
    success: number
    errors: string[]
    total: number
  }>({
    success: 0,
    errors: [],
    total: 0
  })
  const [crudOperation, setCrudOperation] = useState<CrudOperation>("create")
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<string>("")
  const [isOperationConfirmed, setIsOperationConfirmed] = useState(false)
  const [isCreatingOrgUnit, setIsCreatingOrgUnit] = useState(false)
  const [newOrgUnitName, setNewOrgUnitName] = useState("")
  const [newOrgUnitType, setNewOrgUnitType] = useState<"warehouse" | "production" | "office">("warehouse")
  const [newOrgUnitDescription, setNewOrgUnitDescription] = useState("")
  const [newOrgUnitOrganizationId, setNewOrgUnitOrganizationId] = useState("")
  const [importResults, setImportResults] = useState<{
    imported: number
    failed: number
    errors: string[]
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
  const [displayedData, setDisplayedData] = useState<any[]>([])

  // Load displayed data whenever uploadType or selectedOrgUnit changes
  useEffect(() => {
    loadDisplayedData()
  }, [uploadType, selectedOrgUnit])

  // Reset operation confirmation when org unit or operation changes
  useEffect(() => {
    setIsOperationConfirmed(false)
  }, [selectedOrgUnit, crudOperation])

  const loadDisplayedData = () => {
    if (!selectedOrgUnit) {
      setDisplayedData(DEMO_DATA[uploadType as keyof typeof DEMO_DATA])
      return
    }

    const storageKey = `${uploadType}_${selectedOrgUnit}`
    const storedData = localStorageService.getItem<any[]>(storageKey)
    
    if (storedData && storedData.length > 0) {
      setDisplayedData(storedData)
    } else {
      setDisplayedData(DEMO_DATA[uploadType as keyof typeof DEMO_DATA])
    }
  }

  useEffect(() => {
    const storedUnits = localStorage.getItem("worcoor-org-units")
    if (storedUnits) {
      try {
        const parsedUnits = JSON.parse(storedUnits)
        setOrgUnits(parsedUnits)
        const activeUnit = parsedUnits.find((unit: OrgUnit) => unit.status === "LIVE")
        if (activeUnit) {
          setSelectedOrgUnit(activeUnit.unit_name)
        }
      } catch (error) {
        console.error("Error parsing stored org units:", error)
      }
    }
  }, [])

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
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(String(value))) {
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

  const handleCreateOrgUnit = () => {
    if (!newOrgUnitName.trim() || !newOrgUnitOrganizationId.trim()) return

    try {
      const newOrgUnit: OrgUnit = {
        unit_name: newOrgUnitName.trim(),
        unit_type: newOrgUnitType,
        status: "LIVE",
        description: newOrgUnitDescription.trim(),
        organization_id: newOrgUnitOrganizationId.trim()
      }

      const updatedOrgUnits = [...orgUnits, newOrgUnit]
      setOrgUnits(updatedOrgUnits)
      localStorageService.setItem("worcoor-org-units", updatedOrgUnits)
      
      setSelectedOrgUnit(newOrgUnit.unit_name)
      
      setNewOrgUnitName("")
      setNewOrgUnitType("warehouse")
      setNewOrgUnitDescription("")
      setNewOrgUnitOrganizationId("")
      setIsCreatingOrgUnit(false)
    } catch (error) {
      console.error("Error creating org unit:", error)
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
            const workbook = XLSX.read(data, { type: 'array' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

            const headers = jsonData[0] as string[]
            const rows = jsonData.slice(1) as any[][]
            const objects = rows.map(row => {
              const obj: any = {}
              headers.forEach((header, index) => {
                obj[header] = row[index]
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

  const validateData = (data: any[], type: string, operation: CrudOperation, orgUnitId: string): { valid: any[], errors: string[] } => {
    const errors: string[] = []
    const valid: any[] = []

    const schema = BACKEND_SCHEMAS[type as keyof typeof BACKEND_SCHEMAS]
    if (!schema) {
      errors.push(`Unknown upload type: ${type}`)
      return { valid: [], errors }
    }

    const storageKey = `${type}_${orgUnitId}`
    const existingData = localStorageService.getItem<any[]>(storageKey) || []

    data.forEach((row, index) => {
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
        }
      }

      // CRUD operation validation - use appropriate ID field for each type
      if (operation === 'delete' || operation === 'update') {
        let idField = 'id';
        
        // Use appropriate ID field for each type
        switch (type) {
          case 'org_units':
            idField = 'unit_id';
            break;
          case 'skus':
            idField = 'sku_id';
            break;
          case 'assets':
            idField = 'asset_id';
            break;
          case 'location_tags':
            idField = 'location_tag';
            break;
        }
        
        if (!row[idField]) {
          rowErrors.push(`Missing ${idField} for ${operation} operation`)
          isValid = false
        } else {
          const exists = existingData.some(item => item[idField] === row[idField])
          if (!exists) {
            rowErrors.push(`Record with ${idField} ${row[idField]} not found for ${operation} operation`)
            isValid = false
          }
        }
      }

      // L×B×H validation for assets and location tags (matching form validation)
      if (type === 'assets' || type === 'location_tags') {
        const length = parseFloat(row.length) || 0;
        const breadth = parseFloat(row.breadth) || 0;
        const height = parseFloat(row.height) || 0;
        
        // Check if any dimension is provided
        const hasAnyDimension = row.length || row.breadth || row.height;
        
        if (hasAnyDimension) {
          // If any dimension is provided, all must be provided and positive
          if (!row.length || !row.breadth || !row.height) {
            rowErrors.push('If you provide one dimension, you must provide all three (Length, Breadth, Height)');
            isValid = false;
          } else if (length <= 0 || breadth <= 0 || height <= 0) {
            rowErrors.push('All dimensions must be positive numbers');
            isValid = false;
          } else {
            // Check if unit_of_measurement is provided when dimensions are provided
            if (!row.unit_of_measurement) {
              rowErrors.push('Unit of measurement is required when dimensions are provided');
              isValid = false;
            }
          }
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

  const importData = async (data: any[], type: string, orgUnitId: string, operation: CrudOperation): Promise<{ imported: number; failed: number; errors: string[] }> => {
    const errors: string[] = []
    let imported = 0
    let failed = 0

    const storageKey = `${type}_${orgUnitId}`
    console.log("Import starting with storageKey:", storageKey)

    try {
      let existingData = localStorageService.getItem<any[]>(storageKey) || []
      console.log("Existing data count:", existingData.length)

      // Add demo data if this is the first time
      if (existingData.length === 0 && DEMO_DATA[type as keyof typeof DEMO_DATA]) {
        existingData = [...DEMO_DATA[type as keyof typeof DEMO_DATA]]
        console.log("Added demo data, new count:", existingData.length)
      }

      if (operation === 'delete') {
        const initialCount = existingData.length
        existingData = existingData.filter(item => {
          // Use appropriate ID field for matching
          const shouldDelete = data.some(row => {
            switch (type) {
              case 'org_units':
                return row.unit_id === item.unit_id;
              case 'skus':
                return row.sku_id === item.sku_id;
              case 'assets':
                return row.asset_id === item.asset_id;
              case 'location_tags':
                return row.location_tag === item.location_tag;
              default:
                return row.id === item.id;
            }
          })
          if (shouldDelete) imported++
          return !shouldDelete
        })
        failed = data.length - imported
      } else if (operation === 'update') {
        for (const row of data) {
          let existingIndex = -1;
          
          // Find existing record using appropriate ID field
          switch (type) {
            case 'org_units':
              existingIndex = existingData.findIndex(item => item.unit_id === row.unit_id);
              break;
            case 'skus':
              existingIndex = existingData.findIndex(item => item.sku_id === row.sku_id);
              break;
            case 'assets':
              existingIndex = existingData.findIndex(item => item.asset_id === row.asset_id);
              break;
            case 'location_tags':
              existingIndex = existingData.findIndex(item => item.location_tag === row.location_tag);
              break;
            default:
              existingIndex = existingData.findIndex(item => item.id === row.id);
          }
          
          if (existingIndex >= 0) {
            existingData[existingIndex] = {
              ...existingData[existingIndex],
              ...row,
              updated_at: new Date().toISOString()
            }
            imported++
          } else {
            const idField = type === 'org_units' ? 'unit_id' : 
                           type === 'skus' ? 'sku_id' : 
                           type === 'assets' ? 'asset_id' : 
                           type === 'location_tags' ? 'location_tag' : 'id';
            errors.push(`Record with ${idField} ${row[idField]} not found for update`)
            failed++
          }
        }
      } else if (operation === 'create') {
        console.log("Creating new records, count:", data.length)
        for (const row of data) {
          try {
            const newRecord = {
              ...row,
              created_at: row.created_at || new Date().toISOString()
            }
            
            // Check for duplicates using appropriate ID field
            let duplicate = null;
            switch (type) {
              case 'org_units':
                duplicate = existingData.find(item => item.unit_id === newRecord.unit_id);
                break;
              case 'skus':
                duplicate = existingData.find(item => item.sku_id === newRecord.sku_id);
                break;
              case 'assets':
                duplicate = existingData.find(item => item.asset_id === newRecord.asset_id);
                break;
              case 'location_tags':
                duplicate = existingData.find(item => item.location_tag === newRecord.location_tag);
                break;
            }
            
            if (duplicate) {
              const idField = type === 'org_units' ? 'unit_id' : 
                             type === 'skus' ? 'sku_id' : 
                             type === 'assets' ? 'asset_id' : 
                             type === 'location_tags' ? 'location_tag' : 'id';
              errors.push(`Record with ${idField} ${newRecord[idField]} already exists`)
              failed++
              continue
            }

            existingData.push(newRecord)
            imported++
          } catch (error) {
            errors.push(`Failed to import record: ${error instanceof Error ? error.message : 'Unknown error'}`)
            failed++
          }
        }
        console.log("After create - imported:", imported, "failed:", failed)
      }

      console.log("Saving to localStorage, total records:", existingData.length)
      localStorageService.setItem(storageKey, existingData)
      console.log("Updating displayedData state")
      setDisplayedData([...existingData])
      console.log("Import complete")
    } catch (error) {
      console.error("Import error:", error)
      errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { imported, failed, errors }
  }

  const handleImport = async () => {
    if (parsedData.length === 0 || !selectedOrgUnit) {
      console.log("Import blocked: parsedData empty or no org unit selected")
      return
    }

    console.log("Starting import with:", {
      dataCount: parsedData.length,
      uploadType,
      selectedOrgUnit,
      operation: crudOperation
    })

    setIsImporting(true)
    setImportResults(null)

    try {
      const results = await importData(parsedData, uploadType, selectedOrgUnit, crudOperation)
      console.log("Import results:", results)
      setImportResults(results)

      if (results.imported > 0) {
        console.log("Import successful, clearing form")
        setSelectedFile(null)
        setParsedData([])
        setUploadResults(null)
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

    setIsUploading(true)
    setParsedData([])
    setUploadResults(null)

    try {
      const data = await parseFile(selectedFile)
      const { valid, errors } = validateData(data, uploadType, crudOperation, selectedOrgUnit)

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
      id: "org_units",
      name: "Org Units",
      icon: Building,
      description: "Upload organizational units data",
      color: "orange"
    },
    {
      id: "skus",
      name: "SKUs",
      icon: Package,
      description: "Upload SKU data from CSV/Excel",
      color: "blue"
    },
    {
      id: "location_tags",
      name: "Location Tags",
      icon: Database,
      description: "Upload location tags data",
      color: "green"
    },
    {
      id: "assets",
      name: "Assets",
      icon: FileText,
      description: "Upload asset and equipment data",
      color: "purple"
    }
  ]

  const getTableTitle = () => {
    switch (uploadType) {
      case 'org_units':
        return 'Org Units Data'
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
    const hasDimensions = uploadType === 'assets' || uploadType === 'location_tags';
    
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
      const length = parseFloat(row.length) || 0;
      const breadth = parseFloat(row.breadth) || 0;
      const height = parseFloat(row.height) || 0;
      const volume = parseFloat(row.volume) || 0;
      
      if (length > 0 && breadth > 0 && height > 0) {
        return `${length} × ${breadth} × ${height} = ${volume}`;
      } else {
        return '-';
      }
    }
    
    return formatCellValue(row[field], field);
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
                <Select value={selectedOrgUnit} onValueChange={setSelectedOrgUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select org unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgUnits.filter(unit => unit.status === "LIVE").map((unit, index) => (
                      <SelectItem key={index} value={unit.unit_name}>
                        {unit.unit_name} ({unit.unit_type})
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
                      setNewOrgUnitName("")
                      setNewOrgUnitType("warehouse")
                      setNewOrgUnitDescription("")
                      setNewOrgUnitOrganizationId("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Org Unit Name"
                  value={newOrgUnitName}
                  onChange={(e) => setNewOrgUnitName(e.target.value)}
                  className="w-full"
                />
                <Input
                  placeholder="Organization ID"
                  value={newOrgUnitOrganizationId}
                  onChange={(e) => setNewOrgUnitOrganizationId(e.target.value)}
                  className="w-full"
                />
                <Input
                  placeholder="Description (optional)"
                  value={newOrgUnitDescription}
                  onChange={(e) => setNewOrgUnitDescription(e.target.value)}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateOrgUnit}
                    disabled={!newOrgUnitName.trim() || !newOrgUnitOrganizationId.trim()}
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
                      setNewOrgUnitName("")
                      setNewOrgUnitType("warehouse")
                      setNewOrgUnitDescription("")
                      setNewOrgUnitOrganizationId("")
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
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
                  if (!selectedOrgUnit) {
                    alert('Please select an organizational unit first.')
                    return
                  }
                  if (!isOperationConfirmed) {
                    setIsOperationConfirmed(true)
                    console.log('Operation confirmed:', {
                      unit: selectedOrgUnit,
                      type: uploadType,
                      operation: crudOperation
                    })
                  }
                }}
                disabled={!selectedOrgUnit}
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
                  {selectedOrgUnit || "None"}
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
                    <Link href={`/dashboard/reference-data/${uploadType}`}>
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
            {displayedData.length > 2 
              ? `Showing ${displayedData.length} records (including 2 demo records)` 
              : 'Demo sample data - your imported data will appear below'}
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
