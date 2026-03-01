// SSE Endpoint สำหรับ Real-time Notifications
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne } from '../../utils/db'
import { verifyToken } from '../../utils/password'
import { getAuthUser } from '../../utils/auth'

// Store active connections in memory
const connections = new Map<string, { userId: number; res: any; connectionId: string }>()

export default defineEventHandler(async (event) => {
  // Try to get user from Authorization header first
  let user = await getAuthUser(event)
  
  // If no user from header, try to get token from query parameter
  if (!user) {
    const query = getQuery(event)
    const token = query.token as string
    
    if (token) {
      // Verify token
      const payload = verifyToken(token)
      
      if (payload) {
        // Query user from database
        const userRecord = await queryOne<{
          id: number
          email: string
          full_name: string
          role: 'admin' | 'planner' | 'technician' | 'vendor' | 'requester' | 'engineer'
          phone_number: string | null
          is_active: number
        }>(
          'SELECT id, email, full_name, role, phone_number, is_active FROM users WHERE id = ? AND is_active = 1 LIMIT 1',
          [payload.userId]
        )
        
        if (userRecord) {
          user = {
            id: userRecord.id,
            email: userRecord.email,
            full_name: userRecord.full_name,
            role: userRecord.role,
            phone_number: userRecord.phone_number || undefined,
            is_active: userRecord.is_active === 1
          }
        }
      }
    }
  }
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const connectionId = uuidv4()
  const userId = user.id

  // Set SSE headers
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable nginx buffering
  })

  // Store connection
  connections.set(connectionId, {
    userId,
    res: event.node.res,
    connectionId
  })

      // Register connection in database
      await query(`
        INSERT INTO sse_connections (user_id, connection_id, last_heartbeat, user_agent, ip_address)
        VALUES (?, ?, NOW(), ?, ?)
      `, [userId, connectionId, event.node.req.headers['user-agent'], getRequestIP(event)])

  // Send initial connection message
  sendSSEMessage(event.node.res, {
    type: 'connected',
    connectionId,
    timestamp: new Date().toISOString()
  })

  // Keep-alive interval (every 30 seconds)
  const keepAliveInterval = setInterval(() => {
    if (event.node.res.writableEnded) {
      clearInterval(keepAliveInterval)
      return
    }
    
    // Send heartbeat
    sendSSEMessage(event.node.res, {
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    })

    // Update last_heartbeat in database
    updateHeartbeat(connectionId).catch(console.error)
  }, 30000)

  // Handle client disconnect
  event.node.req.on('close', async () => {
    clearInterval(keepAliveInterval)
    connections.delete(connectionId)
    
    // Remove from database
    try {
      await query('DELETE FROM sse_connections WHERE connection_id = ?', [connectionId])
    } catch (error) {
      console.error('Failed to remove SSE connection:', error)
    }
  })

  // Keep connection open
  return new Promise(() => {})
})


// Helper function to send SSE message
function sendSSEMessage(res: any, data: any) {
  if (res.writableEnded) return
  
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

// Helper function to update heartbeat
async function updateHeartbeat(connectionId: string) {
  try {
    await query(
      'UPDATE sse_connections SET last_heartbeat = NOW() WHERE connection_id = ?',
      [connectionId]
    )
  } catch (error) {
    console.error('Failed to update heartbeat:', error)
  }
}

// Export function to broadcast notification to specific user
export function broadcastNotification(userId: number, notification: any) {
  for (const [connectionId, conn] of connections.entries()) {
    if (conn.userId === userId) {
      sendSSEMessage(conn.res, {
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      })
    }
  }
}

// Export function to broadcast to all connections
export function broadcastToAll(data: any) {
  for (const [connectionId, conn] of connections.entries()) {
    sendSSEMessage(conn.res, {
      type: 'broadcast',
      data,
      timestamp: new Date().toISOString()
    })
  }
}
