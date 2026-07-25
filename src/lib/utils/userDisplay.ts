import type { User } from "@/lib/api/types";

type UserLike = Pick<User, "first_name" | "last_name" | "email" | "phone">;

const PLACEHOLDER_EMAIL_RE = /@placeholder\.local$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPlaceholderEmail(email?: string | null): boolean {
    if (!email) return false;
    if (PLACEHOLDER_EMAIL_RE.test(email)) return true;
    const localPart = email.split("@")[0] ?? "";
    return UUID_RE.test(localPart);
}

export function formatUserFullName(user: UserLike): string {
    return `${user.first_name || ""} ${user.last_name || ""}`.trim();
}

/** Primary label for profile menus — never shows auto-generated placeholder emails. */
export function getUserDisplayName(user: UserLike | null | undefined, fallback = "User"): string {
    if (!user) return fallback;

    const fullName = formatUserFullName(user);
    if (fullName) return fullName;
    if (user.first_name) return user.first_name;
    if (user.phone) return user.phone;
    if (user.email && !isPlaceholderEmail(user.email)) return user.email;

    return fallback;
}

/** Secondary line under the display name (phone or real email). */
export function getUserDisplaySubtitle(user: UserLike | null | undefined): string | undefined {
    if (!user) return undefined;

    const fullName = formatUserFullName(user);
    if (fullName) {
        if (user.phone) return user.phone;
        if (user.email && !isPlaceholderEmail(user.email)) return user.email;
        return undefined;
    }

    if (user.email && !isPlaceholderEmail(user.email)) return user.email;
    return undefined;
}

export function getUserAvatarInitial(user: UserLike | null | undefined): string {
    if (!user) return "U";

    const fullName = formatUserFullName(user);
    if (fullName) return fullName.charAt(0).toUpperCase();
    if (user.first_name) return user.first_name.charAt(0).toUpperCase();

    const phoneDigits = user.phone?.replace(/\D/g, "") ?? "";
    if (phoneDigits) return phoneDigits.charAt(0);

    if (user.email && !isPlaceholderEmail(user.email)) return user.email.charAt(0).toUpperCase();

    return "U";
}
