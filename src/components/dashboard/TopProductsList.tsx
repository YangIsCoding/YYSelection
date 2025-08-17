import Image from 'next/image'
import Link from 'next/link'

interface TopProduct {
  id: string
  name: string
  imageUrl: string | null
  price: number
  category: string
  totalSold: number
  orderCount: number
}

interface TopProductsListProps {
  products: TopProduct[]
}

export default function TopProductsList({ products }: TopProductsListProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">熱銷商品排行榜</h3>
        <p className="text-sm text-gray-500">銷量最高的商品</p>
      </div>

      {products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              {/* 排名 */}
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {index + 1}
                </div>
              </div>

              {/* 商品圖片 */}
              <div className="flex-shrink-0">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xs">無圖</span>
                  </div>
                )}
              </div>

              {/* 商品資訊 */}
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/products/${product.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                >
                  {product.name}
                </Link>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {product.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    NT$ {product.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 銷售數據 */}
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {product.totalSold} 個
                </div>
                <div className="text-xs text-gray-500">
                  {product.orderCount} 筆訂單
                </div>
              </div>

              {/* 管理連結 */}
              <div className="flex-shrink-0">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  管理
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🏆</div>
          <p>暫無銷售數據</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Link
            href="/admin/products"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            查看所有商品 →
          </Link>
        </div>
      )}
    </div>
  )
}