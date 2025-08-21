'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface OrderStatusData {
  pending: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
}

interface OrderStatusChartProps {
  data: OrderStatusData
}

export default function OrderStatusChart({ data }: OrderStatusChartProps) {
  const chartData = [
    { name: '已付款', value: data.pending, color: '#fbbf24' },
    { name: '處理中', value: data.processing, color: '#3b82f6' },
    { name: '已出貨', value: data.shipped, color: '#8b5cf6' },
    { name: '已完成', value: data.delivered, color: '#10b981' },
    { name: '已取消', value: data.cancelled, color: '#ef4444' }
  ].filter(item => item.value > 0) // 只顯示有數據的狀態

  const COLORS = chartData.map(item => item.color)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; color: string } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">數量: {data.value}</p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { 
    cx?: number; 
    cy?: number; 
    midAngle?: number; 
    innerRadius?: number; 
    outerRadius?: number; 
    percent?: number 
  }) => {
    if (!percent || percent < 0.05) return null // 小於5%不顯示標籤
    if (!cx || !cy || !midAngle || !innerRadius || !outerRadius) return null
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="500"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">訂單狀態分布</h3>
        <p className="text-sm text-gray-500">各狀態訂單數量佔比</p>
      </div>
      
      {chartData.length > 0 ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>暫無訂單數據</p>
          </div>
        </div>
      )}
    </div>
  )
}