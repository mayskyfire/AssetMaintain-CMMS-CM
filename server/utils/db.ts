import mysql from 'mysql2/promise'

// Database connection pool
let pool: mysql.Pool | null = null

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const config = useRuntimeConfig()
    
    pool = mysql.createPool({
      host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
      port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
      user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
      password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
      database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'pm_cm_air_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Handle timezone - set to Asia/Bangkok
      timezone: '+07:00',
      // Convert dates to local timezone
      dateStrings: false,
      // Performance optimizations
      maxIdle: 10, // Maximum idle connections
      idleTimeout: 60000, // 60 seconds
      connectTimeout: 10000, // 10 seconds
      // MySQL 9.4 compatibility - CRITICAL
      multipleStatements: false,
      namedPlaceholders: false,
      // Charset
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: false,
      decimalNumbers: true
    })

    // Set timezone for all connections in the pool
    pool.on('connection', (connection) => {
      connection.query("SET time_zone = '+07:00'", (error) => {
        if (error) {
          console.error('❌ Failed to set timezone:', error)
        }
      })
    })

    console.log('✅ MySQL connection pool created with timezone +07:00')
  }

  return pool
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const pool = getDbPool()
  // Use pool.query() instead of pool.execute() for MySQL 9.4 compatibility
  // pool.execute() uses prepared statements which can cause
  // 'Incorrect arguments to mysqld_stmt_execute' with dynamic SQL
  const [rows] = await pool.query(sql, params)
  return rows as T[]
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows.length > 0 ? rows[0] : null
}

// Close pool on shutdown
export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    console.log('✅ MySQL connection pool closed')
  }
}
