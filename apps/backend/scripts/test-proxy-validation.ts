import axios from 'axios';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

async function testProxyValidation() {
  const VEMTAP_URL = 'http://[::1]:3001/api/v1';
  // Use a CUID-like branchId (resembling the user's reported ID)
  const branchId = 'cmo2likdq0000k0ux6fs205yz'; 
  
  console.log(`Testing VemTap Proxy with Branch ID: ${branchId}`);

  try {
    const response = await axios.get(`${VEMTAP_URL}/qr-thrive/branches/${branchId}/folders`);
    console.log('✅ Response:', response.status);
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 400 && error.response.data?.message?.includes('uuid')) {
          console.error('❌ Validation Failed: Still expecting UUID!');
          console.error(JSON.stringify(error.response.data, null, 2));
      } else if (error.response.status === 401) {
          console.log('✅ Validation Succeeded (Passed UUID check, reached Auth check)');
      } else {
          console.log(`ℹ️ Received Status: ${error.response.status}`);
          console.log(JSON.stringify(error.response.data, null, 2));
      }
    } else {
      console.error('❌ Connection Error:', error.message);
    }
  }
}

testProxyValidation();
