const { useEffect, useMemo, useRef, useState } = React;

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
  { id: "scenes", label: "管理者", icon: "★" },
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

function buildNotionSyncRows(rehearsalSource, memberSource, attendanceSource, sceneSource) {
  return [...rehearsalSource]
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
    .map((rehearsal) => {
      const summary = getAttendanceSummary(rehearsal, memberSource, attendanceSource);
      const selectedScenes = sceneSource
        .filter((scene) => rehearsal.selectedSceneIds?.includes(scene.id))
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
  return readStorage("keiko.supabaseConfig", { url: "", anonKey: "", roomId: "zakuro-keiko" });
}

function saveSupabaseConfig(config) {
  localStorage.setItem("keiko.supabaseConfig", JSON.stringify(config));
}

function supabaseEndpoint(config, query = "") {
  return `${config.url.replace(/\/$/, "")}/rest/v1/keiko_app_state${query}`;
}

function supabaseHeaders(config) {
  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
  };
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
  const [onlineStatus, setOnlineStatus] = useState("未設定です。");
  const [autoOnlineSave, setAutoOnlineSave] = useState(() => readStorage("keiko.autoOnlineSave", true));
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
    localStorage.setItem("keiko.autoOnlineSave", JSON.stringify(autoOnlineSave));
  }, [autoOnlineSave]);

  function getAppState() {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      members: memberList,
      rehearsals: rehearsalList,
      scenes: sceneList,
      attendances,
    };
  }

  function isOnlineConfigured() {
    return Boolean(supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.roomId);
  }

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

  async function saveOnline({ silent = false } = {}) {
    if (!supabaseConfig.url || !supabaseConfig.anonKey || !supabaseConfig.roomId) {
      if (!silent) alert("Supabase URL、anon key、部屋IDを入力してください。");
      return;
    }
    setOnlineStatus(silent ? "自動保存中です..." : "オンラインへ保存中です...");
    try {
      const response = await fetch(supabaseEndpoint(supabaseConfig), {
        method: "POST",
        headers: { ...supabaseHeaders(supabaseConfig), Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify([{ id: supabaseConfig.roomId, data: getAppState(), updated_at: new Date().toISOString() }]),
      });
      if (!response.ok) throw new Error(await response.text());
      setOnlineReady(true);
      setOnlineStatus(`${silent ? "自動保存しました" : "保存しました"}：${new Date().toLocaleString("ja-JP")}`);
    } catch (error) {
      console.error(error);
      setOnlineStatus("保存できませんでした。Supabase設定とテーブル作成を確認してください。");
      if (!silent) alert("オンライン保存に失敗しました。READMEのSupabase設定を確認してください。");
    }
  }

  async function loadOnline() {
    if (!supabaseConfig.url || !supabaseConfig.anonKey || !supabaseConfig.roomId) {
      alert("Supabase URL、anon key、部屋IDを入力してください。");
      return;
    }
    if (!confirm("オンライン上のデータで、このブラウザのデータを置き換えます。よろしいですか？")) return;
    setOnlineStatus("オンラインから読み込み中です...");
    try {
      const query = `?id=eq.${encodeURIComponent(supabaseConfig.roomId)}&select=data,updated_at`;
      const response = await fetch(supabaseEndpoint(supabaseConfig, query), { headers: supabaseHeaders(supabaseConfig) });
      if (!response.ok) throw new Error(await response.text());
      const rows = await response.json();
      if (!rows.length) {
        setOnlineStatus("オンラインデータがまだありません。先に保存してください。");
        return;
      }
      applyAppState(rows[0].data);
      setOnlineReady(true);
      setOnlineStatus(`読み込みました：${new Date(rows[0].updated_at).toLocaleString("ja-JP")}`);
    } catch (error) {
      console.error(error);
      setOnlineStatus("読み込めませんでした。Supabase設定とテーブル作成を確認してください。");
      alert("オンライン読み込みに失敗しました。READMEのSupabase設定を確認してください。");
    }
  }

  useEffect(() => {
    if (!autoOnlineSave || !onlineReady) return;
    if (!supabaseConfig.url || !supabaseConfig.anonKey || !supabaseConfig.roomId) return;
    if (applyingRemoteRef.current) return;
    const timerId = window.setTimeout(() => {
      saveOnline({ silent: true });
    }, 1200);
    return () => window.clearTimeout(timerId);
  }, [attendances, autoOnlineSave, memberList, onlineReady, rehearsalList, sceneList, supabaseConfig]);

  useEffect(() => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey || !supabaseConfig.roomId) {
      setRealtimeStatus("未接続です。");
      return;
    }
    if (!window.supabase?.createClient) {
      setRealtimeStatus("Supabaseライブラリを読み込めませんでした。");
      return;
    }
    const client = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
    setRealtimeStatus("リアルタイム接続中です...");
    const channel = client
      .channel(`keiko_app_state:${supabaseConfig.roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "keiko_app_state",
          filter: `id=eq.${supabaseConfig.roomId}`,
        },
        (payload) => {
          if (!payload.new?.data) return;
          applyAppState(payload.new.data, "remote");
          setOnlineReady(true);
          setOnlineStatus(`自動反映しました：${new Date().toLocaleString("ja-JP")}`);
        },
      )
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

  function addMember(input: Omit<Member, "id">) {
    setMemberList((current) => [...current, { ...input, id: `m${Date.now()}` }]);
  }

  function updateMember(input: Member) {
    setMemberList((current) => current.map((member) => (member.id === input.id ? input : member)));
  }

  function addScene(input: Omit<Scene, "id">) {
    setSceneList((current) => [...current, { ...input, id: `s${Date.now()}` }]);
  }

  function updateScene(input: Scene) {
    setSceneList((current) => current.map((scene) => (scene.id === input.id ? input : scene)));
  }

  function deleteScene(sceneId: string) {
    if (!confirm("このシーンを削除しますか？")) return;
    setSceneList((current) => current.filter((scene) => scene.id !== sceneId));
  }

  function deleteMember(memberId: string) {
    const target = memberList.find((member) => member.id === memberId);
    if (!target) return;
    if (!confirm(`${target.name} を削除しますか？\nこのメンバーの出欠データも一緒に削除されます。`)) return;
    setMemberList((current) => current.filter((member) => member.id !== memberId));
    setAttendances((current) => current.filter((attendance) => attendance.memberId !== memberId));
  }

  function addRehearsal(input: Omit<Rehearsal, "id">) {
    const next = { ...input, id: `r${Date.now()}`, createdAt: new Date().toISOString() };
    setRehearsalList((current) => [...current, next].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)));
    setSelectedRehearsalId(next.id);
  }

  function updateRehearsal(input: Rehearsal) {
    const next = { ...input, updatedAt: new Date().toISOString() };
    setRehearsalList((current) =>
      current
        .map((rehearsal) => (rehearsal.id === input.id ? next : rehearsal))
        .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
    );
    setSelectedRehearsalId(next.id);
  }

  function deleteRehearsal(rehearsalId: string) {
    if (!confirm("この稽古日を削除しますか？")) return;
    setRehearsalList((current) => current.filter((rehearsal) => rehearsal.id !== rehearsalId));
    setAttendances((current) => current.filter((attendance) => attendance.rehearsalId !== rehearsalId));
  }

  function saveAttendanceBatch(inputs: Omit<Attendance, "id">[]) {
    let nextRows = [...attendances];
    const timestamp = Date.now();
    inputs.forEach((input, index) => {
      const existing = nextRows.find((row) => row.rehearsalId === input.rehearsalId && row.memberId === input.memberId);
      const savedRow = existing ? { ...existing, ...input } : { id: `a${timestamp}-${index}`, ...input };
      nextRows = existing ? nextRows.map((row) => (row.id === existing.id ? savedRow : row)) : [...nextRows, savedRow];
    });
    setAttendances(nextRows);
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
      <div className="statusCards">
        <SyncGuardNotice
          configured={isOnlineConfigured()}
          onlineReady={onlineReady}
          onlineStatus={onlineStatus}
          realtimeStatus={realtimeStatus}
        />
        <NotificationGuidePreview members={memberList} />
      </div>
{tab === "dashboard" && <Dashboard rehearsalId={selectedRehearsalId} rehearsals={rehearsalList} setRehearsalId={setSelectedRehearsalId} attendances={attendances} visibleMembers={visibleMembers} scenes={sceneList} />}
      {tab === "rehearsals" && <RehearsalList rehearsals={rehearsalList} scenes={sceneList} selectedRehearsalId={selectedRehearsalId} setSelectedRehearsalId={setSelectedRehearsalId} attendances={attendances} visibleMembers={visibleMembers} onAdd={addRehearsal} onUpdate={updateRehearsal} onDelete={deleteRehearsal} openAdmin={() => setTab("admin")} />}
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
          allMembers={memberList}
          allRehearsals={rehearsalList}
          scenes={sceneList}
        />
      )}
      {tab === "members" && <MemberView rehearsals={rehearsalList} attendances={attendances} visibleMembers={visibleMembers} onAdd={addMember} onUpdate={updateMember} onDelete={deleteMember} />}
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
          allowDelete={true}
        />
      )}
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

function NotificationGuidePreview({ members }) {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? "");
  const [notificationMemberId, setNotificationMemberId] = useState(() => localStorage.getItem(notificationSettingKey) ?? "");
  const [isExpanded, setIsExpanded] = useState(() => !localStorage.getItem(notificationSettingKey));
  const savedNotificationMember = members.find((member) => member.id === notificationMemberId);

  useEffect(() => {
    if (!selectedMemberId && members[0]?.id) setSelectedMemberId(members[0].id);
  }, [members, selectedMemberId]);

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
            setSelectedMemberId(notificationMemberId);
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
        <p className="note">最初だけ下のボタンから、通知を許可してね♡</p>
      </div>
      <div className="notificationActions">
        <label className="field">
          あなたのお名前を選んでね
          <select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)}>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
        </label>
        <button
          type="button"
          className="primary"
          onClick={() => {
            if (!selectedMemberId) return;
            localStorage.setItem(notificationSettingKey, selectedMemberId);
            setNotificationMemberId(selectedMemberId);
            setIsExpanded(false);
          }}
        >
          表示だけ確認する
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
        {rehearsals.map((rehearsal) => <option key={rehearsal.id} value={rehearsal.id}>{rehearsal.date} {rehearsal.startTime}</option>)}
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
          const isToday = day.date === new Date().toLocaleDateString("sv-SE");
          return (
            <button
              key={day.date}
              className={`calendarDay ${events.length ? "hasEvent" : ""} ${hasMtg ? "hasMtg" : ""} ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
              onClick={() => events[0] && onSelect(events[0].id)}
              disabled={!events.length}
              title={events.map((event) => `${event.startTime} ${event.place}`).join("\n")}
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

function Dashboard({ rehearsalId, rehearsals, setRehearsalId, attendances, visibleMembers, scenes }) {
  const rehearsal = rehearsals.find((item) => item.id === rehearsalId) ?? rehearsals[0];
  const grouped = groupAttendance(rehearsalId, attendances, visibleMembers);
  const attendancePersonRow = (row, prefix = "") => ({
    key: `${prefix}${row.member.id}-${row.attendance.status}`,
    label: `${prefix}${formatAttendanceLine(row)}`,
    role: row.member.role,
  });
  const memberPersonRow = (member) => ({ key: member.id, label: member.name, role: member.role });
  const absenceRows = [
    ...grouped.absent.map((row) => attendancePersonRow(row)),
    ...grouped.late.map((row) => attendancePersonRow(row, "遅刻：")),
  ];
  if (!rehearsal) return <section className="panel emptyState">稽古日を追加してください。</section>;
  return (
    <section className="stack">
      <DashboardCalendar rehearsals={rehearsals} selectedRehearsalId={rehearsalId} onSelect={setRehearsalId} />
      <div className="panel highlight">
        <RehearsalPicker rehearsals={rehearsals} value={rehearsalId} onChange={setRehearsalId} />
        <h2 className="sparkTitle">次回稽古：{rehearsal.date}<span>✦</span></h2>
        <p>{rehearsal.startTime}-{rehearsal.endTime} / {rehearsal.place}</p>
        <p className="note">{rehearsal.memo}</p>
      </div>
      <ContactNotesPanel grouped={grouped} />
      <TodayScenesPanel rehearsal={rehearsal} scenes={scenes} />
      {absenceRows.length > 0 && <PeoplePanel title="欠席・遅刻" rows={absenceRows} tone="warn" />}
      <div className="grid two">
        <PeoplePanel title="出席予定" rows={[...grouped.present, ...grouped.late, ...grouped.early].map((row) => attendancePersonRow(row))} collapsible />
        <PeoplePanel title="未回答" rows={grouped.noReply.map(memberPersonRow)} tone="warn" />
      </div>
      <section className="panel">
        <h2 className="panelTitle"><span>↗</span>出席率</h2>
        <div className="rateList">
          {visibleMembers.map((member) => <div key={member.id} className="rateRow"><span className={`personName ${roleClassName(member.role)}`}>{member.name}</span><strong>{attendanceRate(member.id, attendances, rehearsals)}%</strong></div>)}
        </div>
      </section>
    </section>
  );
}

function RehearsalList({ rehearsals, scenes, selectedRehearsalId, setSelectedRehearsalId, attendances, visibleMembers, onAdd, onUpdate, onDelete, openAdmin }) {
  const [editingRehearsal, setEditingRehearsal] = useState(null);
  return (
    <section className="stack">
      <RehearsalEditor scenes={scenes} editingRehearsal={editingRehearsal} onAdd={onAdd} onUpdate={onUpdate} onCancelEdit={() => setEditingRehearsal(null)} />
      {rehearsals.map((rehearsal) => {
        const summary = summarizeRehearsal(rehearsal.id, attendances, visibleMembers);
        return (
          <article key={rehearsal.id} className={`panel rehearsalCard ${selectedRehearsalId === rehearsal.id ? "selected" : ""}`}>
            <div>
              <p className="eyebrow">{rehearsal.eventType ?? "稽古日"} / {rehearsal.place}</p>
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
              <button onClick={() => { setSelectedRehearsalId(rehearsal.id); setEditingRehearsal(rehearsal); }}>編集</button>
              <button className="dangerButton" onClick={() => onDelete(rehearsal.id)}>削除</button>
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
    setStartTime(String(editingRehearsal.startTime ?? "").slice(0, 5) || "19:00");
    setEndTime(String(editingRehearsal.endTime ?? "").slice(0, 5) || "22:00");
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
              <small>{rehearsal.startTime}-{rehearsal.endTime}</small>
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

function getSelectedSceneTitles(rehearsal, scenes) {
  if (!rehearsal?.selectedSceneIds?.length) return [];
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene.title]));
  return rehearsal.selectedSceneIds.map((id) => sceneById.get(id)).filter(Boolean);
}

function TodayScenesPanel({ rehearsal, scenes }) {
  const titles = getSelectedSceneTitles(rehearsal, scenes);
  if (!titles.length) return null;
  return (
    <section className="panel todayScenesPanel">
      <h2 className="panelTitle"><span>★</span>本日の稽古シーン</h2>
      <p>{titles.map(sceneShortName).join("、")}</p>
    </section>
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
      setSyncStatus(error?.message || "Notion同期に失敗しました。公開版URLで開いているか、VercelのNotion設定を確認してください。");
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
  const editingScene = sceneResults.find(({ scene }) => scene.id === editingId)?.scene;
  const editable = Boolean(onAdd && onUpdate && onDelete);
  const sortedSceneResults = sortSceneResults(sceneResults);
  const availableScenes = sortedSceneResults.filter((result) => result.canRehearse);
  const availabilityMessage = availableScenes.length === sortedSceneResults.length && sortedSceneResults.length
    ? "この日は全シーン可能"
    : availableScenes.length
      ? `この日にできるシーン：${availableScenes.map((result) => sceneShortName(result.scene.title)).join("、")}`
      : "この日にできるシーンはありません";

  return (
    <section className="panel">
      <h2 className="panelTitle green"><span>★</span>シーン稽古可否</h2>
      <p className={`sceneTodaySummary ${availableScenes.length ? "ok" : "ng"}`}>{availabilityMessage}</p>
      {editable && <SceneEditor editingScene={editingScene} onAdd={onAdd} onUpdate={onUpdate} onCancel={() => setEditingId("")} />}
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

function SceneAvailabilityBrowser({ rehearsals, rehearsalId, attendances, visibleMembers, scenes, onAdd, onUpdate, onDelete, allowDelete }) {
  const [selectedId, setSelectedId] = useState(rehearsalId || rehearsals[0]?.id || "");

  useEffect(() => {
    if (!rehearsals.some((rehearsal) => rehearsal.id === selectedId)) {
      setSelectedId(rehearsalId || rehearsals[0]?.id || "");
    }
  }, [rehearsals, rehearsalId, selectedId]);

  const selected = rehearsals.find((rehearsal) => rehearsal.id === selectedId) ?? rehearsals[0];
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
        <div className="dateScroller" aria-label="シーン可否を確認する稽古日">
          {rehearsals.map((rehearsal) => (
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

function ScenePage({ rehearsals, rehearsalId, attendances, visibleMembers, scenes, allMembers, onAdd, onUpdate, onDelete, allowDelete }) {
  return (
    <AdminLock>
      <section className="stack">
        <ExportTools rehearsals={rehearsals} members={allMembers} attendances={attendances} />
        <NotionSyncPanel rehearsals={rehearsals} members={allMembers} attendances={attendances} scenes={scenes} />
        <SceneAvailabilityBrowser
          rehearsals={rehearsals}
          rehearsalId={rehearsalId}
          attendances={attendances}
          visibleMembers={visibleMembers}
          scenes={scenes}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onDelete={onDelete}
          allowDelete={allowDelete}
        />
      </section>
    </AdminLock>
  );
}

function roleClassName(role) {
  return role === "キャスト" ? "cast" : "staff";
}

function renderPeopleRow(row) {
  if (typeof row === "string") return row;
  return <span className={`personName ${roleClassName(row.role)}`}>{row.label}</span>;
}

function PeoplePanel({ title, rows, tone, collapsible = false, initialCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  return (
    <section className={`panel people ${tone ?? ""}`}>
      <div className="panelTitleRow">
        <h2 className="panelTitle"><span>{tone === "warn" ? "?" : "♙"}</span>{title}</h2>
        {collapsible && (
          <button type="button" className="miniToggle" onClick={() => setCollapsed((current) => !current)}>
            {collapsed ? "開く" : "閉じる"}
          </button>
        )}
      </div>
      {!collapsed && (rows.length ? <ul>{rows.map((row, index) => <li key={typeof row === "string" ? row : row.key ?? `${row.label}-${index}`}>{renderPeopleRow(row)}</li>)}</ul> : <p className="note">該当なし</p>)}
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

function MemberView({ rehearsals, attendances, visibleMembers, onAdd, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState("");
  const editingMember = visibleMembers.find((member) => member.id === editingId);
  const roleClass = roleClassName;

  return (
    <section className="stack">
      <MemberEditor editingMember={editingMember} onAdd={onAdd} onUpdate={onUpdate} onCancel={() => setEditingId("")} />
      {visibleMembers.map((member) => (
        <article key={member.id} className={`panel memberCard ${roleClass(member.role)}`}>
          <div>
            <h2>{member.name}</h2>
            <p><span className={`roleBadge ${roleClass(member.role)}`}>{member.role}</span> {member.team}{member.character ? ` / 役：${member.character}` : ""}</p>
            <p className="note">{member.memo}</p>
          </div>
          <div className="cardActions">
            <strong>{attendanceRate(member.id, attendances, rehearsals)}%</strong>
            <button onClick={() => setEditingId(member.id)}>編集</button>
            <button className="dangerButton" onClick={() => onDelete(member.id)}>削除</button>
          </div>
        </article>
      ))}
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
