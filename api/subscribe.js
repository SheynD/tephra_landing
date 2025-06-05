export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { first_name, last_name, email } = req.body;

  const klaviyoPrivateKey = process.env.KLAVIYO_PRIVATE_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  const response = await fetch(`https://a.klaviyo.com/api/v2/list/${listId}/subscribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${klaviyoPrivateKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      profiles: [{ email, first_name, last_name }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    return res.status(500).json({ error: 'Failed to subscribe', detail: errText });
  }

  return res.status(200).json({ status: 'subscribed' });
}
