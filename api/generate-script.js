export default async function handler(req, res) {
  // Allows Squarespace / website requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handles browser preflight check
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = req.body || {};

    const prompt = `
You are writing a short real estate social media reel script for Skyline Imagery.

Skyline's style:
- Natural, confident, conversational
- Strong hooks that create curiosity
- Never start with "welcome to"
- Do not sound like MLS copy
- Do not use cheesy phrases like "this one checks all the boxes"
- Keep each line as one complete sentence
- Make the reel feel human, not robotic
- Prioritize what the agent says makes the home special
- Do not mention features too early unless they are meant to be the hook

Generate the response in this exact format:

HOOK OPTIONS:
1.
2.
3.

FULL SCRIPT:
1.
2.
3.
4.
5.

CTA OPTIONS:
1.
2.
3.

Property information:
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
    });
  } catch (error) {
    return res.status(500).json({
      error: "Script generation failed.",
      details: error.message,
    });
  }
}
