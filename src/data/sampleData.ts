import type { Attendance, Member, Rehearsal, Scene } from "../types";

export const members: Member[] = [
  { id: "m1", name: "春野 いろは", role: "キャスト", character: "A", team: "Aチーム", memo: "ダブルキャストA" },
  { id: "m2", name: "森 つむぎ", role: "キャスト", character: "A", team: "Bチーム", memo: "ダブルキャストB" },
  { id: "m3", name: "佐倉 りん", role: "キャスト", character: "B", team: "Aチーム" },
  { id: "m4", name: "水野 こはる", role: "キャスト", character: "B", team: "Bチーム" },
  { id: "m5", name: "高瀬 凪", role: "キャスト", character: "C", team: "共通" },
  { id: "m6", name: "北川 灯", role: "キャスト", character: "D", team: "共通" },
  { id: "m7", name: "藤井 まこと", role: "演出", team: "共通" },
  { id: "m8", name: "桐谷 すず", role: "制作", team: "共通" },
];

export const rehearsals: Rehearsal[] = [
  { id: "r1", date: "2026-06-06", startTime: "18:30", endTime: "21:30", place: "駅前スタジオA", memo: "顔合わせ、読み合わせ" },
  { id: "r2", date: "2026-06-10", startTime: "19:00", endTime: "22:00", place: "区民センター第2和室", memo: "1場、2場中心" },
  { id: "r3", date: "2026-06-14", startTime: "13:00", endTime: "17:00", place: "小劇場 稽古場", memo: "立ち稽古開始" },
  { id: "r4", date: "2026-06-18", startTime: "19:00", endTime: "22:00", place: "駅前スタジオB", memo: "Bチーム多め" },
  { id: "r5", date: "2026-06-21", startTime: "13:00", endTime: "18:00", place: "小劇場 稽古場", memo: "通しの前段取り確認" },
];

export const scenes: Scene[] = [
  { id: "s1", title: "1場：夜のロビー", requiredCharacters: ["A", "B"], memo: "出会いの場面" },
  { id: "s2", title: "2場：古い楽屋", requiredCharacters: ["A", "C", "D"], memo: "小道具確認あり" },
  { id: "s3", title: "3場：終演後", requiredCharacters: ["B", "D"], memo: "感情の山場" },
  { id: "s4", title: "4場：カーテンコール前", requiredCharacters: ["A", "B", "C", "D"], memo: "全員場面" },
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
