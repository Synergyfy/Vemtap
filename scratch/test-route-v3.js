async function verify() {
  const payload = {
    prompt: "a boy in a farm",
    businessInfo: {
      name: "Bug",
      logoUrl: "https://res.cloudinary.com/dnejwzsgy/image/upload/v1777748994/vemtap_onboarding/agxgm64xloi0qqkp3ruy.png",
      primaryColor: "#2563EB",
      accentColor: "#F59E0B"
    },
    options: {
      goal: "join-loyalty",
      format: "window-sticker"
    }
  };

  try {
    console.log('Sending request to local Next.js dev server endpoint (v3)...');
    const res = await fetch('http://localhost:3000/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error during request:', err.message);
  }
}

verify();
