/**
 * Pull latitude / longitude from typical Google Maps share or place URLs.
 * Short links (goo.gl, maps.app.goo.gl) are not expanded — paste the full link from Share when possible.
 */

function isValidLatLng(lat: string, lng: string): boolean {
    const la = parseFloat(lat);
    const lo = parseFloat(lng);
    return (
        Number.isFinite(la) &&
        Number.isFinite(lo) &&
        la >= -90 &&
        la <= 90 &&
        lo >= -180 &&
        lo <= 180
    );
}

export function extractLatLngFromGoogleMapsUrl(raw: string): { lat: string; lng: string } | null {
    const u = raw.trim();
    if (!u) return null;

    // @lat,lng,...  e.g. /@26.76,83.37,15z or /@26.76,83.37
    const atMatch = u.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch && isValidLatLng(atMatch[1], atMatch[2])) {
        return { lat: atMatch[1], lng: atMatch[2] };
    }

    // ?q=lat,lng or &q=lat,lng
    const qMatch = u.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)(?:&|#|$)/i);
    if (qMatch && isValidLatLng(qMatch[1], qMatch[2])) {
        return { lat: qMatch[1], lng: qMatch[2] };
    }

    // ll=lat,lng
    const llMatch = u.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)(?:&|#|$)/i);
    if (llMatch && isValidLatLng(llMatch[1], llMatch[2])) {
        return { lat: llMatch[1], lng: llMatch[2] };
    }

    // Place data blob !3dLAT!4dLNG
    const dMatch = u.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (dMatch && isValidLatLng(dMatch[1], dMatch[2])) {
        return { lat: dMatch[1], lng: dMatch[2] };
    }

    return null;
}
