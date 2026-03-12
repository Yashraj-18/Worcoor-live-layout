"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Define types for each reference data entity
interface Unit {
  id: string
  name: string
  description: string
}

interface Department {
  id: string
  name: string
  mappedUnit: string
  description: string
}

interface UserType {
  id: string
  name: string
  description: string
}

interface SkillSet {
  id: string
  name: string
  description: string
}

interface IPAddress {
  id: string
  name: string
  ipAddress: string
  description: string
}

interface GeoLocation {
  id: string
  unit: string
  latitude: string
  longitude: string
}

interface TaskType {
  id: string
  name: string
  description: string
}

interface ProjectSchedule {
  id: string
  name: string
  description: string
}

interface ProjectType {
  id: string
  name: string
  description: string
}

interface ResourceType {
  id: string
  name: string
}

interface Resource {
  id: string
  name: string
  resourceType: string
  resourceSpecification?: string
}

interface SKUCategory {
  id: string
  name: string
  description: string
}

interface SKUType {
  id: string
  name: string
  description: string
}

interface LocationTag {
  id: string
  name: string
  description: string
}

interface SKUUnit {
  skuUnit: string
}

interface SKUWeight {
  id: string
  unit: string
}

interface Currency {
  id: string
  currency: string
  isDefault: boolean
}

interface QualityRating {
  id: string
  name: string
}

interface AssetCategory {
  id: string
  name: string
}

interface AssetState {
  id: string
  name: string
  description: string
}

interface ProductCategory {
  prcId: string
  prcName: string
  description: string
}

// Define the context type
interface ReferenceDataContextType {
  units: Unit[]
  departments: Department[]
  userTypes: UserType[]
  skillSets: SkillSet[]
  ipAddresses: IPAddress[]
  geoLocations: GeoLocation[]
  taskTypes: TaskType[]
  projectSchedules: ProjectSchedule[]
  projectTypes: ProjectType[]
  resourceTypes: ResourceType[]
  resources: Resource[]
  skuCategories: SKUCategory[]
  skuTypes: SKUType[]
  locationTags: LocationTag[]
  skuUnits: SKUUnit[]
  skuWeights: SKUWeight[]
  currencies: Currency[]
  qualityRatings: QualityRating[]
  assetCategories: AssetCategory[]
  assetStates: AssetState[]
  productCategories: ProductCategory[]
  updateUnits: (units: Unit[]) => void
  updateDepartments: (departments: Department[]) => void
  updateUserTypes: (userTypes: UserType[]) => void
  updateSkillSets: (skillSets: SkillSet[]) => void
  updateIPAddresses: (ipAddresses: IPAddress[]) => void
  updateGeoLocations: (geoLocations: GeoLocation[]) => void
  updateTaskTypes: (taskTypes: TaskType[]) => void
  updateProjectSchedules: (projectSchedules: ProjectSchedule[]) => void
  updateProjectTypes: (projectTypes: ProjectType[]) => void
  updateResourceTypes: (resourceTypes: ResourceType[]) => void
  updateResources: (resources: Resource[]) => void
  updateSKUCategories: (skuCategories: SKUCategory[]) => void
  updateSKUTypes: (skuTypes: SKUType[]) => void
  updateLocationTags: (locationTags: LocationTag[]) => void
  updateSKUUnits: (skuUnits: SKUUnit[]) => void
  updateSKUWeights: (skuWeights: SKUWeight[]) => void
  updateCurrencies: (currencies: Currency[]) => void
  updateQualityRatings: (qualityRatings: QualityRating[]) => void
  updateAssetCategories: (assetCategories: AssetCategory[]) => void
  updateAssetStates: (assetStates: AssetState[]) => void
  updateProductCategories: (productCategories: ProductCategory[]) => void
}

// Initial data based on the provided tables
const initialUnits: Unit[] = [
  { id: "U-001", name: "All", description: "Represents All Unit (Default Unit)" },
  { id: "U-002", name: "Unit 1", description: "Unit 1 is storage unit" },
  { id: "U-003", name: "Production Unit 1", description: "Production Unit" },
  { id: "U-004", name: "Asset Storing Facility", description: "Asset Storing for Production Machine" },
  { id: "U-005", name: "Main Office", description: "Main Office of Company" },
]

const initialDepartments: Department[] = [
  { id: "D-001", name: "All", mappedUnit: "All", description: "Default Department" },
  { id: "D-002", name: "Auditing", mappedUnit: "All", description: "Auditing Department" },
  { id: "D-003", name: "Quality Check", mappedUnit: "All", description: "QC Department" },
  { id: "D-004", name: "IT", mappedUnit: "All", description: "IT Department" },
]

