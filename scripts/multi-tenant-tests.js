const axios = require('axios')

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api'
const TENANTS = [
  { name: 'Company A', email: process.env.TENANT_A_EMAIL || 'admin1@company.com', password: process.env.TENANT_A_PASSWORD },
  { name: 'Company B', email: process.env.TENANT_B_EMAIL || 'admin2@company.com', password: process.env.TENANT_B_PASSWORD }
]

function requireId(response, entity) {
  const id = response.data?.id
  if (!id) {
    throw new Error(`${entity} creation succeeded but id missing in response`)
  }
  return id
}

async function testSkuCrossTenantDuplication(sessionA, sessionB) {
  const skuCode = `SKU-${Date.now()}`
  const resA = await sessionA.createSku(skuCode)
  const resB = await sessionB.createSku(skuCode)

  const passed = resA.status === 201 && resB.status === 201
  let details = `Company A status ${resA.status}, Company B status ${resB.status}`
  if (!passed) {
    details += ' (expected both to be 201)'
  }
  return { name: 'Cross-tenant duplication allowed (SKU)', passed, details }
}

async function testSkuWithinTenantUniqueness(session) {
  const skuCode = `SKU-DUP-${Date.now()}`
  const first = await session.createSku(skuCode)
  const second = await session.createSku(skuCode)

  const passed = first.status === 201 && second.status >= 400
  let details = `${session.name}: first ${first.status}, second ${second.status}`
  if (!passed) {
    details += ' (expected 201 then >=400)'
  }
  return { name: `Within-tenant uniqueness (SKU - ${session.name})`, passed, details }
}

async function testSkuIsolation(sessionA, sessionB) {
  const skuCode = `SKU-ISO-${Date.now()}`
  const createRes = await sessionA.createSku(skuCode)
  const createdId = createRes.data?.id

  const listA = await sessionA.listSkus()
  const listB = await sessionB.listSkus()

  const itemsA = Array.isArray(listA.data?.items) ? listA.data.items : []
  const itemsB = Array.isArray(listB.data?.items) ? listB.data.items : []
  const aHasSku = itemsA.some((sku) => sku.skuId === skuCode)
  const bHasSku = itemsB.some((sku) => sku.skuId === skuCode)

  let crossOrgRes = { status: 'skipped' }
  if (createdId) {
    crossOrgRes = await sessionB.getSkuById(createdId)
  }

  const passed = aHasSku && !bHasSku && crossOrgRes.status === 404
  let details = `SKU A sees=${aHasSku}, B sees=${bHasSku}, cross-fetch status=${crossOrgRes.status}`
  if (!createdId) {
    details += ' (SKU ID missing in response)'
  }
  return { name: 'Data isolation between tenants (SKU)', passed, details }
}

async function testAssetCrossTenantDuplication(sessionA, sessionB) {
  const assetCode = `ASSET-${Date.now()}`
  const resA = await sessionA.createAsset(assetCode)
  const resB = await sessionB.createAsset(assetCode)

  const passed = resA.status === 201 && resB.status === 201
  let details = `Company A status ${resA.status}, Company B status ${resB.status}`
  if (!passed) {
    details += ' (expected both to be 201)'
  }
  return { name: 'Cross-tenant duplication allowed (Asset)', passed, details }
}

async function testAssetWithinTenantUniqueness(session) {
  const assetCode = `ASSET-DUP-${Date.now()}`
  const first = await session.createAsset(assetCode)
  const second = await session.createAsset(assetCode)

  const passed = first.status === 201 && second.status >= 400
  let details = `${session.name}: first ${first.status}, second ${second.status}`
  if (!passed) {
    details += ' (expected 201 then >=400)'
  }
  return { name: `Within-tenant uniqueness (Asset - ${session.name})`, passed, details }
}

async function testAssetIsolation(sessionA, sessionB) {
  const assetCode = `ASSET-ISO-${Date.now()}`
  const createRes = await sessionA.createAsset(assetCode)
  const createdId = createRes.data?.id

  const listA = await sessionA.listAssets()
  const listB = await sessionB.listAssets()

  const itemsA = Array.isArray(listA.data?.items) ? listA.data.items : []
  const itemsB = Array.isArray(listB.data?.items) ? listB.data.items : []
  const aHasAsset = itemsA.some((asset) => asset.assetId === assetCode)
  const bHasAsset = itemsB.some((asset) => asset.assetId === assetCode)

  let crossOrgRes = { status: 'skipped' }
  if (createdId) {
    crossOrgRes = await sessionB.getAssetById(createdId)
  }

  const passed = aHasAsset && !bHasAsset && crossOrgRes.status === 404
  let details = `Asset A sees=${aHasAsset}, B sees=${bHasAsset}, cross-fetch status=${crossOrgRes.status}`
  if (!createdId) {
    details += ' (Asset ID missing in response)'
  }
  return { name: 'Data isolation between tenants (Asset)', passed, details }
}

