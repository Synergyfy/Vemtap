import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from VemTap backend
dotenv.config({ path: path.join(__dirname, '../.env') });

// Try to get URLs from env, fallback to defaults
const VEMTAP_URL = process.env.VEMTAP_API_URL || 'http://localhost:3001/api/v1';
const QR_THRIVE_URL = process.env.QR_THRIVE_BASE_URL || 'http://localhost:3005/api/v1';

// These keys are pulled from the local .env
const VEMTAP_INTEGRATION_KEY = process.env.VEMTAP_INTEGRATION_KEY || 'vemtap_test_key_xyz789';
const QR_THRIVE_API_KEY = process.env.QR_THRIVE_API_KEY || 'qrthrive_test_key_abc123';

async function testVemTapToQrThrive() {
  console.log('\n--- [1] Testing Outbound: VemTap -> QR-Thrive ---');
  console.log(`Target: ${QR_THRIVE_URL}/integration/plans`);
  try {
    const response = await axios.get(`${QR_THRIVE_URL}/integration/plans`, {
      headers: {
        'x-api-key': QR_THRIVE_API_KEY
      },
      timeout: 5000
    });

    console.log('✅ Success! QR-Thrive reachable and authenticated.');
    console.log(`Plans found: ${response.data.length}`);
  } catch (error: any) {
    console.error('❌ Failed!');
    if (error.response) {
      console.error(`Status: ${error.response.status} (${error.response.statusText})`);
      console.error(`Response: ${JSON.stringify(error.response.data)}`);
      if (error.response.status === 401) {
        console.warn('\n💡 HINT: QR-Thrive unauthorized. Ensure "' + QR_THRIVE_API_KEY + '" is registered in QR-Thrive\'s database.');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`Connection Refused at ${error.address}:${error.port}`);
      console.warn('\n💡 HINT: QR-Thrive is not listening on this port. Is it running?');
    } else {
      console.error(error.message);
    }
  }
}

async function testQrThriveToVemTap() {
  console.log('\n--- [2] Testing Inbound: QR-Thrive -> VemTap (Simulated) ---');
  console.log(`Target: ${VEMTAP_URL}/integration/qr-thrive/callback`);
  try {
    const response = await axios.post(`${VEMTAP_URL}/integration/qr-thrive/callback`, 
      { event: 'test_connection', timestamp: new Date().toISOString() },
      {
        headers: { 'x-vemtap-api-key': VEMTAP_INTEGRATION_KEY },
        timeout: 5000
      }
    );

    console.log('✅ Success! VemTap callback endpoint reached and authenticated.');
  } catch (error: any) {
    console.error('❌ Failed!');
    if (error.response) {
      console.error(`Status: ${error.response.status} (${error.response.statusText})`);
      console.error(`Response: ${JSON.stringify(error.response.data)}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`Connection Refused at ${error.address}:${error.port}`);
      console.warn('\n💡 HINT: VemTap backend is not listening. Check if PORT 3001 is active.');
    } else {
      console.error(error.message);
    }
  }
}

async function runTests() {
  console.log('Starting Integration Communication Tests...');
  console.log(`VemTap: ${VEMTAP_URL}`);
  console.log(`QR-Thrive: ${QR_THRIVE_URL}`);

  await testVemTapToQrThrive();
  await testQrThriveToVemTap();

  console.log('\n--- Test Summary ---');
  console.log('Done.');
}

runTests();