const initialUserTypes: UserType[] = [
  { id: "UT-001", name: "Executives", description: "" },
  { id: "UT-002", name: "Managers", description: "" },
  { id: "UT-003", name: "Technicians", description: "" },
  { id: "UT-004", name: "Worker", description: "" },
]

const initialSkillSets: SkillSet[] = [
  { id: "SS-001", name: "Business Management", description: "" },
  { id: "SS-002", name: "Project Management", description: "" },
  { id: "SS-003", name: "Team Management", description: "" },
  { id: "SS-004", name: "Auditor", description: "" },
  { id: "SS-005", name: "Machine Operator", description: "" },
  { id: "SS-006", name: "Quality Manager", description: "" },
  { id: "SS-007", name: "Packaging", description: "" },
  { id: "SS-008", name: "Electrician", description: "" },
  { id: "SS-009", name: "Plumber", description: "" },
  { id: "SS-010", name: "Welder", description: "" },
  { id: "SS-011", name: "Assembly Line", description: "" },
  { id: "SS-012", name: "HAZMAT", description: "" },
  { id: "SS-013", name: "Machine Repair", description: "" },
  { id: "SS-014", name: "ERT", description: "" },
  { id: "SS-015", name: "Equipment Handling", description: "" },
]

// Define initialIPAddresses with only the two required IP addresses
const initialIPAddresses: IPAddress[] = [
  {
    id: "IP-001",
    name: "General IP",
    ipAddress: "10.09.878.54",
    description: "General purpose IP address for standard network operations and basic connectivity",
  },
  {
    id: "IP-002",
    name: "Production IP",
    ipAddress: "10.09.67.56",
    description: "Production environment IP address for live system operations and critical services",
  },
]

const initialGeoLocations: GeoLocation[] = [
  { id: "G-001", unit: "Production Unit 1", latitude: "29.7320° N", longitude: "-95.3422° W" },
  { id: "G-002", unit: "Asset Storing Facility", latitude: "51.5074° N", longitude: "-0.1278° W" },
]

const initialTaskTypes: TaskType[] = [
  { id: "TT-001", name: "Auditor/Complaince/QC", description: "" },
  { id: "TT-002", name: "Machine Operator", description: "" },
  { id: "TT-003", name: "Equipment Manager", description: "" },
  { id: "TT-004", name: "Warehouse Operation", description: "" },
  { id: "TT-005", name: "Maintanance Management", description: "" },
]

const initialProjectSchedules: ProjectSchedule[] = [
  { id: "PS-001", name: "One-Time", description: "" },
  { id: "PS-002", name: "Repetative", description: "" },
]

const initialProjectTypes: ProjectType[] = [
  { id: "PT-001", name: "Maintainance Work", description: "" },
  { id: "PT-002", name: "Auditing Work", description: "" },
  { id: "PT-003", name: "Production Work", description: "" },
  { id: "PT-004", name: "Internal Orders", description: "" },
  { id: "PT-005", name: "External Orders", description: "" },
]

const initialResourceTypes: ResourceType[] = [
  { id: "RT-001", name: "SKU" },
  { id: "RT-002", name: "Asset" },
  { id: "RT-003", name: "Finished Good(FG)" },
]

const initialResources: Resource[] = [
  { id: "R-001", name: "Pallets", resourceType: "Asset" },
  { id: "R-002", name: "Crates", resourceType: "Asset" },
  { id: "R-003", name: "Forklift Machine", resourceType: "Asset" },
  { id: "R-004", name: "Crane", resourceType: "Asset" },
  { id: "R-005", name: "Packaging Material", resourceType: "SKU" },
  { id: "R-006", name: "RAW Material", resourceType: "SKU" },
  { id: "R-007", name: "Laptop", resourceType: "Asset" },
  { id: "R-008", name: "Tables", resourceType: "Asset" },
  { id: "R-009", name: "Miscellaneous", resourceType: "SKU" },
]

const initialSKUCategories: SKUCategory[] = [
  { id: "SC-001", name: "RAW Material", description: "" },
  { id: "SC-002", name: "Spare Parts", description: "" },
  { id: "SC-003", name: "Packaging Material", description: "" },
  { id: "SC-004", name: "Others", description: "" },
]

const initialSKUTypes: SKUType[] = [
  { id: "ST-001", name: "Primary", description: "" },
  { id: "ST-002", name: "Secondary", description: "" },
]

