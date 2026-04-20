export interface AirtableTableResources {
  clients: string;
  submissions: string;
  cases: string;
}

function readConfiguredTableResource(
  idEnvName: string,
  nameEnvName: string,
  fallback: string,
) {
  const tableId = process.env[idEnvName]?.trim();
  if (tableId) return tableId;

  const tableName = process.env[nameEnvName]?.trim();
  if (tableName) return tableName;

  return fallback;
}

export function getAirtableConfig() {
  return {
    token: process.env.AIRTABLE_TOKEN,
    baseId: process.env.AIRTABLE_BASE_ID,
    tables: {
      clients: readConfiguredTableResource(
        "AIRTABLE_CLIENTS_TABLE_ID",
        "AIRTABLE_CLIENTS_TABLE",
        "Clients",
      ),
      submissions: readConfiguredTableResource(
        "AIRTABLE_SUBMISSIONS_TABLE_ID",
        "AIRTABLE_SUBMISSIONS_TABLE",
        "Intake Submissions",
      ),
      cases: readConfiguredTableResource(
        "AIRTABLE_CASES_TABLE_ID",
        "AIRTABLE_CASES_TABLE",
        "Cases",
      ),
    } satisfies AirtableTableResources,
  };
}