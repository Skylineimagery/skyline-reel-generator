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

    const videoDuration =
      form?.creativeDirection?.videoDuration || "30 sec";

    const lineCountMap = {
      "30 sec": 3,
      "45 sec": 4,
      "60 sec": 5,
      "90 sec": 6,
    };

    const lineCount = lineCountMap[videoDuration] || 3;

    const prompt = `
You are writing real estate social media reel script options for Skyline Imagery.

The user filled out a creative form for a real estate reel.
Your job is to generate line options the agent can mix and match.

VERY IMPORTANT OUTPUT RULES:
- The selected video length is: ${videoDuration}
- Generate exactly ${lineCount} script lines.
- Generate exactly 3 options for each line.
- That means the total number of line options should be ${lineCount * 3}.
- Do not write one full paragraph script.
- Do not add extra sections unless requested.
- Each option must be one complete sentence.
- Each option must stand alone.
- Each option should be easy for an agent to say on camera.
- Options should be mix-and-match friendly.
- Do not make one option depend on the previous option.
- Keep the script natural, conversational, and social-media friendly.

LINE STRUCTURE:
If 30 sec:
Line 1 = Opening / scroll-stopping start
Line 2 = Main selling point / strongest feature
Line 3 = CTA

If 45 sec:
Line 1 = Opening / scroll-stopping start
Line 2 = Interior feel or main feature
Line 3 = Location, lifestyle, or secondary feature
Line 4 = CTA

If 60 sec:
Line 1 = Opening / scroll-stopping start
Line 2 = Interior feel
Line 3 = Main feature or layout benefit
Line 4 = Location, lifestyle, backyard, or community
Line 5 = CTA

If 90 sec:
Line 1 = Opening / scroll-stopping start
Line 2 = First impression / interior feel
Line 3 = Main living, kitchen, or layout
Line 4 = Bedrooms, flex space, storage, or daily-life benefit
Line 5 = Backyard, location, lifestyle, or community
Line 6 = CTA

STYLE RULES:
- Never start with “Welcome to”.
- Do not start with the property address.
- Avoid MLS-style wording.
- Avoid clichés like “checks all the boxes,” “hidden gem,” “must-see,” “won’t last long,” “dream home,” “nestled,” and “boasting.”
- Do not overhype.
- Do not sound robotic.
- Do not say anything that conflicts with the form answers.
- If a detail is not clearly provided, do not invent it.
- If the form says to avoid something, avoid it.

USE THE FORM DATA THIS WAY:
- “Video length selected” controls the number of lines.
- “The video should start with...” controls Line 1.
- “Camera confidence” controls line length and complexity.
  - 1–3 = short, simple, very easy to say.
  - 4–6 = natural and conversational.
  - 7–10 = more polished, confident, expressive.
- “Music style” controls the energy and pacing of the language.
  - Trendy = sharper, more social, more scroll-stopping.
  - Luxury = calmer, refined, premium.
  - Upbeat = friendly, bright, positive.
  - Fun = playful, casual, energetic.
  - Emotional = warm, aspirational, story-driven.
  - Cinematic = smooth, polished, dramatic.
- “Main selling angle” should guide the whole script.
- “Why does that matter to a buyer?” should turn the feature into a benefit.
- “Reel focus” should guide the middle lines.
- “Final call-to-action” should shape the final line.

OUTPUT FORMAT:
Use this exact structure:

LINE 1 — [purpose]
Option 1:
Option 2:
Option 3:

LINE 2 — [purpose]
Option 1:
Option 2:
Option 3:

Continue until exactly ${lineCount} lines.

FORM DATA:
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
        temperature: 0.8,
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
