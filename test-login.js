const { apiCall } = require('./apps/VemTap/lib/api.ts');
// Actually, since lib/api.ts is TS, we'll just write a raw js fetch script to see the backend response
const fetch = require('node-fetch');

async function testLogin() {
    try {
        const res = await fetch('http://localhost:3002/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@latap.com', password: 'admin123' })
        });
        const data = await res.json();
        console.log('STATUS:', res.status);
        console.log('RESPONSE:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
testLogin();
