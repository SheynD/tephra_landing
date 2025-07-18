// /api/subscription.js (for Vercel or a similar serverless environment)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { first_name, last_name, email, website } = req.body;

  // Honeypot: if this hidden field is filled out, it's likely a bot
  if (website && website.trim() !== "") {
    return res.status(400).json({ error: 'Bot detected' });
  }

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.KLAVIYO_PRIVATE_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!apiKey || !listId) {
    return res.status(500).json({ error: 'Missing Klaviyo credentials' });
  }

  try {
    // Step 1: Create or identify the profile
    const profileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'revision': '2025-01-15'
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email,
            first_name,
            last_name
          }
        }
      })
    });

    const profileText = await profileResponse.text();
    let profileData = {};
    try {
      profileData = JSON.parse(profileText);
    }
    catch {
      // Empty or invalid JSON
    }

    if (!profileResponse.ok || !profileData?.data?.id) {
      return res.status(profileResponse.status).json({
        error: 'Profile creation failed',
        detail: profileData
      });
    }

    const profileId = profileData.data.id;

    // Step 2: Subscribe profile to list
    const subscribeResponse = await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
        'revision': '2025-01-15'
      },
      body: JSON.stringify({
        data: [{
          type: 'profile',
          id: profileId
        }]
      })
    });

    const subscribeText = await subscribeResponse.text();
    let subscribeData = {};
    try {
      subscribeData = JSON.parse(subscribeText);
    }
    catch {
      // Empty or invalid JSON
    }

    if (subscribeResponse.status === 409) {
      return res.status(200).json({ success: true, note: "Already subscribed" });
    }

    if (!subscribeResponse.ok) {
      return res.status(subscribeResponse.status).json({ error: 'Subscription failed', detail: subscribeData });
    }

    return res.status(200).json({ success: true });
  }
  catch (error) {
    return res.status(500).json({ error: 'Unexpected error', detail: error.message });
  }
}
