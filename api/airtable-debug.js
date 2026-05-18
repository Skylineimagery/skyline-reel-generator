export default async function handler(req, res) {
  try {
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;

    if (!airtableApiKey || !airtableBaseId) {
      return res.status(500).json({
        error: "Missing Airtable environment variables.",
        hasApiKey: Boolean(airtableApiKey),
        baseId: airtableBaseId || null,
      });
    }

    const basesResponse = await fetch("https://api.airtable.com/v0/meta/bases", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${airtableApiKey}`,
        "Content-Type": "application/json",
      },
    });

    const basesData = await basesResponse.json();

    const schemaResponse = await fetch(
      `https://api.airtable.com/v0/meta/bases/${airtableBaseId}/tables`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${airtableApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const schemaData = await schemaResponse.json();

    return res.status(200).json({
      envCheck: {
        hasApiKey: true,
        baseIdFromVercel: airtableBaseId,
        tableNameFromVercel: process.env.AIRTABLE_TABLE_NAME,
      },
      basesCheck: {
        status: basesResponse.status,
        data: basesData,
      },
      selectedBaseSchemaCheck: {
        status: schemaResponse.status,
        data: schemaData,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "Debug failed.",
      details: error.message,
    });
  }
}
