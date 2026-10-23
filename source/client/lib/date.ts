/**
 * Utility functions for parsing and formatting date/time in NekoTalk.
 */

/**
 * Safely parse a date string, Date object, or timestamp into a valid Date.
 * Truncates microsecond/nanosecond fractions to milliseconds to ensure cross-browser compatibility (e.g. Safari).
 */
export function parseDate(
  dateInput: string | Date | number | null | undefined
): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === "number") {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateInput === "string") {
    let s = dateInput.trim();
    if (!s) return null;
    // Truncate fractional seconds to 3 digits (e.g. .123456 -> .123)
    s = s.replace(/(\.\d{3})\d+/, "$1");
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Format message time inside chat message bubble (e.g. "14:25").
 */
export function formatMessageTime(
  dateInput: string | Date | number | null | undefined
): string {
  const d = parseDate(dateInput);
  if (!d) return "";
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Format timestamp for the conversation list in sidebar (last message time).
 * - Today: "14:25"
 * - Yesterday: "Hôm qua"
 * - Within 7 days: "Th 2", "Th 3", ...
 * - Same year: "18/10"
 * - Previous years: "18/10/2025"
 */
export function formatConversationTime(
  dateInput: string | Date | number | null | undefined
): string {
  const d = parseDate(dateInput);
  if (!d) return "";

  const now = new Date();

  // Check same calendar day
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  // Check yesterday
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  );
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return "Hôm qua";
  }

  // Check within last 7 days
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const diffDays = Math.floor(
    (startOfToday.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays >= 0 && diffDays < 7) {
    const weekdays = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
    return weekdays[d.getDay()];
  }

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");

  if (d.getFullYear() === now.getFullYear()) {
    return `${day}/${month}`;
  }

  return `${day}/${month}/${d.getFullYear()}`;
}

/**
 * Format full date and time for tooltips (title attribute).
 * e.g. "14:25:30, 19/10/2026"
 */
export function formatFullDateTime(
  dateInput: string | Date | number | null | undefined
): string {
  const d = parseDate(dateInput);
  if (!d) return "";
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const seconds = d.getSeconds().toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${hours}:${minutes}:${seconds}, ${day}/${month}/${year}`;
}

/**
 * Format date divider text between groups of messages (e.g. "Hôm nay", "Hôm qua", "18 tháng 10").
 */
export function formatDateDivider(
  dateInput: string | Date | number | null | undefined
): string {
  const d = parseDate(dateInput);
  if (!d) return "";

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return "Hôm nay";

  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  );
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Hôm qua";

  const day = d.getDate();
  const month = d.getMonth() + 1;

  if (d.getFullYear() === now.getFullYear()) {
    return `${day} tháng ${month}`;
  }

  return `${day} tháng ${month}, ${d.getFullYear()}`;
}

/**
 * Check if two dates fall on different calendar days.
 */
export function isDifferentDay(
  dateA: string | Date | number | null | undefined,
  dateB: string | Date | number | null | undefined
): boolean {
  const da = parseDate(dateA);
  const db = parseDate(dateB);
  if (!da || !db) return true;
  return (
    da.getDate() !== db.getDate() ||
    da.getMonth() !== db.getMonth() ||
    da.getFullYear() !== db.getFullYear()
  );
}

/**
 * Format user presence / last active timestamp.
 * - Under 1 min: "Vừa mới truy cập"
 * - Under 60 mins: "Hoạt động X phút trước"
 * - Under 24 hours: "Hoạt động X giờ trước"
 * - Yesterday: "Hoạt động hôm qua"
 * - Older: "Hoạt động dd/MM"
 */
export function formatLastActive(
  dateInput: string | Date | number | null | undefined
): string {
  const d = parseDate(dateInput);
  if (!d) return "Không hoạt động";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return "Vừa mới truy cập";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Vừa mới truy cập";
  if (diffMin < 60) return `Hoạt động ${diffMin} phút trước`;
  if (diffHour < 24) return `Hoạt động ${diffHour} giờ trước`;
  if (diffDay === 1) return "Hoạt động hôm qua";

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `Hoạt động ${day}/${month}`;
}
