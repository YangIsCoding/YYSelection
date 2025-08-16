// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account", // 強制顯示帳號選擇頁面
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: '/',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // 檢查使用者是否已存在
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          const userData = {
            googleId: user.id,
            email: user.email!,
            name: user.name!,
            image: user.image,
            emailVerified: Boolean(user.email_verified),
            firstName: (profile as any)?.given_name,
            lastName: (profile as any)?.family_name,
            locale: (profile as any)?.locale || 'zh-TW',
            role: (user.email === ADMIN_EMAIL ? 'ADMIN' : 'USER') as Role,
            lastLoginAt: new Date()
          }

          if (existingUser) {
            // 更新現有使用者的登入時間和基本資訊
            await prisma.user.update({
              where: { email: user.email! },
              data: {
                name: userData.name,
                image: userData.image,
                lastLoginAt: userData.lastLoginAt,
                role: userData.role
              }
            })
          } else {
            // 建立新使用者
            await prisma.user.create({
              data: userData
            })
          }
          
          return true
        } catch (error) {
          console.error('Error saving user to database:', error)
          // 即使資料庫操作失敗，也允許登入
          return true
        }
      }
      
      return true
    },

    async session({ session }) {
      if (session.user?.email) {
        try {
          // 從資料庫載入完整的使用者資訊
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
              id: true,
              role: true,
              isActive: true,
              createdAt: true,
              lastLoginAt: true
            }
          })

          if (dbUser) {
            session.user = {
              ...session.user,
              id: dbUser.id,
              role: dbUser.role,
              isActive: dbUser.isActive
            }
          }
        } catch (error) {
          console.error('Error loading user from database:', error)
        }
      }
      return session
    },

    async jwt({ token }) {
      return token
    },
  },
}