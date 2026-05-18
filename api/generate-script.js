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

    const cameraConfidenceNumber =
      Number(form?.creativeDirection?.cameraConfidence || 5);

    const lineCountMap = {
      "30 sec": 3,
      "45 sec": 4,
      "60 sec": 5,
      "90 sec": 6,
    };

    const lineCount = lineCountMap[videoDuration] || 3;

    let confidenceRule = "";
    let maxWordsPerOption = 12;

    if (cameraConfidenceNumber <= 3) {
      confidenceRule =
        "The agent is not very confident on camera. Use very short, simple, easy-to-deliver sentences. Avoid complex phrasing.";
      maxWordsPerOption = 8;
    } else if (cameraConfidenceNumber <= 6) {
      confidenceRule =
        "The agent is moderately comfortable on camera. Use natural, conversational sentences that are easy to say.";
      maxWordsPerOption = 12;
    } else {
      confidenceRule =
        "The agent is confident on camera. You may use slightly longer, more polished, expressive sentences while keeping them natural.";
      maxWordsPerOption = 18;
    }

    const prompt = `
You are writing real estate social media reel script options for Skyline Imagery.

The user filled out a creative form for a real estate reel.
Your job is to generate clean line options the agent can mix and match.

ABSOLUTE OUTPUT RULES:
- Output ONLY the script line options.
- Do not include an intro.
- Do not include a summary.
- Do not include notes.
- Do not include explanations.
- Do not include markdown bold.
- Do not add any section besides the exact LINE format.
- Generate exactly ${lineCount} script lines.
- Generate exactly 3 options for each line.
- Total number of options must be exactly ${lineCount * 3}.
- Each option must be one complete sentence.
- Each option must stand alone.
- Each option must be mix-and-match friendly.
- Do not make an option depend on the previous or next line.
- Each option must be ${maxWordsPerOption} words or fewer.

VIDEO LENGTH RULE:
The selected video length is ${videoDuration}.
That means generate exactly ${lineCount} lines.

CAMERA CONFIDENCE RULE:
Camera confidence selected: ${cameraConfidenceNumber}/10.
${confidenceRule}
This rule MUST affect the length and complexity of every line option.

LINE STRUCTURE:
For 30 sec:
LINE 1 = Opening
LINE 2 = Main selling point
LINE 3 = CTA

For 45 sec:
LINE 1 = Opening
LINE 2 = Interior feel or main feature
LINE 3 = Location, lifestyle, or secondary feature
LINE 4 = CTA

For 60 sec:
LINE 1 = Opening
LINE 2 = Interior feel
LINE 3 = Main feature or layout benefit
LINE 4 = Location, lifestyle, backyard, or community
LINE 5 = CTA

For 90 sec:
LINE 1 = Opening
LINE 2 = First impression or interior feel
LINE 3 = Main living, kitchen, or layout
LINE 4 = Bedrooms, flex space, storage, or daily-life benefit
LINE 5 = Backyard, location, lifestyle, or community
LINE 6 = CTA

FORM FIELD RULES:
Use every form answer in the smartest natural way.

Creative direction:
- Video length controls the number of lines.
- “The video should start with...” controls LINE 1.
- Camera confidence controls line length and complexity.
- Music style controls the rhythm, tone, and energy of the wording.

Property basics:
- Use property type, beds/baths, sqft, city/neighborhood only when they help the script.
- Do not force every basic fact into the script if it sounds unnatural.

Main selling angle:
- The standout feature and why it matters should guide the entire script.
- Turn the feature into a buyer benefit.

Reel focus:
- Main focus points should guide the middle lines.
- Overall feel should influence word choice.
- Target buyer should subtly influence the angle without saying “this is perfect for...” every time.

CTA:
- The final line must match the selected call-to-action.
- The CTA should sound natural, not salesy.

Music style:
- Trendy = sharper, more social, more scroll-stopping.
- Luxury = calmer, refined, premium.
- Upbeat = friendly, bright, positive.
- Fun = playful, casual, energetic.
- Emotional = warm, aspirational, story-driven.
- Cinematic = smooth, polished, dramatic.

STYLE RULES:
- Never start with “Welcome to.”
- Do not start with the property address.
- Avoid MLS-style wording.
- Avoid clichés like “checks all the boxes,” “hidden gem,” “must-see,” “won’t last long,” “dream home,” “nestled,” and “boasting.”
- Do not overhype.
- Do not sound robotic.
- Do not invent details.
- Do not mention a feature unless it is provided or clearly implied.
- If extra notes say to avoid something, avoid it.

REQUIRED OUTPUT FORMAT:
Use this exact format and nothing else:

LINE 1
Option 1:
Option 2:
Option 3:

LINE 2
Option 1:
Option 2:
Option 3:

Continue until exactly LINE ${lineCount}.

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
        temperature: 0.75,
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