const initialLocationTags: LocationTag[] = [
  {
    id: "LT-001",
    name: "U1-W1-Z2-R3",
    description: "Nomanclature is Unit-Warehouse-Zone-Rack.",
  },
  { id: "LT-002", name: "U1-W1-Z4", description: "" },
  { id: "LT-003", name: "U1-W1-Z5", description: "" },
  { id: "LT-004", name: "U1-W2", description: "" },
  { id: "LT-005", name: "U1-W3-CR1", description: "Cold room 1" },
  { id: "LT-006", name: "Packaging Store 1", description: "" },
  { id: "LT-007", name: "W4-Spare-Part-Z1", description: "" },
]

const initialSKUUnits: SKUUnit[] = [
  { skuUnit: "Count" },
  { skuUnit: "KG" },
  { skuUnit: "Pounds" },
  { skuUnit: "Liters" },
  { skuUnit: "Rolls" },
  { skuUnit: "Sheet" },
]

const initialSKUWeights: SKUWeight[] = [
  { id: "SUW-001", unit: "KG" },
  { id: "SUW-002", unit: "lb" },
  { id: "SUW-003", unit: "Grams" },
]

const initialCurrencies: Currency[] = [
  { id: "CUR-001", currency: "USD", isDefault: true },
  { id: "CUR-002", currency: "INR", isDefault: false },
  { id: "CUR-003", currency: "EUR", isDefault: false },
  { id: "CUR-004", currency: "GBP", isDefault: false },
  { id: "CUR-005", currency: "", isDefault: false },
  { id: "CUR-006", currency: "", isDefault: false },
  { id: "CUR-007", currency: "", isDefault: false },
]

const initialQualityRatings: QualityRating[] = [
  { id: "QCR-001", name: "Not Rates" },
  { id: "QCR-002", name: "A-Premium" },
  { id: "QCR-003", name: "B-Standard" },
  { id: "QCR-004", name: "C-Economy" },
]

const initialAssetCategories: AssetCategory[] = [
  { id: "ASC-001", name: "Lifting Machine" },
  { id: "ASC-002", name: "Transfortation Asset" },
  { id: "ASC-003", name: "Manifacturing Machine" },
  { id: "ASC-004", name: "Equipement" },
  { id: "ASC-005", name: "Tool" },
  { id: "ASC-006", name: "IT Asset" },
  { id: "ASC-007", name: "Office Asset" },
]

const initialAssetStates: AssetState[] = [
  {
    id: "AST-001",
    name: "Active",
    description:
      "High-performance industrial conveyor belt system currently operational in production line A, processing 500 units per hour with 99.2% uptime efficiency.",
  },
  {
    id: "AST-002",
    name: "Under Maintenance",
    description:
      "Hydraulic press machine temporarily offline for scheduled quarterly maintenance including seal replacement, pressure calibration, and safety system inspection.",
  },
  {
    id: "AST-003",
    name: "Decommissioned",
    description:
      "Legacy packaging equipment retired from service due to obsolescence, replaced by automated system and awaiting disposal through certified recycling vendor.",
  },
]

const initialProductCategories: ProductCategory[] = [
  { prcId: "PRC-001", prcName: "Office Furniture", description: "Desks, chairs, tables, and other office furnishings" },
  { prcId: "PRC-002", prcName: "Office Equipment", description: "Electronics and equipment used in office environments" },
  { prcId: "PRC-003", prcName: "Storage Solutions", description: "Shelving, cabinets, and storage products" },
  { prcId: "PRC-004", prcName: "Lighting", description: "Lamps, fixtures, and lighting accessories" },
  { prcId: "PRC-005", prcName: "Office Supplies", description: "Consumable office materials" },
]

// Create the context
const ReferenceDataContext = createContext<ReferenceDataContextType | undefined>(undefined)

