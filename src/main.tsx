// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

type AttendanceStatus = "出席" | "欠席" | "遅刻" | "早退" | "未定";

type Member = {
  id: string;
  name: string;
  role: string;
  character?: string;
  team: string;
  memo?: string;
};

type Rehearsal = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  place: string;
  memo?: string;
  createdAt?: string;
  eventType?: "稽古日" | "MTG・打ち合わせ";
  rehearsalTeam?: "Aチーム" | "Bチーム" | "共通";
  selectedSceneIds?: string[];
};

type Attendance = {
  id: string;
  rehearsalId: string;
  memberId: string;
  status: AttendanceStatus;
  arrivalTime?: string;
  leaveTime?: string;
  note?: string;
};

type Scene = {
  id: string;
  title: string;
  requiredCharacters: string[];
  memo?: string;
};

const members: Member[] = [
  { id: "m1", name: "おはよう真夜中", role: "キャスト", team: "共通" },
  { id: "m2", name: "黒崎こぎん", role: "キャスト", team: "共通" },
  { id: "m3", name: "Sion", role: "キャスト", team: "共通" },
  { id: "m4", name: "tika.", role: "キャスト", team: "共通" },
  { id: "m5", name: "ちょろね", role: "キャスト", team: "共通" },
  { id: "m6", name: "七宮ソウ", role: "キャスト", team: "共通" },
  { id: "m7", name: "U-kki", role: "キャスト", team: "共通" },
  { id: "m8", name: "冷凍みかん", role: "キャスト", team: "共通" },
];

const rehearsals: Rehearsal[] = [
  { id: "r-2026-06-06", date: "2026-06-06", startTime: "22:00", endTime: "00:30", place: "場所未定", memo: "確定稽古日", eventType: "稽古日" },
  { id: "r-2026-06-10", date: "2026-06-10", startTime: "22:00", endTime: "00:30", place: "場所未定", memo: "確定稽古日", eventType: "稽古日" },
  { id: "r-2026-06-12", date: "2026-06-12", startTime: "22:00", endTime: "00:30", place: "場所未定", memo: "確定稽古日", eventType: "稽古日" },
  { id: "r-2026-06-17", date: "2026-06-17", startTime: "22:00", endTime: "00:30", place: "場所未定", memo: "確定稽古日", eventType: "稽古日" },
  { id: "r-2026-06-19", date: "2026-06-19", startTime: "22:00", endTime: "00:30", place: "場所未定", memo: "確定稽古日", eventType: "稽古日" },
  { id: "r-2026-06-20", date: "2026-06-20", startTime: "22:00", endTime: "00:30", place: "場所未定", memo: "確定稽古日", eventType: "稽古日" },
  { id: "r-2026-06-24", date: "2026-06-24", startTime: "22:00", endTime: "00:30", place: "場所未定", memo: "確定稽古日", eventType: "稽古日" },
  { id: "r-2026-06-26", date: "2026-06-26", startTime: "22:00", endTime: "00:30", place: "場所未定", memo: "確定稽古日", eventType: "稽古日" },
];

const allSceneRoles = ["姫", "神", "殺人鬼", "商人"];
const scenes: Scene[] = [
  { id: "scene-01", title: "1場：プロローグ", requiredCharacters: allSceneRoles },
  { id: "scene-02", title: "2場：姫ライフ", requiredCharacters: ["姫"] },
  { id: "scene-03", title: "3場：殺人鬼の溺れる黒", requiredCharacters: ["殺人鬼"] },
  { id: "scene-04", title: "4場：神", requiredCharacters: ["神"] },
  { id: "scene-05", title: "5場：玉座に商人", requiredCharacters: ["商人"] },
  { id: "scene-06", title: "6場：急ぎ足のタブー", requiredCharacters: ["殺人鬼"] },
  { id: "scene-07", title: "7場：姫と商人", requiredCharacters: ["姫", "商人"] },
  { id: "scene-08", title: "8場：地下牢", requiredCharacters: ["神", "姫"] },
  { id: "scene-09", title: "9場：地下牢はいつも暗く", requiredCharacters: ["殺人鬼", "神"] },
  { id: "scene-10", title: "10場：人殺しと商売人", requiredCharacters: ["殺人鬼", "商人"] },
  { id: "scene-11", title: "11場：インターミッション", requiredCharacters: allSceneRoles },
  { id: "scene-12", title: "12場：天を突く塔", requiredCharacters: allSceneRoles },
  { id: "scene-13", title: "13場：建設現場", requiredCharacters: allSceneRoles },
  { id: "scene-14", title: "14場：栽培", requiredCharacters: allSceneRoles },
  { id: "scene-15", title: "15場：口の中", requiredCharacters: allSceneRoles },
  { id: "scene-16", title: "16場：宴", requiredCharacters: allSceneRoles },
  { id: "scene-17", title: "17場：エピローグ", requiredCharacters: allSceneRoles },
];

const seedAttendances: Attendance[] = [
  { id: "a1", rehearsalId: "r1", memberId: "m1", status: "出席" },
  { id: "a2", rehearsalId: "r1", memberId: "m2", status: "欠席", note: "仕事" },
  { id: "a3", rehearsalId: "r1", memberId: "m3", status: "出席" },
  { id: "a4", rehearsalId: "r1", memberId: "m5", status: "遅刻", arrivalTime: "19:30", note: "授業後に向かいます" },
  { id: "a5", rehearsalId: "r1", memberId: "m6", status: "出席" },
  { id: "a6", rehearsalId: "r1", memberId: "m7", status: "出席" },
  { id: "a7", rehearsalId: "r2", memberId: "m1", status: "出席" },
  { id: "a8", rehearsalId: "r2", memberId: "m3", status: "早退", leaveTime: "21:00" },
  { id: "a9", rehearsalId: "r2", memberId: "m5", status: "出席" },
  { id: "a10", rehearsalId: "r2", memberId: "m6", status: "未定", note: "前日までに確定" },
  { id: "a11", rehearsalId: "r3", memberId: "m2", status: "出席" },
  { id: "a12", rehearsalId: "r3", memberId: "m4", status: "出席" },
  { id: "a13", rehearsalId: "r3", memberId: "m5", status: "欠席", note: "本番対応" },
  { id: "a14", rehearsalId: "r3", memberId: "m6", status: "出席" },
];

const activeStatuses: AttendanceStatus[] = ["出席", "遅刻", "早退"];
const statusOptions: AttendanceStatus[] = ["出席", "欠席", "遅刻", "早退", "未定"];
const roleOptions = ["キャスト", "演出", "演出助手", "制作", "音響", "照明"];
const memberTeamOptions = ["Aチーム", "Bチーム", "共通"];
const eventTypeOptions = ["稽古日", "MTG・打ち合わせ"];
const rehearsalTeamOptions = ["共通", "Aチーム", "Bチーム"];
const rehearsalSeedVersion = "2026-06-confirmed-v2";
const sceneSeedVersion = "zakuro-scenes-v1";
const sceneRoleOptions = allSceneRoles;
const removedMemberNames = ["春野 いろは"];
type TeamFilter = "全員" | "Aチーム" | "Bチーム";
const teamFilters: TeamFilter[] = ["全員", "Aチーム", "Bチーム"];
const tabs = [
  { id: "dashboard", label: "ダッシュボード", icon: "⌂" },
  { id: "rehearsals", label: "稽古日", icon: "▣" },
  { id: "form", label: "出欠登録", icon: "＋" },
  { id: "admin", label: "出欠一覧", icon: "☷" },
  { id: "members", label: "メンバー", icon: "member" },
  { id: "scenes", label: "シーン", icon: "★" },
] as const;

function getAttendanceFor(rehearsalId: string, attendances: Attendance[]) {
  return attendances.filter((attendance) => attendance.rehearsalId === rehearsalId);
}

function getMissingMembers(rehearsalId: string, attendances: Attendance[], targetMembers = members) {
  const answered = new Set(getAttendanceFor(rehearsalId, attendances).map((attendance) => attendance.memberId));
  return targetMembers.filter((member) => !answered.has(member.id));
}

function summarizeRehearsal(rehearsalId: string, attendances: Attendance[], targetMembers = members) {
  const rows = getAttendanceFor(rehearsalId, attendances);
  return {
    present: rows.filter((row) => activeStatuses.includes(row.status)).length,
    absent: rows.filter((row) => row.status === "欠席").length,
    noReply: getMissingMembers(rehearsalId, attendances, targetMembers).length,
  };
}

function groupAttendance(rehearsalId: string, attendances: Attendance[], targetMembers = members) {
  const byMember = new Map(targetMembers.map((member) => [member.id, member]));
  const rows = getAttendanceFor(rehearsalId, attendances);
  const pick = (status: AttendanceStatus) =>
    rows
      .filter((row) => row.status === status)
      .map((row) => ({ attendance: row, member: byMember.get(row.memberId) }))
      .filter((row) => Boolean(row.member));

  return {
    present: pick("出席"),
    absent: pick("欠席"),
    late: pick("遅刻"),
    early: pick("早退"),
    undecided: pick("未定"),
    noReply: getMissingMembers(rehearsalId, attendances, targetMembers),
  };
}

function evaluateScenes(rehearsalId: string, attendances: Attendance[], targetMembers = members, sceneSource = scenes) {
  const rows = getAttendanceFor(rehearsalId, attendances).filter((row) => activeStatuses.includes(row.status));
  const activeMemberIds = new Set(rows.map((row) => row.memberId));
  const activeCharacters = new Set(
    targetMembers
      .filter((member) => activeMemberIds.has(member.id) && member.role === "キャスト" && member.character)
      .map((member) => member.character as string),
  );
  return sceneSource.map((scene) => {
    const missingCharacters = scene.requiredCharacters.filter((character) => !activeCharacters.has(character));
    return { scene, canRehearse: missingCharacters.length === 0, missingCharacters };
  });
}

