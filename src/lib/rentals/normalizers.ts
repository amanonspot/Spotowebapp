import {
    BHKOption,
    MoveInOption,
    OwnerContact,
    PropertyDetail,
    PropertyListItem,
    PropertyType,
} from "@/lib/adapters/types";
import { mockPropertyDetails, mockPropertyList } from "@/mocks/properties";
import { RentalMasterOptionWire, RentalPropertyWire, UnknownRecord, WireApiEnvelope } from "@/lib/rentals/wireTypes";

const asRecord = (value: unknown): UnknownRecord | null =>
    value !== null && typeof value === "object" ? (value as UnknownRecord) : null;

const asArray = <T = unknown>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    return [];
};

const unwrapData = (value: unknown): unknown => {
    const record = asRecord(value);
    if (!record) return value;
    if (record.data !== undefined) return record.data;
    if (record.results !== undefined) return record.results;
    if (record.items !== undefined) return record.items;
    return value;
};

const stringOrFallback = (value: unknown, fallback = ""): string => {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length > 0) return trimmed;
    }
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return fallback;
};

const numberOrFallback = (value: unknown, fallback = 0): number => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
};

const firstString = (...values: unknown[]): string => {
    for (const value of values) {
        const normalized = stringOrFallback(value);
        if (normalized) return normalized;
    }
    return "";
};

const readMasterName = (value: unknown, fallback = ""): string => {
    if (typeof value === "string") return stringOrFallback(value, fallback);
    const record = asRecord(value);
    if (!record) return fallback;
    return firstString(record.name, record.label, record.code, fallback);
};

const toBhk = (value: unknown): BHKOption => {
    const code = readMasterName(value).toLowerCase().replace(/\s+/g, "_");
    if (code.includes("3_bhk") || code.includes("3bhk")) return "3_bhk";
    if (code.includes("2_bhk") || code.includes("2bhk")) return "2_bhk";
    if (code.includes("1_bhk") || code.includes("1bhk")) return "1_bhk";
    if (code.includes("1_rk") || code.includes("1rk") || code.includes("studio")) return "1_rk";
    return "1_bhk";
};

const toPropertyTypes = (wire: RentalPropertyWire): PropertyType[] => {
    const raw = firstString(
        readMasterName(wire.property_type),
        readMasterName(wire.property_type_id),
        readMasterName(wire.name)
    ).toLowerCase();

    const types = new Set<PropertyType>();
    if (raw.includes("pg")) types.add("pg");
    if (raw.includes("co") && raw.includes("liv")) types.add("co_living");
    if (raw.includes("zero")) types.add("zero_deposit");
    if (raw.includes("rent") || raw.includes("house") || types.size === 0) types.add("rent_house");
    return Array.from(types);
};

const toMoveInOptions = (wire: RentalPropertyWire): MoveInOption[] => {
    const raw = readMasterName(wire.availability).toLowerCase();
    if (raw.includes("immediate")) return ["immediately"];
    if (raw.includes("15")) return ["15_days"];
    if (raw.includes("30")) return ["30_days"];
    return ["immediately", "15_days", "30_days"];
};

const resolveImage = (wire: RentalPropertyWire, fallback: string): string => {
    const fromDisplay = firstString(wire.display_image);
    if (fromDisplay) return fromDisplay;

    const mediaCandidates = [
        ...asArray<UnknownRecord>(wire.images),
        ...asArray<UnknownRecord>(wire.media),
        ...asArray<UnknownRecord>(wire.image_files),
    ];

    for (const candidate of mediaCandidates) {
        const url = firstString(candidate.url, candidate.file, candidate.media_file, candidate.image);
        if (url) return url;
    }

    return fallback;
};

const normalizeAmenities = (wire: RentalPropertyWire): string[] => {
    const source = asArray(wire.amenities);
    if (source.length === 0) return [];
    return source
        .map((item) => (typeof item === "string" ? item : readMasterName(item)))
        .filter(Boolean);
};

const normalizeKeywords = (wire: RentalPropertyWire): string[] => {
    const value = wire.keywords;
    if (Array.isArray(value)) {
        return value.map((item) => (typeof item === "string" ? item : readMasterName(item))).filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((token) => token.trim())
            .filter(Boolean);
    }

    return [];
};

const normalizeOwner = (wire: RentalPropertyWire, fallback: PropertyDetail["owner"]): OwnerContact => {
    const ownerName = firstString(
        (wire as UnknownRecord).owner_name,
        (wire as UnknownRecord).contact_name,
        fallback.ownerName
    );
    const phone = firstString(wire.contact_phone, (wire as UnknownRecord).owner_phone, fallback.whatsappNumber);
    const maskedPhone = phone ? phone.replace(/^(\+?\d{2})(\d{2,3})(\d+)(\d{3,4})$/, "$1-$2XX$4") : fallback.maskedPhone;

    return {
        ownerName,
        maskedPhone,
        whatsappNumber: phone || fallback.whatsappNumber,
    };
};

