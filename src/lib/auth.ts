import { NextAuthOptions } from "next-auth"
import { db } from "@/lib/db"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Pour la démo, on utilise toujours les credentials de base
          // En production, vous devriez vérifier contre une base de données
          const demoEmail = process.env.DEMO_EMAIL || "demo@memovox.com"
          const demoPassword = process.env.DEMO_PASSWORD || "demo123"
          
          if (credentials.email === demoEmail && credentials.password === demoPassword) {
            return {
              id: "demo-user-id",
              email: credentials.email,
              name: "Demo User",
            }
          }

          // Vérifier si l'utilisateur existe dans la base de données
          const user = await db.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (user && await bcrypt.compare(credentials.password, user.password)) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          }

          return null
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    }
  }
}