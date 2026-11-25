import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { findUserByUsername } from '@/lib/db'

export function getAuthOptions() {
  return {
    providers: [
      CredentialsProvider({
        id: 'credentials',
        name: 'CRM Login',
        credentials: {
          username: { label: 'Username', type: 'text' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          if (!credentials?.username || !credentials?.password) return null
          const user = findUserByUsername(credentials.username)
          if (!user || !user.active) return null
          const valid = bcrypt.compareSync(credentials.password, user.password_hash)
          if (!valid) return null
          return {
            id: String(user.id),
            name: user.name,
            email: `${user.username}@crm.local`,
            username: user.username,
            role: user.role,
            branch: user.branch || '',
          }
        },
      }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: 'jwt', maxAge: 12 * 60 * 60 },
    pages: { signIn: '/' },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.uid = user.id
          token.username = user.username
          token.role = user.role
          token.branch = user.branch
        }
        return token
      },
      async session({ session, token }) {
        if (session?.user) {
          session.user.id = token.uid || ''
          session.user.username = token.username || ''
          session.user.role = token.role || 'agent'
          session.user.branch = token.branch || ''
          session.user.isAdmin = token.role === 'admin'
          session.user.isManager = token.role === 'manager'
        }
        return session
      },
    },
  }
}
