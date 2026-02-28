import mysql from 'mysql2/promise'

// Database connection pool
let pool: mysql.Pool | null = null

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const config = useRuntimeConfig()
    
    pool = mysql.createPool({
      host: config.dbHost || process.env.DB_HOST,
      port: parseInt(config.dbPort || process.env.DB_PORT || '3306'),
      user: config.dbUser || process.env.DB_USER,
      password: config.dbPassword || process.env.DB_PASSWORD,
      database: config.dbName || process.env.DB_NAME,
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
  const [rows] = await pool.execute(sql, params)
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
