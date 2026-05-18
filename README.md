export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = req.body || {};

    const prompt = `
You are writing a short real estate social media reel script for Skyline Imagery.

Rules:
- Do not say "welcome to"
- Avoid MLS-style wording
- Conversational, confident, natural
- Keep each line one sentence
- Generate:
1. Three hook options
2. Full 4-6 line reel script
3. Three CTA options

Property Information:
${JSON.stringify(form, null, 2)}
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "OpenAI API error",
        details: data,
      });
    }

    const outputText =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        ?.map((content) => content.text || "")
        ?.join("\n")
        ?.trim();

    return res.status(200).json({
      result: outputText || "No script generated.",
      raw: data,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Script generation failed.",
      details: error.message,
    });
  }
}
