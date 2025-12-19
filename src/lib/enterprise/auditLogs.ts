// Audit Logging Service
// Tracks all important actions for compliance and security

import { getSupabase } from '../supabase'

export type AuditAction =
    | 'user.invited'
    | 'user.removed'
    | 'user.role_changed'
    | 'org.created'
    | 'org.updated'
    | 'org.deleted'
    | 'portfolio.created'
    | 'portfolio.updated'
    | 'portfolio.deleted'
    | 'api_key.created'
    | 'api_key.revoked'
    | 'alert.created'
    | 'alert.deleted'
    | 'settings.updated'

export type AuditLog = {
    id: string
    organizationId: string
    userId: string | null
    action: AuditAction
    resourceType: string | null
    resourceId: string | null
    metadata: Record<string, any>
    createdAt: string
}

// Create audit log entry
export async function createAuditLog(params: {
    organizationId: string
    userId: string
    action: AuditAction
    resourceType?: string
    resourceId?: string
    metadata?: Record<string, any>
}): Promise<string | null> {
    try {
        const supabase = getSupabase()

        const { data } = await supabase
            .rpc('create_audit_log', {
                p_org_id: params.organizationId,
                p_user_id: params.userId,
                p_action: params.action,
                p_resource_type: params.resourceType || null,
                p_resource_id: params.resourceId || null,
                p_metadata: params.metadata || {}
            })

        return data
    } catch (error) {
        console.error('Error creating audit log:', error)
        return null
    }
}

// Get audit logs for organization
export async function getOrganizationAuditLogs(
    organizationId: string,
    options?: {
        limit?: number
        offset?: number
        userId?: string
        action?: AuditAction
        startDate?: Date
        endDate?: Date
    }
): Promise<{ logs: AuditLog[]; total: number }> {
    try {
        const supabase = getSupabase()

        let query = supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        if (options?.userId) {
            query = query.eq('user_id', options.userId)
        }

        if (options?.action) {
            query = query.eq('action', options.action)
        }

        if (options?.startDate) {
            query = query.gte('created_at', options.startDate.toISOString())
        }

        if (options?.endDate) {
            query = query.lte('created_at', options.endDate.toISOString())
        }

        if (options?.limit) {
            query = query.limit(options.limit)
        }

        if (options?.offset) {
            query = query.range(options.offset, options.offset + (options?.limit || 10) - 1)
        }

        const { data, error, count } = await query

        if (error || !data) {
            return { logs: [], total: 0 }
        }

        return {
            logs: data.map(mapAuditLog),
            total: count || 0
        }
    } catch {
        return { logs: [], total: 0 }
    }
}

// Get audit logs for specific resource
export async function getResourceAuditLogs(
    organizationId: string,
    resourceType: string,
    resourceId: string
): Promise<AuditLog[]> {
    try {
        const supabase = getSupabase()

        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('resource_type', resourceType)
            .eq('resource_id', resourceId)
            .order('created_at', { ascending: false })

        if (error || !data) {
            return []
        }

        return data.map(mapAuditLog)
    } catch {
        return []
    }
}

// Get recent activity for organization
export async function getRecentActivity(
    organizationId: string,
    limit = 20
): Promise<AuditLog[]> {
    try {
        const supabase = getSupabase()

        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error || !data) {
            return []
        }

        return data.map(mapAuditLog)
    } catch {
        return []
    }
}

// Helper to map database row to AuditLog type
function mapAuditLog(data: any): AuditLog {
    return {
        id: data.id,
        organizationId: data.organization_id,
        userId: data.user_id,
        action: data.action,
        resourceType: data.resource_type,
        resourceId: data.resource_id,
        metadata: data.metadata || {},
        createdAt: data.created_at
    }
}

// Audit log decorator for automatic logging
export function withAuditLog(
    organizationId: string,
    userId: string,
    action: AuditAction,
    resourceType?: string
) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value

        descriptor.value = async function (...args: any[]) {
            const result = await originalMethod.apply(this, args)

            // Log after successful operation
            if (result) {
                const resourceId = typeof result === 'object' && result.id ? result.id : undefined

                await createAuditLog({
                    organizationId,
                    userId,
                    action,
                    resourceType,
                    resourceId,
                    metadata: {
                        method: propertyKey,
                        timestamp: new Date().toISOString()
                    }
                })
            }

            return result
        }

        return descriptor
    }
}
