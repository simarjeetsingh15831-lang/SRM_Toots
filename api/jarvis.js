export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST request required"
    });
  }

  try {

    const { message } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message missing"
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY Vercel vich nahi mili."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",

          instructions:
            "You are JARVIS AI for SRM Tools. Be helpful, friendly and clear. If the user writes Punjabi, reply in Punjabi.",

          input: message.trim()
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenAI API error"
      });
    }

    const reply = (data?.output || [])
      .filter(item => item?.type === "message")
      .flatMap(item => item?.content || [])
      .filter(item => item?.type === "output_text")
      .map(item => item?.text || "")
      .join("\n")
      .trim();

    if (!reply) {
      return res.status(500).json({
        error: "OpenAI response vich text nahi mila."
      });
    }

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {

    return res.status(500).json({
      error:
        error?.message ||
        "JARVIS backend error"
    });

  }
}
