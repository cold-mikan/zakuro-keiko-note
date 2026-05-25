import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const { roomId, memberId, subscription, userAgent } = req.body ?? {};
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
    return json(res, 500, { error: "Failed to register notification subscription." });
  }
}