function attendanceRate(memberId: string, attendances: Attendance[], rehearsalSource = rehearsals) {
  const rows = rehearsalSource
    .map((rehearsal) => attendances.find((attendance) => attendance.rehearsalId === rehearsal.id && attendance.memberId === memberId))
    .filter(Boolean) as Attendance[];
  if (rows.length === 0) return 0;
  const attended = rows.filter((row) => activeStatuses.includes(row.status)).length;
  return Math.round((attended / rows.length) * 100);
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function readRehearsals() {
  const savedVersion = localStorage.getItem("keiko.rehearsalSeedVersion");
  if (savedVersion !== rehearsalSeedVersion) {
    localStorage.setItem("keiko.rehearsalSeedVersion", rehearsalSeedVersion);
    localStorage.setItem("keiko.rehearsals", JSON.stringify(rehearsals));
    return rehearsals;
  }
  return readStorage("keiko.rehearsals", rehearsals).map((rehearsal) => ({
    ...rehearsal,
    eventType: rehearsal.eventType ?? "稽古日",
  }));
}

function withoutRemovedMembers(memberSource) {
  return memberSource.filter((member) => !removedMemberNames.includes(member.name));
}

function readScenes() {
  const savedVersion = localStorage.getItem("keiko.sceneSeedVersion");
  if (savedVersion !== sceneSeedVersion) {
    localStorage.setItem("keiko.sceneSeedVersion", sceneSeedVersion);
    localStorage.setItem("keiko.scenes", JSON.stringify(scenes));
    return scenes;
  }
  return readStorage("keiko.scenes", scenes);
}

function csvCell(value?: string | number) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function buildAttendanceRows(rehearsalSource: Rehearsal[], memberSource: Member[], attendanceSource: Attendance[]) {
  return rehearsalSource.flatMap((rehearsal) =>
    memberSource.map((member) => {
      const attendance = attendanceSource.find((row) => row.rehearsalId === rehearsal.id && row.memberId === member.id);
      return {
        稽古日: rehearsal.date,
        開始: rehearsal.startTime,
        終了: rehearsal.endTime,
        場所: rehearsal.place,
        名前: member.name,
        役職: member.role,
        役名: member.character ?? "",
        チーム: member.team,
        出欠: attendance?.status ?? "未回答",
        到着予定: attendance?.arrivalTime ?? "",
        早退予定: attendance?.leaveTime ?? "",
        理由連絡事項: attendance?.note ?? "",
        稽古メモ: rehearsal.memo ?? "",
      };
    }),
  );
}

function buildDetailRows(rehearsalSource: Rehearsal[], memberSource: Member[], attendanceSource: Attendance[]) {
  return rehearsalSource.flatMap((rehearsal) =>
    memberSource.map((member) => {
      const attendance = attendanceSource.find((row) => row.rehearsalId === rehearsal.id && row.memberId === member.id);
      return {
        稽古日: rehearsal.date,
        開始: formatTime(rehearsal.startTime),
        終了: formatTime(rehearsal.endTime),
        場所: rehearsal.place,
        名前: member.name,
        役職: member.role,
        役名: member.character ?? "",
        チーム: member.team,
        出欠ステータス: attendance?.status ?? "未回答",
        到着予定時間: attendance?.arrivalTime ?? "",
        早退予定時間: attendance?.leaveTime ?? "",
        理由・連絡事項: attendance?.note ?? "",
        稽古メモ: rehearsal.memo ?? "",
      };
    }),
  );
}

function getAttendanceSummary(rehearsal, memberSource, attendanceSource) {
  const rows = memberSource.map((member) => ({
    member,
    attendance: attendanceSource.find((row) => row.rehearsalId === rehearsal.id && row.memberId === member.id),
  }));
  const byStatus = (status) => rows.filter((row) => row.attendance?.status === status);
  const noReply = rows.filter((row) => !row.attendance);
  return {
    present: byStatus("出席"),
    absent: byStatus("欠席"),
    late: byStatus("遅刻"),
    early: byStatus("早退"),
    undecided: byStatus("未定"),
    noReply,
  };
}

function buildRehearsalSummaryRows(rehearsalSource, memberSource, attendanceSource) {
  return rehearsalSource.map((rehearsal) => {
    const summary = getAttendanceSummary(rehearsal, memberSource, attendanceSource);
    return {
      稽古日: rehearsal.date,
      開始: formatTime(rehearsal.startTime),
      終了: formatTime(rehearsal.endTime),
      場所: rehearsal.place,
      出席数: summary.present.length,
      欠席数: summary.absent.length,
      遅刻数: summary.late.length,
      早退数: summary.early.length,
      未回答数: summary.noReply.length,
      未回答者: summary.noReply.map((row) => row.member.name).join("、"),
      欠席者: summary.absent.map((row) => row.member.name).join("、"),
      遅刻者: summary.late.map((row) => row.member.name).join("、"),
      早退者: summary.early.map((row) => row.member.name).join("、"),
      稽古メモ: rehearsal.memo ?? "",
    };
  });
}

function buildMemberSummaryRows(rehearsalSource, memberSource, attendanceSource) {
  return memberSource.map((member) => {
    const rows = rehearsalSource.map((rehearsal) =>
      attendanceSource.find((attendance) => attendance.rehearsalId === rehearsal.id && attendance.memberId === member.id),
    );
    const count = (status) => rows.filter((row) => row?.status === status).length;
    const present = count("出席");
    const absent = count("欠席");
    const late = count("遅刻");
    const early = count("早退");
    const noReply = rows.filter((row) => !row).length;
    const answered = rows.filter(Boolean).length;
    const total = rehearsalSource.length;
    const participation = present + late + early;
    return {
      名前: member.name,
      役職: member.role,
      役名: member.character ?? "",
      チーム: member.team,
      出席数: present,
      欠席数: absent,
      遅刻数: late,
      早退数: early,
      未回答数: noReply,
      回答済み数: answered,
      全稽古数: total,
      出席率: total ? `${Math.round((participation / total) * 100)}%` : "0%",
    };
  });
}

function formatMatrixStatus(attendance) {
  if (!attendance) return "未回答";
  if (attendance.status === "遅刻" && attendance.arrivalTime) return `遅刻 ${attendance.arrivalTime}到着`;
  if (attendance.status === "早退" && attendance.leaveTime) return `早退 ${attendance.leaveTime}早退`;
  return attendance.status;
}

function buildMatrixRows(rehearsalSource, memberSource, attendanceSource) {
  const headers = rehearsalSource.map((rehearsal) => `${rehearsal.date} ${formatTime(rehearsal.startTime)}`);
  return memberSource.map((member) => {
    const row = {
      名前: member.name,
      役職: member.role,
      役名: member.character ?? "",
      チーム: member.team,
    };
    rehearsalSource.forEach((rehearsal, index) => {
      const attendance = attendanceSource.find((item) => item.rehearsalId === rehearsal.id && item.memberId === member.id);
      row[headers[index]] = formatMatrixStatus(attendance);
    });
    return row;
  });
}

function downloadTextFile(filename: string, text: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob(["\ufeff", text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 100);
}

async function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) {
    alert("出力するデータがありません。");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n");
  try {
    const response = await fetch("/save-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, csv: `\ufeff${csv}` }),
    });
    if (!response.ok) throw new Error("save failed");
    const result = await response.json();
    alert(`${filename} を保存しました。\n保存先：${result.path}`);
  } catch {
    downloadTextFile(filename, csv, "text/csv;charset=utf-8");
    alert(`${filename} を作成しました。保存メッセージが出ない場合は、通常のダウンロード先を確認してください。`);
  }
}

function getRehearsalMonths(rehearsalSource: Rehearsal[]) {
  return [...new Set(rehearsalSource.map((rehearsal) => rehearsal.date.slice(0, 7)))].sort();
}

function getSupabaseConfig() {
  return readStorage("keiko.supabaseConfig", {
    url: import.meta.env.VITE_SUPABASE_URL ?? "",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
    roomId: import.meta.env.VITE_DEFAULT_ROOM_ID ?? "zakuro-keiko",
  });
}

function saveSupabaseConfig(config) {
  localStorage.setItem("keiko.supabaseConfig", JSON.stringify(config));
}

function getActorName() {
  return readStorage("keiko.actorName", "");
}

function saveActorName(name) {
  localStorage.setItem("keiko.actorName", JSON.stringify(name));
}

function getNotificationMemberId() {
  return readStorage("keiko.notificationMemberId", "");
}

function saveNotificationMemberId(memberId) {
  localStorage.setItem("keiko.notificationMemberId", JSON.stringify(memberId));
}

