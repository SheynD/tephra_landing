export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { first_name, last_name, email } = req.body;
  const apiKey = process.env.KLAVIYO_PRIVATE_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;

  const response = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/", {
    method: "POST",
    headers: {
      "Authorization": `Klaviyo-API-Key ${apiKey}`,
      "Content-Type": "application/json",
      "revision": "2023-02-22"
    },
    body: JSON.stringify({
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          list_id: listId,
          custom_source: "Tephra Signup",
          subscriptions: [
            {
              channels: {
                email: "consent"
              },
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

  if (!response.ok) {
    const errorText = await response.text();
    return res.status(500).json({ error: "Klaviyo API error", detail: errorText });
  }

  return res.status(200).json({ message: "Successfully subscribed" });
}
