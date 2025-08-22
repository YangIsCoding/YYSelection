// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

// ✅ 改成多個 email，逗號分隔
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

const isAdmin = (email?: string | null) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase())

// 動態設定 NextAuth URL
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  return 'http://localhost:3000'
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: '/', // 確保首頁不會無限重導
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const email = user.email!
          const now = new Date()

          // ✅ 用 upsert 防止競態 + 同時處理新增/更新
          await prisma.user.upsert({
            where: { email },
            create: {
              // ✅ 用 providerAccountId 當 Google 唯一 ID
              googleId: account.providerAccountId,
              email,
              name: user.name!,
              image: user.image,
              // ⚠️ 如果你的 Prisma 欄位是 DateTime，這行要改成日期或拿掉
              // emailVerified: (profile as any)?.email_verified ? new Date() : null,
              // 如果你的欄位是 Boolean 才保留這行：
              // emailVerified: Boolean((profile as any)?.email_verified),

              firstName: (profile as { given_name?: string })?.given_name,
              lastName: (profile as { family_name?: string })?.family_name,
              locale: (profile as { locale?: string })?.locale || 'zh-TW',
              role: (isAdmin(email) ? 'ADMIN' : 'USER') as Role,
              lastLoginAt: now,
            },
            update: {
              name: user.name ?? undefined,
              image: user.image ?? undefined,
              lastLoginAt: now,
              // ✅ 若之後把某人加入/移出管理員名單，這裡會在下次登入時自動修正
              role: (isAdmin(email) ? 'ADMIN' : 'USER') as Role,
            }
          })

          return true
        } catch (error) {
          console.error('Error saving user to database:', error)
          return true // 就算 DB 失敗也允許登入
        }
      }
      return true
    },

    async session({ session }) {
      if (session.user?.email) {
        try {
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
          } else {
            // 如果沒有 DB 紀錄（例如 DB 寫入失敗），仍可用 env 判斷
            session.user = {
              ...session.user,
              role: (isAdmin(session.user.email) ? 'ADMIN' : 'USER') as Role,
              isActive: true
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
