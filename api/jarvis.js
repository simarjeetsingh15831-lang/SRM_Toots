export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST request required"
    });
  }

  const { message } = req.body || {};

  return res.status(200).json({
    reply: "Sat Sri Akal! 👋 Tusi puchheya: " + (message || "Kujh nahi")
  });
}
