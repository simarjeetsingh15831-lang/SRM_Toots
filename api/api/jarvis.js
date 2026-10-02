export default async function handler(req, res) {

  // Sirf POST
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

    // Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY Vercel Environment Variables vich nahi mili."
      });
    }

    // Models:
    // Pehla = normal Gemini
    // Dooja = lightweight fallback
    const models = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite"
    ];

    let lastError = "Gemini API error";

    // Har model nu try karo
    for (const model of models) {

      // Temporary high demand te 3 attempts
      for (let attempt = 1; attempt <= 3; attempt++) {

        try {

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
              },

              body: JSON.stringify({

                systemInstruction: {
                  parts: [
                    {
                      text:
                        "You are JARVIS AI. " +
                        "Be helpful, clear and polite. " +
                        "If the user writes Punjabi or Roman Punjabi, " +
                        "reply in Punjabi/Roman Punjabi. " +
                        "Keep answers easy to understand."
                    }
                  ]
                },

                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: message
                      }
                    ]
                  }
                ],

                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 2048
                }

              })
            }
          );

          const data = await response.json();

          // Success
          if (response.ok) {

            const reply =
              data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

            if (reply) {

              return res.status(200).json({
                reply: reply
              });

            }

            lastError =
              "Gemini ne empty response ditta.";

          } else {

            lastError =
              data?.error?.message ||
              `Gemini API error (${response.status})`;

            // Sirf temporary errors te retry
            if (
              response.status !== 429 &&
              response.status !== 500 &&
              response.status !== 502 &&
              response.status !== 503 &&
              response.status !== 504
            ) {
              break;
            }

          }

        } catch (error) {

          lastError =
            error?.message ||
            "Network error";

        }

        // Retry delay
        if (attempt < 3) {

          await new Promise(resolve =>
            setTimeout(resolve, 1000 * attempt)
          );

        }

      }

    }

    return res.status(503).json({
      error:
        "JARVIS temporary busy hai. Thodi der baad dubara try karo.",
      details: lastError
    });

  } catch (error) {

    return res.status(500).json({
      error: "JARVIS backend error"
    });

  }

}