async function testLocationTagCrossTenantDuplication(sessionA, sessionB) {
  const unitCode = `LT-UNIT-${Date.now()}`
  const unitARes = await sessionA.createUnit(`${unitCode}-A`)
  const unitBRes = await sessionB.createUnit(`${unitCode}-B`)
  const unitAId = requireId(unitARes, 'Company A unit for location tag duplication')
  const unitBId = requireId(unitBRes, 'Company B unit for location tag duplication')

  const tagName = `LT-${Date.now()}`
  const resA = await sessionA.createLocationTag(unitAId, tagName)
  const resB = await sessionB.createLocationTag(unitBId, tagName)

  const passed = resA.status === 201 && resB.status === 201
  let details = `Company A status ${resA.status}, Company B status ${resB.status}`
  if (!passed) {
    details += ' (expected both to be 201)'
  }
  return { name: 'Cross-tenant duplication allowed (Location Tag)', passed, details }
}

async function testLocationTagWithinTenantUniqueness(session) {
  const unitRes = await session.createUnit(`LT-DUP-UNIT-${Date.now()}`)
  const unitId = requireId(unitRes, `${session.name} unit for location tag uniqueness`)
  const tagName = `LT-DUP-${Date.now()}`

  const first = await session.createLocationTag(unitId, tagName)
  const second = await session.createLocationTag(unitId, tagName)

  const passed = first.status === 201 && second.status >= 400
  let details = `${session.name}: first ${first.status}, second ${second.status}`
  if (!passed) {
    details += ' (expected 201 then >=400)'
  }
  return { name: `Within-tenant uniqueness (Location Tag - ${session.name})`, passed, details }
}

async function testLocationTagIsolation(sessionA, sessionB) {
  const unitARes = await sessionA.createUnit(`LT-ISO-A-${Date.now()}`)
  const unitBRes = await sessionB.createUnit(`LT-ISO-B-${Date.now()}`)
  const unitAId = requireId(unitARes, 'Company A unit for location tag isolation')
  const unitBId = requireId(unitBRes, 'Company B unit for location tag isolation')

  const tagName = `LT-ISO-${Date.now()}`
  await sessionA.createLocationTag(unitAId, tagName)

  const listA = await sessionA.listLocationTags(unitAId)
  const listBForOwnUnit = await sessionB.listLocationTags(unitBId)
  const listBForAUnit = await sessionB.listLocationTags(unitAId)

  const tagsA = Array.isArray(listA.data) ? listA.data : []
  const tagsBOwn = Array.isArray(listBForOwnUnit.data) ? listBForOwnUnit.data : []
  const tagsBAUnit = Array.isArray(listBForAUnit.data) ? listBForAUnit.data : []

  const aHasTag = tagsA.some((tag) => tag.locationTagName === tagName)
  const bOwnHasTag = tagsBOwn.some((tag) => tag.locationTagName === tagName)
  const bOnAUnitHasTag = tagsBAUnit.some((tag) => tag.locationTagName === tagName)

  const passed = aHasTag && !bOwnHasTag && !bOnAUnitHasTag
  let details = `A sees=${aHasTag}, B own unit sees=${bOwnHasTag}, B using A unit sees=${bOnAUnitHasTag}`
  return { name: 'Data isolation between tenants (Location Tag)', passed, details }
}

class TenantSession {
  constructor({ name, email, password }) {
    this.name = name
    this.email = email
    this.password = password
    this.cookieHeader = null
    this.organizationId = null
  }

  async login() {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      { email: this.email, password: this.password },
      { validateStatus: () => true }
    )

    if (response.status !== 200) {
      throw new Error(`Login failed for ${this.email}. Status: ${response.status}`)
    }

    const setCookie = response.headers['set-cookie']
    if (!setCookie || setCookie.length === 0) {
      throw new Error(`No auth cookie returned for ${this.email}`)
    }

    this.cookieHeader = setCookie.map((cookie) => cookie.split(';')[0]).join('; ')
    this.organizationId = response.data?.organization?.id ?? null
  }

  async request(method, path, data) {
    const response = await axios({
      method,
      url: `${API_BASE_URL}${path}`,
      data,
      headers: this.cookieHeader ? { Cookie: this.cookieHeader } : undefined,
      validateStatus: () => true,
    })
    return response
  }

  async createUnit(unitId) {
    const payload = {
      unitId,
      unitName: `${unitId} Automation`,
      unitType: 'warehouse',
      status: 'LIVE',
    }
    return this.request('post', '/units', payload)
  }

  async listUnits() {
    return this.request('get', '/units')
  }

  async getUnitById(unitId) {
    return this.request('get', `/units/${unitId}`)
  }

  async createSku(skuCode) {
    const payload = {
      skuId: skuCode,
      skuName: `${skuCode} Automation`,
      skuCategory: 'finished_good',
      skuUnit: 'pieces',
      quantity: 25,
      effectiveDate: new Date().toISOString().slice(0, 10),
    }
    return this.request('post', '/skus', payload)
  }

  async listSkus() {
    return this.request('get', '/skus')
  }

  async getSkuById(skuId) {
    return this.request('get', `/skus/${skuId}`)
  }

  async createAsset(assetCode) {
    const payload = {
      assetId: assetCode,
      assetName: `${assetCode} Automation`,
      assetType: 'equipment',
    }
    return this.request('post', '/assets', payload)
  }

  async listAssets() {
    return this.request('get', '/assets')
  }

  async getAssetById(assetId) {
    return this.request('get', `/assets/${assetId}`)
  }

  async createLocationTag(unitId, locationTagName) {
    const payload = {
      unitId,
      locationTagName,
      length: 1,
      breadth: 1,
      height: 1,
      unitOfMeasurement: 'meters',
    }
    return this.request('post', '/location-tags', payload)
  }

  async listLocationTags(unitId) {
    return this.request('get', `/units/${unitId}/location-tags`)
  }
}

