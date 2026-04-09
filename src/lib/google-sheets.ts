import { google } from "googleapis";

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not set");

  const credentials = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/calendar",
    ],
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

const SHEET_ID = () => {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID not set");
  return id;
};

// ── Read helpers ──

export async function readSheet(tabName: string): Promise<string[][]> {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `'${tabName}'`,
  });
  return res.data.values || [];
}

export async function readSheetAsObjects<T>(
  tabName: string
): Promise<T[]> {
  const rows = await readSheet(tabName);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  return rows.slice(1).map((row, i) => {
    const obj: Record<string, unknown> = { rowIndex: i + 2 }; // 1-indexed header + 1
    headers.forEach((header, j) => {
      obj[header] = row[j] || "";
    });
    return obj as T;
  });
}

// ── Write helpers ──

export async function updateCell(
  tabName: string,
  rowIndex: number,
  column: string,
  value: string
) {
  const sheets = getSheets();
  const range = `'${tabName}'!${column}${rowIndex}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID(),
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });
}

export async function updateCellByHeader(
  tabName: string,
  rowIndex: number,
  headerName: string,
  value: string
) {
  const rows = await readSheet(tabName);
  if (rows.length === 0) throw new Error(`Tab "${tabName}" is empty`);

  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const colIndex = headers.indexOf(headerName.toLowerCase().replace(/\s+/g, "_"));
  if (colIndex === -1) throw new Error(`Column "${headerName}" not found in "${tabName}"`);

  const colLetter = String.fromCharCode(65 + colIndex); // A=0, B=1, etc.
  await updateCell(tabName, rowIndex, colLetter, value);
}

export async function updateMultipleCells(
  tabName: string,
  rowIndex: number,
  updates: Record<string, string>
) {
  const rows = await readSheet(tabName);
  if (rows.length === 0) throw new Error(`Tab "${tabName}" is empty`);

  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  const data = Object.entries(updates).map(([headerName, value]) => {
    const colIndex = headers.indexOf(headerName.toLowerCase().replace(/\s+/g, "_"));
    if (colIndex === -1) throw new Error(`Column "${headerName}" not found`);
    const colLetter = String.fromCharCode(65 + colIndex);
    return {
      range: `'${tabName}'!${colLetter}${rowIndex}`,
      values: [[value]],
    };
  });

  const sheets = getSheets();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID(),
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data,
    },
  });
}

// ── Export auth for Calendar reuse ──
export { getAuth };
