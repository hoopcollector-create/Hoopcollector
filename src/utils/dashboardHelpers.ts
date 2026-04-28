const KST_TZ = "Asia/Seoul";
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export function calcAge(birthdayISO: string) {
    const b = new Date(birthdayISO + "T00:00:00");
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
}

export function fmtKST(iso?: string | null) {
    if (!iso) return "-";
    try {
        return new Date(iso).toLocaleString("ko-KR", { timeZone: KST_TZ });
    } catch {
        return "-";
    }
}

export function fmtDateKST(iso?: string | null) {
    if (!iso) return "-";
    try {
        return new Date(iso).toLocaleDateString("ko-KR", {
            timeZone: KST_TZ,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            weekday: "short",
        });
    } catch {
        return "-";
    }
}

export function fmtTimeKST(iso?: string | null) {
    if (!iso) return "-";
    try {
        return new Date(iso).toLocaleTimeString("ko-KR", {
            timeZone: KST_TZ,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    } catch {
        return "-";
    }
}

export function statusKo(s: string) {
    const v = (s || "").toLowerCase();
    if (v === "requested") return "요청중";
    if (v === "accepted") return "확정";
    if (v === "completed") return "완료";
    if (v === "cancelled") return "취소";
    if (v === "rejected") return "반려";
    if (v === "cancel_requested") return "취소 요청됨";
    return s;
}

export function statusShopKo(s: string) {
    const v = (s || "").toLowerCase();
    if (v === "pending") return "입금대기";
    if (v === "paid") return "결제완료";
    if (v === "cancelled") return "취소됨";
    if (v === "refunded") return "환불됨";
    return s;
}

export function canCancelStatus(s: string) {
    const v = (s || "").toLowerCase();
    return v === "requested" || v === "accepted";
}

export function toISOStringFromKST(date: string, time: string) {
    const [yy, mm, dd] = date.split("-").map(Number);
    const [HH, MIN] = time.split(":").map(Number);
    if (
        !yy ||
        !mm ||
        !dd ||
        Number.isNaN(yy) ||
        Number.isNaN(mm) ||
        Number.isNaN(dd) ||
        Number.isNaN(HH) ||
        Number.isNaN(MIN)
    ) {
        throw new Error("날짜/시간 형식이 올바르지 않습니다.");
    }
    const utcMs = Date.UTC(yy, mm - 1, dd, HH - 9, MIN, 0);
    return new Date(utcMs).toISOString();
}

export function isRefundableByTime(requestedStartISO: string) {
    const start = new Date(requestedStartISO).getTime();
    const now = Date.now();
    return start - now >= TWO_HOURS_MS;
}

export function cancelPolicyHint(requestedStartISO: string) {
    return isRefundableByTime(requestedStartISO)
        ? "2시간 전 취소: 환불 가능"
        : "2시간 이내 취소: 기본 환불 없음(유예권이면 환불 가능)";
}

export function normalizePhone(input: string) {
    return String(input || "").replace(/[^0-9]/g, "");
}

export function clampInt(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}
