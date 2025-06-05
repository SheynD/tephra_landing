export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { first_name, last_name, email } = req.body;
  const apiKey = process.env.KLAVIYO_PRIVATE_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  if (!apiKey || !listId) {
    return res.status(500).json({ error: 'Missing Klaviyo credentials' });
  }

  try {
    const response = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/", {
      method: "POST",
      headers: {
  'Authorization': `Klaviyo-API-Key ${apiKey}`,
  'Content-Type': 'application/json',
  'revision': '2023-02-22'
},
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            subscriptions: [
              {
                list_id: listId,
                channels: { email: true },
                profile: {
                  email,
                  first_name,
                  last_name
                }
              }
            ]
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    res.status(200).json({ message: "Successfully subscribed" });
  } catch (err) {
    res.status(500).json({ error: 'Klaviyo API error', detail: JSON.parse(err.message) });
  }
}
