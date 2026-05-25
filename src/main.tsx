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
  { id: "m1", name: "春野 いろは", role: "キャスト", character: "A", team: "Aチーム", memo: "ダブルキャストA" },
  { id: "m2", name: "森 つむぎ", role: "キャスト", character: "A", team: "Bチーム", memo: "ダブルキャストB" },
  { id: "m3", name: "佐倉 りん", role: "キャスト", character: "B", team: "Aチーム" },
  { id: "m4", name: "水野 こはる", role: "キャスト", character: "B", team: "Bチーム" },
  { id: "m5", name: "高瀬 凪", role: "キャスト", character: "C", team: "共通" },
  { id: "m6", name: "北川 灯", role: "キャスト", character: "D", team: "共通" },
  { id: "m7", name: "藤井 まこと", role: "演出", team: "共通" },
  { id: "m8", name: "桐谷 すず", role: "制作", team: "共通" },
];

const rehearsals: Rehearsal[] = [
  { id: "r1", date: "2026-06-06", startTime: "18:30", endTime: "21:30", place: "駅前スタジオA", memo: "顔合わせ、読み合わせ" },
  { id: "r2", date: "2026-06-10", startTime: "19:00", endTime: "22:00", place: "区民センター第2和室", memo: "1場、2場中心" },
  { id: "r3", date: "2026-06-14", startTime: "13:00", endTime: "17:00", place: "小劇場 稽古場", memo: "立ち稽古開始" },
  { id: "r4", date: "2026-06-18", startTime: "19:00", endTime: "22:00", place: "駅前スタジオB", memo: "Bチーム多め" },
  { id: "r5", date: "2026-06-21", startTime: "13:00", endTime: "18:00", place: "小劇場 稽古場", memo: "通しの前段取り確認" },
];

