import { NextResponse } from 'next/server'
import { getRedis, pingRedis } from '@/lib/redis'

// 簡單的日誌收集系統
const logs: string[] = []

// 添加日誌
export function addLog(message: string) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${message}`
  logs.push(logEntry)
  
  // 只保留最近100條日誌
  if (logs.length > 100) {
    logs.shift()
  }
  
  console.log(logEntry) // 同時輸出到console
}

// GET /api/debug/logs - 查看應用日誌
export async function GET() {
  try {
    // 獲取Redis狀態
    const redisStatus = await pingRedis()
    
    // 基本系統資訊
    const systemInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      redis: redisStatus ? 'connected' : 'disconnected',
      region: process.env.VERCEL_REGION || 'unknown'
    }

    // 如果有Redis，獲取一些統計資訊
    let redisStats = null
    if (redisStatus) {
      try {
        const redis = getRedis()
        const keys = await redis.keys('*')
        const info = await redis.info('memory')
        
        redisStats = {
          totalKeys: keys.length,
          keysByType: keys.reduce((acc: Record<string, number>, key) => {
            const prefix = key.split(':')[0]
            acc[prefix] = (acc[prefix] || 0) + 1
            return acc
          }, {}),
          memoryInfo: info.includes('used_memory_human') 
            ? info.match(/used_memory_human:([^\r\n]+)/)?.[1]?.trim() 
            : 'unavailable'
        }
      } catch (error) {
        redisStats = { error: error instanceof Error ? error.message : 'unknown' }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        system: systemInfo,
        redis: redisStats,
        recentLogs: logs.slice(-20), // 最近20條日誌
        logCount: logs.length
      }
    })

  } catch (error) {
    console.error('❌ 獲取日誌資訊失敗:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知錯誤',
        system: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          vercel: !!process.env.VERCEL
        }
      },
      { status: 500 }
    )
  }
}