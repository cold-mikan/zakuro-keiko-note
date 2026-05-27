const NOTION_VERSION = "2022-06-28";
const NOTION_API_BASE = "https://api.notion.com/v1";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function notionConfig() {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_REHEARSAL_DATABASE_ID;
  if (!token || !databaseId) {
    throw new Error("Vercelの環境変数 NOTION_TOKEN / NOTION_REHEARSAL_DATABASE_ID を設定してください。");
  }
  return { token, databaseId };
}

async function notionFetch(path, options = {}) {
  const { token } = notionConfig();
  const response = await fetch(`${NOTION_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
      ...(options.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Notion API error: ${response.status}`);
  }
  return data;
}

function text(value) {
  const content = String(value ?? "").slice(0, 1900);
  return { rich_text: content ? [{ text: { content } }] : [] };
}

function title(value) {
  const content = String(value ?? "稽古日").slice(0, 1900);
  return { title: [{ text: { content } }] };
}

function select(value) {
  return { select: value ? { name: String(value) } : null };
}

function number(value) {
  return { number: Number(value ?? 0) };
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))) return false;
  const date = new Date(`${value}T00:00:00+09:00`);
  return !Number.isNaN(date.getTime());
}

function normalizeTime(value, fallback = "00:00") {
  const raw = String(value ?? "").slice(0, 5);
  return /^\d{2}:\d{2}$/.test(raw) ? raw : fallback;
}

function addDays(date, days) {
  const [year, month, day] = String(date).split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = next.getUTCFullYear();
  const nextMonth = String(next.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(next.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function toNotionDate(row) {
  const startTime = normalizeTime(row.startTime);
  const endTime = normalizeTime(row.endTime, startTime);
  const endDate = endTime <= startTime ? addDays(row.date, 1) : row.date;
  return {
    date: {
      start: `${row.date}T${startTime}:00+09:00`,
      end: `${endDate}T${endTime}:00+09:00`,
    },
  };
}

function firstPropertyName(properties, type) {
  return Object.entries(properties).find(([, property]) => property.type === type)?.[0] ?? null;
}

function addIfExists(output, properties, name, value) {
  if (properties[name]) output[name] = value;
}

function pageProperties(row, databaseProperties) {
  const output = {};
  const titleProperty = databaseProperties["名前"] ? "名前" : firstPropertyName(databaseProperties, "title");
  const dateProperty = databaseProperties["日付"] ? "日付" : firstPropertyName(databaseProperties, "date");

  if (!titleProperty || !dateProperty) {
    throw new Error("Notionデータベースにタイトル列と日付列が必要です。");
  }

  output[titleProperty] = title(row.title);
  output[dateProperty] = toNotionDate(row);

  addIfExists(output, databaseProperties, "開始", text(row.startTime));
  addIfExists(output, databaseProperties, "終了", text(row.endTime));
  addIfExists(output, databaseProperties, "場所", text(row.place));
  addIfExists(output, databaseProperties, "予定の種類", select(row.eventType));
  addIfExists(output, databaseProperties, "対象チーム", select(row.rehearsalTeam));
  addIfExists(output, databaseProperties, "出席数", number(row.presentCount));
  addIfExists(output, databaseProperties, "欠席数", number(row.absentCount));
  addIfExists(output, databaseProperties, "遅刻数", number(row.lateCount));
  addIfExists(output, databaseProperties, "早退数", number(row.earlyCount));
  addIfExists(output, databaseProperties, "未定数", number(row.undecidedCount));
  addIfExists(output, databaseProperties, "未回答数", number(row.noReplyCount));
  addIfExists(output, databaseProperties, "出席者", text(row.presentMembers));
  addIfExists(output, databaseProperties, "欠席者", text(row.absentMembers));
  addIfExists(output, databaseProperties, "遅刻者", text(row.lateMembers));
  addIfExists(output, databaseProperties, "早退者", text(row.earlyMembers));
  addIfExists(output, databaseProperties, "未回答者", text(row.noReplyMembers));
  addIfExists(output, databaseProperties, "この日にやるシーン", text(row.selectedScenes));
  addIfExists(output, databaseProperties, "メモ", text(row.memo));
  addIfExists(output, databaseProperties, "稽古ノートID", text(row.id));

  return output;
}

async function findExistingPage(databaseId, databaseProperties, rehearsalId) {
  if (!databaseProperties["稽古ノートID"]) return null;

  const result = await notionFetch(`/databases/${databaseId}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: "稽古ノートID",
        rich_text: { equals: rehearsalId },
      },
      page_size: 1,
    }),
  });
  return result.results?.[0]?.id ?? null;
}

async function upsertRehearsal(databaseId, databaseProperties, row) {
  const existingPageId = await findExistingPage(databaseId, databaseProperties, row.id);
  const properties = pageProperties(row, databaseProperties);

  if (existingPageId) {
    await notionFetch(`/pages/${existingPageId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
    return "updated";
  }

  await notionFetch("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });
  return "created";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const { databaseId } = notionConfig();
    const { rehearsals } = await readJsonBody(req);
    if (!Array.isArray(rehearsals) || rehearsals.length === 0) {
      return json(res, 400, { error: "同期する稽古日データがありません。" });
    }

    const database = await notionFetch(`/databases/${databaseId}`);
    const databaseProperties = database.properties ?? {};
    const validRehearsals = rehearsals.filter((rehearsal) => isValidDate(rehearsal.date));
    const skipped = rehearsals.length - validRehearsals.length;

    let created = 0;
    let updated = 0;
    for (const rehearsal of validRehearsals) {
      const result = await upsertRehearsal(databaseId, databaseProperties, rehearsal);
      if (result === "created") created += 1;
      if (result === "updated") updated += 1;
    }

    return json(res, 200, { ok: true, created, updated, skipped });
  } catch (error) {
    console.error(error);
    return json(res, 500, {
      error: "Notion同期に失敗しました。",
      message: error?.message || String(error),
    });
  }
}
