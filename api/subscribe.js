// /api/subscription.js (for Vercel or similar serverless environment)


// /api/subscribe.js (Vercel Edge/Serverless Function)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { first_name, last_name, email } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.KLAVIYO_PRIVATE_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!apiKey || !listId) {
    return res.status(500).json({ error: 'Missing Klaviyo credentials' });
  }

  const headers = {
    'Authorization': `Klaviyo-API-Key ${apiKey}`,
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
    'revision': '2025-01-15'
  };

  let profileId;

  try {
    // Try creating the profile
    const createRes = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers,
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

    if (createRes.status === 409) {
      // Profile already exists, look it up
      const lookupRes = await fetch(`https://a.klaviyo.com/api/profiles?filter=email:${email}`, {
        method: 'GET',
        headers
      });
      const lookupData = await lookupRes.json();

      profileId = lookupData.data?.[0]?.id;

      if (!profileId) {
        return res.status(500).json({ error: 'Unable to find existing profile after 409' });
      }
    } else if (createRes.ok) {
      const profileData = await createRes.json();
      profileId = profileData.data.id;
    } else {
      const errorData = await createRes.json();
      return res.status(createRes.status).json({ error: 'Profile creation failed', detail: errorData });
    }

    // Subscribe profile to list
    const subscribeRes = await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: [
          {
            type: 'profile',
            id: profileId
          }
        ]
      })
    });

    const subscribeData = await subscribeRes.json();

    if (!subscribeRes.ok) {
      return res.status(subscribeRes.status).json({ error: 'Subscription failed', detail: subscribeData });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Unexpected error', detail: err.message });
  }
}

/*export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { first_name, last_name, email } = req.body;

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

    const profileData = await profileResponse.json();

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

    const subscribeData = await subscribeResponse.json();

    if (subscribeResponse.status === 409) {
      return res.status(200).json({ success: true, note: "Already subscribed" });
    }

    if (!subscribeResponse.ok) {
      return res.status(subscribeResponse.status).json({ error: 'Subscription failed', detail: subscribeData });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected error', detail: error.message });
  }
}*/
