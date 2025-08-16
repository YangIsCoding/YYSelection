export interface ProductImage {
  id: string
  imageUrl: string
  alt?: string | null
  sortOrder: number
  createdAt: Date | string
}

export interface Product {
  id: string
  name: string
  price: number // 這裡在前端仍以元為單位顯示
  description: string
  imageUrl: string
  category: string
  createdAt: Date | string
  updatedAt: Date | string
  images?: ProductImage[]
  stats?: ProductStats
}

export interface ProductStats {
  totalOrders: number
  recentOrders: number
}

export interface CreateProductRequest {
  name: string
  price: number // 以元為單位
  description: string
  imageUrl: string
  category: string
}

export interface UpdateProductRequest extends CreateProductRequest {
  id: string
}