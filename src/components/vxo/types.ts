export type ModuleId = "tv" | "radio" | "rec" | "read" | "map" | "morse" | "wx" | "fx" | "lunar" | "dsp" | "ngame";

export const MODULE_LABEL: Record<ModuleId, string> = {
  tv: "Truyền hình",
  radio: "Đài phát thanh",
  rec: "Ghi âm",
  read: "Đọc EPUB",
  map: "Bản đồ",
  morse: "Morse",
  wx: "Thời tiết",
  fx: "Tỉ giá",
  lunar: "Âm lịch",
  dsp: "Master âm thanh",
  ngame: "NGAME",
};
