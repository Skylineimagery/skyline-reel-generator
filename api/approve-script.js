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

    const fields = {
      "Property Address": body.propertyAddress || "",
      "Approved Script": body.approvedScript || "",
      "Submitted At": new Date().toISOString(),
    };

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
    return res.status(500).json({
      error: "Approval failed.",
      details: error.message,
    });
  }
}