function getVapidPublicKey() {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function getSupabaseClient(config) {
  if (!config.url || !config.anonKey) return null;
  return createClient(config.url, config.anonKey);
}

function withRoom(config, row) {
  return {
    ...row,
    room_id: config.roomId,
  };
}

function memberToRow(config, member, actorName) {
  return withRoom(config, {
    id: member.id,
    name: member.name,
    role: member.role,
    character: member.character ?? "",
    team: member.team,
    memo: member.memo ?? "",
    updated_by: actorName,
    updated_at: new Date().toISOString(),
  });
}

function memberFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    character: row.character ?? "",
    team: row.team,
    memo: row.memo ?? "",
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

function rehearsalToRow(config, rehearsal, actorName) {
  return withRoom(config, {
    id: rehearsal.id,
    date: rehearsal.date,
    start_time: rehearsal.startTime,
    end_time: rehearsal.endTime,
    place: rehearsal.place,
    memo: rehearsal.memo ?? "",
    event_type: rehearsal.eventType ?? "稽古日",
    rehearsal_team: rehearsal.rehearsalTeam ?? "共通",
    selected_scene_ids: rehearsal.selectedSceneIds ?? [],
    created_at: rehearsal.createdAt ?? new Date().toISOString(),
    updated_by: actorName,
    updated_at: new Date().toISOString(),
  });
}

function rehearsalFromRow(row) {
  return {
    id: row.id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    place: row.place,
    memo: row.memo ?? "",
    eventType: row.event_type ?? "稽古日",
    rehearsalTeam: row.rehearsal_team ?? "共通",
    selectedSceneIds: Array.isArray(row.selected_scene_ids) ? row.selected_scene_ids : [],
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

function sceneToRow(config, scene, actorName) {
  return withRoom(config, {
    id: scene.id,
    title: scene.title,
    required_characters: scene.requiredCharacters,
    memo: scene.memo ?? "",
    updated_by: actorName,
    updated_at: new Date().toISOString(),
  });
}

function sceneFromRow(row) {
  return {
    id: row.id,
    title: row.title,
    requiredCharacters: Array.isArray(row.required_characters) ? row.required_characters : [],
    memo: row.memo ?? "",
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

function attendanceToRow(config, attendance, actorName) {
  return withRoom(config, {
    id: attendance.id,
    rehearsal_id: attendance.rehearsalId,
    member_id: attendance.memberId,
    status: attendance.status,
    arrival_time: attendance.arrivalTime ?? "",
    leave_time: attendance.leaveTime ?? "",
    note: attendance.note ?? "",
    updated_by: actorName,
    updated_at: new Date().toISOString(),
  });
}

function attendanceFromRow(row) {
  return {
    id: row.id,
    rehearsalId: row.rehearsal_id,
    memberId: row.member_id,
    status: row.status,
    arrivalTime: row.arrival_time ?? "",
    leaveTime: row.leave_time ?? "",
    note: row.note ?? "",
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

async function logEdit(client, config, actorName, tableName, recordId, action, beforeData, afterData) {
  await client.from("edit_logs").insert({
    room_id: config.roomId,
    table_name: tableName,
    record_id: recordId,
    action,
    changed_by: actorName || "未入力",
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
  });
}

async function upsertSupabaseRow(config, actorName, tableName, row, beforeData, afterData) {
  const client = getSupabaseClient(config);
  if (!client) return { ok: false, message: "Supabase未接続のため、この端末内だけに保存しました。" };
  const onConflict = tableName === "attendances" ? "room_id,rehearsal_id,member_id" : "id";
  const { error } = await client.from(tableName).upsert(row, { onConflict });
  if (error) throw error;
  await logEdit(client, config, actorName, tableName, row.id, beforeData ? "update" : "insert", beforeData, afterData);
  return { ok: true, message: "オンラインへ保存しました。" };
}

async function deleteSupabaseRehearsal(config, actorName, rehearsal, attendanceRows) {
  const client = getSupabaseClient(config);
  if (!client) return { ok: false, message: "Supabase未接続のため、この端末内だけで削除しました。" };
  await logEdit(client, config, actorName, "rehearsals", rehearsal.id, "delete", {
    rehearsal,
    attendances: attendanceRows,
  }, null);
  const { error: attendanceError } = await client
    .from("attendances")
    .delete()
    .eq("room_id", config.roomId)
    .eq("rehearsal_id", rehearsal.id);
  if (attendanceError) throw attendanceError;
  const { error: rehearsalError } = await client
    .from("rehearsals")
    .delete()
    .eq("room_id", config.roomId)
    .eq("id", rehearsal.id);
  if (rehearsalError) throw rehearsalError;
  return { ok: true, message: "稽古日をオンラインから削除しました。" };
}

async function loadSupabaseState(config) {
  const client = getSupabaseClient(config);
  if (!client) throw new Error("Supabaseライブラリを読み込めませんでした。");
  const [memberRows, rehearsalRows, sceneRows, attendanceRows] = await Promise.all([
    client.from("members").select("*").eq("room_id", config.roomId).order("name"),
    client.from("rehearsals").select("*").eq("room_id", config.roomId).order("date").order("start_time"),
    client.from("scenes").select("*").eq("room_id", config.roomId).order("title"),
    client.from("attendances").select("*").eq("room_id", config.roomId).order("updated_at", { ascending: false }),
  ]);
  const failed = [memberRows, rehearsalRows, sceneRows, attendanceRows].find((result) => result.error);
  if (failed?.error) throw failed.error;
  return {
    members: memberRows.data.map(memberFromRow),
    rehearsals: rehearsalRows.data.map(rehearsalFromRow),
    scenes: sceneRows.data.map(sceneFromRow),
    attendances: attendanceRows.data.map(attendanceFromRow),
  };
}

function getStateCounts(state) {
  return {
    members: state.members?.length ?? 0,
    rehearsals: state.rehearsals?.length ?? 0,
    scenes: state.scenes?.length ?? 0,
    attendances: state.attendances?.length ?? 0,
  };
}

function hasStateData(state) {
  const counts = getStateCounts(state);
  return counts.members > 0 || counts.rehearsals > 0 || counts.scenes > 0 || counts.attendances > 0;
}

function describeStateCounts(state) {
  const counts = getStateCounts(state);
  return `メンバー${counts.members}件、稽古日${counts.rehearsals}件、シーン${counts.scenes}件、出欠${counts.attendances}件`;
}

async function seedSupabaseState(config, actorName, state, options = { requireEmpty: true }) {
  const client = getSupabaseClient(config);
  if (!client) throw new Error("Supabaseライブラリを読み込めませんでした。");
  if (options.requireEmpty) {
    const remoteState = await loadSupabaseState(config);
    if (hasStateData(remoteState)) {
      throw new Error(`本番データ保護: Supabaseに既存データがあります（${describeStateCounts(remoteState)}）。初期データでの上書きを中止しました。`);
    }
  }
  const rows = [
    ["members", state.members.map((member) => memberToRow(config, member, actorName))],
    ["rehearsals", state.rehearsals.map((rehearsal) => rehearsalToRow(config, rehearsal, actorName))],
    ["scenes", state.scenes.map((scene) => sceneToRow(config, scene, actorName))],
    ["attendances", state.attendances.map((attendance) => attendanceToRow(config, attendance, actorName))],
  ];
  for (const [tableName, tableRows] of rows) {
    if (!tableRows.length) continue;
    const { error } = await client.from(tableName).upsert(tableRows, { onConflict: "id" });
    if (error) throw error;
  }
  await logEdit(client, config, actorName, "app_state", config.roomId, "seed", null, {
    members: state.members.length,
    rehearsals: state.rehearsals.length,
    scenes: state.scenes.length,
    attendances: state.attendances.length,
  });
}

function App() {
  const [memberList, setMemberList] = useState<Member[]>(() => {
    return withoutRemovedMembers(readStorage("keiko.members", members));
  });
  const [rehearsalList, setRehearsalList] = useState<Rehearsal[]>(() => {
    return readRehearsals();
  });
  const [sceneList, setSceneList] = useState<Scene[]>(() => {
    return readScenes();
  });
  const [attendances, setAttendances] = useState<Attendance[]>(() => readStorage("keiko.attendances", seedAttendances));
  const [supabaseConfig, setSupabaseConfig] = useState(() => getSupabaseConfig());
  const [actorName, setActorName] = useState(() => getActorName());
  const [notificationMemberId, setNotificationMemberId] = useState(() => getNotificationMemberId());
  const [onlineStatus, setOnlineStatus] = useState("未設定です。");
  const [onlineReady, setOnlineReady] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("未接続です。");
  const applyingRemoteRef = useRef(false);
  const initialOnlineLoadRef = useRef(false);
  const [selectedRehearsalId, setSelectedRehearsalId] = useState(rehearsalList[0]?.id ?? "");
  const [tab, setTab] = useState("dashboard");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("全員");
  const visibleMembers = useMemo(
    () => memberList.filter((member) => teamFilter === "全員" || member.team === "共通" || member.team === teamFilter),
    [memberList, teamFilter],
  );
  const grouped = useMemo(() => groupAttendance(selectedRehearsalId, attendances, visibleMembers), [selectedRehearsalId, attendances, visibleMembers]);
  const sceneResults = useMemo(() => evaluateScenes(selectedRehearsalId, attendances, visibleMembers, sceneList), [selectedRehearsalId, attendances, visibleMembers, sceneList]);

  useEffect(() => {
    localStorage.setItem("keiko.rehearsals", JSON.stringify(rehearsalList));
    if (!rehearsalList.some((rehearsal) => rehearsal.id === selectedRehearsalId)) {
      setSelectedRehearsalId(rehearsalList[0]?.id ?? "");
    }
  }, [rehearsalList, selectedRehearsalId]);

  useEffect(() => {
    localStorage.setItem("keiko.members", JSON.stringify(memberList));
  }, [memberList]);

  useEffect(() => {
    localStorage.setItem("keiko.scenes", JSON.stringify(sceneList));
  }, [sceneList]);

  useEffect(() => {
    localStorage.setItem("keiko.attendances", JSON.stringify(attendances));
  }, [attendances]);

  useEffect(() => {
    saveSupabaseConfig(supabaseConfig);
  }, [supabaseConfig]);

  useEffect(() => {
    saveActorName(actorName);
  }, [actorName]);

  useEffect(() => {
    saveNotificationMemberId(notificationMemberId);
  }, [notificationMemberId]);

  function applyAppState(data, source = "manual") {
    if (!data?.members || !data?.rehearsals || !data?.scenes || !data?.attendances) {
      alert("オンラインデータの形式が違います。読み込みを中止しました。");
      return;
    }
    if (source === "remote") {
      applyingRemoteRef.current = true;
      window.setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 1600);
    }
    setMemberList(withoutRemovedMembers(data.members));
    setRehearsalList(data.rehearsals);
    setSceneList(data.scenes);
    setAttendances(data.attendances);
    setSelectedRehearsalId(data.rehearsals[0]?.id ?? "");
  }

  function getCurrentState() {
    return {
      members: memberList,
      rehearsals: rehearsalList,
      scenes: sceneList,
      attendances,
    };
  }

  function isOnlineConfigured() {
    return Boolean(supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.roomId);
  }

  function guardOnlineWrite() {
    if (!isOnlineConfigured()) return true;
    if (onlineReady) return true;
    alert("オンライン同期の接続がまだ完了していないため、保存を中止しました。少し待ってからもう一度試すか、ページを再読み込みしてください。");
    setOnlineStatus("オンライン接続が完了するまで保存を止めています。");
    return false;
  }

  useEffect(() => {
    if (initialOnlineLoadRef.current) return;
    if (!supabaseConfig.url || !supabaseConfig.anonKey || !supabaseConfig.roomId) return;
    initialOnlineLoadRef.current = true;

    async function initializeOnlineState() {
      setOnlineStatus("オンラインデータを確認中です...");
      try {
        const data = await loadSupabaseState(supabaseConfig);
        const isEmpty = !hasStateData(data);
        if (isEmpty) {
          await seedSupabaseState(supabaseConfig, actorName || "初期設定", getCurrentState());
          setOnlineStatus("初期データをオンラインに保存しました。");
        } else {
          applyAppState(data);
          setOnlineStatus("オンラインデータを読み込みました。");
        }
        setOnlineReady(true);
      } catch (error) {
        console.error(error);
        setOnlineStatus("オンライン接続に失敗しました。");
      }
    }

    initializeOnlineState();
  }, [supabaseConfig.anonKey, supabaseConfig.roomId, supabaseConfig.url]);

  async function saveInitialOnline() {
    if (!supabaseConfig.url || !supabaseConfig.anonKey || !supabaseConfig.roomId) {
      alert("Supabase URL、anon key、部屋IDを入力してください。");
      return;
    }
    if (!actorName.trim()) {
      alert("先に入力者名を入れてください。誰が変更したかを履歴に残すためです。");
      return;
    }
    setOnlineStatus("現在のデータをSupabaseへ送信中です...");
    try {
      const remoteState = await loadSupabaseState(supabaseConfig);
      if (hasStateData(remoteState)) {
        alert(`Supabaseに既存データがあります。上書きを防ぐため送信を中止しました。\n現在のオンラインデータ：${describeStateCounts(remoteState)}`);
        applyAppState(remoteState);
        setOnlineReady(true);
        setOnlineStatus("本番データ保護のため、オンライン上の既存データを残しました。");
        return;
      }
      await seedSupabaseState(supabaseConfig, actorName, getCurrentState());
      setOnlineReady(true);
      setOnlineStatus(`Supabaseへ保存しました：${new Date().toLocaleString("ja-JP")}`);
    } catch (error) {
      console.error(error);
      setOnlineStatus("保存できませんでした。Supabase設定とテーブル作成を確認してください。");
      alert("オンライン保存に失敗しました。READMEのSupabase設定を確認してください。");
    }
  }

  async function loadOnline() {
    if (!supabaseConfig.url || !supabaseConfig.anonKey || !supabaseConfig.roomId) {
      alert("Supabase URL、anon key、部屋IDを入力してください。");
      return;
    }
    if (!confirm("Supabase上のデータで、このブラウザのデータを置き換えます。よろしいですか？")) return;
    setOnlineStatus("オンラインから読み込み中です...");
    try {
      const data = await loadSupabaseState(supabaseConfig);
      if (!data.members.length && !data.rehearsals.length && !data.scenes.length && !data.attendances.length) {
        setOnlineStatus("オンラインデータがまだありません。先に保存してください。");
        return;
      }
      applyAppState(data);
      setOnlineReady(true);
      setOnlineStatus(`Supabaseから読み込みました：${new Date().toLocaleString("ja-JP")}`);
    } catch (error) {
      console.error(error);
      setOnlineStatus("読み込めませんでした。Supabase設定とテーブル作成を確認してください。");
      alert("オンライン読み込みに失敗しました。READMEのSupabase設定を確認してください。");
    }
  }

  useEffect(() => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey || !supabaseConfig.roomId) {
      setRealtimeStatus("未接続です。");
      return;
    }
    const client = getSupabaseClient(supabaseConfig);
    if (!client) return;
    setRealtimeStatus("リアルタイム接続中です...");
    const channel = client
      .channel(`keiko-room:${supabaseConfig.roomId}`);

    const onRemoteChange = async () => {
      if (applyingRemoteRef.current) return;
      try {
        const data = await loadSupabaseState(supabaseConfig);
        applyAppState(data, "remote");
        setOnlineReady(true);
        setOnlineStatus(`自動反映しました：${new Date().toLocaleString("ja-JP")}`);
      } catch (error) {
        console.error(error);
        setRealtimeStatus("同期データの取得でエラーが出ています。");
      }
    };

    ["members", "rehearsals", "scenes", "attendances"].forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `room_id=eq.${supabaseConfig.roomId}`,
        },
        onRemoteChange,
      );
    });

    channel
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("リアルタイム同期中です。");
        } else if (status === "CHANNEL_ERROR") {
          setRealtimeStatus("リアルタイム接続でエラーが出ています。");
        } else if (status === "TIMED_OUT") {
          setRealtimeStatus("リアルタイム接続がタイムアウトしました。");
        } else {
          setRealtimeStatus(`リアルタイム状態：${status}`);
        }
      });
    return () => {
      client.removeChannel(channel);
    };
  }, [supabaseConfig.anonKey, supabaseConfig.roomId, supabaseConfig.url]);

  async function reportOnlineError(error) {
    console.error(error);
    setOnlineStatus("オンライン保存でエラーが出ました。オンラインデータを読み直しています...");
    try {
      const data = await loadSupabaseState(supabaseConfig);
      applyAppState(data);
      setOnlineReady(true);
      setOnlineStatus("保存に失敗したため、オンライン上の最新データへ戻しました。");
    } catch (loadError) {
      console.error(loadError);
      setOnlineReady(false);
      setOnlineStatus("オンライン保存と再読み込みに失敗しました。ページを再読み込みしてください。");
    }
    alert("オンライン保存に失敗しました。ほかの人に反映されない変更を残さないため、オンライン上の最新データを読み直しました。もう一度入力してください。");
  }

  function addMember(input: Omit<Member, "id">) {
    if (!guardOnlineWrite()) return;
    const next = { ...input, id: `m${Date.now()}`, updatedBy: actorName, updatedAt: new Date().toISOString() };
    setMemberList((current) => [...current, next]);
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "members", memberToRow(supabaseConfig, next, actorName), null, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  function updateMember(input: Member) {
    if (!guardOnlineWrite()) return;
    const next = { ...input, updatedBy: actorName, updatedAt: new Date().toISOString() };
    const before = memberList.find((member) => member.id === input.id);
    setMemberList((current) => current.map((member) => (member.id === input.id ? next : member)));
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "members", memberToRow(supabaseConfig, next, actorName), before, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  function addScene(input: Omit<Scene, "id">) {
    if (!guardOnlineWrite()) return;
    const next = { ...input, id: `s${Date.now()}`, updatedBy: actorName, updatedAt: new Date().toISOString() };
    setSceneList((current) => [...current, next]);
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "scenes", sceneToRow(supabaseConfig, next, actorName), null, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  function updateScene(input: Scene) {
    if (!guardOnlineWrite()) return;
    const next = { ...input, updatedBy: actorName, updatedAt: new Date().toISOString() };
    const before = sceneList.find((scene) => scene.id === input.id);
    setSceneList((current) => current.map((scene) => (scene.id === input.id ? next : scene)));
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "scenes", sceneToRow(supabaseConfig, next, actorName), before, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  function deleteScene(sceneId: string) {
    if (!guardOnlineWrite()) return;
    if (!confirm("このシーンを削除しますか？")) return;
    setSceneList((current) => current.filter((scene) => scene.id !== sceneId));
  }

  function deleteMember(memberId: string) {
    if (!guardOnlineWrite()) return;
    if (!confirm("このメンバーを削除しますか？")) return;
    setMemberList((current) => current.filter((member) => member.id !== memberId));
    setAttendances((current) => current.filter((attendance) => attendance.memberId !== memberId));
  }

  function addRehearsal(input: Omit<Rehearsal, "id">) {
    if (!guardOnlineWrite()) return;
    const next = { ...input, id: `r${Date.now()}`, createdAt: new Date().toISOString(), updatedBy: actorName, updatedAt: new Date().toISOString() };
    setRehearsalList((current) => [...current, next].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)));
    setSelectedRehearsalId(next.id);
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "rehearsals", rehearsalToRow(supabaseConfig, next, actorName), null, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  function updateRehearsal(input: Rehearsal) {
    if (!guardOnlineWrite()) return;
    const before = rehearsalList.find((rehearsal) => rehearsal.id === input.id);
    const next = { ...input, updatedBy: actorName, updatedAt: new Date().toISOString() };
    setRehearsalList((current) =>
      current
        .map((rehearsal) => (rehearsal.id === input.id ? next : rehearsal))
        .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
    );
    setSelectedRehearsalId(next.id);
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "rehearsals", rehearsalToRow(supabaseConfig, next, actorName), before, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  async function deleteRehearsal(rehearsalId: string) {
    if (!guardOnlineWrite()) return;
    const target = rehearsalList.find((rehearsal) => rehearsal.id === rehearsalId);
    if (!target) return;
    if (!confirm(`${target.date} ${target.startTime}-${target.endTime} の稽古日を削除しますか？\nこの日の出欠データも一緒に削除されます。`)) return;
    const typed = prompt("誤削除防止のため「削除」と入力してください。");
    if (typed !== "削除") return;
    const relatedAttendances = attendances.filter((attendance) => attendance.rehearsalId === rehearsalId);
    if (onlineReady) {
      try {
        setOnlineStatus("稽古日をオンラインから削除中です...");
        const result = await deleteSupabaseRehearsal(supabaseConfig, actorName, target, relatedAttendances);
        setOnlineStatus(result.message);
      } catch (error) {
        await reportOnlineError(error);
        return;
      }
    }
    setRehearsalList((current) => current.filter((rehearsal) => rehearsal.id !== rehearsalId));
    setAttendances((current) => current.filter((attendance) => attendance.rehearsalId !== rehearsalId));
  }

  function saveAttendanceBatch(inputs: Omit<Attendance, "id">[]) {
    if (!guardOnlineWrite()) return;
    const savedRows = [];
    const beforeRows = [];
    let nextRows = [...attendances];
    const timestamp = Date.now();
    inputs.forEach((input, index) => {
      const existing = nextRows.find((row) => row.rehearsalId === input.rehearsalId && row.memberId === input.memberId);
      const savedRow = existing
        ? { ...existing, ...input, updatedBy: actorName, updatedAt: new Date().toISOString() }
        : { id: `a${timestamp}-${index}`, ...input, updatedBy: actorName, updatedAt: new Date().toISOString() };
      if (existing) {
        beforeRows.push(existing);
        nextRows = nextRows.map((row) => (row.id === existing.id ? savedRow : row));
      } else {
        beforeRows.push(null);
        nextRows.push(savedRow);
      }
      savedRows.push(savedRow);
    });
    setAttendances(nextRows);
    if (onlineReady && savedRows.length) {
      Promise.all(
        savedRows.map((savedRow, index) =>
          upsertSupabaseRow(supabaseConfig, actorName, "attendances", attendanceToRow(supabaseConfig, savedRow, actorName), beforeRows[index], savedRow),
        ),
      )
        .then(() => setOnlineStatus(`${savedRows.length}件をオンラインへ保存しました。`))
        .catch(reportOnlineError);
    }
    setSelectedRehearsalId(inputs[0]?.rehearsalId ?? selectedRehearsalId);
    setTab("admin");
  }

  function saveAttendance(input: Omit<Attendance, "id">) {
    saveAttendanceBatch([input]);
  }

  return (
    <main className="shell">
      <header className="appHeader">
        <div className="fruit" aria-hidden="true">
          <img src="./assets/pomegranate-clean.png" alt="" />
        </div>
        <div className="cutlery" aria-hidden="true">
          <img src="./assets/sword-cropped.png" alt="" />
        </div>
        <div>
          <p className="eyebrow">10月公演 ザクロ 稽古管理</p>
          <h1>稽古出欠ノート</h1>
          <img className="titleLine" src="./assets/title-line-v2-cropped.png" alt="" />
        </div>
      </header>
      <nav className="tabs" aria-label="画面切り替え">
        {tabs.map(({ id, label, icon }) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            {icon === "member" ? (
              <span className="memberGlyph" aria-hidden="true">
                <span className="memberGlyphPerson main"></span>
                <span className="memberGlyphPerson left"></span>
                <span className="memberGlyphPerson right"></span>
              </span>
            ) : icon && <span className="tabIcon">{icon}</span>}
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <TeamSwitch value={teamFilter} onChange={setTeamFilter} />
      <SyncGuardNotice
        configured={isOnlineConfigured()}
        onlineReady={onlineReady}
        onlineStatus={onlineStatus}
        realtimeStatus={realtimeStatus}
      />
      <NotificationGuide
        members={memberList}
        roomId={supabaseConfig.roomId}
        memberId={notificationMemberId}
        onMemberChange={setNotificationMemberId}
      />
      {tab === "dashboard" && <Dashboard rehearsalId={selectedRehearsalId} rehearsals={rehearsalList} setRehearsalId={setSelectedRehearsalId} attendances={attendances} visibleMembers={visibleMembers} sceneResults={sceneResults} />}
      {tab === "rehearsals" && <RehearsalList rehearsals={rehearsalList} scenes={sceneList} selectedRehearsalId={selectedRehearsalId} setSelectedRehearsalId={setSelectedRehearsalId} attendances={attendances} visibleMembers={visibleMembers} onAdd={addRehearsal} onUpdate={updateRehearsal} onDelete={deleteRehearsal} allowDelete={true} openAdmin={() => setTab("admin")} />}
      {tab === "form" && <AttendanceForm members={memberList} rehearsals={rehearsalList} defaultRehearsalId={selectedRehearsalId} onSave={saveAttendance} onSaveBatch={saveAttendanceBatch} />}
      {tab === "admin" && (
        <AdminView
          rehearsals={rehearsalList}
          rehearsalId={selectedRehearsalId}
          setRehearsalId={setSelectedRehearsalId}
          grouped={grouped}
          sceneResults={sceneResults}
          attendances={attendances}
          members={visibleMembers}
          allRehearsals={rehearsalList}
        />
      )}
      {tab === "members" && <MemberView rehearsals={rehearsalList} attendances={attendances} visibleMembers={visibleMembers} onAdd={addMember} onUpdate={updateMember} onDelete={deleteMember} allowDelete={!onlineReady} />}
      {tab === "scenes" && <ScenePage sceneResults={sceneResults} rehearsals={rehearsalList} onAdd={addScene} onUpdate={updateScene} onDelete={deleteScene} allowDelete={!onlineReady} />}
    </main>
  );
}

function SyncGuardNotice({ configured, onlineReady, onlineStatus, realtimeStatus }) {
  const tone = configured && onlineReady ? "ok" : "warn";
  const title = !configured ? "ローカル確認中" : onlineReady ? "オンライン保存中" : "オンライン接続を確認中";
  const message = !configured
    ? "この画面はローカル確認用です。公開版ではSupabaseに保存されます。"
    : onlineReady
      ? "入力内容はオンラインに保存され、他の端末にも反映されます。"
      : "接続が完了するまで保存操作を止めています。";
  const statusText = !configured
    ? "Supabase未設定 / ローカル表示"
    : onlineReady
      ? "オンラインデータを読み込み完了 / 現在、リアルタイム同期中"
      : `${onlineStatus} / ${realtimeStatus}`;
  return (
    <section className={`syncGuard ${tone}`} aria-live="polite">
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      <span>{statusText}</span>
    </section>
  );
}

function NotificationGuide({ members, roomId, memberId, onMemberChange }) {
  const [status, setStatus] = useState("最初だけ下のボタンから、通知を許可してね♡");
  const [isSettingNotification, setIsSettingNotification] = useState(false);
  const selectedMemberId = memberId || members[0]?.id || "";
  const vapidPublicKey = getVapidPublicKey();
  const canUsePush = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  useEffect(() => {
    if (!memberId && members[0]?.id) onMemberChange(members[0].id);
  }, [members, memberId, onMemberChange]);

  async function enableNotifications() {
    if (!canUsePush) {
      setStatus("この端末またはブラウザは通知に対応していません。iPhoneはホーム画面に追加したアプリから試してください。");
      return;
    }
    if (!vapidPublicKey) {
      setStatus("通知用の公開キーが未設定です。Vercelの環境変数 VITE_VAPID_PUBLIC_KEY を確認してください。");
      return;
    }
    if (!selectedMemberId) {
      setStatus("通知を受け取るメンバーを選んでください。");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("通知が許可されませんでした。端末やブラウザの通知設定を確認してください。");
      return;
    }

    try {
      setIsSettingNotification(true);
      setStatus("通知設定を保存しています...");
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const response = await fetch("/api/register-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          memberId: selectedMemberId,
          subscription,
          userAgent: navigator.userAgent,
        }),
      });
      if (!response.ok) {
        let payload = null;
        try {
          payload = await response.json();
        } catch (parseError) {
          payload = { message: await response.text() };
        }
        throw new Error(payload?.message || payload?.error || "通知登録APIでエラーが発生しました。");
      }
      setStatus("通知を受け取る設定が完了しました。稽古1時間前に通知します。");
    } catch (error) {
      console.error(error);
      setStatus(error?.message || "通知設定に失敗しました。公開版URLで開いているか、Vercelの通知設定を確認してください。");
    } finally {
      setIsSettingNotification(false);
    }
  }

  return (
    <section className="notificationGuide">
      <div>
        <strong>♥稽古前お知らせ機能♥</strong>
        <p>稽古のだいたい1時間前に通知でおしらせするよ〜！</p>
        <p>このページはWebでも見られるけど、通知を受け取るにはちょっと準備が必要です。<br />♦スマホ：ホーム画面に追加 　　♦PC：アプリとしてインストール</p>
        <p className="note">{status}</p>
      </div>
      <div className="notificationActions">
        <label className="field">
          あなたのお名前を選んでね
          <select value={selectedMemberId} onChange={(event) => onMemberChange(event.target.value)}>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
        </label>
        <button type="button" className="primary" onClick={enableNotifications} disabled={isSettingNotification}>
          {isSettingNotification ? "設定中..." : "通知を受け取る"}
        </button>
      </div>
    </section>
  );
}

function TeamSwitch({ value, onChange }) {
  return (
    <div className="teamSwitch" aria-label="チーム表示切り替え">
      {teamFilters.map((filter) => (
        <button key={filter} className={value === filter ? "active" : ""} onClick={() => onChange(filter)}>
          {filter}
        </button>
      ))}
    </div>
  );
}

function RehearsalPicker({ rehearsals, value, onChange }) {
  return (
    <label className="field">
      稽古日
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {rehearsals.map((rehearsal) => <option key={rehearsal.id} value={rehearsal.id}>{rehearsal.date} {formatTime(rehearsal.startTime)}</option>)}
      </select>
    </label>
  );
}

function getCalendarDays(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0).getDate();
  const offset = firstDay.getDay();
  return [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: lastDate }, (_, index) => {
      const date = `${monthKey}-${String(index + 1).padStart(2, "0")}`;
      return { day: index + 1, date };
    }),
  ];
}

