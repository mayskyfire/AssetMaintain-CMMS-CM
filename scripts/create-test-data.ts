/**
 * Script to create test data (assets, notifications, etc.) in the database
 * Run with: npx tsx scripts/create-test-data.ts
 */

import mysql from 'mysql2/promise'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function createTestData() {
  let connection: mysql.Connection | null = null

  try {
    console.log('🔌 Connecting to database...')
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    })

    console.log('✅ Connected to database')

    // Get or create asset_types
    console.log('\n📝 Creating asset types...')
    
    const assetTypes = [
      { name: 'เครื่องปรับอากาศ', code: 'AC' },
      { name: 'ปั๊มน้ำ', code: 'PUMP' },
      { name: 'ระบบไฟฟ้า', code: 'ELEC' }
    ]

    const assetTypeIds: Record<string, number> = {}

    for (const type of assetTypes) {
      const [existing] = await connection.execute(
        'SELECT id FROM asset_types WHERE type_code = ?',
        [type.code]
      )

      if (Array.isArray(existing) && existing.length > 0) {
        assetTypeIds[type.code] = (existing[0] as any).id
        console.log(`   ✓ Asset type ${type.name} already exists`)
      } else {
        const [result] = await connection.execute(
          'INSERT INTO asset_types (type_name, type_code, is_active, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())',
          [type.name, type.code]
        )
        assetTypeIds[type.code] = (result as any).insertId
        console.log(`   ✓ Created asset type: ${type.name}`)
      }
    }

    // Create test assets
    console.log('\n📝 Creating test assets...')
    
    const testAssets = [
      {
        asset_code: 'AC-001',
        asset_type: 'AC',
        asset_name: 'เครื่องปรับอากาศ AC-001',
        brand_model: 'Daikin Inverter 18000 BTU',
        serial_number: 'DK-2024-001',
        capacity: '18000 BTU',
        location: 'อาคาร A ชั้น 3 ห้อง 301',
        site: 'สำนักงานใหญ่',
        zone: 'Zone A',
        building: 'อาคาร A',
        floor: '3',
        installation_date: '2024-01-15'
      },
      {
        asset_code: 'AC-002',
        asset_type: 'AC',
        asset_name: 'เครื่องปรับอากาศ AC-002',
        brand_model: 'Mitsubishi Heavy Duty 24000 BTU',
        serial_number: 'MT-2024-002',
        capacity: '24000 BTU',
        location: 'อาคาร B ชั้น 2 ห้องประชุม',
        site: 'สำนักงานใหญ่',
        zone: 'Zone B',
        building: 'อาคาร B',
        floor: '2',
        installation_date: '2024-02-20'
      },
      {
        asset_code: 'PUMP-001',
        asset_type: 'PUMP',
        asset_name: 'ปั๊มน้ำ PUMP-001',
        brand_model: 'Grundfos CR 5-10',
        serial_number: 'GF-2024-001',
        capacity: '5 HP',
        location: 'ห้องเครื่อง ชั้น B1',
        site: 'สำนักงานใหญ่',
        zone: 'Zone C',
        building: 'อาคาร A',
        floor: 'B1',
        installation_date: '2023-12-01'
      }
    ]

    for (const asset of testAssets) {
      const [existing] = await connection.execute(
        'SELECT id FROM assets WHERE asset_code = ?',
        [asset.asset_code]
      )

      if (Array.isArray(existing) && existing.length > 0) {
        console.log(`   ⚠️  Asset ${asset.asset_code} already exists`)
      } else {
        await connection.execute(
          `INSERT INTO assets (
            asset_code, asset_type_id, asset_name, brand_model, serial_number, 
            capacity, location, site, zone, building, floor, installation_date, 
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
          [
            asset.asset_code,
            assetTypeIds[asset.asset_type],
            asset.asset_name,
            asset.brand_model,
            asset.serial_number,
            asset.capacity,
            asset.location,
            asset.site,
            asset.zone,
            asset.building,
            asset.floor,
            asset.installation_date
          ]
        )
        console.log(`   ✓ Created asset: ${asset.asset_code}`)
      }
    }

    console.log('\n✅ All test data created successfully!')
    console.log('\n📋 Test Assets:')
    testAssets.forEach(asset => {
      console.log(`   - ${asset.asset_code}: ${asset.asset_name}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n🔌 Database connection closed')
    }
  }
}

// Run the script
createTestData()