// Create the provider component
export function ReferenceDataProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<Unit[]>(initialUnits)
  const [departments, setDepartments] = useState<Department[]>(initialDepartments)
  const [userTypes, setUserTypes] = useState<UserType[]>(initialUserTypes)
  const [skillSets, setSkillSets] = useState<SkillSet[]>(initialSkillSets)
  const [ipAddresses, setIPAddresses] = useState<IPAddress[]>(initialIPAddresses)
  const [geoLocations, setGeoLocations] = useState<GeoLocation[]>(initialGeoLocations)
  const [taskTypes, setTaskTypes] = useState<TaskType[]>(initialTaskTypes)
  const [projectSchedules, setProjectSchedules] = useState<ProjectSchedule[]>(initialProjectSchedules)
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>(initialProjectTypes)
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>(initialResourceTypes)
  const [resources, setResources] = useState<Resource[]>(initialResources)
  const [skuCategories, setSKUCategories] = useState<SKUCategory[]>(initialSKUCategories)
  const [skuTypes, setSKUTypes] = useState<SKUType[]>(initialSKUTypes)
  const [locationTags, setLocationTags] = useState<LocationTag[]>(initialLocationTags)
  const [skuUnits, setSKUUnits] = useState<SKUUnit[]>(initialSKUUnits)
  const [skuWeights, setSKUWeights] = useState<SKUWeight[]>(initialSKUWeights)
  const [currencies, setCurrencies] = useState<Currency[]>(initialCurrencies)
  const [qualityRatings, setQualityRatings] = useState<QualityRating[]>(initialQualityRatings)
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>(initialAssetCategories)
  const [assetStates, setAssetStates] = useState<AssetState[]>(initialAssetStates)
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(initialProductCategories)

  const updateUnits = (newUnits: Unit[]) => setUnits(newUnits)
  const updateDepartments = (newDepartments: Department[]) => setDepartments(newDepartments)
  const updateUserTypes = (newUserTypes: UserType[]) => setUserTypes(newUserTypes)
  const updateSkillSets = (newSkillSets: SkillSet[]) => setSkillSets(newSkillSets)
  const updateIPAddresses = (newIPAddresses: IPAddress[]) => setIPAddresses(newIPAddresses)
  const updateGeoLocations = (newGeoLocations: GeoLocation[]) => setGeoLocations(newGeoLocations)
  const updateTaskTypes = (newTaskTypes: TaskType[]) => setTaskTypes(newTaskTypes)
  const updateProjectSchedules = (newProjectSchedules: ProjectSchedule[]) => setProjectSchedules(newProjectSchedules)
  const updateProjectTypes = (newProjectTypes: ProjectType[]) => setProjectTypes(newProjectTypes)
  const updateResourceTypes = (newResourceTypes: ResourceType[]) => setResourceTypes(newResourceTypes)
  const updateResources = (newResources: Resource[]) => setResources(newResources)
  const updateSKUCategories = (newSKUCategories: SKUCategory[]) => setSKUCategories(newSKUCategories)
  const updateSKUTypes = (newSKUTypes: SKUType[]) => setSKUTypes(newSKUTypes)
  const updateLocationTags = (newLocationTags: LocationTag[]) => setLocationTags(newLocationTags)
  const updateSKUUnits = (newSKUUnits: SKUUnit[]) => setSKUUnits(newSKUUnits)
  const updateSKUWeights = (newSKUWeights: SKUWeight[]) => setSKUWeights(newSKUWeights)
  const updateCurrencies = (newCurrencies: Currency[]) => setCurrencies(newCurrencies)
  const updateQualityRatings = (newQualityRatings: QualityRating[]) => setQualityRatings(newQualityRatings)
  const updateAssetCategories = (newAssetCategories: AssetCategory[]) => setAssetCategories(newAssetCategories)
  const updateAssetStates = (newAssetStates: AssetState[]) => setAssetStates(newAssetStates)
  const updateProductCategories = (newProductCategories: ProductCategory[]) => setProductCategories(newProductCategories)

  return (
    <ReferenceDataContext.Provider
      value={{
        units,
        departments,
        userTypes,
        skillSets,
        ipAddresses,
        geoLocations,
        taskTypes,
        projectSchedules,
        projectTypes,
        resourceTypes,
        resources,
        skuCategories,
        skuTypes,
        locationTags,
        skuUnits,
        skuWeights,
        currencies,
        qualityRatings,
        assetCategories,
        assetStates,
        productCategories,
        updateUnits,
        updateDepartments,
        updateUserTypes,
        updateSkillSets,
        updateIPAddresses,
        updateGeoLocations,
        updateTaskTypes,
        updateProjectSchedules,
        updateProjectTypes,
        updateResourceTypes,
        updateResources,
        updateSKUCategories,
        updateSKUTypes,
        updateLocationTags,
        updateSKUUnits,
        updateSKUWeights,
        updateCurrencies,
        updateQualityRatings,
        updateAssetCategories,
        updateAssetStates,
        updateProductCategories,
      }}
    >
      {children}
    </ReferenceDataContext.Provider>
  )
}

// Create a hook to use the context
export function useReferenceData() {
  const context = useContext(ReferenceDataContext)
  if (context === undefined) {
    throw new Error("useReferenceData must be used within a ReferenceDataProvider")
  }
  return context
}
