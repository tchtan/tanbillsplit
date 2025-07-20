export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { long_url } = req.body;

  if (!long_url || !long_url.startsWith("http")) {
    return res.status(400).json({ error: 'Invalid long_url' });
  }

  if (!process.env.BITLY_TOKEN) {
    return res.status(500).json({ error: "Missing BITLY_TOKEN in environment" });
  }

  try {
    const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.BITLY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        long_url,
        domain: "bit.ly"
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Bitly error response:", data);
      return res.status(response.status).json({ error: data.message || "Bitly error" });
    }

    res.status(200).json({ link: data.link });
  } catch (err) {
    console.error("Bitly API crash:", err);
    res.status(500).json({ error: "Server error" });
  }
}