const scenes: Scene[] = [
  { id: "s1", title: "1場：夜のロビー", requiredCharacters: ["A", "B"], memo: "出会いの場面" },
  { id: "s2", title: "2場：古い楽屋", requiredCharacters: ["A", "C", "D"], memo: "小道具確認あり" },
  { id: "s3", title: "3場：終演後", requiredCharacters: ["B", "D"], memo: "感情の山場" },
  { id: "s4", title: "4場：カーテンコール前", requiredCharacters: ["A", "B", "C", "D"], memo: "全員場面" },
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

async function seedSupabaseState(config, actorName, state) {
  const client = getSupabaseClient(config);
  if (!client) throw new Error("Supabaseライブラリを読み込めませんでした。");
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
    return readStorage("keiko.members", members);
  });
  const [rehearsalList, setRehearsalList] = useState<Rehearsal[]>(() => {
    return readStorage("keiko.rehearsals", rehearsals);
  });
  const [sceneList, setSceneList] = useState<Scene[]>(() => {
    return readStorage("keiko.scenes", scenes);
  });
  const [attendances, setAttendances] = useState<Attendance[]>(() => readStorage("keiko.attendances", seedAttendances));
  const [supabaseConfig, setSupabaseConfig] = useState(() => getSupabaseConfig());
  const [actorName, setActorName] = useState(() => getActorName());
  const [onlineStatus, setOnlineStatus] = useState("未設定です。");
  const [onlineReady, setOnlineReady] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("未接続です。");
  const applyingRemoteRef = useRef(false);
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
    setMemberList(data.members);
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

  function reportOnlineError(error) {
    console.error(error);
    setOnlineStatus("オンライン保存でエラーが出ました。画面上の変更はこの端末には残っています。");
  }

  function addMember(input: Omit<Member, "id">) {
    const next = { ...input, id: `m${Date.now()}`, updatedBy: actorName, updatedAt: new Date().toISOString() };
    setMemberList((current) => [...current, next]);
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "members", memberToRow(supabaseConfig, next, actorName), null, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  function updateMember(input: Member) {
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
    const next = { ...input, id: `s${Date.now()}`, updatedBy: actorName, updatedAt: new Date().toISOString() };
    setSceneList((current) => [...current, next]);
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "scenes", sceneToRow(supabaseConfig, next, actorName), null, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  function updateScene(input: Scene) {
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
    if (!confirm("このシーンを削除しますか？")) return;
    setSceneList((current) => current.filter((scene) => scene.id !== sceneId));
  }

  function deleteMember(memberId: string) {
    if (!confirm("このメンバーを削除しますか？")) return;
    setMemberList((current) => current.filter((member) => member.id !== memberId));
    setAttendances((current) => current.filter((attendance) => attendance.memberId !== memberId));
  }

  function addRehearsal(input: Omit<Rehearsal, "id">) {
    const next = { ...input, id: `r${Date.now()}`, createdAt: new Date().toISOString(), updatedBy: actorName, updatedAt: new Date().toISOString() };
    setRehearsalList((current) => [...current, next].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)));
    setSelectedRehearsalId(next.id);
    if (onlineReady) {
      upsertSupabaseRow(supabaseConfig, actorName, "rehearsals", rehearsalToRow(supabaseConfig, next, actorName), null, next)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
  }

  function deleteRehearsal(rehearsalId: string) {
    if (!confirm("この稽古日を削除しますか？")) return;
    setRehearsalList((current) => current.filter((rehearsal) => rehearsal.id !== rehearsalId));
    setAttendances((current) => current.filter((attendance) => attendance.rehearsalId !== rehearsalId));
  }

  function saveAttendance(input: Omit<Attendance, "id">) {
    let savedRow;
    let beforeRow;
    setAttendances((current) => {
      const existing = current.find((row) => row.rehearsalId === input.rehearsalId && row.memberId === input.memberId);
      if (existing) {
        beforeRow = existing;
        savedRow = { ...existing, ...input, updatedBy: actorName, updatedAt: new Date().toISOString() };
        return current.map((row) => (row.id === existing.id ? savedRow : row));
      }
      savedRow = { id: `a${Date.now()}`, ...input, updatedBy: actorName, updatedAt: new Date().toISOString() };
      return [...current, savedRow];
    });
    if (onlineReady && savedRow) {
      upsertSupabaseRow(supabaseConfig, actorName, "attendances", attendanceToRow(supabaseConfig, savedRow, actorName), beforeRow, savedRow)
        .then((result) => setOnlineStatus(result.message))
        .catch(reportOnlineError);
    }
    setSelectedRehearsalId(input.rehearsalId);
    setTab("admin");
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
      <OnlineSyncPanel
        config={supabaseConfig}
        onChange={setSupabaseConfig}
        actorName={actorName}
        onActorNameChange={setActorName}
        onSave={saveInitialOnline}
        onLoad={loadOnline}
        status={onlineStatus}
        realtimeStatus={realtimeStatus}
      />
      {tab === "dashboard" && <Dashboard rehearsalId={selectedRehearsalId} rehearsals={rehearsalList} setRehearsalId={setSelectedRehearsalId} attendances={attendances} visibleMembers={visibleMembers} sceneResults={sceneResults} />}
      {tab === "rehearsals" && <RehearsalList rehearsals={rehearsalList} selectedRehearsalId={selectedRehearsalId} setSelectedRehearsalId={setSelectedRehearsalId} attendances={attendances} visibleMembers={visibleMembers} onAdd={addRehearsal} onDelete={deleteRehearsal} allowDelete={!onlineReady} openAdmin={() => setTab("admin")} />}
      {tab === "form" && <AttendanceForm members={memberList} rehearsals={rehearsalList} defaultRehearsalId={selectedRehearsalId} onSave={saveAttendance} />}
      {tab === "admin" && (
        <AdminView
          rehearsals={rehearsalList}
          rehearsalId={selectedRehearsalId}
          setRehearsalId={setSelectedRehearsalId}
          grouped={grouped}
          sceneResults={sceneResults}
          attendances={attendances}
          members={visibleMembers}
        />
      )}
      {tab === "members" && <MemberView rehearsals={rehearsalList} attendances={attendances} visibleMembers={visibleMembers} onAdd={addMember} onUpdate={updateMember} onDelete={deleteMember} allowDelete={!onlineReady} />}
      {tab === "scenes" && <ScenePage sceneResults={sceneResults} onAdd={addScene} onUpdate={updateScene} onDelete={deleteScene} allowDelete={!onlineReady} />}
    </main>
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

function OnlineSyncPanel({ config, onChange, actorName, onActorNameChange, onSave, onLoad, status, realtimeStatus }) {
  const [open, setOpen] = useState(false);
  const hasEnvConfig = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_DEFAULT_ROOM_ID);
  return (
    <section className="onlinePanel">
      <button className="onlineToggle" onClick={() => setOpen((value) => !value)}>
        オンライン同期
        <span>{status}</span>
      </button>
      {open && (
        <div className="onlineBody">
          <label className="field">
            入力者名
            <input value={actorName} onChange={(event) => onActorNameChange(event.target.value)} placeholder="例：香野 いろは" />
          </label>
          {!hasEnvConfig && (
            <>
              <div className="grid two">
                <label className="field">
                  Supabase URL
                  <input value={config.url} onChange={(event) => onChange({ ...config, url: event.target.value })} placeholder="https://xxxx.supabase.co" />
                </label>
                <label className="field">
                  anon public key
                  <input value={config.anonKey} onChange={(event) => onChange({ ...config, anonKey: event.target.value })} placeholder="eyJhbGci..." />
                </label>
              </div>
              <label className="field">
                部屋ID
                <input value={config.roomId} onChange={(event) => onChange({ ...config, roomId: event.target.value })} placeholder="zakuro-keiko" />
              </label>
            </>
          )}
          <div className="formActions">
            <button className="primary" onClick={onSave}>現在のデータをSupabaseへ送る</button>
            <button onClick={onLoad}>オンラインから読み込み</button>
          </div>
          <p className="note">読み込み後は、出欠登録や編集をした瞬間にSupabaseへ保存し、ほかの端末にもリアルタイムで反映します。</p>
          <p className="note">入力者名は「誰が変更したか」を履歴に残すために使います。</p>
          <p className="note">状態：{status}</p>
          <p className="note">リアルタイム：{realtimeStatus}</p>
        </div>
      )}
    </section>
  );
}

function RehearsalPicker({ rehearsals, value, onChange }) {
  return (
    <label className="field">
      稽古日
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {rehearsals.map((rehearsal) => <option key={rehearsal.id} value={rehearsal.id}>{rehearsal.date} {rehearsal.startTime}</option>)}
      </select>
    </label>
  );
}

function Dashboard({ rehearsalId, rehearsals, setRehearsalId, attendances, visibleMembers, sceneResults }) {
  const rehearsal = rehearsals.find((item) => item.id === rehearsalId) ?? rehearsals[0];
  const grouped = groupAttendance(rehearsalId, attendances, visibleMembers);
  if (!rehearsal) return <section className="panel emptyState">稽古日を追加してください。</section>;
  return (
    <section className="stack">
      <div className="panel highlight">
        <RehearsalPicker rehearsals={rehearsals} value={rehearsalId} onChange={setRehearsalId} />
        <h2 className="sparkTitle">次回稽古：{rehearsal.date}<span>✦</span></h2>
        <p>{rehearsal.startTime}-{rehearsal.endTime} / {rehearsal.place}</p>
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

function RehearsalList({ rehearsals, selectedRehearsalId, setSelectedRehearsalId, attendances, visibleMembers, onAdd, onDelete, allowDelete, openAdmin }) {
  return (
    <section className="stack">
      <RehearsalEditor onAdd={onAdd} />
      {rehearsals.map((rehearsal) => {
        const summary = summarizeRehearsal(rehearsal.id, attendances, visibleMembers);
        return (
          <article key={rehearsal.id} className={`panel rehearsalCard ${selectedRehearsalId === rehearsal.id ? "selected" : ""}`}>
            <div>
              <p className="eyebrow">{rehearsal.place}</p>
              <h2>{rehearsal.date}</h2>
              <p>{rehearsal.startTime}-{rehearsal.endTime}</p>
              <p className="note">{rehearsal.memo}</p>
            </div>
            <div className="chips">
              <span>出席 {summary.present}</span>
              <span>欠席 {summary.absent}</span>
              <span>未回答 {summary.noReply}</span>
            </div>
            <div className="cardActions">
              <button onClick={() => { setSelectedRehearsalId(rehearsal.id); openAdmin(); }}>確認する</button>
              {allowDelete && <button className="dangerButton" onClick={() => onDelete(rehearsal.id)}>削除</button>}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function RehearsalEditor({ onAdd }) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("22:00");
  const [place, setPlace] = useState("");
  const [memo, setMemo] = useState("");

  return (
    <form
      className="panel form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!date || !startTime || !endTime || !place) {
          alert("日付・開始時間・終了時間・場所を入力してください。");
          return;
        }
        onAdd({ date, startTime, endTime, place, memo });
        setDate("");
        setStartTime("19:00");
        setEndTime("22:00");
        setPlace("");
        setMemo("");
      }}
    >
      <h2 className="panelTitle"><span>＋</span>稽古日を追加</h2>
      <div className="grid two">
        <label className="field">日付<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label className="field">場所<input value={place} onChange={(event) => setPlace(event.target.value)} placeholder="例：駅前スタジオA" /></label>
      </div>
      <div className="grid two">
        <label className="field">開始<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
        <label className="field">終了<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
      </div>
      <label className="field">メモ<input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="例：1場、2場中心" /></label>
      <button className="primary">稽古日を追加する</button>
    </form>
  );
}

function AttendanceForm({ members, rehearsals, defaultRehearsalId, onSave }) {
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [rehearsalId, setRehearsalId] = useState(defaultRehearsalId);
  const [status, setStatus] = useState<AttendanceStatus>("出席");
  const [arrivalTime, setArrivalTime] = useState("");
  const [leaveTime, setLeaveTime] = useState("");
  const [note, setNote] = useState("");

  return (
    <form className="panel form" onSubmit={(event) => { event.preventDefault(); onSave({ memberId, rehearsalId, status, arrivalTime, leaveTime, note }); }}>
      <h2>出欠登録</h2>
      <label className="field">名前<select value={memberId} onChange={(event) => setMemberId(event.target.value)}>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
      <RehearsalPicker rehearsals={rehearsals} value={rehearsalId} onChange={setRehearsalId} />
      <label className="field">出欠ステータス<select value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
      <div className="grid two">
        <label className="field">到着予定時間<input type="time" value={arrivalTime} onChange={(event) => setArrivalTime(event.target.value)} /></label>
        <label className="field">早退予定時間<input type="time" value={leaveTime} onChange={(event) => setLeaveTime(event.target.value)} /></label>
      </div>
      <label className="field">理由・連絡事項<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="例：仕事後に向かいます" /></label>
      <button className="primary">登録する</button>
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
  rehearsalId,
  members,
  attendances,
}) {
  const rehearsal = rehearsals.find((item) => item.id === rehearsalId) ?? rehearsals[0];
  const selectedRows = rehearsal ? buildAttendanceRows([rehearsal], members, attendances) : [];
  const allRows = buildAttendanceRows(rehearsals, members, attendances);
  const months = getRehearsalMonths(rehearsals);

  return (
    <section className="panel exportPanel">
      <h2 className="panelTitle"><span>↓</span>CSV出力</h2>
      <div className="monthExportList">
        {months.map((month) => {
          const monthRehearsals = rehearsals.filter((item) => item.date.startsWith(month));
          const monthRows = buildAttendanceRows(monthRehearsals, members, attendances);
          return (
            <button key={month} className="monthExportButton" onClick={() => downloadCsv(`keiko_${month}.csv`, monthRows)}>
              {Number(month.slice(5, 7))}月分CSV
              <span>{monthRehearsals.length}回分</span>
            </button>
          );
        })}
      </div>
      <div className="exportActions">
        <button onClick={() => downloadCsv(`keiko_${rehearsal?.date ?? "selected"}.csv`, selectedRows)}>この稽古日のCSV</button>
        <button onClick={() => downloadCsv("keiko_all.csv", allRows)}>全稽古日のCSV</button>
      </div>
      <p className="note">月ごとのCSVは、各月の稽古日とメンバー全員分をまとめて出力します。</p>
    </section>
  );
}

function AdminView({ rehearsals, rehearsalId, setRehearsalId, grouped, sceneResults, attendances, members }) {
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
      <ScenePanel sceneResults={sceneResults} />
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
  const [requiredCharactersText, setRequiredCharactersText] = useState(editingScene?.requiredCharacters?.join(",") ?? "");
  const [memo, setMemo] = useState(editingScene?.memo ?? "");

  useEffect(() => {
    setTitle(editingScene?.title ?? "");
    setRequiredCharactersText(editingScene?.requiredCharacters?.join(",") ?? "");
    setMemo(editingScene?.memo ?? "");
  }, [editingScene]);

  return (
    <form
      className="sceneEditor"
      onSubmit={(event) => {
        event.preventDefault();
        const requiredCharacters = requiredCharactersText
          .split(/[、,]/)
          .map((item) => item.trim())
          .filter(Boolean);
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
          setRequiredCharactersText("");
          setMemo("");
        }
      }}
    >
      <h3>{editingScene ? "シーンを編集" : "シーンを追加"}</h3>
      <div className="grid two">
        <label className="field">シーン名<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：5場：ラスト" /></label>
        <label className="field">必要な役<input value={requiredCharactersText} onChange={(event) => setRequiredCharactersText(event.target.value)} placeholder="例：A,B,D" /></label>
      </div>
      <label className="field">メモ<input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="例：小道具確認あり" /></label>
      <div className="formActions">
        <button className="primary">{editingScene ? "変更を保存する" : "シーンを追加する"}</button>
        {editingScene && <button type="button" onClick={onCancel}>キャンセル</button>}
      </div>
    </form>
  );
}

function ScenePanel({ sceneResults, onAdd, onUpdate, onDelete, allowDelete = true }) {
  const [editingId, setEditingId] = useState("");
  const editingScene = sceneResults.find(({ scene }) => scene.id === editingId)?.scene;
  const editable = Boolean(onAdd && onUpdate && onDelete);

  return (
    <section className="panel">
      <h2 className="panelTitle green"><span>★</span>シーン稽古可否</h2>
      {editable && <SceneEditor editingScene={editingScene} onAdd={onAdd} onUpdate={onUpdate} onCancel={() => setEditingId("")} />}
      <div className="sceneList">
        {sceneResults.map(({ scene, canRehearse, missingCharacters }) => (
          <article key={scene.id} className={`scene ${canRehearse ? "ok" : "ng"}`}>
            <div>
              <h3>{scene.title}</h3>
              <p>必要：{scene.requiredCharacters.join("、")}</p>
              <p className="note">{scene.memo}</p>
            </div>
            <strong>{canRehearse ? "✓ 稽古できます" : `不足：${missingCharacters.join("、")}`}</strong>
            {editable && (
              <div className="sceneActions">
                <button onClick={() => setEditingId(scene.id)}>編集</button>
                {allowDelete && <button className="dangerButton" onClick={() => onDelete(scene.id)}>削除</button>}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function ScenePage({ sceneResults, onAdd, onUpdate, onDelete, allowDelete }) {
  return (
    <section className="stack">
      <ScenePanel sceneResults={sceneResults} onAdd={onAdd} onUpdate={onUpdate} onDelete={onDelete} allowDelete={allowDelete} />
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
