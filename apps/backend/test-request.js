const axios = require('axios');
axios.post('https://api.qrthrive.com/api/v1/integration/users', {}, { headers: { 'X-API-KEY': 'your_qr_thrive_api_key' } })
  .then(res => console.log(res.data))
  .catch(e => console.error(e.response?.status, e.response?.data, e.message));
