'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BannerCarousel from '@/components/BannerCarousel'

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleStartShopping = () => {
    router.push('/products')
  }

  const handleChatWithYaYa = async () => {
    if (!session) {
      if (confirm('請先登入才能私訊歪歪，現在要登入嗎？')) {
        return
      }
      return
    }

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initialMessage: '您好！我想了解一下代購服務的相關資訊。'
        })
      })

      if (response.ok) {
        router.push('/chat')
      } else {
        alert('無法開啟聊天室，請稍後再試')
      }
    } catch (error) {
      console.error('Error opening chat:', error)
      alert('開啟聊天室時發生錯誤')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 text-white py-3">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="marquee-container overflow-hidden">
            <div className="marquee-content inline-block animate-marquee whitespace-nowrap">
              ✨ 全館95折優惠中！ ✨ 新品限時7折！ ✨ 累積訂單滿5單送精美好禮！ ✨ 免運費優惠進行中！ ✨ VIP會員專享額外折扣！ ✨ 推薦朋友購買雙方都有優惠！
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-rose-500/20 rounded-full border border-rose-500/30 mb-8">
              <span className="text-yellow-400 mr-2">⭐</span>
              <span className="text-sm font-medium text-gray-200">讓我來給你一對一服務</span>
              <span className="text-yellow-400 mr-2">⭐</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="text-white">
                歡迎來到
              </span>
              <br />
              <span className="bg-gradient-to-r from-rose-400 via-yellow-400 to-rose-400 bg-clip-text text-transparent">
                YYSelection
              </span>
            </h1>
            <p className="text-xl lg:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed text-gray-300">
              由代購達人「歪歪」為您精選世界各地的優質商品，<br />
              每封私訊都由「真人」與您對話，讓您輕鬆購買心儀商品
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={handleStartShopping}
                className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 hover:scale-105 shadow-xl"
              >
                開始購物 🛍️
              </button>
              <button
                onClick={handleChatWithYaYa}
                className="bg-transparent border-2 border-gray-300 text-white hover:bg-white hover:text-slate-900 font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 hover:scale-105"
              >
                聯繫歪歪 💬
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Carousel Section */}
      <BannerCarousel />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              為什麼選擇 YYSelection？
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們提供與眾不同的代購體驗，讓每一次購物都成為愉快的旅程
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">精選商品</h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                歪歪親自挑選，每件商品都經過嚴格篩選，確保品質與性價比
              </p>
            </div>
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">一對一服務</h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                直接與歪歪對話，即時回答您的問題，提供專業購買建議
              </p>
            </div>
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">快速便利</h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                簡化購買流程，從諮詢到下單一站式服務，讓您享受輕鬆便捷的購物體驗
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              如何使用 YYSelection？
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              簡單四步驟，開啟您的專屬購物之旅
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Google 登入</h3>
              <p className="text-gray-700 leading-relaxed">
                使用您的 Google 帳號快速登入，安全便利
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">瀏覽商品</h3>
              <p className="text-gray-700 leading-relaxed">
                查看歪歪為您精選的各種商品，找到喜歡的項目
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">私訊歪歪</h3>
              <p className="text-gray-700 leading-relaxed">
                點擊「私訊歪歪」按鈕，直接與歪歪對話諮詢
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">完成訂單</h3>
              <p className="text-gray-700 leading-relaxed">
                歪歪會為您建立專屬訂單，並協助完成購買流程
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-8">
            準備好開始您的專屬購物體驗了嗎？
          </h2>
          <p className="text-xl lg:text-2xl mb-12 text-gray-300 max-w-3xl mx-auto">
            加入 YYSelection，讓歪歪為您找到最棒的商品
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/products"
              className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 hover:scale-105 shadow-xl"
            >
              瀏覽所有商品 →
            </Link>
            <button
              onClick={handleChatWithYaYa}
              className="bg-transparent border-2 border-gray-300 text-white hover:bg-white hover:text-slate-900 font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 hover:scale-105"
            >
              立即聯繫歪歪 💬
            </button>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">關於歪歪</h3>
              <p className="text-gray-700 leading-relaxed text-lg mb-6" suppressHydrationWarning>
                歪歪是一位沒什麼特別的留學生，他在世界各地看見了許多奇珍異寶。
                她最喜歡尋找高品質、具有性價比的商品。
                在台灣，他創立YY選物，開始他的旅程。
              </p>
              <div className="flex items-center text-gray-600">
                <span className="text-rose-500 mr-2">📍</span>
                <span>提供全球代購服務</span>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">服務特色</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-rose-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700 font-medium">即時線上諮詢服務</span>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-rose-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700 font-medium">人工建立專屬訂單</span>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-rose-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700 font-medium">安全可靠的付款流程</span>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-rose-500 mr-3 text-xl">✓</span>
                  <span className="text-gray-700 font-medium">完整的訂單追蹤系統</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}