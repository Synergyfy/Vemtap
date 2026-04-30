import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userResponse = await api.get('/users/me');
    const user = userResponse;

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      qrThriveUserId: user.qrThriveUserId || null,
      provisioned: !!user.qrThriveUserId,
    });
  } catch (error) {
    console.error('[QRThrive STATUS] Error:', error);
    return NextResponse.json(
      { qrThriveUserId: null, provisioned: false },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { email, firstName, lastName } = await request.json();

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const qrThriveApiUrl = process.env.NEXT_PUBLIC_QR_THRIVE_API_URL || 'https://api.qrthrive.com/api/v1/integration';
    const qrThriveApiKey = process.env.QR_THRIVE_API_KEY || process.env.NEXT_PUBLIC_QR_THRIVE_API_KEY || '';

    const response = await fetch(`${qrThriveApiUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': qrThriveApiKey,
      },
      body: JSON.stringify({ email, firstName, lastName }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to provision user' }));
      return NextResponse.json(
        { error: error.message },
        { status: response.status }
      );
    }

    const qrThriveUser = await response.json();

    return NextResponse.json({
      success: true,
      qrThriveUserId: qrThriveUser.id,
    });
  } catch (error) {
    console.error('[QRThrive PROVISION] Error:', error);
    return NextResponse.json(
      { error: 'Failed to provision user' },
      { status: 500 }
    );
  }
}