import Image from 'next/image'
import Link from 'next/link'

interface QuickAction {
  pendingOrders: {
    count: number
    orders: Array<{
      id: string
      orderNumber: string
      totalAmount: number
      status: string
      createdAt: string
      user: {
        id: string
        name: string
        image: string | null
      }
      _count: {
        orderItems: number
      }
    }>
  }
  unreadChats: {
    count: number
    chats: Array<{
      id: string
      user: {
        id: string
        name: string
        image: string | null
      }
      latestMessage: {
        content: string
        createdAt: string
      } | null
      unreadCount: number
    }>
  }
  lowStockProducts: {
    count: number
    products: Array<{
      id: string
      name: string
      stock: number
      minStock: number
      imageUrl: string | null
    }>
  }
}

interface QuickActionsPanelProps {
  data: QuickAction
}

export default function QuickActionsPanel({ data }: QuickActionsPanelProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}分鐘前`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}小時前`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}天前`
    }
  }

  return (
    <div className="space-y-6">
      {/* 待處理訂單 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">待處理訂單</h3>
            {data.pendingOrders.count > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {data.pendingOrders.count}
              </span>
            )}
          </div>
          <Link
            href="/admin/orders"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            查看全部
          </Link>
        </div>

        {data.pendingOrders.orders.length > 0 ? (
          <div className="space-y-3">
            {data.pendingOrders.orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {order.user.image ? (
                      <Image
                        src={order.user.image}
                        alt={order.user.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="text-gray-600 text-sm">👤</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.user.name} • {order._count.orderItems} 個商品
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    NT$ {order.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTime(order.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">目前沒有待處理的訂單</p>
          </div>
        )}
      </div>

      {/* 未讀訊息 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">未讀訊息</h3>
            {data.unreadChats.count > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {data.unreadChats.count}
              </span>
            )}
          </div>
          <Link
            href="/admin/chats"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            查看全部
          </Link>
        </div>

        {data.unreadChats.chats.length > 0 ? (
          <div className="space-y-3">
            {data.unreadChats.chats.slice(0, 5).map((chat) => (
              <Link
                key={chat.id}
                href={`/admin/chats/${chat.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {chat.user.image ? (
                        <Image
                          src={chat.user.image}
                          alt={chat.user.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <span className="text-gray-600 text-sm">👤</span>
                      )}
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {chat.user.name}
                    </p>
                    {chat.latestMessage && (
                      <p className="text-xs text-gray-500 truncate max-w-48">
                        {chat.latestMessage.content}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {chat.latestMessage && formatTime(chat.latestMessage.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">目前沒有未讀訊息</p>
          </div>
        )}
      </div>

      {/* 低庫存提醒 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">低庫存提醒</h3>
            {data.lowStockProducts.count > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {data.lowStockProducts.count}
              </span>
            )}
          </div>
          <Link
            href="/admin/stock"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            查看全部
          </Link>
        </div>

        {data.lowStockProducts.products.length > 0 ? (
          <div className="space-y-3">
            {data.lowStockProducts.products.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">📦</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      最低庫存: {product.minStock}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    product.stock === 0 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    剩餘 {product.stock}
                  </p>
                  <Link
                    href={`/admin/stock`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    補貨
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">所有商品庫存充足</p>
          </div>
        )}
      </div>
    </div>
  )
}