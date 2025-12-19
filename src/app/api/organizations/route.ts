// Organizations API Endpoint
// GET /api/organizations - List user's organizations
// POST /api/organizations - Create new organization

import { NextResponse } from 'next/server'
import { createOrganization, getUserOrganizations } from '@/lib/enterprise/organizations'
import { createAuditLog } from '@/lib/enterprise/auditLogs'

export async function GET(request: Request) {
    try {
        // TODO: Get userId from auth session
        const userId = request.headers.get('x-user-id')

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const organizations = await getUserOrganizations(userId)

        return NextResponse.json(organizations)

    } catch (error) {
        console.error('Error fetching organizations:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        // TODO: Get userId from auth session
        const userId = request.headers.get('x-user-id')

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { name, slug, tier } = body

        if (!name || !slug) {
            return NextResponse.json(
                { error: 'Name and slug are required' },
                { status: 400 }
            )
        }

        const organization = await createOrganization({
            name,
            slug,
            ownerId: userId,
            tier: tier || 'essential'
        })

        if (!organization) {
            return NextResponse.json(
                { error: 'Failed to create organization' },
                { status: 500 }
            )
        }

        // Create audit log
        await createAuditLog({
            organizationId: organization.id,
            userId,
            action: 'org.created',
            resourceType: 'organization',
            resourceId: organization.id,
            metadata: { name, slug, tier }
        })

        return NextResponse.json(organization, { status: 201 })

    } catch (error) {
        console.error('Error creating organization:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
