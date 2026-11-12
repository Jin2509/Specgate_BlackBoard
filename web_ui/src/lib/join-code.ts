// Sinh và chuẩn hóa mã tham gia workspace chung (kiểu mã nhóm của Microsoft Teams).
export const JOIN_CODE_LENGTH = 7;

// Bỏ 0, O, 1, I, L để đọc qua điện thoại hay chép tay không nhầm.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateJoinCode(random: (n: number) => Uint32Array = (n) => crypto.getRandomValues(new Uint32Array(n))) {
  return Array.from(random(JOIN_CODE_LENGTH), (v) => ALPHABET[v % ALPHABET.length]).join("");
}

// Nhận cả mã gõ thường, có dấu cách hay gạch nối ("adm-7q3p"); trả undefined nếu không đúng dạng.
export function normalizeJoinCode(input: string): string | undefined {
  const code = input.replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]+$/.test(code) && code.length === JOIN_CODE_LENGTH ? code : undefined;
}