function logResult(result) {
  const icon = result.passed ? '✅' : '❌'
  console.log(`${icon} ${result.name}`)
  if (result.details) {
    console.log(`   ${result.details}`)
  }
}

async function testCrossTenantDuplication(sessionA, sessionB) {
  const unitCode = `UNIT-${Date.now()}`
  const resA = await sessionA.createUnit(unitCode)
  const resB = await sessionB.createUnit(unitCode)

  const passed = resA.status === 201 && resB.status === 201
  let details = `Company A status ${resA.status}, Company B status ${resB.status}`
  if (!passed) {
    details += ' (expected both to be 201)'
  }
  return { name: 'Cross-tenant duplication allowed', passed, details }
}

async function testWithinTenantUniqueness(session) {
  const unitCode = `DUP-${Date.now()}`
  const first = await session.createUnit(unitCode)
  const second = await session.createUnit(unitCode)

  const passed = first.status === 201 && second.status >= 400
  let details = `${session.name}: first ${first.status}, second ${second.status}`
  if (!passed) {
    details += ' (expected 201 then >=400)'
  }
  return { name: `Within-tenant uniqueness (${session.name})`, passed, details }
}

async function testIsolation(sessionA, sessionB) {
  const unitCode = `ISO-${Date.now()}`
  const createRes = await sessionA.createUnit(unitCode)
  const createdId = createRes.data?.id

  const listA = await sessionA.listUnits()
  const listB = await sessionB.listUnits()

  const aHasUnit = Array.isArray(listA.data) && listA.data.some((unit) => unit.unitId === unitCode)
  const bHasUnit = Array.isArray(listB.data) && listB.data.some((unit) => unit.unitId === unitCode)

  let crossOrgRes = { status: 'skipped' }
  if (createdId) {
    crossOrgRes = await sessionB.getUnitById(createdId)
  }

  const passed = aHasUnit && !bHasUnit && crossOrgRes.status === 404
  let details = `A sees=${aHasUnit}, B sees=${bHasUnit}, cross-fetch status=${crossOrgRes.status}`
  if (!createdId) {
    details += ' (unit ID missing in response)'
  }
  return { name: 'Data isolation between tenants', passed, details }
}

async function run() {
  const sessions = TENANTS.map((cfg) => new TenantSession(cfg))
  for (const session of sessions) {
    await session.login()
    console.log(`Logged in as ${session.email} (${session.name})`)
  }

  const [companyA, companyB] = sessions
  const results = []
  results.push(await testCrossTenantDuplication(companyA, companyB))
  results.push(await testWithinTenantUniqueness(companyA))
  results.push(await testWithinTenantUniqueness(companyB))
  results.push(await testIsolation(companyA, companyB))
  results.push(await testSkuCrossTenantDuplication(companyA, companyB))
  results.push(await testSkuWithinTenantUniqueness(companyA))
  results.push(await testSkuWithinTenantUniqueness(companyB))
  results.push(await testSkuIsolation(companyA, companyB))
  results.push(await testAssetCrossTenantDuplication(companyA, companyB))
  results.push(await testAssetWithinTenantUniqueness(companyA))
  results.push(await testAssetWithinTenantUniqueness(companyB))
  results.push(await testAssetIsolation(companyA, companyB))
  results.push(await testLocationTagCrossTenantDuplication(companyA, companyB))
  results.push(await testLocationTagWithinTenantUniqueness(companyA))
  results.push(await testLocationTagWithinTenantUniqueness(companyB))
  results.push(await testLocationTagIsolation(companyA, companyB))

  let hasFailure = false
  for (const result of results) {
    logResult(result)
    if (!result.passed) {
      hasFailure = true
    }
  }

  if (hasFailure) {
    console.error('One or more multi-tenant tests failed.')
    process.exit(1)
  } else {
    console.log('All multi-tenant tests passed successfully.')
  }
}

run().catch((error) => {
  if (error?.response) {
    console.error('Test execution failed:', {
      message: error.message,
      status: error.response.status,
      data: error.response.data,
    })
  } else {
    console.error('Test execution failed:', error?.message ?? error)
  }
  process.exit(1)
})
