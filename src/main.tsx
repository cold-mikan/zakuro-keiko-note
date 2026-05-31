// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { CalendarDays, ClipboardList, Home, Settings } from "lucide-react";
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

type SchedulePoll = {
  id: string;
  title: string;
  description?: string;
  isClosed: boolean;
  confirmedOptionId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type SchedulePollOption = {
  id: string;
  pollId: string;
  candidateDate: string;
  startTime: string;
  endTime: string;
  memo?: string;
};

type SchedulePollParticipant = {
  id: string;
  pollId: string;
  memberName: string;
  comment?: string;
  updatedAt?: string;
};

type SchedulePollResponseStatus = "yes" | "no" | "maybe";

type SchedulePollResponse = {
  id: string;
  pollId: string;
  optionId: string;
  participantId: string;
  status: SchedulePollResponseStatus;
  updatedAt?: string;
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

const schedulePolls: SchedulePoll[] = [];
const schedulePollOptions: SchedulePollOption[] = [];
const schedulePollParticipants: SchedulePollParticipant[] = [];
const schedulePollResponses: SchedulePollResponse[] = [];

const activeStatuses: AttendanceStatus[] = ["出席", "遅刻", "早退"];
const statusOptions: AttendanceStatus[] = ["出席", "欠席", "遅刻", "早退", "未定"];
const roleOptions = ["キャスト", "演出", "演出助手", "制作", "音響", "照明", "技術・美術"];
const memberTeamOptions = ["Aチーム", "Bチーム", "共通"];
const eventTypeOptions = ["稽古日", "MTG・打ち合わせ"];
const rehearsalTeamOptions = ["共通", "Aチーム", "Bチーム"];
const rehearsalSeedVersion = "2026-06-confirmed-v2";
const sceneSeedVersion = "zakuro-scenes-v1";
const sceneRoleOptions = allSceneRoles;
const removedMemberNames = ["春野 いろは"];
const deletedMemberMemo = "__deleted_member__";
type TeamFilter = "全員" | "Aチーム" | "Bチーム";
const teamFilters: TeamFilter[] = ["全員", "Aチーム", "Bチーム"];
const tabs = [
  { id: "dashboard", label: "ホーム", Icon: Home },
  { id: "form", label: "参加予定の入力", Icon: ClipboardList },
  { id: "schedule", label: "稽古日調整", Icon: CalendarDays },
  { id: "scenes", label: "管理者", Icon: Settings },
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

function sceneOrderValue(title = "") {
  const match = String(title).match(/[0-9０-９]+/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[0].replace(/[０-９]/g, (char) => String(char.charCodeAt(0) - 0xff10)));
}

function sortSceneResults(sceneResults) {
  return [...sceneResults].sort((a, b) => {
    const orderDiff = sceneOrderValue(a.scene.title) - sceneOrderValue(b.scene.title);
    return orderDiff || a.scene.title.localeCompare(b.scene.title, "ja");
  });
}

function sceneShortName(title = "") {
  const match = String(title).match(/[0-9０-９]+場/);
  return match?.[0] ?? title;
}

const sceneScopeOptions = [
  {
    id: "common",
    label: "共通",
    className: "common",
    description: "共通に設定中：選択したシーンは Aチーム・Bチーム両方に反映されます。",
  },
  {
    id: "team_a",
    label: "Aチーム",
    className: "teamA",
    description: "Aチームに設定中：選択したシーンは Aチームだけに反映されます。",
  },
  {
    id: "team_b",
    label: "Bチーム",
    className: "teamB",
    description: "Bチームに設定中：選択したシーンは Bチームだけに反映されます。",
  },
] as const;

const sceneScopeLabels = {
  common: "共通",
  team_a: "Aチーム",
  team_b: "Bチーム",
};

const validSceneScopes = new Set(sceneScopeOptions.map((option) => option.id));

function parseScopedSceneId(value = "") {
  const [maybeScope, ...rest] = String(value).split(":");
  const sceneId = rest.join(":");
  if (validSceneScopes.has(maybeScope) && sceneId) {
    return { scope: maybeScope, sceneId };
  }
  return { scope: "common", sceneId: value };
}

function makeScopedSceneId(scope, sceneId) {
  return `${scope}:${sceneId}`;
}

function getSceneSelectionMap(rehearsal) {
  const map = {
    common: new Set(),
    team_a: new Set(),
    team_b: new Set(),
  };
  (rehearsal?.selectedSceneIds ?? []).forEach((value) => {
    const { scope, sceneId } = parseScopedSceneId(value);
    if (sceneId) map[scope].add(sceneId);
  });
  return map;
}

function serializeSceneSelectionMap(map) {
  return sceneScopeOptions.flatMap((option) =>
    Array.from(map[option.id] ?? []).map((sceneId) => makeScopedSceneId(option.id, sceneId)),
  );
}

function getSelectedSceneIdsForScope(rehearsal, scope) {
  return Array.from(getSceneSelectionMap(rehearsal)[scope] ?? []);
}

function getEffectiveSceneIdsForTeam(rehearsal, teamFilter = "全員") {
  const map = getSceneSelectionMap(rehearsal);
  const ids = new Set(map.common);
  if (teamFilter === "Aチーム") {
    map.team_a.forEach((sceneId) => ids.add(sceneId));
    return Array.from(ids);
  }
  if (teamFilter === "Bチーム") {
    map.team_b.forEach((sceneId) => ids.add(sceneId));
    return Array.from(ids);
  }
  map.team_a.forEach((sceneId) => ids.add(sceneId));
  map.team_b.forEach((sceneId) => ids.add(sceneId));
  return Array.from(ids);
}

function getSceneTitlesForScope(rehearsal, scenes, scope) {
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene.title]));
  return getSelectedSceneIdsForScope(rehearsal, scope)
    .map((sceneId) => sceneById.get(sceneId))
    .filter(Boolean);
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
  return memberSource.filter((member) => !removedMemberNames.includes(member.name) && member.memo !== deletedMemberMemo);
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

function buildNotionSyncRows(rehearsalSource, memberSource, attendanceSource, sceneSource) {
  return [...rehearsalSource]
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
    .map((rehearsal) => {
      const summary = getAttendanceSummary(rehearsal, memberSource, attendanceSource);
      const selectedScenes = sceneSource
        .filter((scene) => getEffectiveSceneIdsForTeam(rehearsal).includes(scene.id))
        .map((scene) => scene.title);
      return {
        id: rehearsal.id,
        title: `${rehearsal.date} ${rehearsal.eventType ?? "稽古日"}`,
        date: rehearsal.date,
        startTime: formatTime(rehearsal.startTime),
        endTime: formatTime(rehearsal.endTime),
        place: rehearsal.place ?? "",
        eventType: rehearsal.eventType ?? "稽古日",
        rehearsalTeam: rehearsal.rehearsalTeam ?? "共通",
        presentCount: summary.present.length,
        absentCount: summary.absent.length,
        lateCount: summary.late.length,
        earlyCount: summary.early.length,
        undecidedCount: summary.undecided.length,
        noReplyCount: summary.noReply.length,
        presentMembers: summary.present.map((row) => row.member.name).join("、"),
        absentMembers: summary.absent.map((row) => row.member.name).join("、"),
        lateMembers: summary.late.map((row) => row.member.name).join("、"),
        earlyMembers: summary.early.map((row) => row.member.name).join("、"),
        noReplyMembers: summary.noReply.map((row) => row.member.name).join("、"),
        selectedScenes: selectedScenes.join("、"),
        memo: rehearsal.memo ?? "",
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

const notificationSettingKey = "zakuro-keiko-notification-member";

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

function schedulePollToRow(config, poll, actorName) {
  return withRoom(config, {
    id: poll.id,
    title: poll.title,
    description: poll.description ?? "",
    is_closed: Boolean(poll.isClosed),
    confirmed_option_id: poll.confirmedOptionId ?? "",
    created_at: poll.createdAt ?? new Date().toISOString(),
    updated_by: actorName,
    updated_at: new Date().toISOString(),
  });
}

function schedulePollFromRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    isClosed: Boolean(row.is_closed),
    confirmedOptionId: row.confirmed_option_id ?? "",
    createdAt: row.created_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

function schedulePollOptionToRow(config, option, actorName) {
  return withRoom(config, {
    id: option.id,
    poll_id: option.pollId,
    candidate_date: option.candidateDate,
    start_time: option.startTime,
    end_time: option.endTime,
    memo: option.memo ?? "",
    updated_by: actorName,
    updated_at: new Date().toISOString(),
  });
}

function schedulePollOptionFromRow(row) {
  return {
    id: row.id,
    pollId: row.poll_id,
    candidateDate: row.candidate_date,
    startTime: row.start_time,
    endTime: row.end_time,
    memo: row.memo ?? "",
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

function schedulePollParticipantToRow(config, participant, actorName) {
  return withRoom(config, {
    id: participant.id,
    poll_id: participant.pollId,
    member_name: participant.memberName,
    comment: participant.comment ?? "",
    updated_by: actorName,
    updated_at: new Date().toISOString(),
  });
}

function schedulePollParticipantFromRow(row) {
  return {
    id: row.id,
    pollId: row.poll_id,
    memberName: row.member_name,
    comment: row.comment ?? "",
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

function schedulePollResponseToRow(config, response, actorName) {
  return withRoom(config, {
    id: response.id,
    poll_id: response.pollId,
    option_id: response.optionId,
    participant_id: response.participantId,
    status: response.status,
    updated_by: actorName,
    updated_at: new Date().toISOString(),
  });
}

function schedulePollResponseFromRow(row) {
  return {
    id: row.id,
    pollId: row.poll_id,
    optionId: row.option_id,
    participantId: row.participant_id,
    status: row.status,
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
  const conflictKeys = {
    attendances: "room_id,rehearsal_id,member_id",
    schedule_poll_participants: "room_id,poll_id,member_name",
    schedule_poll_responses: "room_id,poll_id,option_id,participant_id",
  };
  const onConflict = conflictKeys[tableName] ?? "id";
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

async function deleteSupabaseMember(config, actorName, member, attendanceRows) {
  const client = getSupabaseClient(config);
  if (!client) return { ok: false, message: "Supabase未接続のため、この端末内だけで削除しました。" };
  const hiddenMember = {
    ...member,
    memo: deletedMemberMemo,
    updatedBy: actorName,
    updatedAt: new Date().toISOString(),
  };
  await logEdit(client, config, actorName, "members", member.id, "hide", {
    member,
    attendances: attendanceRows,
  }, hiddenMember);
  const { error } = await client
    .from("members")
    .update({
      memo: deletedMemberMemo,
      updated_by: actorName,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", config.roomId)
    .eq("id", member.id);
  if (error) throw error;
  return { ok: true, message: "メンバーを非表示にしました。" };
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
  const scheduleState = await loadSchedulePollState(client, config);
  return {
    members: memberRows.data.map(memberFromRow),
    rehearsals: rehearsalRows.data.map(rehearsalFromRow),
    scenes: sceneRows.data.map(sceneFromRow),
    attendances: attendanceRows.data.map(attendanceFromRow),
    ...scheduleState,
  };
}

async function loadSchedulePollState(client, config) {
  const empty = {
    schedulePolls: [],
    schedulePollOptions: [],
    schedulePollParticipants: [],
    schedulePollResponses: [],
  };
  const [pollRows, optionRows, participantRows, responseRows] = await Promise.all([
    client.from("schedule_polls").select("*").eq("room_id", config.roomId).order("created_at", { ascending: false }),
    client.from("schedule_poll_options").select("*").eq("room_id", config.roomId).order("candidate_date").order("start_time"),
    client.from("schedule_poll_participants").select("*").eq("room_id", config.roomId).order("member_name"),
    client.from("schedule_poll_responses").select("*").eq("room_id", config.roomId).order("updated_at", { ascending: false }),
  ]);
  const failed = [pollRows, optionRows, participantRows, responseRows].find((result) => result.error);
  if (failed?.error) {
    console.warn("稽古日調整テーブルを読み込めませんでした。supabase-schema.sql の再実行が必要です。", failed.error);
    return empty;
  }
  return {
    schedulePolls: pollRows.data.map(schedulePollFromRow),
    schedulePollOptions: optionRows.data.map(schedulePollOptionFromRow),
    schedulePollParticipants: participantRows.data.map(schedulePollParticipantFromRow),
    schedulePollResponses: responseRows.data.map(schedulePollResponseFromRow),
  };
}

function getStateCounts(state) {
  return {
    members: state.members?.length ?? 0,
    rehearsals: state.rehearsals?.length ?? 0,
    scenes: state.scenes?.length ?? 0,
    attendances: state.attendances?.length ?? 0,
    schedulePolls: state.schedulePolls?.length ?? 0,
    schedulePollOptions: state.schedulePollOptions?.length ?? 0,
    schedulePollParticipants: state.schedulePollParticipants?.length ?? 0,
    schedulePollResponses: state.schedulePollResponses?.length ?? 0,
  };
}

function hasStateData(state) {
  const counts = getStateCounts(state);
  return counts.members > 0 || counts.rehearsals > 0 || counts.scenes > 0 || counts.attendances > 0 || counts.schedulePolls > 0 || counts.schedulePollOptions > 0 || counts.schedulePollParticipants > 0 || counts.schedulePollResponses > 0;
}

function describeStateCounts(state) {
  const counts = getStateCounts(state);
  return `メンバー${counts.members}件、稽古日${counts.rehearsals}件、シーン${counts.scenes}件、出欠${counts.attendances}件、稽古日調整${counts.schedulePolls}件`;
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
    ["schedule_polls", (state.schedulePolls ?? []).map((poll) => schedulePollToRow(config, poll, actorName))],
    ["schedule_poll_options", (state.schedulePollOptions ?? []).map((option) => schedulePollOptionToRow(config, option, actorName))],
    ["schedule_poll_participants", (state.schedulePollParticipants ?? []).map((participant) => schedulePollParticipantToRow(config, participant, actorName))],
    ["schedule_poll_responses", (state.schedulePollResponses ?? []).map((response) => schedulePollResponseToRow(config, response, actorName))],
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
    schedulePolls: state.schedulePolls?.length ?? 0,
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
  const [schedulePollList, setSchedulePollList] = useState<SchedulePoll[]>(() => readStorage("keiko.schedulePolls", schedulePolls));
  const [scheduleOptionList, setScheduleOptionList] = useState<SchedulePollOption[]>(() => readStorage("keiko.schedulePollOptions", schedulePollOptions));
  const [scheduleParticipantList, setScheduleParticipantList] = useState<SchedulePollParticipant[]>(() => readStorage("keiko.schedulePollParticipants", schedulePollParticipants));
  const [scheduleResponseList, setScheduleResponseList] = useState<SchedulePollResponse[]>(() => readStorage("keiko.schedulePollResponses", schedulePollResponses));
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
  const [toast, setToast] = useState<{ message: string; tone: "ok" | "error" } | null>(null);
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
    localStorage.setItem("keiko.schedulePolls", JSON.stringify(schedulePollList));
  }, [schedulePollList]);

  useEffect(() => {
    localStorage.setItem("keiko.schedulePollOptions", JSON.stringify(scheduleOptionList));
  }, [scheduleOptionList]);

  useEffect(() => {
    localStorage.setItem("keiko.schedulePollParticipants", JSON.stringify(scheduleParticipantList));
  }, [scheduleParticipantList]);

  useEffect(() => {
    localStorage.setItem("keiko.schedulePollResponses", JSON.stringify(scheduleResponseList));
  }, [scheduleResponseList]);

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
    setSchedulePollList(data.schedulePolls ?? []);
    setScheduleOptionList(data.schedulePollOptions ?? []);
    setScheduleParticipantList(data.schedulePollParticipants ?? []);
    setScheduleResponseList(data.schedulePollResponses ?? []);
    setSelectedRehearsalId(data.rehearsals[0]?.id ?? "");
  }

  function getCurrentState() {
    return {
      members: memberList,
      rehearsals: rehearsalList,
      scenes: sceneList,
      attendances,
      schedulePolls: schedulePollList,
      schedulePollOptions: scheduleOptionList,
      schedulePollParticipants: scheduleParticipantList,
      schedulePollResponses: scheduleResponseList,
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

  function showToast(message: string, tone: "ok" | "error" = "ok") {
    setToast({ message, tone });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3600);
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
      if (!hasStateData(data)) {
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

    ["members", "rehearsals", "scenes", "attendances", "schedule_polls", "schedule_poll_options", "schedule_poll_participants", "schedule_poll_responses"].forEach((table) => {
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
    showToast("送信に失敗しました。もう一度お試しください。", "error");
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
    showToast("変更が完了しました。");
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
    showToast("変更が完了しました。");
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
    showToast("変更が完了しました。");
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
    showToast("変更が完了しました。");
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

  async function deleteMember(memberId: string) {
    if (!guardOnlineWrite()) return;
    const target = memberList.find((member) => member.id === memberId);
    if (!target) return;
    if (!confirm(`${target.name} を削除しますか？\nこのメンバーの出欠データも一緒に削除されます。`)) return;
    const typed = prompt("誤削除防止のため「削除」と入力してください。");
    if (typed !== "削除") return;
    const relatedAttendances = attendances.filter((attendance) => attendance.memberId === memberId);
    if (onlineReady) {
      try {
        const result = await deleteSupabaseMember(supabaseConfig, actorName, target, relatedAttendances);
        setOnlineStatus(result.message);
      } catch (error) {
        reportOnlineError(error);
        return;
      }
    }
    setMemberList((current) => current.filter((member) => member.id !== memberId));
    setAttendances((current) => current.filter((attendance) => attendance.memberId !== memberId));
    showToast("変更が完了しました。");
  }

  function addRehearsal(input: Omit<Rehearsal, "id">) {
    if (!guardOnlineWrite()) return;
    const uniqueId = `r${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next = { ...input, id: uniqueId, createdAt: new Date().toISOString(), updatedBy: actorName, updatedAt: new Date().toISOString() };
    setRehearsalList((current) => [...current, next].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)));
    setSelectedRehearsalId(next.id);
    showToast("変更が完了しました。");
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
    showToast("変更が完了しました。");
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
    showToast("変更が完了しました。");
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
    showToast("ご記入ありがとうございます。情報を送信しました。");
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

  function createSchedulePoll(input) {
    if (!guardOnlineWrite()) return;
    const timestamp = Date.now();
    const poll: SchedulePoll = {
      id: `sp${timestamp}`,
      title: input.title,
      description: input.description ?? "",
      isClosed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const options = input.options.map((option, index) => ({
      id: `spo${timestamp}-${index}`,
      pollId: poll.id,
      candidateDate: option.candidateDate,
      startTime: option.startTime,
      endTime: option.endTime,
      memo: option.memo ?? "",
      updatedAt: new Date().toISOString(),
    }));
    setSchedulePollList((current) => [poll, ...current]);
    setScheduleOptionList((current) => [...current, ...options].sort((a, b) => `${a.candidateDate}${a.startTime}`.localeCompare(`${b.candidateDate}${b.startTime}`)));
    showToast("稽古日調整を作成しました。");
    if (onlineReady) {
      (async () => {
        await upsertSupabaseRow(supabaseConfig, actorName, "schedule_polls", schedulePollToRow(supabaseConfig, poll, actorName), null, poll);
        await Promise.all(
          options.map((option) => upsertSupabaseRow(supabaseConfig, actorName, "schedule_poll_options", schedulePollOptionToRow(supabaseConfig, option, actorName), null, option)),
        );
      })()
        .then(() => setOnlineStatus("稽古日調整をオンラインへ保存しました。"))
        .catch(reportOnlineError);
    }
  }

  function saveScheduleAnswer(input) {
    if (!guardOnlineWrite()) return;
    const timestamp = Date.now();
    const existingParticipant = scheduleParticipantList.find((participant) => participant.pollId === input.pollId && participant.memberName === input.memberName);
    const participant: SchedulePollParticipant = existingParticipant
      ? { ...existingParticipant, comment: input.comment ?? "", updatedAt: new Date().toISOString() }
      : { id: `spp${timestamp}`, pollId: input.pollId, memberName: input.memberName, comment: input.comment ?? "", updatedAt: new Date().toISOString() };
    const responseRows = Object.entries(input.statuses).map(([optionId, status], index) => {
      const existing = scheduleResponseList.find((response) => response.pollId === input.pollId && response.optionId === optionId && response.participantId === participant.id);
      return existing
        ? { ...existing, status, updatedAt: new Date().toISOString() }
        : { id: `spr${timestamp}-${index}`, pollId: input.pollId, optionId, participantId: participant.id, status, updatedAt: new Date().toISOString() };
    });
    setScheduleParticipantList((current) => {
      const next = current.some((row) => row.id === participant.id)
        ? current.map((row) => (row.id === participant.id ? participant : row))
        : [...current, participant];
      return next.sort((a, b) => a.memberName.localeCompare(b.memberName, "ja"));
    });
    setScheduleResponseList((current) => {
      let next = [...current];
      responseRows.forEach((response) => {
        next = next.some((row) => row.id === response.id)
          ? next.map((row) => (row.id === response.id ? response : row))
          : [...next, response];
      });
      return next;
    });
    showToast("回答を保存しました。");
    if (onlineReady) {
      const beforeParticipant = existingParticipant ?? null;
      (async () => {
        await upsertSupabaseRow(supabaseConfig, actorName, "schedule_poll_participants", schedulePollParticipantToRow(supabaseConfig, participant, actorName), beforeParticipant, participant);
        await Promise.all(
          responseRows.map((response) => {
            const before = scheduleResponseList.find((row) => row.id === response.id) ?? null;
            return upsertSupabaseRow(supabaseConfig, actorName, "schedule_poll_responses", schedulePollResponseToRow(supabaseConfig, response, actorName), before, response);
          }),
        );
      })()
        .then(() => setOnlineStatus("稽古日調整の回答をオンラインへ保存しました。"))
        .catch(reportOnlineError);
    }
  }

  function closeSchedulePoll(pollId) {
    if (!guardOnlineWrite()) return;
    const before = schedulePollList.find((poll) => poll.id === pollId);
    if (!before) return;
    const next = { ...before, isClosed: true, updatedAt: new Date().toISOString() };
    setSchedulePollList((current) => current.map((poll) => (poll.id === pollId ? next : poll)));
    showToast("回答受付を終了しました。");
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "schedule_polls", schedulePollToRow(supabaseConfig, next, actorName), before, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  function updateSchedulePoll(input) {
    if (!guardOnlineWrite()) return;
    const before = schedulePollList.find((poll) => poll.id === input.id);
    if (!before) return;
    if (!input.title?.trim()) {
      alert("タイトルを入力してください。");
      return;
    }
    const next = {
      ...before,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      updatedAt: new Date().toISOString(),
    };
    setSchedulePollList((current) => current.map((poll) => (poll.id === input.id ? next : poll)));
    showToast("投票内容を更新しました。");
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "schedule_polls", schedulePollToRow(supabaseConfig, next, actorName), before, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  async function deleteSchedulePoll(pollId) {
    if (!guardOnlineWrite()) return;
    const poll = schedulePollList.find((item) => item.id === pollId);
    if (!poll) return;
    const confirmation = prompt("この投票を削除します。候補日・回答も削除されます。削除する場合は「削除」と入力してください。");
    if (confirmation !== "削除") return;
    const relatedOptions = scheduleOptionList.filter((option) => option.pollId === pollId);
    const relatedParticipants = scheduleParticipantList.filter((participant) => participant.pollId === pollId);
    const relatedResponses = scheduleResponseList.filter((response) => response.pollId === pollId);
    if (onlineReady) {
      try {
        const client = getSupabaseClient(supabaseConfig);
        if (client) {
          await logEdit(client, supabaseConfig, actorName, "schedule_polls", pollId, "delete", {
            poll,
            options: relatedOptions,
            participants: relatedParticipants,
            responses: relatedResponses,
          }, null);
          const { error } = await client.from("schedule_polls").delete().eq("room_id", supabaseConfig.roomId).eq("id", pollId);
          if (error) throw error;
        }
      } catch (error) {
        reportOnlineError(error);
        return;
      }
    }
    setSchedulePollList((current) => current.filter((item) => item.id !== pollId));
    setScheduleOptionList((current) => current.filter((option) => option.pollId !== pollId));
    setScheduleParticipantList((current) => current.filter((participant) => participant.pollId !== pollId));
    setScheduleResponseList((current) => current.filter((response) => response.pollId !== pollId));
    showToast("投票を削除しました。");
  }

  function addScheduleOption(pollId, input) {
    if (!guardOnlineWrite()) return;
    const next: SchedulePollOption = {
      id: `spo${Date.now()}`,
      pollId,
      candidateDate: input.candidateDate,
      startTime: input.startTime,
      endTime: input.endTime,
      memo: input.memo ?? "",
      updatedAt: new Date().toISOString(),
    };
    setScheduleOptionList((current) => [...current, next].sort((a, b) => `${a.candidateDate}${a.startTime}`.localeCompare(`${b.candidateDate}${b.startTime}`)));
    showToast("候補日を追加しました。");
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "schedule_poll_options", schedulePollOptionToRow(supabaseConfig, next, actorName), null, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  function updateScheduleOption(input) {
    if (!guardOnlineWrite()) return;
    const before = scheduleOptionList.find((option) => option.id === input.id);
    if (!before) return;
    const next = { ...before, ...input, updatedAt: new Date().toISOString() };
    setScheduleOptionList((current) => current.map((option) => (option.id === input.id ? next : option)).sort((a, b) => `${a.candidateDate}${a.startTime}`.localeCompare(`${b.candidateDate}${b.startTime}`)));
    showToast("候補日を更新しました。");
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "schedule_poll_options", schedulePollOptionToRow(supabaseConfig, next, actorName), before, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  async function deleteScheduleOption(optionId) {
    if (!guardOnlineWrite()) return;
    if (!confirm("この候補日を削除しますか？")) return;
    const before = scheduleOptionList.find((option) => option.id === optionId);
    if (!before) return;
    if (onlineReady) {
      try {
        const client = getSupabaseClient(supabaseConfig);
        if (client) {
          await logEdit(client, supabaseConfig, actorName, "schedule_poll_options", optionId, "delete", before, null);
          const { error } = await client.from("schedule_poll_options").delete().eq("room_id", supabaseConfig.roomId).eq("id", optionId);
          if (error) throw error;
        }
      } catch (error) {
        reportOnlineError(error);
        return;
      }
    }
    setScheduleOptionList((current) => current.filter((option) => option.id !== optionId));
    setScheduleResponseList((current) => current.filter((response) => response.optionId !== optionId));
    showToast("候補日を削除しました。");
  }

  function confirmScheduleOption(pollId, optionId) {
    if (!guardOnlineWrite()) return;
    const poll = schedulePollList.find((item) => item.id === pollId);
    const option = scheduleOptionList.find((item) => item.id === optionId);
    if (!poll || !option) return;
    const nextRehearsal: Rehearsal = {
      id: `r-schedule-${option.id}`,
      date: option.candidateDate,
      startTime: option.startTime,
      endTime: option.endTime,
      place: "",
      memo: option.memo || poll.title,
      eventType: "稽古日",
      rehearsalTeam: "共通",
      selectedSceneIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const beforePoll = poll;
    const nextPoll = { ...poll, isClosed: true, confirmedOptionId: optionId, updatedAt: new Date().toISOString() };
    const existingRehearsal = rehearsalList.find((rehearsal) => rehearsal.id === nextRehearsal.id);
    setRehearsalList((current) => {
      const next = existingRehearsal
        ? current.map((rehearsal) => (rehearsal.id === nextRehearsal.id ? { ...rehearsal, ...nextRehearsal } : rehearsal))
        : [...current, nextRehearsal];
      return next.sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
    });
    setSchedulePollList((current) => current.map((item) => (item.id === pollId ? nextPoll : item)));
    setSelectedRehearsalId(nextRehearsal.id);
    showToast("稽古日として確定しました。");
    if (onlineReady) {
      Promise.all([
        upsertSupabaseRow(supabaseConfig, actorName, "rehearsals", rehearsalToRow(supabaseConfig, nextRehearsal, actorName), existingRehearsal ?? null, nextRehearsal),
        upsertSupabaseRow(supabaseConfig, actorName, "schedule_polls", schedulePollToRow(supabaseConfig, nextPoll, actorName), beforePoll, nextPoll),
      ])
        .then(() => setOnlineStatus("確定した稽古日をオンラインへ保存しました。"))
        .catch(reportOnlineError);
    }
  }

  function confirmScheduleOptions(pollId, optionIds) {
    if (!guardOnlineWrite()) return;
    const poll = schedulePollList.find((item) => item.id === pollId);
    const selectedOptions = scheduleOptionList.filter((item) => item.pollId === pollId && optionIds.includes(item.id));
    if (!poll || selectedOptions.length === 0) return;
    if (!confirm(`選択した${selectedOptions.length}件を稽古日に追加します。よろしいですか？`)) return;
    const now = new Date().toISOString();
    const nextRehearsals: Rehearsal[] = selectedOptions.map((option) => ({
      id: `r-schedule-${option.id}`,
      date: option.candidateDate,
      startTime: option.startTime,
      endTime: option.endTime,
      place: "",
      memo: option.memo || poll.title,
      eventType: "稽古日",
      rehearsalTeam: "共通",
      selectedSceneIds: [],
      createdAt: now,
      updatedAt: now,
    }));
    const beforePoll = poll;
    const nextPoll = { ...poll, isClosed: true, confirmedOptionId: optionIds.join(","), updatedAt: now };
    const existingById = new Map(rehearsalList.map((rehearsal) => [rehearsal.id, rehearsal]));
    setRehearsalList((current) => {
      const nextMap = new Map(current.map((rehearsal) => [rehearsal.id, rehearsal]));
      nextRehearsals.forEach((rehearsal) => {
        nextMap.set(rehearsal.id, { ...(nextMap.get(rehearsal.id) ?? {}), ...rehearsal });
      });
      return Array.from(nextMap.values()).sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
    });
    setSchedulePollList((current) => current.map((item) => (item.id === pollId ? nextPoll : item)));
    setSelectedRehearsalId(nextRehearsals[0].id);
    showToast(`${nextRehearsals.length}件を稽古日として確定しました。`);
    if (onlineReady) {
      Promise.all([
        ...nextRehearsals.map((rehearsal) => upsertSupabaseRow(supabaseConfig, actorName, "rehearsals", rehearsalToRow(supabaseConfig, rehearsal, actorName), existingById.get(rehearsal.id) ?? null, rehearsal)),
        upsertSupabaseRow(supabaseConfig, actorName, "schedule_polls", schedulePollToRow(supabaseConfig, nextPoll, actorName), beforePoll, nextPoll),
      ])
        .then(() => setOnlineStatus("選択した稽古日をオンラインへ保存しました。"))
        .catch(reportOnlineError);
    }
  }

  return (
    <main className="shell">
      <header className="appHeader">
        <div className="fruit" aria-hidden="true">
          <img src="./assets/pomegranate-clean.png" alt="" />
        </div>
        <div className="headerTitle">
          <p className="eyebrow">10月公演 スケジュール管理</p>
          <h1>ザクロ連絡帳</h1>
          <img className="titleLine" src="./assets/title-line-v2-cropped.png" alt="" />
        </div>
        <div className="cutlery" aria-hidden="true">
          <img src="./assets/sword-cropped.png" alt="" />
        </div>
      </header>
      <nav className="tabs" aria-label="画面切り替え">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
            <Icon className="tabLucideIcon" aria-hidden="true" strokeWidth={2.2} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <TeamSwitch value={teamFilter} onChange={setTeamFilter} />
      <div className="statusCards">
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
      </div>
      {toast && <div className={`toastNotice ${toast.tone}`} role="status">{toast.message}</div>}
      {tab === "dashboard" && <Dashboard rehearsalId={selectedRehearsalId} rehearsals={rehearsalList} setRehearsalId={setSelectedRehearsalId} attendances={attendances} visibleMembers={visibleMembers} scenes={sceneList} teamFilter={teamFilter} />}
      {tab === "form" && <AttendanceForm members={memberList} rehearsals={rehearsalList} attendances={attendances} defaultRehearsalId={selectedRehearsalId} onSave={saveAttendance} onSaveBatch={saveAttendanceBatch} />}
      {tab === "schedule" && (
        <ScheduleAdjustmentPage
          polls={schedulePollList}
          options={scheduleOptionList}
          participants={scheduleParticipantList}
          responses={scheduleResponseList}
          members={memberList}
          onCreatePoll={createSchedulePoll}
          onSaveAnswer={saveScheduleAnswer}
          onClosePoll={closeSchedulePoll}
          onUpdatePoll={updateSchedulePoll}
          onDeletePoll={deleteSchedulePoll}
          onConfirmOption={confirmScheduleOption}
          onConfirmOptions={confirmScheduleOptions}
          onAddOption={addScheduleOption}
          onUpdateOption={updateScheduleOption}
          onDeleteOption={deleteScheduleOption}
        />
      )}
      {tab === "admin" && (
        <AdminView
          rehearsals={rehearsalList}
          rehearsalId={selectedRehearsalId}
          setRehearsalId={setSelectedRehearsalId}
          grouped={grouped}
          sceneResults={sceneResults}
          attendances={attendances}
          members={visibleMembers}
          allMembers={memberList}
          allRehearsals={rehearsalList}
          scenes={sceneList}
        />
      )}
      {tab === "scenes" && (
        <ScenePage
          rehearsals={rehearsalList}
          rehearsalId={selectedRehearsalId}
          attendances={attendances}
          visibleMembers={visibleMembers}
          scenes={sceneList}
          allMembers={memberList}
          onAdd={addScene}
          onUpdate={updateScene}
          onDelete={deleteScene}
          onUpdateRehearsal={updateRehearsal}
          onAddMember={addMember}
          onUpdateMember={updateMember}
          onDeleteMember={deleteMember}
          setSelectedRehearsalId={setSelectedRehearsalId}
          onAddRehearsal={addRehearsal}
          onUpdateRehearsalItem={updateRehearsal}
          onDeleteRehearsal={deleteRehearsal}
          allowDelete={!onlineReady}
        />
      )}
    </main>
  );
}

function ScheduleAdjustmentPage({ polls, options, participants, responses, members, onCreatePoll, onSaveAnswer, onClosePoll, onUpdatePoll, onDeletePoll, onConfirmOption, onConfirmOptions, onAddOption, onUpdateOption, onDeleteOption }) {
  const [view, setView] = useState("open");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const shownPolls = polls
    .filter((poll) => (view === "open" ? !poll.isClosed : poll.isClosed))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return (
    <section className="schedulePage">
      <div className="panel scheduleHero">
        <h2 className="panelTitle"><span>◇</span>稽古日調整</h2>
        <p>みんなの予定を集めて稽古日を決めましょう</p>
      </div>
      <div className="scheduleTabs" role="tablist" aria-label="稽古日調整の表示切り替え">
        <button className={view === "open" ? "active" : ""} onClick={() => setView("open")}>募集中</button>
        <button className={view === "closed" ? "active" : ""} onClick={() => setView("closed")}>終了</button>
      </div>
      <div className="schedulePollList">
        {shownPolls.length ? shownPolls.map((poll) => (
          <SchedulePollCard
            key={poll.id}
            poll={poll}
            options={options.filter((option) => option.pollId === poll.id)}
            participants={participants.filter((participant) => participant.pollId === poll.id)}
            responses={responses.filter((response) => response.pollId === poll.id)}
            members={members}
            adminUnlocked={adminUnlocked}
            onSaveAnswer={onSaveAnswer}
            onClosePoll={onClosePoll}
            onUpdatePoll={onUpdatePoll}
            onDeletePoll={onDeletePoll}
            onConfirmOption={onConfirmOption}
            onConfirmOptions={onConfirmOptions}
            onAddOption={onAddOption}
            onUpdateOption={onUpdateOption}
            onDeleteOption={onDeleteOption}
          />
        )) : (
          <section className="panel emptyPanel">
            <p>{view === "open" ? "募集中の稽古日調整はありません。" : "終了した稽古日調整はありません。"}</p>
          </section>
        )}
      </div>
      <section className="panel scheduleAdminPanel">
        <div className="scheduleAdminHeader">
          <h2 className="panelTitle"><span>★</span>管理者用</h2>
          <button type="button" onClick={() => setShowAdminPanel((current) => !current)}>
            {showAdminPanel ? "閉じる" : "投票を作成・管理する"}
          </button>
        </div>
        {showAdminPanel && (!adminUnlocked ? (
          <form
            className="scheduleAdminUnlock"
            onSubmit={(event) => {
              event.preventDefault();
              const value = new FormData(event.currentTarget).get("adminPassword");
              if (value === "つらこ") setAdminUnlocked(true);
            }}
          >
            <label>
              <span>パスワードを入力してください。</span>
              <input name="adminPassword" type="text" autoComplete="off" inputMode="text" />
            </label>
            <button className="primary">管理者機能を開く</button>
          </form>
        ) : (
          <SchedulePollCreator onCreatePoll={onCreatePoll} />
        ))}
      </section>
    </section>
  );
}

function ScheduleCandidateCalendar({ month, selectedDates, onMonthChange, onToggleDate }) {
  const today = new Date().toLocaleDateString("sv-SE");
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const leadingBlankCount = firstDay.getDay();
  const previousMonthDays = new Date(year, monthNumber - 1, 0).getDate();
  const cellCount = Math.ceil((leadingBlankCount + daysInMonth) / 7) * 7;
  const calendarCells = Array.from({ length: cellCount }, (_, index) => {
    const dayOffset = index - leadingBlankCount + 1;
    const cellDate = new Date(year, monthNumber - 1, dayOffset);
    const date = cellDate.toLocaleDateString("sv-SE");
    const inCurrentMonth = cellDate.getMonth() === monthNumber - 1;
    const day = dayOffset < 1 ? previousMonthDays + dayOffset : dayOffset > daysInMonth ? dayOffset - daysInMonth : dayOffset;
    return { key: date, date, day, inCurrentMonth };
  });

  function shiftMonth(diff) {
    const next = new Date(year, monthNumber - 1 + diff, 1);
    onMonthChange(next.toLocaleDateString("sv-SE").slice(0, 7));
  }

  return (
    <div className="scheduleCandidateCalendar">
      <div className="scheduleCalendarHeader">
        <button type="button" aria-label="前の月へ" onClick={() => shiftMonth(-1)}>‹</button>
        <strong>{year}年{String(monthNumber).padStart(2, "0")}月</strong>
        <button type="button" aria-label="次の月へ" onClick={() => shiftMonth(1)}>›</button>
      </div>
      <div className="scheduleCalendarWeekdays" aria-hidden="true">
        {["日", "月", "火", "水", "木", "金", "土"].map((weekday) => <span key={weekday}>{weekday}</span>)}
      </div>
      <div className="scheduleCalendarGrid">
        {calendarCells.map((cell) => (
          <button
            key={cell.key}
            type="button"
            className={`${selectedDates.includes(cell.date) ? "selected" : ""} ${cell.date === today ? "today" : ""} ${cell.inCurrentMonth ? "" : "otherMonth"}`}
            onClick={() => onToggleDate(cell.date)}
          >
            <span>{cell.day}</span>
            {cell.date === today && <small>今日</small>}
          </button>
        ))}
      </div>
      <div className="scheduleCalendarLegend" aria-label="カレンダーの凡例">
        <span><i className="selectedDot"></i>選択中</span>
        <span><i className="todayDot"></i>今日</span>
        <span><i className="otherDot"></i>他の月</span>
      </div>
    </div>
  );
}

function SchedulePollCreator({ onCreatePoll }) {
  const today = new Date().toLocaleDateString("sv-SE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(today.slice(0, 7));
  const [selectedDates, setSelectedDates] = useState([]);
  const [startTime, setStartTime] = useState("22:00");
  const [endTime, setEndTime] = useState("00:00");
  const [memo, setMemo] = useState("");
  const [formError, setFormError] = useState("");

  function toggleCandidateDate(date) {
    setFormError("");
    setSelectedDates((current) =>
      current.includes(date)
        ? current.filter((item) => item !== date)
        : [...current, date].sort((a, b) => a.localeCompare(b)),
    );
  }

  function submit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setFormError("タイトルを入力してください。");
      return;
    }
    if (!selectedDates.length) {
      setFormError("候補日をカレンダーから1日以上選択してください。");
      return;
    }
    const options = selectedDates.map((candidateDate) => ({ candidateDate, startTime, endTime, memo }));
    onCreatePoll({ title: title.trim(), description: description.trim(), options });
    setTitle("");
    setDescription("");
    setMemo("");
    setSelectedDates([]);
    setFormError("");
  }

  return (
    <form className="scheduleCreator" onSubmit={submit}>
      <div className="scheduleCreatorIntro">
        <h3><span>★</span>管理者用</h3>
        <p>新しい稽古日調整の投票を作成します</p>
      </div>

      <div className="scheduleCreatorFields">
        <label>
          <span>タイトル</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：7月稽古日程調整" />
        </label>
        <label>
          <span>説明文（任意）</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="例：7月の稽古日程をみんなで決めましょう！" />
        </label>
      </div>

      <div className="scheduleCandidateBlock">
        <div className="scheduleCreatorLabel">
          <strong>候補日を選択</strong>
          <span>複数選択できます</span>
        </div>
        <div className="scheduleCandidateLayout">
          <ScheduleCandidateCalendar
            month={calendarMonth}
            selectedDates={selectedDates}
            onMonthChange={setCalendarMonth}
            onToggleDate={toggleCandidateDate}
          />
          <aside className="selectedCandidatePanel">
            <div className="selectedCandidateHeader">
              <strong>選択中の候補日</strong>
              <span>{selectedDates.length}日</span>
            </div>
            {selectedDates.length ? (
              <div className="selectedCandidateList">
                {selectedDates.map((date) => (
                  <div key={date} className="selectedCandidateItem">
                    <span>{formatDateWithWeekday(date).replaceAll("-", "/")}</span>
                    <button type="button" className="removeCandidateButton" aria-label={`${date}を候補日から外す`} onClick={() => toggleCandidateDate(date)}>
                      <img src="/assets/remove-candidate-icon.png" alt="" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="selectedCandidateEmpty">カレンダーの日付をタップしてください。</p>
            )}
            <p className="selectedCandidateHint">日付をタップすると選択・解除できます</p>
          </aside>
        </div>
      </div>

      <section className="scheduleCommonSettings">
        <div className="scheduleCommonTitle">
          <strong>共通設定</strong>
          <span>すべての候補日に共通で適用されます</span>
        </div>
        <div className="scheduleCommonGrid">
          <label>
            <span>開始時間</span>
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          </label>
          <label>
            <span>終了時間</span>
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </label>
          <label>
            <span>メモ（任意）</span>
            <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="オンライン稽古" />
          </label>
        </div>
        <p>💡 選択したすべての日付に、上記の時間とメモが設定されます。</p>
      </section>

      {formError && <p className="formError">{formError}</p>}
      <button className="primary scheduleCreateButton">✨ 投票を作成する</button>
      {!selectedDates.length && <p className="scheduleCreateNote">候補日を1つ以上選択してください</p>}
    </form>
  );
}

function SchedulePollCard({ poll, options, participants, responses, members, adminUnlocked, onSaveAnswer, onClosePoll, onUpdatePoll, onDeletePoll, onConfirmOption, onConfirmOptions, onAddOption, onUpdateOption, onDeleteOption }) {
  const [memberName, setMemberName] = useState(members[0]?.name ?? "");
  const [comment, setComment] = useState("");
  const [draft, setDraft] = useState({});
  const [pollDraft, setPollDraft] = useState({ title: poll.title, description: poll.description ?? "" });
  const [activeVoteTab, setActiveVoteTab] = useState("answer");
  const [showDetailTable, setShowDetailTable] = useState(false);
  const [selectedConfirmOptionIds, setSelectedConfirmOptionIds] = useState([]);
  const optionStats = getScheduleOptionStats(options, participants, responses);
  const existingAnswer = participants.find((participant) => participant.memberName === memberName);
  const responseMap = new Map(responses.map((response) => [`${response.participantId}:${response.optionId}`, response]));
  const answeredMemberNames = new Set(participants.map((participant) => participant.memberName.trim()));
  const unansweredMembers = members.filter((member) => !answeredMemberNames.has(member.name.trim()));

  useEffect(() => {
    setPollDraft({ title: poll.title, description: poll.description ?? "" });
  }, [poll.id, poll.title, poll.description]);

  useEffect(() => {
    setSelectedConfirmOptionIds((current) => current.filter((optionId) => options.some((option) => option.id === optionId)));
  }, [poll.id, options.length]);

  useEffect(() => {
    const existing = participants.find((participant) => participant.memberName === memberName);
    setComment(existing?.comment ?? "");
    const nextDraft = {};
    if (existing) {
      options.forEach((option) => {
        const response = responses.find((row) => row.participantId === existing.id && row.optionId === option.id);
        if (response) nextDraft[option.id] = response.status;
      });
    }
    setDraft(nextDraft);
  }, [memberName, poll.id, participants.length, responses.length, options.length]);

  function submitAnswer(event) {
    event.preventDefault();
    if (!memberName.trim()) {
      alert("名前を入力してください。");
      return;
    }
    onSaveAnswer({ pollId: poll.id, memberName: memberName.trim(), comment: comment.trim(), statuses: draft });
  }

  function toggleConfirmOption(optionId) {
    setSelectedConfirmOptionIds((current) => (
      current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
    ));
  }

  function submitConfirmOptions() {
    if (!selectedConfirmOptionIds.length) {
      alert("稽古日に確定する候補日を選択してください。");
      return;
    }
    onConfirmOptions(poll.id, selectedConfirmOptionIds);
    setSelectedConfirmOptionIds([]);
  }

  return (
    <article className={`schedulePollCardSimple ${poll.isClosed ? "closed" : ""}`}>
      <section className="pollIntroCard">
        <div className="pollIntroIcon" aria-hidden="true">
          <img src="./assets/schedule-poll-book-icon.png" alt="" />
        </div>
        <div className="pollIntroText">
          <h2>{poll.title}</h2>
          {poll.description && <p>{poll.description}</p>}
        </div>
        {poll.isClosed && <span className="closedBadge">終了</span>}
      </section>

      {adminUnlocked && (
        <section className="schedulePollEditBox">
          <label>
            <span>投票タイトル</span>
            <input value={pollDraft.title} onChange={(event) => setPollDraft((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label>
            <span>説明文</span>
            <textarea value={pollDraft.description} onChange={(event) => setPollDraft((current) => ({ ...current, description: event.target.value }))} placeholder="任意" />
          </label>
          <div className="schedulePollEditActions">
            <button type="button" className="primary" onClick={() => onUpdatePoll({ id: poll.id, ...pollDraft })}>投票内容を保存</button>
            <button type="button" className="dangerButton" onClick={() => onDeletePoll(poll.id)}>投票を削除</button>
          </div>
        </section>
      )}

      {!poll.isClosed && (
        <section className="voterNameCard">
          <label>
            <span>投票者のお名前 <em>必須</em></span>
            <select value={memberName} onChange={(event) => setMemberName(event.target.value)}>
              {members.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}
            </select>
          </label>
          {existingAnswer && <p className="scheduleAnswerHint">この名前は回答済みです。内容を変更して保存すると、前回の回答が更新されます。</p>}
        </section>
      )}

      <section className="pollTabsCard">
        <div className="pollViewTabs" role="tablist" aria-label="投票画面の切り替え">
          <button type="button" className={activeVoteTab === "answer" ? "active" : ""} onClick={() => setActiveVoteTab("answer")}>回答する</button>
          <button type="button" className={activeVoteTab === "summary" ? "active" : ""} onClick={() => setActiveVoteTab("summary")}>みんなの回答状況</button>
        </div>

        {activeVoteTab === "answer" ? (
          poll.isClosed ? (
            <p className="closedPollMessage">この投票は回答受付を終了しています。回答状況のみ確認できます。</p>
          ) : (
            <form className="simpleVoteForm" onSubmit={submitAnswer}>
              <div className="simpleVoteIntro">
                <h3>あなたの回答</h3>
                <p>各日程について、あなたの参加可否を選択してください。</p>
              </div>
              <div className="simpleVoteRows">
                {options.map((option) => (
                  <div key={option.id} className="simpleVoteRow">
                    <div className="simpleVoteDate">
                      <strong>{formatChipDate(option.candidateDate)}</strong>
                      <span>{formatTime(option.startTime)}〜{formatTime(option.endTime)}</span>
                      {option.memo && <small>{option.memo}</small>}
                    </div>
                    <div className="simpleVoteButtons">
                      <button type="button" className={draft[option.id] === "yes" ? "active yes" : ""} onClick={() => setDraft((current) => ({ ...current, [option.id]: "yes" }))}>
                        <strong>○</strong><span>参加できる</span>
                      </button>
                      <button type="button" className={draft[option.id] === "maybe" ? "active maybe" : ""} onClick={() => setDraft((current) => ({ ...current, [option.id]: "maybe" }))}>
                        <strong>△</strong><span>未定・要相談</span>
                      </button>
                      <button type="button" className={draft[option.id] === "no" ? "active no" : ""} onClick={() => setDraft((current) => ({ ...current, [option.id]: "no" }))}>
                        <strong>×</strong><span>参加できない</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <label className="commentBox">
                <span>コメント（任意）</span>
                <textarea maxLength={100} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="例：22時以降なら可能です / この日は少し遅れるかもしれません など" />
                <small>{comment.length} / 100</small>
              </label>
              <button className="primary simpleSaveButton">回答を保存する</button>
              <p className="saveCaption">回答はいつでも変更できます</p>
            </form>
          )
        ) : (
          <div className="simpleSummary">
            <h3>みんなの回答状況</h3>
            <p className="unansweredSummary">
              ※未回答者 {unansweredMembers.length}人
              {unansweredMembers.length > 0 && `（${unansweredMembers.map((member) => member.name).join("、")}）`}
            </p>
            <div className="summaryCards">
              {optionStats.map((item) => (
                <div key={item.option.id} className="summaryCard">
                  <strong>{formatChipDate(item.option.candidateDate)}</strong>
                  <span>{formatTime(item.option.startTime)}〜{formatTime(item.option.endTime)}</span>
                  {item.option.memo && <small>{item.option.memo}</small>}
                  <div className="summaryCounts">
                    <span className="yes">○ {item.yes}人</span>
                    <span className="maybe">△ {item.maybe}人</span>
                    <span className="no">× {item.no}人</span>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="detailToggleButton" onClick={() => setShowDetailTable((current) => !current)}>
              {showDetailTable ? "詳細一覧を閉じる" : "詳細一覧を見る"}
            </button>
            {showDetailTable && (
              <div className="scheduleTableWrap">
                <table className="scheduleTable">
                  <thead>
                    <tr>
                      <th>メンバー</th>
                      {options.map((option) => <th key={option.id}>{formatChipDate(option.candidateDate)}<br /><small>{formatTime(option.startTime)}-{formatTime(option.endTime)}</small></th>)}
                      <th>コメント</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant) => (
                      <tr key={participant.id}>
                        <th>{participant.memberName}</th>
                        {options.map((option) => {
                          const status = responseMap.get(`${participant.id}:${option.id}`)?.status;
                          return <td key={option.id} className={status === "yes" ? "yesCell" : status === "no" ? "noCell" : status === "maybe" ? "maybeCell" : ""}>{status === "yes" ? "○" : status === "no" ? "×" : status === "maybe" ? "△" : "-"}</td>;
                        })}
                        <td>{participant.comment || "-"}</td>
                      </tr>
                    ))}
                    <tr className="summaryRow">
                      <th>集計</th>
                      {optionStats.map((item) => <td key={item.option.id}>○ {item.yes}</td>)}
                      <td>-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {adminUnlocked && (
        <div className="scheduleAdminActions">
          {!poll.isClosed && <button type="button" onClick={() => onClosePoll(poll.id)}>回答受付終了</button>}
          <div className="scheduleConfirmOptions">
            <p>稽古日に確定する候補日を選択してください。</p>
            <div className="scheduleConfirmOptionList">
              {options.map((option) => (
                <label key={option.id} className={selectedConfirmOptionIds.includes(option.id) ? "selected" : ""}>
                  <input
                    type="checkbox"
                    checked={selectedConfirmOptionIds.includes(option.id)}
                    onChange={() => toggleConfirmOption(option.id)}
                  />
                  <span>{formatChipDate(option.candidateDate)}</span>
                  <small>{formatTime(option.startTime)}-{formatTime(option.endTime)}</small>
                </label>
              ))}
            </div>
            <button type="button" className="primary" onClick={submitConfirmOptions}>
              選択した日を稽古日に確定
            </button>
          </div>
        </div>
      )}
      {adminUnlocked && (
        <ScheduleOptionManager
          pollId={poll.id}
          options={options}
          onAddOption={onAddOption}
          onUpdateOption={onUpdateOption}
          onDeleteOption={onDeleteOption}
        />
      )}
    </article>
  );
}

function LegacySchedulePollCard({ poll, options, participants, responses, members, adminUnlocked, onSaveAnswer, onClosePoll, onUpdatePoll, onDeletePoll, onConfirmOption, onAddOption, onUpdateOption, onDeleteOption }) {
  const [memberName, setMemberName] = useState(members[0]?.name ?? "");
  const [comment, setComment] = useState("");
  const [draft, setDraft] = useState({});
  const [pollDraft, setPollDraft] = useState({ title: poll.title, description: poll.description ?? "" });
  const optionStats = getScheduleOptionStats(options, participants, responses);
  const ranking = [...optionStats].sort((a, b) => b.yes - a.yes || a.option.candidateDate.localeCompare(b.option.candidateDate));
  const best = ranking[0];
  const existingAnswer = participants.find((participant) => participant.memberName === memberName);
  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const responseMap = new Map(responses.map((response) => [`${response.participantId}:${response.optionId}`, response]));

  useEffect(() => {
    setPollDraft({ title: poll.title, description: poll.description ?? "" });
  }, [poll.id, poll.title, poll.description]);

  useEffect(() => {
    const existing = participants.find((participant) => participant.memberName === memberName);
    setComment(existing?.comment ?? "");
    const nextDraft = {};
    if (existing) {
      options.forEach((option) => {
        const response = responses.find((row) => row.participantId === existing.id && row.optionId === option.id);
        if (response) nextDraft[option.id] = response.status;
      });
    }
    setDraft(nextDraft);
  }, [memberName, poll.id, participants.length, responses.length, options.length]);

  function submitAnswer(event) {
    event.preventDefault();
    if (!memberName.trim()) {
      alert("名前を選んでください。");
      return;
    }
    onSaveAnswer({ pollId: poll.id, memberName: memberName.trim(), comment: comment.trim(), statuses: draft });
  }

  return (
    <article className={`panel schedulePollCard ${poll.isClosed ? "closed" : ""}`}>
      <div className="schedulePollHeader">
        <div>
          <h2>{poll.title}</h2>
          {poll.description && <p>{poll.description}</p>}
        </div>
        {poll.isClosed && <span className="closedBadge">終了</span>}
      </div>
      {adminUnlocked && (
        <div className="schedulePollEditBox">
          <label>
            <span>投票タイトル</span>
            <input value={pollDraft.title} onChange={(event) => setPollDraft((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label>
            <span>説明文</span>
            <textarea value={pollDraft.description} onChange={(event) => setPollDraft((current) => ({ ...current, description: event.target.value }))} placeholder="任意" />
          </label>
          <div className="schedulePollEditActions">
            <button type="button" className="primary" onClick={() => onUpdatePoll({ id: poll.id, ...pollDraft })}>投票内容を保存</button>
            <button type="button" className="dangerButton" onClick={() => onDeletePoll(poll.id)}>投票を削除</button>
          </div>
        </div>
      )}
      {best && (
        <div className="bestSchedule">
          <strong>最も参加可能人数が多い日</strong>
          <span>{formatDateWithWeekday(best.option.candidateDate)}（{participants.length}人中{best.yes}人参加可能）</span>
        </div>
      )}
      <div className="scheduleRanking">
        {ranking.map((item, index) => (
          <span key={item.option.id} className={index === 0 ? "top" : ""}>
            {["🥇", "🥈", "🥉"][index] ?? `${index + 1}.`} {formatChipDate(item.option.candidateDate)}（{item.yes}人）
          </span>
        ))}
      </div>
      {!poll.isClosed && (
        <form className="scheduleAnswerForm" onSubmit={submitAnswer}>
          <label>
            <span>お名前</span>
            <select value={memberName} onChange={(event) => setMemberName(event.target.value)}>
              {members.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}
            </select>
          </label>
          {existingAnswer && <p className="scheduleAnswerHint">この名前は回答済みです。内容を変更して保存すると、前回の回答が更新されます。</p>}
          <div className="scheduleAnswerOptions">
            {options.map((option) => (
              <div key={option.id} className="scheduleAnswerOption">
                <p>{formatDateWithWeekday(option.candidateDate)}<br /><small>{formatTime(option.startTime)}-{formatTime(option.endTime)}</small></p>
                {option.memo && <small>{option.memo}</small>}
                <div className="yesNoButtons">
                  <button type="button" className={draft[option.id] === "yes" ? "active yes" : ""} onClick={() => setDraft((current) => ({ ...current, [option.id]: "yes" }))}>○</button>
                  <button type="button" className={draft[option.id] === "no" ? "active no" : ""} onClick={() => setDraft((current) => ({ ...current, [option.id]: "no" }))}>×</button>
                </div>
              </div>
            ))}
          </div>
          <label>
            <span>コメント</span>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="例：22時以降なら可能です" />
          </label>
          <button className="primary">回答を保存</button>
        </form>
      )}
      <div className="scheduleTableWrap">
        <table className="scheduleTable">
          <thead>
            <tr>
              <th>メンバー</th>
              {options.map((option) => <th key={option.id}>{formatChipDate(option.candidateDate)}<br /><small>{formatTime(option.startTime)}-{formatTime(option.endTime)}</small></th>)}
              <th>コメント</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr key={participant.id}>
                <th>{participant.memberName}</th>
                {options.map((option) => {
                  const status = responseMap.get(`${participant.id}:${option.id}`)?.status;
                  return <td key={option.id} className={status === "yes" ? "yesCell" : status === "no" ? "noCell" : ""}>{status === "yes" ? "○" : status === "no" ? "×" : "-"}</td>;
                })}
                <td>{participant.comment || "-"}</td>
              </tr>
            ))}
            <tr className="summaryRow">
              <th>集計</th>
              {optionStats.map((item) => <td key={item.option.id}>{item.yes}</td>)}
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="scheduleStatsGrid">
        {optionStats.map((item) => (
          <div key={item.option.id} className={best?.option.id === item.option.id ? "best" : ""}>
            <strong>{formatDateWithWeekday(item.option.candidateDate)}</strong>
            <span>○ {item.yes} / × {item.no}</span>
          </div>
        ))}
      </div>
      {adminUnlocked && (
        <div className="scheduleAdminActions">
          {!poll.isClosed && <button type="button" onClick={() => onClosePoll(poll.id)}>回答受付終了</button>}
          {options.map((option) => (
            <button key={option.id} type="button" className="primary" onClick={() => onConfirmOption(poll.id, option.id)}>
              {formatChipDate(option.candidateDate)}を稽古日に確定
            </button>
          ))}
        </div>
      )}
      {adminUnlocked && (
        <ScheduleOptionManager
          pollId={poll.id}
          options={options}
          onAddOption={onAddOption}
          onUpdateOption={onUpdateOption}
          onDeleteOption={onDeleteOption}
        />
      )}
    </article>
  );
}

function ScheduleOptionManager({ pollId, options, onAddOption, onUpdateOption, onDeleteOption }) {
  const today = new Date().toLocaleDateString("sv-SE");
  const [newOption, setNewOption] = useState({ candidateDate: today, startTime: "22:00", endTime: "00:00", memo: "" });
  const [editing, setEditing] = useState({});

  useEffect(() => {
    const next = {};
    options.forEach((option) => {
      next[option.id] = { ...option };
    });
    setEditing(next);
  }, [options.length]);

  return (
    <div className="scheduleOptionManager">
      <h3>候補日の管理</h3>
      <p className="scheduleOptionSectionLabel">現在、登録されている日</p>
      <div className="scheduleOptionRows">
        {options.map((option) => {
          const draft = editing[option.id] ?? option;
          return (
            <div key={option.id} className="scheduleOptionRow">
              <input type="date" value={draft.candidateDate} onChange={(event) => setEditing((current) => ({ ...current, [option.id]: { ...draft, candidateDate: event.target.value } }))} />
              <input type="time" value={draft.startTime} onChange={(event) => setEditing((current) => ({ ...current, [option.id]: { ...draft, startTime: event.target.value } }))} />
              <input type="time" value={draft.endTime} onChange={(event) => setEditing((current) => ({ ...current, [option.id]: { ...draft, endTime: event.target.value } }))} />
              <input value={draft.memo ?? ""} onChange={(event) => setEditing((current) => ({ ...current, [option.id]: { ...draft, memo: event.target.value } }))} placeholder="メモ" />
              <button type="button" onClick={() => onUpdateOption(draft)}>保存</button>
              <button type="button" className="dangerButton" onClick={() => onDeleteOption(option.id)}>削除</button>
            </div>
          );
        })}
      </div>
      <p className="scheduleOptionSectionLabel">日付追加</p>
      <div className="scheduleOptionRow add">
        <input type="date" value={newOption.candidateDate} onChange={(event) => setNewOption((current) => ({ ...current, candidateDate: event.target.value }))} />
        <input type="time" value={newOption.startTime} onChange={(event) => setNewOption((current) => ({ ...current, startTime: event.target.value }))} />
        <input type="time" value={newOption.endTime} onChange={(event) => setNewOption((current) => ({ ...current, endTime: event.target.value }))} />
        <input value={newOption.memo} onChange={(event) => setNewOption((current) => ({ ...current, memo: event.target.value }))} placeholder="メモ" />
        <button type="button" onClick={() => onAddOption(pollId, newOption)}>候補日を追加</button>
      </div>
    </div>
  );
}

function getScheduleOptionStats(options, participants, responses) {
  return options.map((option) => {
    const optionResponses = responses.filter((response) => response.optionId === option.id);
    return {
      option,
      yes: optionResponses.filter((response) => response.status === "yes").length,
      no: optionResponses.filter((response) => response.status === "no").length,
      maybe: participants.length - optionResponses.filter((response) => response.status === "yes").length - optionResponses.filter((response) => response.status === "no").length,
      total: participants.length,
    };
  });
}

function SyncGuardNotice({ configured, onlineReady, onlineStatus, realtimeStatus }) {
  const tone = configured && onlineReady ? "ok" : "warn";
  const title = !configured ? "ローカル確認中" : onlineReady ? "オンライン保存中" : "オンライン接続を確認中";
  const message = !configured
    ? "この画面はローカル確認用です。公開版ではSupabaseに保存されます。"
    : onlineReady
      ? "入力内容は他の端末にも反映されています。"
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
        {onlineReady && configured && <p>{statusText}</p>}
        <p>{message}</p>
      </div>
      {(!onlineReady || !configured) && <span>{statusText}</span>}
    </section>
  );
}

function NotificationGuide({ members, roomId, memberId, onMemberChange }) {
  const [status, setStatus] = useState("最初だけ下のボタンから、通知を許可してね♡");
  const [isSettingNotification, setIsSettingNotification] = useState(false);
  const [notificationMemberId, setNotificationMemberId] = useState(() => localStorage.getItem(notificationSettingKey) ?? "");
  const [isExpanded, setIsExpanded] = useState(() => !localStorage.getItem(notificationSettingKey));
  const selectedMemberId = memberId || members[0]?.id || "";
  const savedNotificationMember = members.find((member) => member.id === notificationMemberId);
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
      localStorage.setItem(notificationSettingKey, selectedMemberId);
      setNotificationMemberId(selectedMemberId);
      setIsExpanded(false);
    } catch (error) {
      console.error(error);
      setStatus(error?.message || "通知設定に失敗しました。公開版URLで開いているか、Vercelの通知設定を確認してください。");
    } finally {
      setIsSettingNotification(false);
    }
  }

  if (!isExpanded && savedNotificationMember) {
    return (
      <section className="notificationGuide compact">
        <div>
          <strong>♥稽古前お知らせ機能♥</strong>
          <p>通知設定済み：{savedNotificationMember.name}</p>
        </div>
        <button
          type="button"
          className="ghostButton"
          onClick={() => {
            onMemberChange(notificationMemberId);
            setIsExpanded(true);
          }}
        >
          変更する
        </button>
      </section>
    );
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

function scrollToRef(ref) {
  setTimeout(() => {
    const element = ref.current;
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 18;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, 120);
}

function RehearsalPicker({ rehearsals, value, onChange }) {
  const chipRefs = useRef(new Map());
  const chipListRef = useRef(null);
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const selectedChip = chipRefs.current.get(value);
    const chipList = chipListRef.current;
    if (!selectedChip || !chipList) return;

    const targetLeft = selectedChip.offsetLeft - (chipList.clientWidth - selectedChip.clientWidth) / 2;
    chipList.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
  }, [value]);

  return (
    <div className="rehearsalPicker" role="group" aria-label="表示する稽古日の変更">
      <p className="rehearsalPickerHelp">他の日を見る</p>
      <div className="rehearsalChipList" ref={chipListRef}>
        {rehearsals.map((rehearsal) => {
          const selected = rehearsal.id === value;
          return (
            <button
              key={rehearsal.id}
              type="button"
              className={`rehearsalDateChip ${selected ? "selected" : ""}`}
              aria-pressed={selected}
              ref={(element) => {
                if (element) chipRefs.current.set(rehearsal.id, element);
                else chipRefs.current.delete(rehearsal.id);
              }}
              onClick={() => onChange(rehearsal.id)}
            >
              <span>{formatChipDate(rehearsal.date)}</span>
              <small>{formatTime(rehearsal.startTime)}</small>
            </button>
          );
        })}
      </div>
    </div>
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

function getRehearsalEndDateTime(rehearsal) {
  const start = new Date(`${rehearsal.date}T${formatTime(rehearsal.startTime) || "00:00"}:00`);
  const end = new Date(`${rehearsal.date}T${formatTime(rehearsal.endTime) || "23:59"}:00`);
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
    end.setDate(end.getDate() + 1);
  }
  return end;
}

function isRehearsalStillSelectable(rehearsal) {
  const end = getRehearsalEndDateTime(rehearsal);
  if (Number.isNaN(end.getTime())) {
    const today = new Date().toLocaleDateString("sv-SE");
    return rehearsal.date >= today;
  }
  return end > new Date();
}

function formatJapaneseDate(date) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTicketDate(date) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  const weekday = parsed.toLocaleDateString("ja-JP", { weekday: "short" });
  return `${date} (${weekday})`;
}

function formatDateWithWeekday(date) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  const weekday = parsed.toLocaleDateString("ja-JP", { weekday: "short" });
  return `${date}（${weekday}）`;
}

function formatChipDate(date) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  const weekday = parsed.toLocaleDateString("ja-JP", { weekday: "short" });
  return `${parsed.getMonth() + 1}/${parsed.getDate()}（${weekday}）`;
}

function isTodayDate(date) {
  return date === new Date().toLocaleDateString("sv-SE");
}

const ticketSymbols = ["♤", "❤︎", "♧", "♦︎"];

function getNextRehearsal(rehearsals) {
  const today = new Date().toLocaleDateString("sv-SE");
  const rehearsalOnly = rehearsals.filter((rehearsal) => rehearsal.eventType !== "MTG・打ち合わせ");
  return rehearsalOnly
    .filter((rehearsal) => rehearsal.date >= today)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))[0] ?? rehearsalOnly[0];
}

function getNextMeeting(rehearsals) {
  const today = new Date().toLocaleDateString("sv-SE");
  return rehearsals
    .filter((rehearsal) => rehearsal.eventType === "MTG・打ち合わせ" && rehearsal.date >= today)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))[0];
}

function formatShortDateWithWeekday(date) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  const weekday = parsed.toLocaleDateString("ja-JP", { weekday: "short" });
  return `${parsed.getMonth() + 1}/${parsed.getDate()}(${weekday})`;
}

function getDaysUntil(date) {
  const today = new Date(new Date().toLocaleDateString("sv-SE"));
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return "";
  const days = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  if (days <= 0) return "本日";
  return `あと${days}日`;
}

function getSceneCounts(sceneId, rehearsals) {
  return rehearsals.reduce(
    (counts, rehearsal) => {
      const selectionMap = getSceneSelectionMap(rehearsal);
      const inCommon = selectionMap.common.has(sceneId);
      const inTeamA = selectionMap.team_a.has(sceneId);
      const inTeamB = selectionMap.team_b.has(sceneId);
      if (!inCommon && !inTeamA && !inTeamB) return counts;
      counts.total += 1;
      if (inCommon || inTeamA) counts.a += 1;
      if (inCommon || inTeamB) counts.b += 1;
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
        <h2 className="panelTitle"><span><img className="calendarTitleIcon" src="./assets/calendar-cute-icon.png" alt="" /></span>カレンダー</h2>
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
          const isToday = day.date === new Date().toLocaleDateString("sv-SE");
          return (
            <button
              key={day.date}
              className={`calendarDay ${events.length ? "hasEvent" : ""} ${hasMtg ? "hasMtg" : ""} ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
              onClick={() => events[0] && onSelect(events[0].id)}
              disabled={!events.length}
              title={events.map((event) => `${formatTime(event.startTime)} ${event.eventType ?? "稽古日"}`).join("\n")}
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

function Dashboard({ rehearsalId, rehearsals, setRehearsalId, attendances, visibleMembers, scenes, teamFilter }) {
  const rehearsal = rehearsals.find((item) => item.id === rehearsalId) ?? rehearsals[0];
  const nextRehearsal = getNextRehearsal(rehearsals);
  const nextMeeting = getNextMeeting(rehearsals);
  const isNextRehearsalToday = nextRehearsal ? isTodayDate(nextRehearsal.date) : false;
  const ticketSymbol = useMemo(() => ticketSymbols[Math.floor(Math.random() * ticketSymbols.length)], []);
  const grouped = groupAttendance(rehearsalId, attendances, visibleMembers);
  const attendancePersonRow = (row, prefix = "") => ({
    key: `${prefix}${row.member.id}-${row.attendance.status}`,
    label: `${prefix}${formatAttendanceLine(row)}`,
    role: row.member.role,
    team: row.member.team,
  });
  const memberPersonRow = (member) => ({ key: member.id, label: member.name, role: member.role, team: member.team });
  const absenceRows = [
    ...grouped.absent.map((row) => attendancePersonRow(row)),
    ...grouped.late.map((row) => attendancePersonRow(row, "遅刻：")),
  ];
  const attendanceRows = [...grouped.present, ...grouped.late, ...grouped.early].map((row) => attendancePersonRow(row));
  const isMeetingDay = rehearsal?.eventType === "MTG・打ち合わせ";
  if (!rehearsal) return <section className="panel emptyState">稽古日を追加してください。</section>;
  return (
    <section className="stack">
      {nextRehearsal && (
        <section className="panel nextRehearsalCard">
          <span className="ticketRibbon">NEXT</span>
          <div className="ticketInner">
            {isNextRehearsalToday ? (
              <p className="ticketTodayHeading">次回稽古日：<span>本日❣</span></p>
            ) : (
              <>
                <p>次回稽古日</p>
                <h2><span>{ticketSymbol}</span>{formatTicketDate(nextRehearsal.date)}</h2>
              </>
            )}
            <strong className="ticketTime">{formatTime(nextRehearsal.startTime)}-{formatTime(nextRehearsal.endTime)}</strong>
            {nextRehearsal.memo && <small className="ticketMemo">{nextRehearsal.memo}</small>}
          </div>
        </section>
      )}
      {nextMeeting && (
        <section className="nextMeetingCard" aria-label="次回ミーティングのお知らせ">
          <div className="nextMeetingIntro">
            <span aria-hidden="true">📢</span>
            <strong>次回ミーティングのお知らせ</strong>
          </div>
          <div className="nextMeetingMeta">
            <span><b aria-hidden="true">📢</b>制作MTG</span>
            <span><b aria-hidden="true">📅</b>{formatShortDateWithWeekday(nextMeeting.date)}</span>
            <span><b aria-hidden="true">🕒</b>{formatTime(nextMeeting.startTime)}-{formatTime(nextMeeting.endTime)}</span>
          </div>
          <em>{getDaysUntil(nextMeeting.date)}</em>
        </section>
      )}
      <div className="dashboardDateSwitch">
        <div className="dateSwitchSide">
          <DashboardCalendar rehearsals={rehearsals} selectedRehearsalId={rehearsalId} onSelect={setRehearsalId} />
          <RehearsalPicker rehearsals={rehearsals} value={rehearsalId} onChange={setRehearsalId} />
          <section className="panel highlight currentRehearsalCard currentRehearsalHero">
            <span className="currentHeroIcon"><img src="./assets/current-rehearsal-calendar.png" alt="" /></span>
            <div>
              <h2>現在表示している稽古日</h2>
              <div className="currentInfoMeta">
                <span className="currentInfoDay">{formatDateWithWeekday(rehearsal.date)}</span>
                <span className="currentInfoTime">{formatTime(rehearsal.startTime)}-{formatTime(rehearsal.endTime)}</span>
              </div>
            </div>
            {rehearsal.memo && <p>{rehearsal.memo}</p>}
          </section>
        </div>
        <section className="selectedDayInfoList">
          <h2 className="panelTitle"><span>✦</span>{formatDateWithWeekday(rehearsal.date)}の情報一覧</h2>
          <ContactNotesPanel grouped={grouped} />
          <TodayScenesPanel rehearsal={rehearsal} scenes={scenes} teamFilter={teamFilter} />
          {absenceRows.length > 0 && <PeoplePanel title="欠席・遅刻" rows={absenceRows} tone="warn" />}
          <div className="grid two">
            <PeoplePanel
              key={`attendance-${rehearsal.id}`}
              title="参加予定"
              rows={attendanceRows}
              collapsible
              initialCollapsed={attendanceRows.length > 4}
              collapsedMessage={(grouped.absent.length || grouped.noReply.length) ? ",,,1,2,,,いっぱい！" : "なんと全員大集合❣"}
            />
            <PeoplePanel
              key={`no-reply-${rehearsal.id}`}
              title="まだ回答していない人"
              rows={grouped.noReply.map(memberPersonRow)}
              tone="warn"
              collapsible={isMeetingDay}
              initialCollapsed={isMeetingDay}
            />
          </div>
          <AttendanceRatePanel members={visibleMembers} attendances={attendances} rehearsals={rehearsals} />
        </section>
      </div>
    </section>
  );
}

function RehearsalList({ rehearsals, selectedRehearsalId, setSelectedRehearsalId, attendances, visibleMembers, onAdd, onUpdate, onDelete, allowDelete, openAdmin }) {
  const [editingRehearsal, setEditingRehearsal] = useState(null);
  const editorRef = useRef(null);
  const scrollToEditor = () => scrollToRef(editorRef);
  return (
    <section className="stack">
      <div ref={editorRef} className="scrollAnchor">
        <RehearsalEditor
          rehearsals={rehearsals}
          editingRehearsal={editingRehearsal}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onCancelEdit={() => setEditingRehearsal(null)}
        />
      </div>
      {rehearsals.map((rehearsal) => {
        const summary = summarizeRehearsal(rehearsal.id, attendances, visibleMembers);
        return (
          <article key={rehearsal.id} className={`panel rehearsalCard ${selectedRehearsalId === rehearsal.id ? "selected" : ""}`}>
            <div>
              <p className="eyebrow">{rehearsal.eventType ?? "稽古日"}</p>
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
              <button className="editButton" onClick={() => { setSelectedRehearsalId(rehearsal.id); setEditingRehearsal(rehearsal); scrollToEditor(); }}>編集</button>
              {allowDelete && <button className="dangerButton" onClick={() => onDelete(rehearsal.id)}>削除</button>}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function DateMultiPicker({ selectedDates, onChange, single = false, scheduledDates = [] }) {
  const today = new Date();
  const defaultMonth = selectedDates[0]?.slice(0, 7) ?? today.toLocaleDateString("sv-SE").slice(0, 7);
  const [monthKey, setMonthKey] = useState(defaultMonth);
  const scheduledByDate = useMemo(() => {
    const grouped = new Map();
    scheduledDates.forEach((rehearsal) => {
      if (!grouped.has(rehearsal.date)) grouped.set(rehearsal.date, []);
      grouped.get(rehearsal.date).push(rehearsal);
    });
    return grouped;
  }, [scheduledDates]);
  const monthOptions = Array.from({ length: 8 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() + index, 1);
    return date.toLocaleDateString("sv-SE").slice(0, 7);
  });

  useEffect(() => {
    if (selectedDates[0]) setMonthKey(selectedDates[0].slice(0, 7));
  }, [selectedDates.join(",")]);

  const toggleDate = (date) => {
    if (single) {
      onChange([date]);
      return;
    }
    onChange(selectedDates.includes(date) ? selectedDates.filter((item) => item !== date) : [...selectedDates, date].sort());
  };

  return (
    <div className="dateMultiPicker">
      <div className="calendarMonthControls">
        <select value={monthKey} onChange={(event) => setMonthKey(event.target.value)} aria-label="日付を選ぶ月">
          {monthOptions.map((month) => <option key={month} value={month}>{month.replace("-", "年")}月</option>)}
        </select>
      </div>
      <div className="calendarWeekdays compact" aria-hidden="true">
        {["日", "月", "火", "水", "木", "金", "土"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendarGrid compact">
        {getCalendarDays(monthKey).map((day, index) => {
          if (!day) return <span key={`blank-${index}`} className="calendarDay blank"></span>;
          const selected = selectedDates.includes(day.date);
          const isToday = day.date === new Date().toLocaleDateString("sv-SE");
          const scheduled = scheduledByDate.get(day.date) ?? [];
          const hasScheduled = scheduled.length > 0;
          const hasMtg = scheduled.some((rehearsal) => rehearsal.eventType === "MTG・打ち合わせ");
          return (
            <button
              key={day.date}
              type="button"
              className={`calendarDay selectable ${selected ? "selected" : ""} ${isToday ? "today" : ""} ${hasScheduled ? "hasExistingSchedule" : ""} ${hasScheduled && hasMtg ? "hasExistingMtg" : ""} ${hasScheduled && !hasMtg ? "hasExistingRehearsal" : ""}`}
              title={scheduled.map((rehearsal) => `${rehearsal.eventType ?? "稽古日"} ${formatTime(rehearsal.startTime)}-${formatTime(rehearsal.endTime)}`).join("\n")}
              onClick={() => toggleDate(day.date)}
            >
              <span>{day.day}</span>
              {hasScheduled && <em className="calendarExistingMark" aria-label={hasMtg ? "登録済みのMTG・打ち合わせ" : "登録済みの稽古日"}></em>}
            </button>
          );
        })}
      </div>
      <div className="dateMultiLegend" aria-label="登録済み予定の凡例">
        <span><i className="existingRehearsalDot"></i>登録済みの稽古日</span>
        <span><i className="existingMtgDot"></i>登録済みのMTG・打ち合わせ</span>
      </div>
      {selectedDates.length > 0 && <p className="note">選択中：{selectedDates.join("、")}</p>}
    </div>
  );
}

function RehearsalEditor({ rehearsals = [], editingRehearsal, onAdd, onUpdate, onCancelEdit }) {
  const [date, setDate] = useState("");
  const [selectedDates, setSelectedDates] = useState([]);
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("22:00");
  const [place, setPlace] = useState("");
  const [memo, setMemo] = useState("");
  const [eventType, setEventType] = useState("稽古日");
  const [rehearsalTeam, setRehearsalTeam] = useState("共通");
  const isEditing = Boolean(editingRehearsal);

  useEffect(() => {
    if (!editingRehearsal) return;
    setDate(editingRehearsal.date ?? "");
    setSelectedDates(editingRehearsal.date ? [editingRehearsal.date] : []);
    setStartTime(formatTime(editingRehearsal.startTime) || "19:00");
    setEndTime(formatTime(editingRehearsal.endTime) || "22:00");
    setPlace(editingRehearsal.place ?? "");
    setMemo(editingRehearsal.memo ?? "");
    setEventType(editingRehearsal.eventType ?? "稽古日");
    setRehearsalTeam(editingRehearsal.rehearsalTeam ?? "共通");
  }, [editingRehearsal]);

  function resetForm() {
    setDate("");
    setSelectedDates([]);
    setStartTime("19:00");
    setEndTime("22:00");
    setPlace("");
    setMemo("");
    setEventType("稽古日");
    setRehearsalTeam("共通");
  }


  return (
    <form
      className="panel form"
      onSubmit={(event) => {
        event.preventDefault();
        const targetDates = [...(isEditing ? [date] : selectedDates)];
        if (!targetDates.length || !startTime || !endTime) {
          alert("日付・開始時間・終了時間を入力してください。");
          return;
        }
        const payload = { date: targetDates[0], startTime, endTime, place: place || editingRehearsal?.place || "場所未定", memo, eventType, rehearsalTeam, selectedSceneIds: editingRehearsal?.selectedSceneIds ?? [] };
        if (editingRehearsal) {
          onUpdate({ ...editingRehearsal, ...payload });
          onCancelEdit();
        } else {
          targetDates.forEach((targetDate) => onAdd({ ...payload, date: targetDate }));
        }
        resetForm();
      }}
    >
      <h2 className="panelTitle"><span>{isEditing ? "✎" : "＋"}</span>{isEditing ? "稽古日を編集" : "稽古日を追加"}</h2>
      <div className="grid rehearsalEditorTop">
        <label className="field datePickerField">カレンダーから日付を選んでください。<DateMultiPicker selectedDates={isEditing ? (date ? [date] : []) : selectedDates} onChange={(dates) => { setSelectedDates(dates); setDate(dates[0] ?? ""); }} single={isEditing} scheduledDates={rehearsals} /></label>
        <div className="rehearsalEditorSide">
          <label className="field">予定の種類<select value={eventType} onChange={(event) => setEventType(event.target.value)}>{eventTypeOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="field">開始<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
          <label className="field">終了<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
          <label className="field">対象チーム<select value={rehearsalTeam} onChange={(event) => setRehearsalTeam(event.target.value)}>{rehearsalTeamOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        </div>
      </div>
      <label className="field">メモ<input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="例：1場、2場中心" /></label>
      <div className="formActions">
        <button className="primary">{isEditing ? "変更を保存する" : "稽古日を追加する"}</button>
        {isEditing && <button type="button" onClick={() => { resetForm(); onCancelEdit(); }}>編集をやめる</button>}
      </div>
    </form>
  );
}

function AttendanceForm({ members, rehearsals, attendances, defaultRehearsalId, onSave, onSaveBatch }) {
  const [viewMode, setViewMode] = useState("input");
  const [mode, setMode] = useState("single");
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [statusMemberId, setStatusMemberId] = useState(members[0]?.id ?? "");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const upcomingRehearsals = rehearsals.filter(isRehearsalStillSelectable);
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
  const selectedMembers = mode === "bulk"
    ? members.filter((member) => selectedMemberIds.includes(member.id))
    : members.filter((member) => member.id === memberId);
  const statusMembers = members;
  const statusMember = statusMembers.find((member) => member.id === statusMemberId) ?? statusMembers[0];
  const getMemberAttendance = (targetMemberId, targetRehearsalId) =>
    attendances.find((attendance) => attendance.memberId === targetMemberId && attendance.rehearsalId === targetRehearsalId);
  const formatAttendanceStatus = (attendance) => {
    if (!attendance) return "未回答";
    const details = [];
    if (attendance.arrivalTime) details.push(`${formatTime(attendance.arrivalTime)}到着`);
    if (attendance.leaveTime) details.push(`${formatTime(attendance.leaveTime)}早退`);
    return [attendance.status, ...details].join(" ");
  };
  const statusClassName = (status) => {
    if (status === "出席") return "present";
    if (status === "欠席") return "absent";
    if (status === "遅刻") return "late";
    if (status === "早退") return "early";
    if (status === "未定") return "undecided";
    return "noReply";
  };

  useEffect(() => {
    if (!memberId && members[0]?.id) setMemberId(members[0].id);
  }, [members, memberId]);

  useEffect(() => {
    const selectableStatusIds = statusMembers.map((member) => member.id);
    if (!selectableStatusIds.includes(statusMemberId)) {
      setStatusMemberId(selectableStatusIds[0] ?? "");
    }
  }, [statusMembers, statusMemberId]);

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
    <section className="stack attendanceEntryPage">
      <div className="formModeSwitch attendancePageSwitch" aria-label="表示内容">
        <button type="button" className={viewMode === "input" ? "active" : ""} onClick={() => setViewMode("input")}>参加予定を入力</button>
        <button type="button" className={viewMode === "status" ? "active" : ""} onClick={() => setViewMode("status")}>入力状況を見る</button>
      </div>
      {viewMode === "input" && (
        <form
        className="panel form"
        onSubmit={(event) => {
          event.preventDefault();
          submitAttendance();
        }}
      >
      <h2>参加予定の入力</h2>
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
        <legend>{mode === "bulk" ? "稽古日" : "日時（複数選択できます）"}</legend>
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
              <span>{formatTicketDate(rehearsal.date)}</span>
              <em className={`eventTypePill ${getEventKind(rehearsal)}`}>{rehearsal.eventType ?? "稽古日"}</em>
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
      )}
      {viewMode === "status" && (
      <section className="panel attendanceStatusPanel" aria-label="選択したメンバーの入力状況">
        <div className="attendanceStatusHeader">
          <h3>選択したメンバーの入力状況</h3>
          <span>{statusMembers.length ? `${statusMembers.length}人` : "未選択"}</span>
        </div>
        <div className="attendanceStatusTabs" aria-label="表示するメンバー">
          {statusMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              className={`${statusMember?.id === member.id ? "active" : ""} ${memberColorClass(member.role, member.team)}`}
              onClick={() => setStatusMemberId(member.id)}
            >
              {member.name}
            </button>
          ))}
        </div>
        {!statusMember ? (
          <p className="note">名前を選ぶと、今日以降の稽古日に対する入力状況を確認できます。</p>
        ) : (
          <div className="attendanceStatusDetail">
            <p className={`personName ${memberColorClass(statusMember.role, statusMember.team)}`}>{statusMember.name}</p>
            <div className="attendanceStatusList">
              {upcomingRehearsals.map((rehearsal) => {
                const attendance = getMemberAttendance(statusMember.id, rehearsal.id);
                const label = formatAttendanceStatus(attendance);
                return (
                  <div key={rehearsal.id} className="attendanceStatusRow">
                    <span>
                      {formatTicketDate(rehearsal.date)}
                      <em className={`eventTypePill ${getEventKind(rehearsal)}`}>{rehearsal.eventType ?? "稽古日"}</em>
                      <small>{formatTime(rehearsal.startTime)}-{formatTime(rehearsal.endTime)}</small>
                    </span>
                    <strong className={`attendanceStatusChip ${statusClassName(attendance?.status ?? "未回答")}`}>{label}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
      )}
    </section>
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

  return <PeoplePanel title="連絡事項" rows={rows} tone={rows.length ? "warn" : undefined} />;
}

function getSelectedSceneTitles(rehearsal, scenes, teamFilter = "全員") {
  const selectedSceneIds = getEffectiveSceneIdsForTeam(rehearsal, teamFilter);
  if (!selectedSceneIds.length) return [];
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene.title]));
  return selectedSceneIds.map((id) => sceneById.get(id)).filter(Boolean);
}

function TodayScenesPanel({ rehearsal, scenes, teamFilter = "全員" }) {
  const titles = getSelectedSceneTitles(rehearsal, scenes, teamFilter);
  if (!titles.length) return null;
  const selectedSceneIds = getEffectiveSceneIdsForTeam(rehearsal, teamFilter);
  const allScenesSelected = scenes.length > 0 && scenes.every((scene) => selectedSceneIds.includes(scene.id));
  return (
    <section className="panel todayScenesPanel">
      <h2 className="panelTitle"><span><img className="panelTitleImageIcon sceneContentIcon" src="./assets/scene-checklist.png" alt="" /></span>稽古内容</h2>
      <p>{allScenesSelected ? "全シーン" : titles.map(sceneShortName).join("、")}</p>
    </section>
  );
}

function SceneSelectionEditor({ rehearsal, scenes, onUpdate }) {
  if (!rehearsal) return null;
  const [activeScope, setActiveScope] = useState("common");
  const activeScopeOption = sceneScopeOptions.find((option) => option.id === activeScope) ?? sceneScopeOptions[0];
  const selectionMap = getSceneSelectionMap(rehearsal);
  const selectedSceneIds = Array.from(selectionMap[activeScope]);
  const sortedScenes = sortSceneResults(scenes.map((scene) => ({ scene, canRehearse: true, missingCharacters: [] }))).map(({ scene }) => scene);
  const allSceneIds = sortedScenes.map((scene) => scene.id);
  const allSelected = allSceneIds.length > 0 && allSceneIds.every((sceneId) => selectedSceneIds.includes(sceneId));
  const saveSelectionMap = (nextMap) => {
    onUpdate({ ...rehearsal, selectedSceneIds: serializeSceneSelectionMap(nextMap) });
  };
  const toggleScene = (sceneId) => {
    const nextMap = getSceneSelectionMap(rehearsal);
    if (nextMap[activeScope].has(sceneId)) {
      nextMap[activeScope].delete(sceneId);
    } else {
      nextMap[activeScope].add(sceneId);
    }
    saveSelectionMap(nextMap);
  };
  const toggleAllScenes = () => {
    const nextMap = getSceneSelectionMap(rehearsal);
    if (allSelected) {
      allSceneIds.forEach((sceneId) => nextMap[activeScope].delete(sceneId));
    } else {
      allSceneIds.forEach((sceneId) => nextMap[activeScope].add(sceneId));
    }
    saveSelectionMap(nextMap);
  };
  const hasAnySceneSetting = sceneScopeOptions.some((option) => selectionMap[option.id].size > 0);

  return (
    <div className="adminSceneEditor">
      <div className="sceneScopeBlock">
        <span className="sceneScopeLabel">適用先</span>
        <div className="sceneScopeTabs" role="tablist" aria-label="シーンの適用先">
          {sceneScopeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`sceneScopeTab ${option.className} ${activeScope === option.id ? "active" : ""}`}
              onClick={() => setActiveScope(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className={`sceneScopeDescription ${activeScopeOption.className}`}>{activeScopeOption.description}</p>
      </div>

      <fieldset className="checkboxGroup adminSceneSelector">
        <legend>この日にやるシーン</legend>
        <label className="checkboxPill sceneSelectPill selectAllPill">
          <input type="checkbox" checked={allSelected} onChange={toggleAllScenes} />
          <span>全て選択する</span>
        </label>
        {sortedScenes.map((scene) => (
          <label key={scene.id} className="checkboxPill sceneSelectPill">
            <input type="checkbox" checked={selectedSceneIds.includes(scene.id)} onChange={() => toggleScene(scene.id)} />
            <span>{scene.title}</span>
          </label>
        ))}
      </fieldset>

      <div className="sceneScopeSummary">
        <strong>この日のシーン設定</strong>
        {hasAnySceneSetting ? (
          <div className="sceneScopeSummaryRows">
            {sceneScopeOptions.map((option) => {
              const titles = getSceneTitlesForScope(rehearsal, scenes, option.id);
              return (
                <p key={option.id} className={`sceneScopeSummaryRow ${option.className}`}>
                  <span>{sceneScopeLabels[option.id]}</span>
                  <b>{titles.length ? titles.map(sceneShortName).join("・") : "未設定"}</b>
                </p>
              );
            })}
          </div>
        ) : (
          <p className="sceneScopeEmpty">この日にできるシーンはありません</p>
        )}
      </div>
    </div>
  );
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

function NotionSyncPanel({ rehearsals, members, attendances, scenes }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("クリックするとアプリ内の最新情報をNotionの稽古カレンダーへ同期するよ！");

  async function syncNotion() {
    if (!rehearsals.length) {
      alert("同期する稽古日がありません。");
      return;
    }
    try {
      setIsSyncing(true);
      setSyncStatus("Notionへ同期中です...");
      const response = await fetch("/api/sync-notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rehearsals: buildNotionSyncRows(rehearsals, members, attendances, scenes) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || result?.error || "Notion同期に失敗しました。");
      setSyncStatus(`同期完了：${result.created ?? 0}件作成 / ${result.updated ?? 0}件更新`);
    } catch (error) {
      setSyncStatus(error?.message || "Notion同期に失敗しました。Vercelの環境変数とNotion設定を確認してください。");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <section className="panel exportPanel">
      <h2 className="panelTitle"><span>↗</span>Notion同期</h2>
      <div className="exportActions single">
        <button type="button" onClick={syncNotion} disabled={isSyncing}>
          {isSyncing ? "同期中..." : "Notionへ同期"}
        </button>
      </div>
      <p className="note">{syncStatus}</p>
    </section>
  );
}

function AdminView({ rehearsals, rehearsalId, setRehearsalId, grouped }) {
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
  const editorRef = useRef(null);
  const editingScene = sceneResults.find(({ scene }) => scene.id === editingId)?.scene;
  const editable = Boolean(onAdd && onUpdate && onDelete);
  const sortedSceneResults = sortSceneResults(sceneResults);
  const scrollToEditor = () => scrollToRef(editorRef);

  return (
    <section className="panel">
      <h2 className="panelTitle green"><span>★</span>シーンの編集・追加</h2>
      {editable && (
        <div ref={editorRef} className="scrollAnchor">
          <SceneEditor editingScene={editingScene} onAdd={onAdd} onUpdate={onUpdate} onCancel={() => setEditingId("")} />
        </div>
      )}
      <div className="sceneList">
        {sortedSceneResults.map(({ scene, canRehearse, missingCharacters }) => {
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
                <button onClick={() => { setEditingId(scene.id); scrollToEditor(); }}>編集</button>
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

function AdminLock({ children }) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  if (unlocked) return children;

  return (
    <section className="panel adminLock">
      <h2 className="panelTitle"><span>★</span>管理者ページ</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (password === "つらこ") {
            setUnlocked(true);
            return;
          }
          alert("パスワードが違います。");
        }}
      >
        <label className="field">
          パスワードを入力してください。
          <input value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button className="primary">管理者ページを開く</button>
      </form>
    </section>
  );
}

function SceneAvailabilityBrowser({ rehearsals, rehearsalId, attendances, visibleMembers, scenes, onAdd, onUpdate, onDelete, onUpdateRehearsal, allowDelete }) {
  const sceneRehearsals = useMemo(() => rehearsals.filter((rehearsal) => rehearsal.eventType !== "MTG・打ち合わせ"), [rehearsals]);
  const [selectedId, setSelectedId] = useState(
    sceneRehearsals.some((rehearsal) => rehearsal.id === rehearsalId) ? rehearsalId : sceneRehearsals[0]?.id || "",
  );
  const selected = sceneRehearsals.find((rehearsal) => rehearsal.id === selectedId) ?? sceneRehearsals[0];
  const monthOptions = useMemo(() => Array.from(new Set(sceneRehearsals.map((rehearsal) => rehearsal.date.slice(0, 7)))).sort(), [sceneRehearsals]);
  const [monthKey, setMonthKey] = useState(selected?.date.slice(0, 7) || monthOptions[0] || "");

  useEffect(() => {
    if (!sceneRehearsals.some((rehearsal) => rehearsal.id === selectedId)) {
      const nextRehearsal = (rehearsalId && sceneRehearsals.find((rehearsal) => rehearsal.id === rehearsalId)) || sceneRehearsals[0];
      setSelectedId(nextRehearsal?.id || "");
      setMonthKey(nextRehearsal?.date.slice(0, 7) || "");
      return;
    }
    const current = sceneRehearsals.find((rehearsal) => rehearsal.id === selectedId);
    if (current && (!monthKey || !monthOptions.includes(monthKey))) {
      setMonthKey(current.date.slice(0, 7));
    }
  }, [sceneRehearsals, rehearsalId, selectedId, monthKey, monthOptions]);

  const monthRehearsals = sceneRehearsals.filter((rehearsal) => rehearsal.date.startsWith(monthKey));
  const selectMonth = (nextMonth) => {
    setMonthKey(nextMonth);
    const current = sceneRehearsals.find((rehearsal) => rehearsal.id === selectedId);
    if (!current || !current.date.startsWith(nextMonth)) {
      const firstInMonth = sceneRehearsals.find((rehearsal) => rehearsal.date.startsWith(nextMonth));
      if (firstInMonth) setSelectedId(firstInMonth.id);
    }
  };
  const selectedResults = selected ? evaluateScenes(selected.id, attendances, visibleMembers, scenes) : [];
  const availableScenes = sortSceneResults(selectedResults).filter((result) => result.canRehearse);
  const summary = !selectedResults.length
    ? "登録済みのシーンがありません"
    : availableScenes.length === selectedResults.length
      ? "この日は全シーン可能"
      : availableScenes.length
        ? `この日にできるシーン：${availableScenes.map((result) => sceneShortName(result.scene.title)).join("、")}`
        : "この日にできるシーンはありません";

  return (
    <section className="stack">
      <section className="panel sceneDatePanel">
        <h2 className="panelTitle green"><span>★</span>稽古日ごとのシーン可否</h2>
        <div className="monthTabs" aria-label="表示する月">
          {monthOptions.map((month) => (
            <button
              key={month}
              type="button"
              className={monthKey === month ? "active" : ""}
              onClick={() => selectMonth(month)}
            >
              {month.replace("-", "年")}月
            </button>
          ))}
        </div>
        <div className="dateScroller" aria-label="シーン可否を確認する稽古日">
          {monthRehearsals.map((rehearsal) => (
            <button
              key={rehearsal.id}
              type="button"
              className={selected?.id === rehearsal.id ? "active" : ""}
              onClick={() => setSelectedId(rehearsal.id)}
            >
              <strong>{rehearsal.date}</strong>
              <span>{formatTime(rehearsal.startTime)}-{formatTime(rehearsal.endTime)}</span>
            </button>
          ))}
        </div>
        <p className={`sceneTodaySummary ${availableScenes.length ? "ok" : "ng"}`}>{summary}</p>
        <SceneSelectionEditor rehearsal={selected} scenes={scenes} onUpdate={onUpdateRehearsal} />
      </section>
      <ScenePanel
        sceneResults={selectedResults}
        rehearsals={rehearsals}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
        allowDelete={allowDelete}
      />
    </section>
  );
}

function ScenePage({
  rehearsals,
  rehearsalId,
  attendances,
  visibleMembers,
  scenes,
  allMembers,
  onAdd,
  onUpdate,
  onDelete,
  onUpdateRehearsal,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  setSelectedRehearsalId,
  onAddRehearsal,
  onUpdateRehearsalItem,
  onDeleteRehearsal,
  allowDelete,
}) {
  const [adminSection, setAdminSection] = useState("scene");
  return (
    <AdminLock>
      <section className="stack">
        <div className="adminSectionTabs" role="tablist" aria-label="管理者ページの表示切り替え">
          {[
            { id: "rehearsal", label: "稽古日の追加" },
            { id: "scene", label: "稽古日ごとのシーン可否" },
            { id: "member", label: "メンバーを追加" },
            { id: "export", label: "出力" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={adminSection === tab.id ? "active" : ""}
              onClick={() => setAdminSection(tab.id)}
              role="tab"
              aria-selected={adminSection === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {adminSection === "rehearsal" && (
          <RehearsalList
            rehearsals={rehearsals}
            selectedRehearsalId={rehearsalId}
            setSelectedRehearsalId={setSelectedRehearsalId}
            attendances={attendances}
            visibleMembers={visibleMembers}
            onAdd={onAddRehearsal}
            onUpdate={onUpdateRehearsalItem}
            onDelete={onDeleteRehearsal}
            allowDelete={true}
          />
        )}
        {adminSection === "scene" && (
          <SceneAvailabilityBrowser
            rehearsals={rehearsals}
            rehearsalId={rehearsalId}
            attendances={attendances}
            visibleMembers={visibleMembers}
            scenes={scenes}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onUpdateRehearsal={onUpdateRehearsal}
            allowDelete={allowDelete}
          />
        )}
        {adminSection === "member" && (
          <MemberView
            rehearsals={rehearsals}
            attendances={attendances}
            visibleMembers={visibleMembers}
            onAdd={onAddMember}
            onUpdate={onUpdateMember}
            onDelete={onDeleteMember}
            allowDelete={true}
          />
        )}
        {adminSection === "export" && (
          <section className="stack">
            <ExportTools rehearsals={rehearsals} members={allMembers} attendances={attendances} />
            <NotionSyncPanel rehearsals={rehearsals} members={allMembers} attendances={attendances} scenes={scenes} />
          </section>
        )}
      </section>
    </AdminLock>
  );
}

function teamClassName(team) {
  if (team === "Aチーム") return "teamA";
  if (team === "Bチーム") return "teamB";
  return "teamCommon";
}

function memberColorClass(role, team) {
  return role === "キャスト" ? teamClassName(team) : "staff";
}

function renderPeopleRow(row) {
  if (typeof row === "string") return row;
  return <span className={`personName ${memberColorClass(row.role, row.team)}`}>{row.label}</span>;
}

function panelTitleIcon(title, tone) {
  if (title === "連絡事項") {
    return <img className="panelTitleImageIcon noticeIcon" src="./assets/notice-megaphone.png" alt="" />;
  }
  if (title === "参加予定") {
    return <img className="panelTitleImageIcon attendanceIcon" src="./assets/attendance-people.png" alt="" />;
  }
  if (title === "まだ回答していない人") {
    return <img className="panelTitleImageIcon noReplyIcon" src="./assets/no-reply-icon.png" alt="" />;
  }
  if (title === "欠席・遅刻") {
    return <img className="panelTitleImageIcon absenceLateIcon" src="./assets/absence-late-icon.png" alt="" />;
  }
  return tone === "warn" ? "?" : "♙";
}

function PeoplePanel({ title, rows, tone, collapsible = false, initialCollapsed = false, collapsedMessage = "" }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  useEffect(() => {
    setCollapsed(initialCollapsed);
  }, [initialCollapsed, title]);
  return (
    <section className={`panel people ${tone ?? ""}`}>
      <div className="panelTitleRow">
        <h2 className="panelTitle"><span>{panelTitleIcon(title, tone)}</span>{title}</h2>
        {collapsible && (
          <button type="button" className="miniToggle" onClick={() => setCollapsed((current) => !current)}>
            {collapsed ? "開く" : "閉じる"}
          </button>
        )}
      </div>
      {collapsed && collapsedMessage && <p className="collapsedMessage">{collapsedMessage}</p>}
      {!collapsed && (rows.length ? <ul>{rows.map((row, index) => <li key={typeof row === "string" ? row : row.key ?? `${row.label}-${index}`}>{renderPeopleRow(row)}</li>)}</ul> : <p className="note">該当なし</p>)}
    </section>
  );
}

function AttendanceRatePanel({ members, attendances, rehearsals }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <section className="panel">
      <div className="panelTitleRow">
        <h2 className="panelTitle"><span><img className="panelTitleImageIcon attendanceRateIcon" src="./assets/attendance-rate-icon.png" alt="" /></span>出席状況</h2>
        <button type="button" className="miniToggle" onClick={() => setCollapsed((current) => !current)}>
          {collapsed ? "開く" : "閉じる"}
        </button>
      </div>
      {!collapsed && (
        <div className="rateList">
          {members.filter((member) => member.role === "キャスト").map((member) => (
            <div key={member.id} className="rateRow">
              <span className={`personName ${memberColorClass(member.role, member.team)}`}>{member.name}</span>
              <strong>{attendanceRate(member.id, attendances, rehearsals)}%</strong>
            </div>
          ))}
        </div>
      )}
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
  const editorRef = useRef(null);
  const editingMember = visibleMembers.find((member) => member.id === editingId);
  const memberClass = (member) => memberColorClass(member.role, member.team);
  const scrollToEditor = () => scrollToRef(editorRef);

  return (
    <section className="stack">
      <div ref={editorRef} className="scrollAnchor">
        <MemberEditor editingMember={editingMember} onAdd={onAdd} onUpdate={onUpdate} onCancel={() => setEditingId("")} />
      </div>
      {visibleMembers.map((member) => (
        <article key={member.id} className={`panel memberCard ${memberClass(member)}`}>
          <div>
            <h2>{member.name}</h2>
            <p><span className={`roleBadge ${memberClass(member)}`}>{member.role}</span> {member.team}{member.character ? ` / 役：${member.character}` : ""}</p>
            <p className="note">{member.memo}</p>
          </div>
          <div className="cardActions">
            <strong>{attendanceRate(member.id, attendances, rehearsals)}%</strong>
            <button className="editButton" onClick={() => { setEditingId(member.id); scrollToEditor(); }}>編集</button>
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
