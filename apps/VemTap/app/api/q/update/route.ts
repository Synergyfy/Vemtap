import { NextRequest, NextResponse } from 'next/server';
import { redirectService } from '@/lib/redirect-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const id = String(body?.id || '').trim();
        const url = String(body?.url || '').trim();

        if (!id || !url) {
            return NextResponse.json({ error: 'id and url are required' }, { status: 400 });
        }

        redirectService.updateDestination(id, url);
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
