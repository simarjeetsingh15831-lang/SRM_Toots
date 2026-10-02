export default async function handler(req, res) {

  // POST only
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

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY Vercel Environment Variables vich nahi mili."
      });
    }

    // Main model
    const mainModel = "gemini-2.5-flash";

    // Lightweight fallback
    const fallbackModel = "gemini-2.5-flash-lite";

    async function askGemini(model) {

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
                    "You are JARVIS AI, a helpful smart assistant. " +
                    "If the user writes Punjabi or Roman Punjabi, reply in Punjabi/Roman Punjabi. " +
                    "Be clear, friendly and concise. " +
                    "Do not mention internal API errors unless necessary."
                }
              ]
            },

            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: message.trim()
                  }
                ]
              }
            ],

            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024
            }

          })
        }
      );

      const data = await response.json();

      return {
        ok: response.ok,
        status: response.status,
        data: data
      };
    }

    // --------------------------------
    // FIRST TRY
    // --------------------------------

    let result = await askGemini(mainModel);

    if (result.ok) {

      const reply =
        result.data?.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("")
          .trim();

      if (reply) {
        return res.status(200).json({
          reply: reply
        });
      }
    }

    // --------------------------------
    // 503 = TEMPORARY OVERLOAD
    // Wait and retry ONCE
    // --------------------------------

    if (
      result.status === 503 ||
      result.status === 500 ||
      result.status === 502 ||
      result.status === 504
    ) {

      await new Promise(resolve =>
        setTimeout(resolve, 2000)
      );

      result = await askGemini(mainModel);

      if (result.ok) {

        const reply =
          result.data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        if (reply) {
          return res.status(200).json({
            reply: reply
          });
        }
      }

      // --------------------------------
      // FALLBACK MODEL
      // Only after temporary failure
      // --------------------------------

      result = await askGemini(fallbackModel);

      if (result.ok) {

        const reply =
          result.data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        if (reply) {
          return res.status(200).json({
            reply: reply
          });
        }
      }
    }

    // --------------------------------
    // 429 = QUOTA / RATE LIMIT
    // Do NOT keep retrying
    // --------------------------------

    if (result.status === 429) {

      return res.status(429).json({
        error:
          "JARVIS di Gemini limit temporarily full hai. Thodi der baad dubara try karo."
      });
    }

    // --------------------------------
    // OTHER ERROR
    // --------------------------------

    const errorMessage =
      result.data?.error?.message ||
      "Gemini API response nahi de reha.";

    return res.status(503).json({
      error: errorMessage
    });

  } catch (error) {

    return res.status(500).json({
      error:
        "JARVIS backend error. Thodi der baad dubara try karo."
    });

  }
      }
