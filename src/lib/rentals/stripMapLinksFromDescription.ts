/**
 * Remove map / directions URLs from free-text listing descriptions.
 * Map should use `map_url` + lat/lng; owners often paste the same link in description.
 */

const MAP_URL_REGEXES: RegExp[] = [
    /https?:\/\/[^\s]*google\.[^\s/]*\/maps[^\s]*/gi,
    /https?:\/\/maps\.google\.[^\s]+/gi,
    /https?:\/\/goo\.gl\/[^\s]+/gi,
    /https?:\/\/maps\.app\.goo\.gl\/[^\s]+/gi,
];

export function stripMapLinksFromDescription(raw: string): string {
    if (!raw?.trim()) return raw ?? "";

    let text = raw;
    for (const re of MAP_URL_REGEXES) {
        text = text.replace(re, "");
    }

    const lines = text
        .split("\n")
        .map((line) =>
            line
                .replace(/\s{2,}/g, " ")
                .replace(/[\s·•|-]+$/g, "")
                .trim(),
        )
        .filter((line) => {
            if (!line) return false;
            if (/^(map|location|google\s*maps)\s*[:：]?\s*$/i.test(line)) return false;
            return true;
        });

    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
