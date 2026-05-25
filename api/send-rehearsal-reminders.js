import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const REMINDER_KIND = "one_hour_before";
const REMINDER_WINDOW_MINUTES = 70;
const REMINDER_WINDOW_MINUTES_MIN = 50;

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
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are missing.");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function toTokyoDateTime(date, time) {
  const hhmm = String(time).slice(0, 5);
  return new Date(`${date}T${hhmm}:00+09:00`);
}

function isReminderWindow(rehearsal, now) {
  const startsAt = toTokyoDateTime(rehearsal.date, rehearsal.start_time);
  const diffMinutes = (startsAt.getTime() - now.getTime()) / 60000;
  return diffMinutes >= REMINDER_WINDOW_MINUTES_MIN && diffMinutes <= REMINDER_WINDOW_MINUTES;
}

function rehearsalLabel(rehearsal) {
  const start = String(rehearsal.start_time).slice(0, 5);
  const end = String(rehearsal.end_time).slice(0, 5);
  const place = rehearsal.place ? ` / ${rehearsal.place}` : "";
  return `${start}-${end}${place}`;
}

async function alreadyLogged(supabase, roomId, rehearsalId, memberId) {
  const { data, error } = await supabase
    .from("notification_logs")
    .select("id")
    .eq("room_id", roomId)
    .eq("rehearsal_id", rehearsalId)
    .eq("member_id", memberId)
    .eq("kind", REMINDER_KIND)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function logSent(supabase, roomId, rehearsalId, memberId) {
  const { error } = await supabase
    .from("notification_logs")
    .insert({
      room_id: roomId,
      rehearsal_id: rehearsalId,
      member_id: memberId,
      kind: REMINDER_KIND,
      sent_at: new Date().toISOString(),
    });

  if (error && error.code !== "23505") throw error;
}

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.authorization || "";
  const querySecret = req.query?.secret;
  if (cronSecret && authorization !== `Bearer ${cronSecret}` && querySecret !== cronSecret) {
    return json(res, 401, { error: "Unauthorized" });
  }

  try {
    setupWebPush();
    const supabase = getSupabaseAdmin();
    const roomId = process.env.VITE_DEFAULT_ROOM_ID || "zakuro-keiko";
    const now = new Date();
    const todayTokyo = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const tomorrowTokyo = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(now.getTime() + 24 * 60 * 60 * 1000));

    const { data: rehearsals, error: rehearsalError } = await supabase
      .from("rehearsals")
      .select("id, room_id, date, start_time, end_time, place, event_type")
      .eq("room_id", roomId)
      .in("date", [todayTokyo, tomorrowTokyo]);

    if (rehearsalError) throw rehearsalError;

    let sent = 0;
    let skipped = 0;
    const targets = (rehearsals ?? []).filter((rehearsal) => isReminderWindow(rehearsal, now));

    for (const rehearsal of targets) {
      const { data: attendances, error: attendanceError } = await supabase
        .from("attendances")
        .select("member_id, status")
        .eq("room_id", roomId)
        .eq("rehearsal_id", rehearsal.id)
        .in("status", ["出席", "遅刻", "早退"]);

      if (attendanceError) throw attendanceError;
      const memberIds = [...new Set((attendances ?? []).map((row) => row.member_id))];
      if (memberIds.length === 0) continue;

      const { data: subscriptions, error: subscriptionError } = await supabase
        .from("push_subscriptions")
        .select("id, member_id, subscription")
        .eq("room_id", roomId)
        .eq("enabled", true)
        .in("member_id", memberIds);

      if (subscriptionError) throw subscriptionError;

      for (const memberId of memberIds) {
        if (await alreadyLogged(supabase, roomId, rehearsal.id, memberId)) {
          skipped += 1;
          continue;
        }

        const memberSubscriptions = (subscriptions ?? []).filter((row) => row.member_id === memberId);
        let memberSent = 0;
        for (const row of memberSubscriptions) {
          try {
            await webpush.sendNotification(
              row.subscription,
              JSON.stringify({
                title: "ザクロ稽古ノート",
                body: `今日はザクロの稽古日だよ！がんばろうね！\n${rehearsalLabel(rehearsal)}`,
                url: "/",
              }),
            );
            memberSent += 1;
          } catch (error) {
            if (error?.statusCode === 404 || error?.statusCode === 410) {
              await supabase.from("push_subscriptions").update({ enabled: false }).eq("id", row.id);
            } else {
              console.error(error);
            }
          }
        }

        if (memberSent > 0) {
          await logSent(supabase, roomId, rehearsal.id, memberId);
          sent += memberSent;
        }
      }
    }

    return json(res, 200, { ok: true, checked: targets.length, sent, skipped });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: "Failed to send reminders." });
  }
}
