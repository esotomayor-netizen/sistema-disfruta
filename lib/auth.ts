import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',      type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.usuario.findUnique({ where: { email: credentials.email } })
        if (!user || !user.activo) return null
        if (!user.password) return null
        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) return null
        return {
          id:       String(user.id),
          name:     `${user.nombre} ${user.apellido}`,
          email:    user.email,
          rol:      user.rol,
          usuarioId: user.id,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id  = (user as any).usuarioId
        token.rol = (user as any).rol
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id  = token.id
        ;(session.user as any).rol = token.rol
      }
      return session
    },
  },
  pages:   { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret:  process.env.NEXTAUTH_SECRET,
}
