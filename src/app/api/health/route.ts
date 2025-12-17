import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        checks: {
            app: 'ok',
            database: 'unchecked', // Will check Supabase when env is set
            api: 'ok'
        },
        uptime: process.uptime(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            unit: 'MB'
        }
    }

    // Check Supabase connection if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
        try {
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                }
            })
            health.checks.database = response.ok ? 'ok' : 'error'
        } catch {
            health.checks.database = 'error'
        }
    }

    // Determine overall status
    const allOk = Object.values(health.checks).every(v => v === 'ok' || v === 'unchecked')
    health.status = allOk ? 'healthy' : 'degraded'

    return NextResponse.json(health, {
        status: allOk ? 200 : 503,
        headers: {
            'Cache-Control': 'no-store'
        }
    })
}
