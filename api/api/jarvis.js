export default async function handler(req, res) {
  // Sirf POST request allow
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST request required"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        error: "Message missing"
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY Vercel Environment Variables vich nahi mili."
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input: [
          {
            role: "system",
            content:
              "You are JARVIS AI, a helpful assistant. Reply clearly and politely. If the user writes Punjabi, reply in Punjabi."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenAI API error"
      });
    }

    return res.status(200).json({
      reply: data.output_text || "JARVIS nu jawab nahi milia 🤖"
    });

  } catch (error) {
    return res.status(500).json({
      error: "JARVIS backend error"
    });
  }
}
