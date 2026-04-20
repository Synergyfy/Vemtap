import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface QrThriveWebhookPayload {
  event: string;
  userId: string;
  data: Record<string, any>;
  timestamp: string;
}

const WEBHOOK_SECRET = process.env.QR_THRIVE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-qr-thrive-signature');
    const body = await request.text();

    if (WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('[QR-THRIVE WEBHOOK] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload: QrThriveWebhookPayload = JSON.parse(body);

    console.log('[QR-THRIVE WEBHOOK] Received:', payload.event, payload.userId);

    switch (payload.event) {
      case 'user.updated':
        await handleUserUpdate(payload);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdate(payload);
        break;

      case 'qr.created':
        await handleQRCreated(payload);
        break;

      case 'qr.deleted':
        await handleQRDeleted(payload);
        break;

      case 'scan.milestone':
        await handleScanMilestone(payload);
        break;

      default:
        console.log('[QR-THRIVE WEBHOOK] Unknown event:', payload.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[QR-THRIVE WEBHOOK] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUserUpdate(payload: QrThriveWebhookPayload) {
  const { userId, data } = payload;
  console.log('[QR-THRIVE WEBHOOK] User updated:', userId, data);
}

async function handleSubscriptionUpdate(payload: QrThriveWebhookPayload) {
  const { userId, data } = payload;
  console.log('[QR-THRIVE WEBHOOK] Subscription updated:', userId, data);
}

async function handleQRCreated(payload: QrThriveWebhookPayload) {
  const { userId, data } = payload;
  console.log('[QR-THRIVE WEBHOOK] QR created:', userId, data.qrId);
}

async function handleQRDeleted(payload: QrThriveWebhookPayload) {
  const { userId, data } = payload;
  console.log('[QR-THRIVE WEBHOOK] QR deleted:', userId, data.qrId);
}

async function handleScanMilestone(payload: QrThriveWebhookPayload) {
  const { userId, data } = payload;
  console.log('[QR-THRIVE WEBHOOK] Scan milestone reached:', userId, {
    qrId: data.qrId,
    scans: data.scans,
    milestone: data.milestone,
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'QR-Thrive webhook endpoint',
    version: '1.0.0',
    events: [
      'user.updated',
      'subscription.updated',
      'qr.created',
      'qr.deleted',
      'scan.milestone',
    ],
  });
}