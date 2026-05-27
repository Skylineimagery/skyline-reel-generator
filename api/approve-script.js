export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};

    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    const airtableTableName = process.env.AIRTABLE_TABLE_NAME;

    if (!airtableApiKey || !airtableBaseId || !airtableTableName) {
      return res.status(500).json({
        error: "Missing Airtable environment variables.",
        debug: {
          hasApiKey: Boolean(airtableApiKey),
          baseId: airtableBaseId || null,
          tableName: airtableTableName || null,
        },
      });
    }

    const answers = body.formAnswers || {};
    const creative = answers.creativeDirection || {};
    const basics = answers.propertyBasics || {};
    const angle = answers.mainSellingAngle || {};
    const focus = answers.reelFocus || {};
    const cta = answers.ctaAndNotes || {};

    const fields = {
      "Property Address": body.propertyAddress || basics.propertyAddress || "",
      "Approved Script": body.approvedScript || "",

      "Music Style": creative.musicStyle || "",
      "Reel Focus": Array.isArray(focus.mainFocusPoints)
        ? focus.mainFocusPoints.join(", ")
        : "",
      "Comfort Level": creative.cameraConfidence
        ? Number(creative.cameraConfidence)
        : null,
      "Video Length": creative.videoDuration || "",
      "Video Start Style": creative.videoShouldStartWith || "",

      "City / Neighborhood": basics.cityNeighborhood || "",
      "Property Type": basics.propertyType || "",
      "Beds / Baths": basics.bedsBaths || "",
      "Square Footage": basics.sqft || "",

      "Standout Feature": angle.standoutFeature || "",
      "Why It Matters": angle.whyItMatters || "",

      "Overall Feel": focus.interiorFeel || "",
      "Target Buyer": focus.targetBuyer || "",

      "CTA Preference": cta.ctaPreference || "",
      "Extra Notes": cta.extraNotes || "",

      "Submitted At": new Date().toISOString(),
    };

    Object.keys(fields).forEach((key) => {
      if (fields[key] === null || fields[key] === undefined) {
        delete fields[key];
      }
    });

    const airtableUrl =
      "https://api.airtable.com/v0/" +
      airtableBaseId +
      "/" +
      encodeURIComponent(airtableTableName);

    console.log("Sending to Airtable:", {
      baseId: airtableBaseId,
      tableName: airtableTableName,
      fields,
    });

    const airtableResponse = await fetch(airtableUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${airtableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields,
          },
        ],
      }),
    });

    const airtableData = await airtableResponse.json();

    console.log("Airtable response:", {
      status: airtableResponse.status,
      data: airtableData,
    });

    if (!airtableResponse.ok) {
      return res.status(airtableResponse.status).json({
        error: "Airtable error",
        airtableStatus: airtableResponse.status,
        airtableDetails: airtableData,
        debug: {
          baseId: airtableBaseId,
          tableName: airtableTableName,
          sentFields: Object.keys(fields),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Script approved and saved to Airtable.",
      airtable: airtableData,
    });
  } catch (error) {
    console.error("Approval failed:", error);

    return res.status(500).json({
      error: "Approval failed.",
      details: error.message,
    });
  }
}