export const normalizeMasterOptions = (payload: WireApiEnvelope<unknown>): RentalMasterOptionWire[] => {
    const unwrapped = unwrapData(payload);
    if (Array.isArray(unwrapped)) return unwrapped as RentalMasterOptionWire[];
    return [];
};

export const normalizePropertyList = (
    payload: WireApiEnvelope<unknown>,
    options?: { fallbackToMock?: boolean }
): PropertyListItem[] => {
    const fallbackToMock = options?.fallbackToMock ?? true;
    const unwrapped = unwrapData(payload);
    const rawList = asArray<RentalPropertyWire>(unwrapped);

    if (rawList.length === 0) return fallbackToMock ? mockPropertyList : [];

    return rawList.map((wire, index) => {
        const fallback = mockPropertyList[index % mockPropertyList.length];
        const id = firstString(wire.id, wire.property_id, fallback.id);
        const title = firstString(wire.title, wire.name, fallback.title);
        const locality = firstString(readMasterName(wire.locality), wire.locality_name, fallback.locality);
        const city = firstString(readMasterName(wire.city), wire.city_name, fallback.city);
        const pricePerMonth = numberOrFallback(firstString(wire.rent, wire.monthly_rent), fallback.pricePerMonth);
        const deposit = numberOrFallback(firstString(wire.deposit, wire.security_deposit), fallback.deposit);
        const furnishing = readMasterName(wire.furnishing).toLowerCase();
        const furnished = furnishing.includes("full") || furnishing.includes("semi") ? true : fallback.furnished;
        const image = resolveImage(wire, fallback.image);
        const bhk = toBhk(firstString(readMasterName(wire.bhk), wire.bhk_id, fallback.bhk));
        const propertyTypes = toPropertyTypes(wire);
        const moveInOptions = toMoveInOptions(wire);
        const keywords = normalizeKeywords(wire);

        return {
            ...fallback,
            id,
            title,
            locality,
            city,
            pricePerMonth,
            deposit,
            furnished,
            image,
            bhk,
            propertyTypes,
            moveInOptions,
            badges: keywords.length > 0 ? keywords.slice(0, 2) : fallback.badges,
            features: normalizeAmenities(wire).slice(0, 2).length > 0 ? normalizeAmenities(wire).slice(0, 2) : fallback.features,
        };
    });
};

const findWireProperty = (payload: WireApiEnvelope<unknown>, propertyId: string): RentalPropertyWire | null => {
    const unwrapped = unwrapData(payload);
    if (Array.isArray(unwrapped)) {
        const found = (unwrapped as RentalPropertyWire[]).find((item) =>
            [item.id, item.property_id].some((id) => String(id ?? "") === propertyId)
        );
        return found || null;
    }

    const record = asRecord(unwrapped);
    if (!record) return null;

    if (record.property && asRecord(record.property)) {
        return record.property as RentalPropertyWire;
    }

    return record as RentalPropertyWire;
};

export const normalizePropertyDetail = (payload: WireApiEnvelope<unknown>, propertyId: string): PropertyDetail => {
    const fallback =
        mockPropertyDetails.find((item) => item.id === propertyId) ??
        mockPropertyDetails[0];
    const wire = findWireProperty(payload, propertyId);
    if (!wire) return fallback;

    const listBase = normalizePropertyList([wire])[0];
    const amenities = normalizeAmenities(wire);
    const keywordHighlights = normalizeKeywords(wire);
    const owner = normalizeOwner(wire, fallback.owner);

    return {
        ...fallback,
        ...listBase,
        description: firstString(wire.description, fallback.description),
        mapPreviewLabel: firstString((wire as UnknownRecord).map_preview_label, fallback.mapPreviewLabel),
        mapPreviewSubLabel: firstString((wire as UnknownRecord).map_preview_sub_label, fallback.mapPreviewSubLabel),
        amenities: amenities.length > 0 ? amenities : fallback.amenities,
        highlights: keywordHighlights.length > 0 ? keywordHighlights : fallback.highlights,
        owner,
    };
};

export const normalizeLocalitiesFromProperties = (items: PropertyListItem[]): string[] =>
    Array.from(new Set(items.map((item) => item.locality).filter(Boolean))).sort((a, b) => a.localeCompare(b));

export const toMasterSelectOption = (wire: RentalMasterOptionWire): { id: string; name: string } => ({
    id: firstString(wire.id, wire.uuid, String(wire.value ?? "")),
    name: firstString(wire.name, wire.label, wire.code, String(wire.value ?? "")),
});

export const extractErrorMessage = (error: unknown, fallback = "Something went wrong"): string => {
    const record = asRecord(error);
    if (!record) return fallback;
    const message = firstString(record.message, (record as UnknownRecord).detail);
    return message || fallback;
};
