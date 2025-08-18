'use client'

import { useState } from 'react'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
  showText?: boolean
  className?: string
}

export default function StarRating({
  rating,
  onRatingChange,
  size = 'md',
  readonly = false,
  showText = false,
  className = ''
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'lg':
        return 'w-8 h-8'
      default:
        return 'w-6 h-6'
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm'
      case 'lg':
        return 'text-lg'
      default:
        return 'text-base'
    }
  }

  const handleClick = (selectedRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(selectedRating)
    }
  }

  const handleMouseEnter = (selectedRating: number) => {
    if (!readonly) {
      setHoverRating(selectedRating)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }

  const getStarColor = (starIndex: number) => {
    const displayRating = hoverRating || rating
    if (displayRating >= starIndex) {
      return 'text-yellow-400'
    }
    return 'text-gray-300'
  }

  const ratingTexts = {
    1: '很差',
    2: '差',
    3: '普通',
    4: '好',
    5: '很好'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((starIndex) => (
          <button
            key={starIndex}
            type="button"
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`
              ${getSizeClasses()}
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              transition-all duration-150
              ${getStarColor(starIndex)}
              disabled:cursor-default
            `}
            aria-label={`${starIndex} 星`}
          >
            <svg
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.392 2.46a1 1 0 00-.364 1.118l1.286 3.97c.3.921-.755 1.688-1.54 1.118l-3.392-2.46a1 1 0 00-1.176 0l-3.392 2.46c-.784.57-1.838-.197-1.539-1.118l1.286-3.97a1 1 0 00-.364-1.118L2.045 9.397c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.97z" />
            </svg>
          </button>
        ))}
      </div>

      {showText && (
        <span className={`${getTextSize()} text-gray-600 ml-1`}>
          {rating > 0 && ratingTexts[rating as keyof typeof ratingTexts]}
          {rating === 0 && '未評分'}
        </span>
      )}

      {readonly && rating > 0 && (
        <span className={`${getTextSize()} text-gray-600 ml-1`}>
          ({rating}/5)
        </span>
      )}
    </div>
  )
}