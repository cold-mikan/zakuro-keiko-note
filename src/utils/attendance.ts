import type { Attendance, AttendanceStatus, Member, Rehearsal, Scene } from "../types";

export const activeStatuses: AttendanceStatus[] = ["出席", "遅刻", "早退"];

export function getAttendanceFor(rehearsalId: string, attendances: Attendance[]) {
  return attendances.filter((attendance) => attendance.rehearsalId === rehearsalId);
}

export function getMissingMembers(rehearsalId: string, members: Member[], attendances: Attendance[]) {
  const answered = new Set(getAttendanceFor(rehearsalId, attendances).map((attendance) => attendance.memberId));
  return members.filter((member) => !answered.has(member.id));
}

export function summarizeRehearsal(rehearsalId: string, members: Member[], attendances: Attendance[]) {
  const rows = getAttendanceFor(rehearsalId, attendances);
  return {
    present: rows.filter((row) => row.status === "出席").length,
    absent: rows.filter((row) => row.status === "欠席").length,
    late: rows.filter((row) => row.status === "遅刻").length,
    early: rows.filter((row) => row.status === "早退").length,
    undecided: rows.filter((row) => row.status === "未定").length,
    noReply: getMissingMembers(rehearsalId, members, attendances).length,
  };
}

export function groupAttendance(rehearsalId: string, members: Member[], attendances: Attendance[]) {
  const byMember = new Map(members.map((member) => [member.id, member]));
  const rows = getAttendanceFor(rehearsalId, attendances);

  const pick = (status: AttendanceStatus) =>
    rows
      .filter((row) => row.status === status)
      .map((row) => ({ attendance: row, member: byMember.get(row.memberId) }))
      .filter((row): row is { attendance: Attendance; member: Member } => Boolean(row.member));

  return {
    present: pick("出席"),
    absent: pick("欠席"),
    late: pick("遅刻"),
    early: pick("早退"),
    undecided: pick("未定"),
    noReply: getMissingMembers(rehearsalId, members, attendances),
  };
}

export function evaluateScenes(rehearsalId: string, members: Member[], attendances: Attendance[], scenes: Scene[]) {
  const rows = getAttendanceFor(rehearsalId, attendances).filter((row) => activeStatuses.includes(row.status));
  const activeMemberIds = new Set(rows.map((row) => row.memberId));
  const activeCharacters = new Set(
    members
      .filter((member) => activeMemberIds.has(member.id) && member.role === "キャスト" && member.character)
      .map((member) => member.character as string),
  );

  return scenes.map((scene) => {
    const missingCharacters = scene.requiredCharacters.filter((character) => !activeCharacters.has(character));
    return {
      scene,
      canRehearse: missingCharacters.length === 0,
      missingCharacters,
    };
  });
}

export function attendanceRate(memberId: string, rehearsals: Rehearsal[], attendances: Attendance[]) {
  const rows = rehearsals
    .map((rehearsal) => attendances.find((attendance) => attendance.rehearsalId === rehearsal.id && attendance.memberId === memberId))
    .filter(Boolean) as Attendance[];
  if (rows.length === 0) return 0;
  const attended = rows.filter((row) => activeStatuses.includes(row.status)).length;
  return Math.round((attended / rows.length) * 100);
}
