export type Role = "キャスト" | "演出" | "演出助手" | "制作" | "音響" | "照明";
export type Team = "Aチーム" | "Bチーム" | "共通";
export type AttendanceStatus = "出席" | "欠席" | "遅刻" | "早退" | "未定";

export type Member = {
  id: string;
  name: string;
  role: Role;
  character?: string;
  team: Team;
  memo?: string;
};

export type Rehearsal = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  place: string;
  memo?: string;
  eventType?: "稽古日" | "MTG・打ち合わせ";
};

export type Attendance = {
  id: string;
  rehearsalId: string;
  memberId: string;
  status: AttendanceStatus;
  arrivalTime?: string;
  leaveTime?: string;
  note?: string;
};

export type Scene = {
  id: string;
  title: string;
  requiredCharacters: string[];
  memo?: string;
};
