'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface WishlistButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'icon' | 'button'
}

export default function WishlistButton({ 
  productId, 
  className = '', 
  size = 'md',
  variant = 'button'
}: WishlistButtonProps) {
  const { data: session } = useSession()
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // 檢查商品是否在願望清單中
  const checkWishlistStatus = async () => {
    if (!session) {
      setChecking(false)
      return
    }

    try {
      const response = await fetch(`/api/wishlist/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setIsInWishlist(data.isInWishlist)
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkWishlistStatus()
  }, [session, productId])

  // 切換願望清單狀態
  const toggleWishlist = async () => {
    if (!session) {
      alert('請先登入才能使用此功能')
      return
    }

    setLoading(true)

    try {
      if (isInWishlist) {
        // 從願望清單移除
        const response = await fetch(`/api/wishlist/${productId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setIsInWishlist(false)
          showNotification('已從願望清單中移除')
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to remove from wishlist')
        }
      } else {
        // 添加到願望清單
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ productId })
        })

        if (response.ok) {
          setIsInWishlist(true)
          showNotification('已加入願望清單')
        } else {
          const error = await response.json()
          alert(error.error || 'Failed to add to wishlist')
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      alert('操作失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  // 顯示通知
  const showNotification = (message: string) => {
    // 簡單的通知實現，可以後續改為 toast 組件
    alert(message)
  }

  // 按鈕樣式
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return variant === 'icon' ? 'w-8 h-8' : 'px-3 py-1.5 text-sm'
      case 'lg':
        return variant === 'icon' ? 'w-12 h-12' : 'px-6 py-3 text-lg'
      default:
        return variant === 'icon' ? 'w-10 h-10' : 'px-4 py-2'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'lg':
        return 'w-6 h-6'
      default:
        return 'w-5 h-5'
    }
  }

  if (checking) {
    return (
      <div className={`${getSizeClasses()} ${className} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleWishlist}
        disabled={loading}
        className={`
          ${getSizeClasses()}
          flex items-center justify-center
          rounded-full
          transition-all duration-200
          ${isInWishlist 
            ? 'bg-rose-100 text-rose-500 hover:bg-rose-200' 
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-rose-500'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        title={isInWishlist ? '從願望清單中移除' : '加入願望清單'}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : (
          <svg className={getIconSize()} fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`
        ${getSizeClasses()}
        flex items-center justify-center gap-2
        font-medium
        rounded-lg
        transition-all duration-200
        ${isInWishlist 
          ? 'bg-rose-500 text-white hover:bg-rose-600' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <>
          <svg className={getIconSize()} fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>
            {isInWishlist ? '從願望清單中移除' : '加入願望清單'}
          </span>
        </>
      )}
    </button>
  )
}