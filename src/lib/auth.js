const ADMIN_EMAILS = ['mehap5314@gmail.com']
const MANAGER_EMAILS = ['moataz.ramadan@hammer-protection.com']

export function getAuthOptions() {
  return {
    providers: [
      {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        wellKnown: 'https://accounts.google.com/.well-known/openid-configuration',
        authorization: { params: { scope: 'openid email profile' } },
        idToken: true,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        profile(profile) {
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
          }
        },
      },
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: 'jwt' },
    pages: {
      signIn: '/',
    },
    callbacks: {
      async signIn({ account, profile }) {
        if (account.provider === 'google') {
          const allowedEmails = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim())
          if (allowedEmails.length > 0 && allowedEmails[0] !== '') {
            return allowedEmails.includes(profile.email)
          }
          return true
        }
        return false
      },
      async jwt({ token, profile }) {
        const email = profile?.email || token?.email || ''
        if (email) {
          token.isAdmin = ADMIN_EMAILS.includes(email)
          token.isManager = MANAGER_EMAILS.includes(email)
        }
        return token
      },
      async session({ session, token }) {
        session.user.isAdmin = token.isAdmin || false
        session.user.isManager = token.isManager || false
        return session
      },
    },
  }
}
