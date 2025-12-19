// Organizations Service
// Manages multi-tenant organizations for Enterprise tier

import { getSupabase } from '../supabase'

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer'

export type Organization = {
    id: string
    name: string
    slug: string
    tier: 'essential' | 'pro' | 'enterprise'
    stripeCustomerId: string | null
    apiLimitOverride: number | null
    isActive: boolean
    ownerId: string
    createdAt: string
    updatedAt: string
}

export type OrganizationMember = {
    id: string
    organizationId: string
    userId: string
    role: OrganizationRole
    invitedBy: string | null
    joinedAt: string
}

// Create a new organization
export async function createOrganization(params: {
    name: string
    slug: string
    ownerId: string
    tier?: 'essential' | 'pro' | 'enterprise'
}): Promise<Organization | null> {
    try {
        const supabase = getSupabase()

        const { data, error } = await supabase
            .from('organizations')
            .insert({
                name: params.name,
                slug: params.slug,
                owner_id: params.ownerId,
                tier: params.tier || 'essential'
            })
            .select()
            .single()

        if (error || !data) {
            console.error('Error creating organization:', error)
            return null
        }

        // Add owner as member
        await addOrganizationMember({
            organizationId: data.id,
            userId: params.ownerId,
            role: 'owner'
        })

        return mapOrganization(data)
    } catch (error) {
        console.error('Error creating organization:', error)
        return null
    }
}

// Get organization by ID
export async function getOrganization(orgId: string): Promise<Organization | null> {
    try {
        const supabase = getSupabase()

        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single()

        if (error || !data) {
            return null
        }

        return mapOrganization(data)
    } catch {
        return null
    }
}

// Get organizations for a user
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
        const supabase = getSupabase()

        const { data: memberships, error } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', userId)

        if (error || !memberships) {
            return []
        }

        const orgIds = memberships.map(m => m.organization_id)

        const { data: orgs, error: orgsError } = await supabase
            .from('organizations')
            .select('*')
            .in('id', orgIds)

        if (orgsError || !orgs) {
            return []
        }

        return orgs.map(mapOrganization)
    } catch {
        return []
    }
}

// Add member to organization
export async function addOrganizationMember(params: {
    organizationId: string
    userId: string
    role: OrganizationRole
    invitedBy?: string
}): Promise<boolean> {
    try {
        const supabase = getSupabase()

        const { error } = await supabase
            .from('organization_members')
            .insert({
                organization_id: params.organizationId,
                user_id: params.userId,
                role: params.role,
                invited_by: params.invitedBy || null
            })

        return !error
    } catch {
        return false
    }
}

// Update member role
export async function updateMemberRole(
    organizationId: string,
    userId: string,
    newRole: OrganizationRole
): Promise<boolean> {
    try {
        const supabase = getSupabase()

        const { error } = await supabase
            .from('organization_members')
            .update({ role: newRole })
            .eq('organization_id', organizationId)
            .eq('user_id', userId)

        return !error
    } catch {
        return false
    }
}

// Remove member from organization
export async function removeMember(
    organizationId: string,
    userId: string
): Promise<boolean> {
    try {
        const supabase = getSupabase()

        const { error } = await supabase
            .from('organization_members')
            .delete()
            .eq('organization_id', organizationId)
            .eq('user_id', userId)

        return !error
    } catch {
        return false
    }
}

// Get organization members
export async function getOrganizationMembers(
    organizationId: string
): Promise<OrganizationMember[]> {
    try {
        const supabase = getSupabase()

        const { data, error } = await supabase
            .from('organization_members')
            .select('*')
            .eq('organization_id', organizationId)
            .order('joined_at', { ascending: true })

        if (error || !data) {
            return []
        }

        return data.map(m => ({
            id: m.id,
            organizationId: m.organization_id,
            userId: m.user_id,
            role: m.role,
            invitedBy: m.invited_by,
            joinedAt: m.joined_at
        }))
    } catch {
        return []
    }
}

// Check if user has required role
export async function checkUserRole(
    userId: string,
    organizationId: string,
    requiredRole: OrganizationRole
): Promise<boolean> {
    try {
        const supabase = getSupabase()

        const { data } = await supabase
            .rpc('user_has_org_role', {
                p_user_id: userId,
                p_org_id: organizationId,
                p_required_role: requiredRole
            })

        return data === true
    } catch {
        return false
    }
}

// Helper to map database row to Organization type
function mapOrganization(data: any): Organization {
    return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        tier: data.tier,
        stripeCustomerId: data.stripe_customer_id,
        apiLimitOverride: data.api_limit_override,
        isActive: data.is_active,
        ownerId: data.owner_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    }
}
