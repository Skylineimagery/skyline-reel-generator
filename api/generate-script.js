export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = req.body;

    const prompt = `
You are writing a short real estate social media reel script for Skyline Imagery.

Rules:
- Do not say "welcome to".
- Do not sound like MLS copy.
- Make it conversational, natural, and strong.
- Keep each script line as one sentence.
- Create 3 hook options.
- Create a short full script.
- Create 3 CTA options.

Property info:
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

    res.status(200).json({
      result: data.output_text || "No script generated.",
    });
  } catch (error) {
    res.status(500).json({
      error: "Script generation failed.",
      details: error.message,
    });
  }
}
