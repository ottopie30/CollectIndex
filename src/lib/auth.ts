import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

// Auth helper functions
export const auth = {
    // Sign up with email
    async signUp(email: string, password: string, name?: string) {
        const supabase = createClient()
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                }
            }
        })
        return { data, error }
    },

    // Sign in with email
    async signIn(email: string, password: string) {
        const supabase = createClient()
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { data, error }
    },

    // Sign in with Google
    async signInWithGoogle() {
        const supabase = createClient()
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            }
        })
        return { data, error }
    },

    // Sign out
    async signOut() {
        const supabase = createClient()
        const { error } = await supabase.auth.signOut()
        return { error }
    },

    // Get current session
    async getSession() {
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        return { session, error }
    },

    // Get current user
    async getUser() {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        return { user, error }
    },

    // Reset password
    async resetPassword(email: string) {
        const supabase = createClient()
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })
        return { data, error }
    },

    // Update password
    async updatePassword(newPassword: string) {
        const supabase = createClient()
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        })
        return { data, error }
    },
}
