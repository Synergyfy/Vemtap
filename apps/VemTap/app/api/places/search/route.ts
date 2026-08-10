import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length < 2) {
        return NextResponse.json([], { status: 200 });
    }

    const params = new URLSearchParams({
        q: q.trim(),
        format: 'json',
        addressdetails: '1',
        limit: '6',
    });

    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: {
            'User-Agent': 'VemtapApp/1.0 (https://vemtap.com)',
            'Accept-Language': 'en',
        },
    });

    if (!res.ok) {
        return NextResponse.json([], { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
}