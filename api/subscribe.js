export default async function handler(req, res) {
  const { first_name, last_name, email } = req.body;

  try {
    const response = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KLAVIYO_PRIVATE_API_KEY}`,  // or hardcode for testing
        'Content-Type': 'application/json',
        'revision': '2023-10-15'
      },
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            subscriptions: [
              {
                channels: {
                  email: true
                },
                email: email,
                profile: {
                  first_name: first_name,
                  last_name: last_name
                }
              }
            ]
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Klaviyo error:", errorData);
      return res.status(500).json({ error: "Klaviyo API error", detail: errorData });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected error", detail: err.message });
  }
}