function getEventKind(rehearsal) {
  return rehearsal.eventType === "MTG・打ち合わせ" ? "mtg" : "rehearsal";
}

function formatTime(time) {
  return String(time ?? "").slice(0, 5);
}

function getSceneCounts(sceneId, rehearsals) {
  return rehearsals.reduce(
    (counts, rehearsal) => {
      if (!rehearsal.selectedSceneIds?.includes(sceneId)) return counts;
      counts.total += 1;
      if (rehearsal.rehearsalTeam === "Aチーム") counts.a += 1;
      if (rehearsal.rehearsalTeam === "Bチーム") counts.b += 1;
      return counts;
    },
    { total: 0, a: 0, b: 0 },
  );
}

function DashboardCalendar({ rehearsals, selectedRehearsalId, onSelect }) {
  const selected = rehearsals.find((item) => item.id === selectedRehearsalId) ?? rehearsals[0];
  const monthOptions = [...new Set(rehearsals.map((rehearsal) => rehearsal.date.slice(0, 7)))].sort();
  const [monthKey, setMonthKey] = useState(selected?.date.slice(0, 7) ?? monthOptions[0] ?? new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const selectedMonth = selected?.date.slice(0, 7);
    if (selectedMonth && monthOptions.includes(selectedMonth)) {
      setMonthKey(selectedMonth);
    }
  }, [selectedRehearsalId]);

  const days = getCalendarDays(monthKey);
  const eventsByDate = rehearsals
    .filter((rehearsal) => rehearsal.date.startsWith(monthKey))
    .reduce((map, rehearsal) => {
      const rows = map.get(rehearsal.date) ?? [];
      rows.push(rehearsal);
      map.set(rehearsal.date, rows);
      return map;
    }, new Map());

  return (
    <section className="panel calendarPanel">
      <div className="calendarHeader">
        <h2 className="panelTitle"><span><img className="calendarTitleIcon" src="./assets/calendar-moon-icon.png" alt="" /></span>カレンダー</h2>
        <div className="calendarMonthControls">
          <select value={monthKey} onChange={(event) => setMonthKey(event.target.value)} aria-label="表示する月">
            {monthOptions.map((month) => <option key={month} value={month}>{month.replace("-", "年")}月</option>)}
          </select>
        </div>
      </div>
      <div className="calendarWeekdays" aria-hidden="true">
        {["日", "月", "火", "水", "木", "金", "土"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendarGrid">
        {days.map((day, index) => {
          if (!day) return <span key={`blank-${index}`} className="calendarDay blank"></span>;
          const events = eventsByDate.get(day.date) ?? [];
          const hasMtg = events.some((event) => getEventKind(event) === "mtg");
          const isSelected = day.date === selected?.date;
          return (
            <button
              key={day.date}
              className={`calendarDay ${events.length ? "hasEvent" : ""} ${hasMtg ? "hasMtg" : ""} ${isSelected ? "selected" : ""}`}
              onClick={() => events[0] && onSelect(events[0].id)}
              disabled={!events.length}
              title={events.map((event) => `${formatTime(event.startTime)} ${event.place}`).join("\n")}
            >
              <span>{day.day}</span>
              {events.length > 0 && <i aria-hidden="true"></i>}
            </button>
          );
        })}
      </div>
      <div className="calendarLegend">
        <span><i className="rehearsalDot"></i>稽古</span>
        <span><i className="mtgDot"></i>MTG・打ち合わせ</span>
      </div>
    </section>
  );
}

function Dashboard({ rehearsalId, rehearsals, setRehearsalId, attendances, visibleMembers, sceneResults }) {
  const rehearsal = rehearsals.find((item) => item.id === rehearsalId) ?? rehearsals[0];
  const grouped = groupAttendance(rehearsalId, attendances, visibleMembers);
  if (!rehearsal) return <section className="panel emptyState">稽古日を追加してください。</section>;
  return (
    <section className="stack">
      <DashboardCalendar rehearsals={rehearsals} selectedRehearsalId={rehearsalId} onSelect={setRehearsalId} />
      <div className="panel highlight">
        <RehearsalPicker rehearsals={rehearsals} value={rehearsalId} onChange={setRehearsalId} />
        <h2 className="sparkTitle">次回稽古：{rehearsal.date}<span>✦</span></h2>
        <p>{formatTime(rehearsal.startTime)}-{formatTime(rehearsal.endTime)} / {rehearsal.place}</p>
        <p className="note">{rehearsal.memo}</p>
      </div>
      <div className="grid two">
        <PeoplePanel title="出席予定" rows={[...grouped.present, ...grouped.late, ...grouped.early].map((row) => row.member.name)} />
        <PeoplePanel title="未回答" rows={grouped.noReply.map((member) => member.name)} tone="warn" />
      </div>
      <ContactNotesPanel grouped={grouped} />
      <ScenePanel sceneResults={sceneResults} />
      <section className="panel">
        <h2 className="panelTitle"><span>↗</span>出席率</h2>
        <div className="rateList">
          {visibleMembers.map((member) => <div key={member.id} className="rateRow"><span>{member.name}</span><strong>{attendanceRate(member.id, attendances, rehearsals)}%</strong></div>)}
        </div>
      </section>
    </section>
  );
}

function RehearsalList({ rehearsals, scenes, selectedRehearsalId, setSelectedRehearsalId, attendances, visibleMembers, onAdd, onUpdate, onDelete, allowDelete, openAdmin }) {
  const [editingRehearsal, setEditingRehearsal] = useState(null);
  return (
    <section className="stack">
      <RehearsalEditor
        scenes={scenes}
        editingRehearsal={editingRehearsal}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onCancelEdit={() => setEditingRehearsal(null)}
      />
      {rehearsals.map((rehearsal) => {
        const summary = summarizeRehearsal(rehearsal.id, attendances, visibleMembers);
        return (
          <article key={rehearsal.id} className={`panel rehearsalCard ${selectedRehearsalId === rehearsal.id ? "selected" : ""}`}>
            <div>
              <p className="eyebrow">{rehearsal.eventType ?? "稽古日"} / {rehearsal.place}</p>
              <h2>{rehearsal.date}</h2>
              <p>{formatTime(rehearsal.startTime)}-{formatTime(rehearsal.endTime)}</p>
              <p className="note">{rehearsal.memo}</p>
            </div>
            <div className="chips">
              <span>出席 {summary.present}</span>
              <span>欠席 {summary.absent}</span>
              <span>未回答 {summary.noReply}</span>
            </div>
            <div className="cardActions">
              <button onClick={() => { setSelectedRehearsalId(rehearsal.id); openAdmin(); }}>確認する</button>
              <button onClick={() => { setSelectedRehearsalId(rehearsal.id); setEditingRehearsal(rehearsal); }}>編集</button>
              {allowDelete && <button className="dangerButton" onClick={() => onDelete(rehearsal.id)}>削除</button>}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function RehearsalEditor({ scenes, editingRehearsal, onAdd, onUpdate, onCancelEdit }) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("22:00");
  const [place, setPlace] = useState("");
  const [memo, setMemo] = useState("");
  const [eventType, setEventType] = useState("稽古日");
  const [rehearsalTeam, setRehearsalTeam] = useState("共通");
  const [selectedSceneIds, setSelectedSceneIds] = useState([]);
  const isEditing = Boolean(editingRehearsal);

  useEffect(() => {
    if (!editingRehearsal) return;
    setDate(editingRehearsal.date ?? "");
    setStartTime(formatTime(editingRehearsal.startTime) || "19:00");
    setEndTime(formatTime(editingRehearsal.endTime) || "22:00");
    setPlace(editingRehearsal.place ?? "");
    setMemo(editingRehearsal.memo ?? "");
    setEventType(editingRehearsal.eventType ?? "稽古日");
    setRehearsalTeam(editingRehearsal.rehearsalTeam ?? "共通");
    setSelectedSceneIds(editingRehearsal.selectedSceneIds ?? []);
  }, [editingRehearsal]);

  function resetForm() {
    setDate("");
    setStartTime("19:00");
    setEndTime("22:00");
    setPlace("");
    setMemo("");
    setEventType("稽古日");
    setRehearsalTeam("共通");
    setSelectedSceneIds([]);
  }

  function toggleSelectedScene(sceneId) {
    setSelectedSceneIds((current) => (current.includes(sceneId) ? current.filter((id) => id !== sceneId) : [...current, sceneId]));
  }

  return (
    <form
      className="panel form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!date || !startTime || !endTime || !place) {
          alert("日付・開始時間・終了時間・場所を入力してください。");
          return;
        }
        const payload = { date, startTime, endTime, place, memo, eventType, rehearsalTeam, selectedSceneIds };
        if (editingRehearsal) {
          onUpdate({ ...editingRehearsal, ...payload });
          onCancelEdit();
        } else {
          onAdd(payload);
        }
        resetForm();
      }}
    >
      <h2 className="panelTitle"><span>{isEditing ? "✎" : "＋"}</span>{isEditing ? "稽古日を編集" : "稽古日を追加"}</h2>
      <div className="grid two">
        <label className="field">日付<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label className="field">予定の種類<select value={eventType} onChange={(event) => setEventType(event.target.value)}>{eventTypeOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
      </div>
      <div className="grid two">
        <label className="field">開始<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
        <label className="field">終了<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
      </div>
      <label className="field">対象チーム<select value={rehearsalTeam} onChange={(event) => setRehearsalTeam(event.target.value)}>{rehearsalTeamOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
      <fieldset className="checkboxGroup">
        <legend>この日にやるシーン</legend>
        {scenes.map((scene) => (
          <label key={scene.id} className="checkboxPill sceneSelectPill">
            <input type="checkbox" checked={selectedSceneIds.includes(scene.id)} onChange={() => toggleSelectedScene(scene.id)} />
            <span>{scene.title}</span>
          </label>
        ))}
      </fieldset>
      <label className="field">場所<input value={place} onChange={(event) => setPlace(event.target.value)} placeholder="例：駅前スタジオA" /></label>
      <label className="field">メモ<input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="例：1場、2場中心" /></label>
      <div className="formActions">
        <button className="primary">{isEditing ? "変更を保存する" : "稽古日を追加する"}</button>
        {isEditing && <button type="button" onClick={() => { resetForm(); onCancelEdit(); }}>編集をやめる</button>}
      </div>
    </form>
  );
}

function AttendanceForm({ members, rehearsals, defaultRehearsalId, onSave, onSaveBatch }) {
  const [mode, setMode] = useState("single");
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const todayKey = new Date().toLocaleDateString("sv-SE");
  const upcomingRehearsals = rehearsals.filter((rehearsal) => rehearsal.date >= todayKey);
  const [rehearsalId, setRehearsalId] = useState(
    upcomingRehearsals.some((rehearsal) => rehearsal.id === defaultRehearsalId)
      ? defaultRehearsalId
      : upcomingRehearsals[0]?.id ?? "",
  );
  const [selectedRehearsalIds, setSelectedRehearsalIds] = useState(
    upcomingRehearsals.some((rehearsal) => rehearsal.id === defaultRehearsalId)
      ? [defaultRehearsalId]
      : upcomingRehearsals[0]?.id
        ? [upcomingRehearsals[0].id]
        : [],
  );
  const [status, setStatus] = useState<AttendanceStatus>("出席");
  const [arrivalTime, setArrivalTime] = useState("");
  const [leaveTime, setLeaveTime] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!memberId && members[0]?.id) setMemberId(members[0].id);
  }, [members, memberId]);

  useEffect(() => {
    const selectableIds = upcomingRehearsals.map((rehearsal) => rehearsal.id);
    setRehearsalId((current) => {
      if (current && selectableIds.includes(current)) return current;
      if (defaultRehearsalId && selectableIds.includes(defaultRehearsalId)) return defaultRehearsalId;
      return upcomingRehearsals[0]?.id ?? "";
    });
    setSelectedRehearsalIds((current) => {
      const kept = current.filter((id) => selectableIds.includes(id));
      if (kept.length) return kept;
      if (defaultRehearsalId && selectableIds.includes(defaultRehearsalId)) return [defaultRehearsalId];
      return upcomingRehearsals[0]?.id ? [upcomingRehearsals[0].id] : [];
    });
  }, [defaultRehearsalId, rehearsals]);

  function toggleMember(memberId) {
    setSelectedMemberIds((current) => (current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]));
  }

  function toggleSingleRehearsal(rehearsalId) {
    setSelectedRehearsalIds((current) => (
      current.includes(rehearsalId) ? current.filter((id) => id !== rehearsalId) : [...current, rehearsalId]
    ));
  }

  function submitAttendance() {
    if (mode === "bulk") {
      if (!rehearsalId) {
        alert("稽古日を選んでください。");
        return;
      }
      if (!selectedMemberIds.length) {
        alert("名前を1人以上選んでください。");
        return;
      }
      onSaveBatch(
        selectedMemberIds.map((selectedId) => ({
          memberId: selectedId,
          rehearsalId,
          status,
          arrivalTime,
          leaveTime,
          note,
        })),
      );
      setSelectedMemberIds([]);
      return;
    }
    if (!memberId) {
      alert("名前を選んでください。");
      return;
    }
    if (!selectedRehearsalIds.length) {
      alert("稽古日を1つ以上選んでください。");
      return;
    }
    onSaveBatch(
      selectedRehearsalIds.map((selectedId) => ({
        memberId,
        rehearsalId: selectedId,
        status,
        arrivalTime,
        leaveTime,
        note,
      })),
    );
  }

  return (
    <form
      className="panel form"
      onSubmit={(event) => {
        event.preventDefault();
        submitAttendance();
      }}
    >
      <h2>出欠登録</h2>
      <div className="formModeSwitch" aria-label="登録方法">
        <button type="button" className={mode === "single" ? "active" : ""} onClick={() => setMode("single")}>ひとりずつ登録</button>
        <button type="button" className={mode === "bulk" ? "active" : ""} onClick={() => setMode("bulk")}>まとめて登録</button>
      </div>
      <fieldset className="choiceGroup">
        <legend>{mode === "bulk" ? "名前（複数選択できます）" : "名前"}</legend>
        <div className="choiceGrid members">
          {members.map((member) => (
            <label key={member.id} className={`choiceCard ${(mode === "bulk" ? selectedMemberIds.includes(member.id) : memberId === member.id) ? "selected" : ""}`}>
              <input
                type={mode === "bulk" ? "checkbox" : "radio"}
                name={mode === "bulk" ? `attendance-member-${member.id}` : "attendance-member"}
                checked={mode === "bulk" ? selectedMemberIds.includes(member.id) : memberId === member.id}
                onChange={() => (mode === "bulk" ? toggleMember(member.id) : setMemberId(member.id))}
              />
              <span>{member.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="choiceGroup">
        <legend>{mode === "bulk" ? "稽古日" : "稽古日（複数選択できます）"}</legend>
        <div className="choiceGrid rehearsals">
          {upcomingRehearsals.map((rehearsal) => (
            <label
              key={rehearsal.id}
              className={`choiceCard ${(mode === "bulk" ? rehearsalId === rehearsal.id : selectedRehearsalIds.includes(rehearsal.id)) ? "selected" : ""}`}
            >
              <input
                type={mode === "bulk" ? "radio" : "checkbox"}
                name={mode === "bulk" ? "attendance-rehearsal" : `attendance-rehearsal-${rehearsal.id}`}
                checked={mode === "bulk" ? rehearsalId === rehearsal.id : selectedRehearsalIds.includes(rehearsal.id)}
                onChange={() => (mode === "bulk" ? setRehearsalId(rehearsal.id) : toggleSingleRehearsal(rehearsal.id))}
              />
              <span>{rehearsal.date}</span>
              <small>{formatTime(rehearsal.startTime)}-{formatTime(rehearsal.endTime)}</small>
            </label>
          ))}
        </div>
        {!upcomingRehearsals.length && <p className="note">今日以降の稽古日がありません。必要な場合は稽古日を追加してください。</p>}
      </fieldset>
      <label className="field">出欠ステータス<select value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
      <div className="grid two">
        <label className="field">到着予定時間<input type="time" value={arrivalTime} onChange={(event) => setArrivalTime(event.target.value)} /></label>
        <label className="field">早退予定時間<input type="time" value={leaveTime} onChange={(event) => setLeaveTime(event.target.value)} /></label>
      </div>
      {mode === "bulk" && <p className="note">まとめて登録では、選んだ全員に同じステータス・時間・連絡事項が入ります。個別の理由はあとからひとりずつ編集できます。</p>}
      <label className="field">理由・連絡事項<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="例：仕事後に向かいます" /></label>
      <button className="primary">{mode === "bulk" ? (selectedMemberIds.length ? `${selectedMemberIds.length}人分をまとめて登録する` : "まとめて登録する") : (selectedRehearsalIds.length > 1 ? `${selectedRehearsalIds.length}日分を登録する` : "登録する")}</button>
    </form>
  );
}

function formatAttendanceLine(row) {
  const time = row.attendance.arrivalTime || row.attendance.leaveTime;
  const parts = [row.member.name];
  if (time) parts.push(time);
  if (row.attendance.note) parts.push(row.attendance.note);
  return parts.join(" / ");
}

function ContactNotesPanel({ grouped }) {
  const rows = [...grouped.present, ...grouped.absent, ...grouped.late, ...grouped.early, ...grouped.undecided]
    .filter((row) => row.attendance.note || row.attendance.arrivalTime || row.attendance.leaveTime)
    .map((row) => {
      const time = row.attendance.arrivalTime || row.attendance.leaveTime;
      return `${row.member.name}（${row.attendance.status}${time ? ` ${time}` : ""}）${row.attendance.note ? `：${row.attendance.note}` : ""}`;
    });

  return <PeoplePanel title="連絡事項まとめ" rows={rows} tone={rows.length ? "warn" : undefined} />;
}

function ExportTools({
  rehearsals,
  members,
  attendances,
}) {
  function exportCsv(kind) {
    const builders = {
      detail: {
        filename: "keiko_detail_all.csv",
        rows: buildDetailRows(rehearsals, members, attendances),
      },
      rehearsalSummary: {
        filename: "keiko_rehearsal_summary_all.csv",
        rows: buildRehearsalSummaryRows(rehearsals, members, attendances),
      },
      memberSummary: {
        filename: "keiko_member_summary_all.csv",
        rows: buildMemberSummaryRows(rehearsals, members, attendances),
      },
      matrix: {
        filename: "keiko_matrix_all.csv",
        rows: buildMatrixRows(rehearsals, members, attendances),
      },
    };
    const target = builders[kind];
    downloadCsv(target.filename, target.rows);
  }

  return (
    <section className="panel exportPanel">
      <h2 className="panelTitle"><span>↓</span>CSVダウンロード</h2>
      <div className="exportActions">
        <button onClick={() => exportCsv("detail")}>詳細CSV</button>
        <button onClick={() => exportCsv("rehearsalSummary")}>稽古日別サマリー</button>
        <button onClick={() => exportCsv("memberSummary")}>メンバー別サマリー</button>
        <button onClick={() => exportCsv("matrix")}>一覧表CSV</button>
      </div>
    </section>
  );
}

function AdminView({ rehearsals, rehearsalId, setRehearsalId, grouped, sceneResults, attendances, members, allRehearsals }) {
  return (
    <section className="stack">
      <div className="panel"><RehearsalPicker rehearsals={rehearsals} value={rehearsalId} onChange={setRehearsalId} /></div>
      <ContactNotesPanel grouped={grouped} />
      <div className="grid two">
        <PeoplePanel title="出席者" rows={grouped.present.map(formatAttendanceLine)} />
        <PeoplePanel title="欠席者" rows={grouped.absent.map(formatAttendanceLine)} tone="muted" />
        <PeoplePanel title="遅刻者" rows={grouped.late.map(formatAttendanceLine)} />
        <PeoplePanel title="早退者" rows={grouped.early.map(formatAttendanceLine)} />
        <PeoplePanel title="未定" rows={grouped.undecided.map(formatAttendanceLine)} tone="warn" />
        <PeoplePanel title="未回答者" rows={grouped.noReply.map((member) => member.name)} tone="warn" />
      </div>
      <ScenePanel sceneResults={sceneResults} rehearsals={allRehearsals} />
      <ExportTools
        rehearsals={rehearsals}
        rehearsalId={rehearsalId}
        members={members}
        attendances={attendances}
      />
    </section>
  );
}

function SceneEditor({ editingScene, onAdd, onUpdate, onCancel }) {
  const [title, setTitle] = useState(editingScene?.title ?? "");
  const [requiredCharacters, setRequiredCharacters] = useState(editingScene?.requiredCharacters ?? []);
  const [memo, setMemo] = useState(editingScene?.memo ?? "");

  useEffect(() => {
    setTitle(editingScene?.title ?? "");
    setRequiredCharacters(editingScene?.requiredCharacters ?? []);
    setMemo(editingScene?.memo ?? "");
  }, [editingScene]);

  function toggleRequiredCharacter(character) {
    setRequiredCharacters((current) =>
      current.includes(character) ? current.filter((item) => item !== character) : [...current, character],
    );
  }

  return (
    <form
      className="sceneEditor"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title || requiredCharacters.length === 0) {
          alert("シーン名と必要な役を入力してください。");
          return;
        }
        if (editingScene) {
          onUpdate({ ...editingScene, title, requiredCharacters, memo });
          onCancel();
        } else {
          onAdd({ title, requiredCharacters, memo });
          setTitle("");
          setRequiredCharacters([]);
          setMemo("");
        }
      }}
    >
      <h3>{editingScene ? "シーンを編集" : "シーンを追加"}</h3>
      <label className="field">シーン名<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：5場：ラスト" /></label>
      <fieldset className="checkboxGroup">
        <legend>必要な役</legend>
        {sceneRoleOptions.map((character) => (
          <label key={character} className="checkboxPill">
            <input
              type="checkbox"
              checked={requiredCharacters.includes(character)}
              onChange={() => toggleRequiredCharacter(character)}
            />
            <span>{character}</span>
          </label>
        ))}
      </fieldset>
      <label className="field">メモ<input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="例：小道具確認あり" /></label>
      <div className="formActions">
        <button className="primary">{editingScene ? "変更を保存する" : "シーンを追加する"}</button>
        {editingScene && <button type="button" onClick={onCancel}>キャンセル</button>}
      </div>
    </form>
  );
}

function ScenePanel({ sceneResults, rehearsals = [], onAdd, onUpdate, onDelete, allowDelete = true }) {
  const [editingId, setEditingId] = useState("");
  const editingScene = sceneResults.find(({ scene }) => scene.id === editingId)?.scene;
  const editable = Boolean(onAdd && onUpdate && onDelete);

  return (
    <section className="panel">
      <h2 className="panelTitle green"><span>★</span>シーン稽古可否</h2>
      {editable && <SceneEditor editingScene={editingScene} onAdd={onAdd} onUpdate={onUpdate} onCancel={() => setEditingId("")} />}
      <div className="sceneList">
        {sceneResults.map(({ scene, canRehearse, missingCharacters }) => {
          const sceneCounts = getSceneCounts(scene.id, rehearsals);
          return (
          <article key={scene.id} className={`scene ${canRehearse ? "ok" : "ng"}`}>
            <div>
              <h3>{scene.title}</h3>
              <p>必要：{scene.requiredCharacters.join("、")}</p>
              <p className="note">{scene.memo}</p>
              <p className="sceneCountLine">選択 {sceneCounts.total}回 / Aチーム {sceneCounts.a}回 / Bチーム {sceneCounts.b}回</p>
            </div>
            <strong>{canRehearse ? "✓ 稽古できます" : `不足：${missingCharacters.join("、")}`}</strong>
            {editable && (
              <div className="sceneActions">
                <button onClick={() => setEditingId(scene.id)}>編集</button>
                {allowDelete && <button className="dangerButton" onClick={() => onDelete(scene.id)}>削除</button>}
              </div>
            )}
          </article>
          );
        })}
      </div>
    </section>
  );
}

function ScenePage({ sceneResults, rehearsals, onAdd, onUpdate, onDelete, allowDelete }) {
  return (
    <section className="stack">
      <ScenePanel sceneResults={sceneResults} rehearsals={rehearsals} onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete} allowDelete={allowDelete} />
    </section>
  );
}

function PeoplePanel({ title, rows, tone }) {
  return (
    <section className={`panel people ${tone ?? ""}`}>
      <h2 className="panelTitle"><span>{tone === "warn" ? "?" : "♙"}</span>{title}</h2>
      {rows.length ? <ul>{rows.map((row) => <li key={row}>{row}</li>)}</ul> : <p className="note">該当なし</p>}
    </section>
  );
}

function MemberEditor({ editingMember, onAdd, onUpdate, onCancel }) {
  const [name, setName] = useState(editingMember?.name ?? "");
  const [role, setRole] = useState(editingMember?.role ?? "キャスト");
  const [character, setCharacter] = useState(editingMember?.character ?? "");
  const [team, setTeam] = useState(editingMember?.team ?? "共通");
  const [memo, setMemo] = useState(editingMember?.memo ?? "");

  useEffect(() => {
    setName(editingMember?.name ?? "");
    setRole(editingMember?.role ?? "キャスト");
    setCharacter(editingMember?.character ?? "");
    setTeam(editingMember?.team ?? "共通");
    setMemo(editingMember?.memo ?? "");
  }, [editingMember]);

  return (
    <form
      className="panel form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name || !role || !team) {
          alert("名前・役職・所属チームを入力してください。");
          return;
        }
        if (editingMember) {
          onUpdate({ ...editingMember, name, role, character, team, memo });
          onCancel();
        } else {
          onAdd({ name, role, character, team, memo });
          setName("");
          setRole("キャスト");
          setCharacter("");
          setTeam("共通");
          setMemo("");
        }
      }}
    >
      <h2 className="panelTitle"><span>{editingMember ? "✎" : "＋"}</span>{editingMember ? "メンバーを編集" : "メンバーを追加"}</h2>
      <div className="grid two">
        <label className="field">名前<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例：山田 はな" /></label>
        <label className="field">担当役名<input value={character} onChange={(event) => setCharacter(event.target.value)} placeholder="例：A" /></label>
      </div>
      <div className="grid two">
        <label className="field">役職<select value={role} onChange={(event) => setRole(event.target.value)}>{roleOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="field">所属チーム<select value={team} onChange={(event) => setTeam(event.target.value)}>{memberTeamOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
      </div>
      <label className="field">メモ<input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="例：6月後半から参加" /></label>
      <div className="formActions">
        <button className="primary">{editingMember ? "変更を保存する" : "メンバーを追加する"}</button>
        {editingMember && <button type="button" onClick={onCancel}>キャンセル</button>}
      </div>
    </form>
  );
}

function MemberView({ rehearsals, attendances, visibleMembers, onAdd, onUpdate, onDelete, allowDelete }) {
  const [editingId, setEditingId] = useState("");
  const editingMember = visibleMembers.find((member) => member.id === editingId);

  return (
    <section className="stack">
      <MemberEditor editingMember={editingMember} onAdd={onAdd} onUpdate={onUpdate} onCancel={() => setEditingId("")} />
      {visibleMembers.map((member) => (
        <article key={member.id} className="panel memberCard">
          <div>
            <h2>{member.name}</h2>
            <p>{member.role} / {member.team}{member.character ? ` / 役：${member.character}` : ""}</p>
            <p className="note">{member.memo}</p>
          </div>
          <div className="cardActions">
            <strong>{attendanceRate(member.id, attendances, rehearsals)}%</strong>
            <button onClick={() => setEditingId(member.id)}>編集</button>
            {allowDelete && <button className="dangerButton" onClick={() => onDelete(member.id)}>削除</button>}
          </div>
        </article>
      ))}
    </section>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("root要素が見つかりません。");
}

createRoot(rootElement).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service Worker registration failed", error);
    });
  });
}
