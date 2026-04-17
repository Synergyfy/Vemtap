import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const VEMTAP_URL = 'http://localhost:3002/api/v1'; // Frontend-facing port might be 3002 or 3001
const VEMTAP_INTEGRATION_KEY = process.env.VEMTAP_INTEGRATION_KEY || 'vemtap_test_key_xyz789';

// Note: This script requires a valid JWT if testing via Controller.
// For now, we simulate the logic or assume the developer will test via Postman/UI.
// However, we can test the QR-Thrive endpoints directly to ensure our Service logic uses the right ones.

const QR_THRIVE_URL = process.env.QR_THRIVE_BASE_URL || 'http://localhost:3005/api/v1';
const QR_THRIVE_API_KEY = process.env.QR_THRIVE_API_KEY || 'qrthrive_test_key_abc123';

async function testQrThriveDirect() {
  console.log('Testing QR-Thrive Direct Endpoints...');
  
  const headers = { 'x-api-key': QR_THRIVE_API_KEY };
  
  try {
    // 1. Get Plans (Public)
    const plans = await axios.get(`${QR_THRIVE_URL}/integration/plans`, { headers });
    console.log('✅ Plans reachable');

    // 2. Provision User (Test User)
    const userPayload = { email: 'test-crud@vemtap.com', firstName: 'Crud', lastName: 'Tester' };
    const userResponse = await axios.post(`${QR_THRIVE_URL}/integration/users`, userPayload, { headers });
    const userId = userResponse.data.id;
    console.log(`✅ User Provisioned: ${userId}`);

    // 3. List QR Codes
    const codes = await axios.get(`${QR_THRIVE_URL}/integration/users/${userId}/qr-codes`, { headers });
    console.log(`✅ List Codes: Found ${codes.data.length}`);

    // 4. Create Folder
    const folder = await axios.post(`${QR_THRIVE_URL}/integration/users/${userId}/folders`, { name: 'Test Folder', color: '#000000' }, { headers });
    const folderId = folder.data.id;
    console.log(`✅ Folder Created: ${folderId}`);

    // 5. List Folders
    const folders = await axios.get(`${QR_THRIVE_URL}/integration/users/${userId}/folders`, { headers });
    console.log(`✅ List Folders: Found ${folders.data.length}`);

    // 6. Get Stats
    const stats = await axios.get(`${QR_THRIVE_URL}/integration/users/${userId}/stats`, { headers });
    console.log('✅ Stats fetched successfully');

    // 7. Create a QR to test Duplicate/Update
    const qr = await axios.post(`${QR_THRIVE_URL}/integration/users/${userId}/qr-codes`, { 
      name: 'Test QR', 
      type: 'url', 
      data: { url: 'https://google.com' },
      design: {},
      frame: {}
    }, { headers });
    const qrId = qr.data.id;
    console.log(`✅ QR Created for Test: ${qrId}`);

    // 8. Update QR
    await axios.put(`${QR_THRIVE_URL}/integration/users/${userId}/qr-codes/${qrId}`, { name: 'Updated Name' }, { headers });
    console.log('✅ QR Updated');

    // 9. Duplicate QR
    const dup = await axios.post(`${QR_THRIVE_URL}/integration/users/${userId}/qr-codes/${qrId}/duplicate`, {}, { headers });
    console.log(`✅ QR Duplicated: ${dup.data.id}`);

    // 10. Cleanup
    await axios.delete(`${QR_THRIVE_URL}/integration/users/${userId}/folders/${folderId}`, { headers });
    await axios.delete(`${QR_THRIVE_URL}/integration/users/${userId}/qr-codes/${qrId}`, { headers });
    await axios.delete(`${QR_THRIVE_URL}/integration/users/${userId}/qr-codes/${dup.data.id}`, { headers });
    console.log('✅ Cleanup Successful');

  } catch (error: any) {
    console.error('❌ Test Failed!');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
  }
}

testQrThriveDirect();
