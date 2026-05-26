import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

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

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase admin environment variables are missing.");
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function setupWebPush() {
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:notify@example.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

function describeSetupError(error) {
  const message = `${error?.message ?? error}`;
  if (message.includes("Supabase admin environment variables")) {
    return "Vercelの SUPABASE_SERVICE_ROLE_KEY が未設定です。Environment Variablesを確認してください。";
  }
  if (message.includes("push_subscriptions") || message.includes("schema cache") || message.includes("relation")) {
    return "Supabaseに通知用テーブルがまだありません。supabase-schema.sql をSQL Editorで再実行してください。";
  }
  if (message.includes("row-level security") || message.includes("permission denied") || message.includes("JWT")) {
    return "SUPABASE_SERVICE_ROLE_KEY が anon key になっている可能性があります。Supabaseの service_role key を入れてください。";
  }
  if (message.includes("violates foreign key")) {
    return "通知対象のメンバー情報がSupabase側に見つかりません。公開版のデータ読み込み後にもう一度試してください。";
  }
  return "通知登録の保存に失敗しました。Vercelの環境変数とSupabase設定を確認してください。";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const { roomId, memberId, subscription, userAgent } = await readJsonBody(req);
    if (!roomId || !memberId || !subscription?.endpoint) {
      return json(res, 400, { error: "roomId, memberId, and subscription are required." });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          room_id: roomId,
          member_id: memberId,
          endpoint: subscription.endpoint,
          subscription,
          user_agent: userAgent ?? "",
          enabled: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );

    if (error) throw error;

    if (setupWebPush()) {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: "ザクロ稽古ノート",
            body: "通知設定ができました。稽古前のお知らせを受け取れます。",
            url: "/",
          }),
        );
      } catch (pushError) {
        console.warn("Test notification failed", pushError);
      }
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error(error);
    return json(res, 500, {
      error: "Failed to register notification subscription.",
      message: describeSetupError(error),
      detail: error?.message ?? String(error),
    });
  }
}
