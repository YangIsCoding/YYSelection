import { OrderStatus, PaymentStatus } from '@prisma/client'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  productImage: string
  unitPrice: number // 前端顯示用（元）
  quantity: number
  subtotal: number // 前端顯示用（元）
}

export interface Order {
  id: string
  orderNumber: string
  
  // 客戶資訊
  userId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  
  // 狀態
  status: OrderStatus
  paymentStatus: PaymentStatus
  
  // 金額
  totalAmount: number // 前端顯示用（元）
  
  // 備註
  customerNote?: string
  adminNote?: string
  
  // 時間
  createdAt: Date | string
  updatedAt: Date | string
  
  // 關聯資料
  orderItems: OrderItem[]
  user?: {
    id: string
    name: string
    email: string
    image?: string
  }
}

export interface CreateOrderRequest {
  userId: string
  customerPhone: string
  customerNote?: string
  adminNote?: string
  orderItems: {
    productId: string
    quantity: number
  }[]
}

export interface UpdateOrderRequest {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  customerPhone?: string
  customerNote?: string
  adminNote?: string
}

// 訂單狀態顯示用的中文映射
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PAID: '已付款',
  CONFIRMED: '已確認',
  PROCESSING: '採購中',
  SHIPPED: '已出貨',
  DELIVERED: '已送達',
  CANCELLED: '已取消'
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  COMPLETED: '已付款',
  REFUNDED: '已退款'
}

// 訂單編號生成器
export const generateOrderNumber = (): string => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const date = now.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
  return `${year}${month}${date}${random}`
}