/**
 * Script to create test users in the database
 * Run with: npx tsx scripts/create-test-users.ts
 */

import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SALT_ROUNDS = 10

interface TestUser {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'planner' | 'technician' | 'vendor' | 'requester' | 'engineer'
  phone_number: string
}

const testUsers: TestUser[] = [
  {
    email: 'requester@test.com',
    password: 'password123',
    full_name: 'ผู้แจ้งซ่อม ทดสอบ',
    role: 'requester',
    phone_number: '089-123-4567'
  },
  {
    email: 'technician@test.com',
    password: 'password123',
    full_name: 'ช่างเทคนิค ทดสอบ',
    role: 'technician',
    phone_number: '089-234-5678'
  },
  {
    email: 'supervisor@test.com',
    password: 'password123',
    full_name: 'หัวหน้างาน ทดสอบ',
    role: 'planner',
    phone_number: '089-345-6789'
  },
  {
    email: 'admin@test.com',
    password: 'password123',
    full_name: 'ผู้ดูแลระบบ',
    role: 'admin',
    phone_number: '089-456-7890'
  }
]

async function createTestUsers() {
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

    // Create users
    for (const user of testUsers) {
      console.log(`\n📝 Creating user: ${user.email}`)

      // Hash password
      const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS)

      // Check if user already exists
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [user.email]
      )

      if (Array.isArray(existing) && existing.length > 0) {
        console.log(`⚠️  User ${user.email} already exists, updating...`)
        
        // Update existing user
        await connection.execute(
          `UPDATE users 
           SET password_hash = ?, full_name = ?, role = ?, phone_number = ?, is_active = 1, updated_at = NOW()
           WHERE email = ?`,
          [passwordHash, user.full_name, user.role, user.phone_number, user.email]
        )
        
        console.log(`✅ Updated user: ${user.email}`)
      } else {
        // Insert new user
        await connection.execute(
          `INSERT INTO users (email, password_hash, full_name, role, phone_number, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
          [user.email, passwordHash, user.full_name, user.role, user.phone_number]
        )
        
        console.log(`✅ Created user: ${user.email}`)
      }
    }

    console.log('\n✅ All test users created successfully!')
    console.log('\n📋 Test Users:')
    testUsers.forEach(user => {
      console.log(`   - ${user.email} / ${user.password} (${user.role})`)
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
createTestUsers()
