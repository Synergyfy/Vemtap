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
    const signature = request.headers.get('x-QRThrive-signature');
    const body = await request.text();

    if (WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('[QRThrive WEBHOOK] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload: QrThriveWebhookPayload = JSON.parse(body);

    console.log('[QRThrive WEBHOOK] Received:', payload.event, payload.userId);

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
        console.log('[QRThrive WEBHOOK] Unknown event:', payload.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[QRThrive WEBHOOK] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUserUpdate(payload: QrThriveWebhookPayload) {
  const { userId, data } = payload;
  console.log('[QRThrive WEBHOOK] User updated:', userId, data);
}

async function handleSubscriptionUpdate(payload: QrThriveWebhookPayload) {
  const { userId, data } = payload;
  console.log('[QRThrive WEBHOOK] Subscription updated:', userId, data);
}

async function handleQRCreated(payload: QrThriveWebhookPayload) {
  const { userId, data } = payload;
  console.log('[QRThrive WEBHOOK] QR created:', userId, data.qrId);
}

async function handleQRDeleted(payload: QrThriveWebhookPayload) {
  const { userId, data } = payload;
  console.log('[QRThrive WEBHOOK] QR deleted:', userId, data.qrId);
}

async function handleScanMilestone(payload: QrThriveWebhookPayload) {
  const { userId, data } = payload;
  console.log('[QRThrive WEBHOOK] Scan milestone reached:', userId, {
    qrId: data.qrId,
    scans: data.scans,
    milestone: data.milestone,
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'QRThrive webhook endpoint',
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