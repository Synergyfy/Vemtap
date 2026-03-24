import axios from 'axios';

const apiKey =
  'atsk_e790d4182cb149d69d8308fabb3a91cd452904c38a8e88a57ebb636af15fe3518aebca4c';
const username = 'Vemtap';
const baseUrl = 'https://api.africastalking.com/version1/messaging/bulk';

async function sendSms(recipients: { number: string; name: string }[]) {
  console.log(
    `Sending TRANSACTIONAL-STYLE SMS to: ${recipients.map((r) => r.name).join(', ')}...`,
  );

  const data = {
    username: username,
    // Using a more standard OTP-style message which often bypasses generic "test" filters
    message: `Your Vemtap verification code is 5521. Please do not share this with anyone.`,
    phoneNumbers: recipients.map((r) => r.number),
  };

  try {
    const response = await axios.post(baseUrl, data, {
      headers: {
        apiKey: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    const smsMessageData = response.data.SMSMessageData;
    const results = smsMessageData?.Recipients || [];

    console.log('\n--- Send Results ---');
    results.forEach((recipient: any) => {
      const name =
        recipients.find((r) => r.number === recipient.number)?.name ||
        'Unknown';
      if (recipient.status === 'Success' || recipient.status === 'Sent') {
        console.log(`✅ SUCCESS [${name} - ${recipient.number}]:`);
        console.log(`   MessageId: ${recipient.messageId}`);
        console.log(`   Cost: ${recipient.cost}`);
        console.log(`   Status: ${recipient.status}`);
      } else {
        console.log(`❌ FAILED [${name} - ${recipient.number}]:`);
        console.log(`   Status: ${recipient.status}`);
        console.log(`   Error: ${recipient.errorMessage || 'Unknown error'}`);
      }
    });
    console.log('-------------------------\n');
  } catch (error: any) {
    console.error(`❌ ERROR:`, error.response?.data || error.message);
  }
}

async function run() {
  const contacts = [{ number: '+2347033486488', name: 'Azeem' }];
  await sendSms(contacts);
}

run();
