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

function addDays(date, days) {
  const next = new Date(`${date}T00:00:00+09:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function toNotionDate(row) {
  const startTime = String(row.startTime ?? "").slice(0, 5) || "00:00";
  const endTime = String(row.endTime ?? "").slice(0, 5) || startTime;
  const endDate = endTime <= startTime ? addDays(row.date, 1) : row.date;
  return {
    date: {
      start: `${row.date}T${startTime}:00+09:00`,
      end: `${endDate}T${endTime}:00+09:00`,
    },
  };
}

function pageProperties(row) {
  return {
    名前: title(row.title),
    日付: toNotionDate(row),
    開始: text(row.startTime),
    終了: text(row.endTime),
    場所: text(row.place),
    予定の種類: select(row.eventType),
    対象チーム: select(row.rehearsalTeam),
    出席数: number(row.presentCount),
    欠席数: number(row.absentCount),
    遅刻数: number(row.lateCount),
    早退数: number(row.earlyCount),
    未定数: number(row.undecidedCount),
    未回答数: number(row.noReplyCount),
    出席者: text(row.presentMembers),
    欠席者: text(row.absentMembers),
    遅刻者: text(row.lateMembers),
    早退者: text(row.earlyMembers),
    未回答者: text(row.noReplyMembers),
    この日にやるシーン: text(row.selectedScenes),
    メモ: text(row.memo),
    稽古ノートID: text(row.id),
  };
}

async function findExistingPage(databaseId, rehearsalId) {
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

async function upsertRehearsal(databaseId, row) {
  const existingPageId = await findExistingPage(databaseId, row.id);
  const properties = pageProperties(row);

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

    let created = 0;
    let updated = 0;
    for (const rehearsal of rehearsals) {
      const result = await upsertRehearsal(databaseId, rehearsal);
      if (result === "created") created += 1;
      if (result === "updated") updated += 1;
    }

    return json(res, 200, { ok: true, created, updated });
  } catch (error) {
    console.error(error);
    return json(res, 500, {
      error: "Notion同期に失敗しました。",
      message: error?.message || String(error),
    });
  }
}
