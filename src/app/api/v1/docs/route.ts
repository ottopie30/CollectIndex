// API Documentation Endpoint
// GET /api/v1/docs - Returns OpenAPI spec

import { NextResponse } from 'next/server'
import { getOpenApiJson } from '@/lib/api/openapi'

export const dynamic = 'force-static'

export async function GET() {
    const spec = getOpenApiJson()

    return new NextResponse(spec, {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    })
}
