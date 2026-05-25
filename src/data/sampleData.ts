import type { Attendance, Member, Rehearsal, Scene } from "../types";

export const members: Member[] = [
  { id: "m1", name: "おはよう真夜中", role: "キャスト", team: "共通" },
  { id: "m2", name: "黒崎こぎん", role: "キャスト", team: "共通" },
  { id: "m3", name: "Sion", role: "キャスト", team: "共通" },
  { id: "m4", name: "tika.", role: "キャスト", team: "共通" },
  { id: "m5", name: "ちょろね", role: "キャスト", team: "共通" },
  { id: "m6", name: "七宮ソウ", role: "キャスト", team: "共通" },
  { id: "m7", name: "U-kki", role: "キャスト", team: "共通" },
  { id: "m8", name: "冷凍みかん", role: "キャスト", team: "共通" },
];

export const rehearsals: Rehearsal[] = [
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

export const scenes: Scene[] = [
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

export const attendances: Attendance[] = [
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
