'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { data: session } = useSession()
  const user = session?.user
  const isAdmin = user?.role === 'ADMIN'

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* 左側 Logo + 導覽連結 */}
        <div className="flex gap-6 items-center">
          <Link href="/" className="text-xl font-semibold text-gray-800">
            YYSelction
          </Link>
          <Link href="/products" className="text-sm text-gray-600 hover:text-black transition">
            所有商品
          </Link>

          {user && !isAdmin && (
            <>
              <Link href="/orders" className="text-sm text-gray-600 hover:text-black transition">
                我的訂單
              </Link>
              <Link href="/chat" className="text-sm text-gray-600 hover:text-black transition">
                我的對話
              </Link>
            </>
          )}

          {user && isAdmin && (
            <>
              <Link href="/admin/dashboard" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition">
                📊 儀表板
              </Link>
              <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-black transition">
                訂單管理
              </Link>
              <Link href="/admin/chats" className="text-sm text-gray-600 hover:text-black transition">
                聊天管理
              </Link>
              <Link href="/admin/products" className="text-sm text-gray-600 hover:text-black transition">
                商品管理
              </Link>
              <Link href="/admin/stock" className="text-sm text-gray-600 hover:text-black transition">
                庫存管理
              </Link>
              <Link href="/admin/users" className="text-sm text-gray-600 hover:text-black transition">
                使用者管理
              </Link>
              <Link href="/admin/banners" className="text-sm text-gray-600 hover:text-black transition">
                廣告管理
              </Link>
            </>
          )}
        </div>

        {/* 右側登入/登出 */}
        <div>
          {!user ? (
            <button
              onClick={() => signIn('google')}
              className="text-sm text-white bg-[#d96c6c] hover:bg-[#c55b5b] px-3 py-1 rounded"
            >
              Google 登入
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="text-sm text-gray-700">
                {isAdmin ? `管理員您好，${user.name}` : user.name}
              </span>
              <button
                onClick={() => signOut()}
                className="text-xs text-gray-500 hover:text-red-500 transition"
              >
                登出
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
