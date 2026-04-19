import {
    BHKOption,
    MoveInOption,
    OwnerContact,
    PropertyDetail,
    PropertyListItem,
    PropertyType,
} from "@/lib/adapters/types";
import { mockPropertyDetails, mockPropertyList } from "@/mocks/properties";
import { isUuidLike } from "@/lib/rentals/runtime";
import { RentalMasterOptionWire, RentalPropertyWire, UnknownRecord, WireApiEnvelope } from "@/lib/rentals/wireTypes";

type NormalizerContext = {
    cityNameById?: Record<string, string>;
    localityNameById?: Record<string, string>;
    amenityNameById?: Record<string, string>;
    keywordNameById?: Record<string, string>;
    propertyTypeIdByToken?: Record<string, string>;
    bhkIdByToken?: Record<string, string>;
    furnishingIdByToken?: Record<string, string>;
    availabilityIdByToken?: Record<string, string>;
};

type NormalizerOptions = NormalizerContext & {
    fallbackToMock?: boolean;
};

const asRecord = (value: unknown): UnknownRecord | null =>
    value !== null && typeof value === "object" ? (value as UnknownRecord) : null;

const asArray = <T = unknown>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    return [];
};

const normalizeToken = (value: unknown) =>
    stringOrFallback(value)
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const resolveIdFromMasterMap = (value: unknown, map?: Record<string, string>): string => {
    if (!map) return "";
    const token = normalizeToken(value);
    if (!token) return "";
    return map[token] || "";
};

const DEFAULT_UNLOCK_OFFER: PropertyDetail["unlockOffer"] = {
    weeklyPassPrice: 249,
    headline: "Get Direct Owner's Contacts",
    subHeadline: "Unlock verified owner details",
    bullets: ["Direct Owner Contact", "Exact map location", "No brokerage"],
    ctaLabel: "Get 99 Unlimited Pass",
};

const unwrapData = (value: unknown): unknown => {
    const record = asRecord(value);
    if (!record) return value;
    if (record.data !== undefined) return record.data;
    if (record.results !== undefined) return record.results;
    if (record.items !== undefined) return record.items;
    if (record.property !== undefined) return record.property;
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

const readMasterId = (value: unknown): string => {
    if (typeof value === "string" && isUuidLike(value)) return value;
    const record = asRecord(value);
    if (!record) return "";
    return firstString(record.id, record.uuid);
};

const toBhk = (wire: RentalPropertyWire): BHKOption => {
    const code = firstString(
        readMasterName(wire.bhk),
        wire.bhk_name,
        wire.bhk_id,
        wire.bhk_value
    )
        .toLowerCase()
        .replace(/\s+/g, "_");

    if (code.includes("3_bhk") || code.includes("3bhk")) return "3_bhk";
    if (code.includes("2_bhk") || code.includes("2bhk")) return "2_bhk";
    if (code.includes("1_rk") || code.includes("studio")) return "1_rk";
    return "1_bhk";
};

const resolvePropertyTypeCode = (wire: RentalPropertyWire): string => {
    return firstString(
        wire.property_type_code,
        readMasterName(wire.property_type),
        wire.property_type_name
    ).toLowerCase();
};

const toPropertyTypes = (wire: RentalPropertyWire): PropertyType[] => {
    const raw = resolvePropertyTypeCode(wire);
    const types = new Set<PropertyType>();
    if (raw.includes("pg")) types.add("pg");
    if (raw.includes("co") && raw.includes("liv")) types.add("co_living");
    if (raw.includes("zero")) types.add("zero_deposit");
    if (raw.includes("apartment") || raw.includes("house") || raw.includes("rent") || types.size === 0) {
        types.add("rent_house");
    }
    return Array.from(types);
};

const toMoveInOptions = (wire: RentalPropertyWire): MoveInOption[] => {
    const raw = firstString(
        readMasterName(wire.availability),
        wire.availability_name,
        wire.availability_code
    ).toLowerCase();
    if (raw.includes("15")) return ["15_days"];
    if (raw.includes("30")) return ["30_days"];
    return ["immediately"];
};

const toStatus = (wire: RentalPropertyWire): string =>
    firstString(wire.status, wire.is_verified === true ? "verified" : wire.is_verified === false ? "unverified" : "");

const resolvePropertyTypeId = (wire: RentalPropertyWire, options: NormalizerContext): string =>
    firstString(
        wire.property_type_id,
        readMasterId(wire.property_type),
        resolveIdFromMasterMap(wire.property_type_code, options.propertyTypeIdByToken),
        resolveIdFromMasterMap(wire.property_type_name, options.propertyTypeIdByToken),
        resolveIdFromMasterMap(readMasterName(wire.property_type), options.propertyTypeIdByToken)
    );

const resolveBhkId = (wire: RentalPropertyWire, options: NormalizerContext): string =>
    firstString(
        wire.bhk_id,
        readMasterId(wire.bhk),
        resolveIdFromMasterMap(wire.bhk_name, options.bhkIdByToken),
        resolveIdFromMasterMap(wire.bhk_value, options.bhkIdByToken),
        resolveIdFromMasterMap(readMasterName(wire.bhk), options.bhkIdByToken)
    );

const resolveFurnishingId = (wire: RentalPropertyWire, options: NormalizerContext): string =>
    firstString(
        wire.furnishing_id,
        readMasterId(wire.furnishing),
        resolveIdFromMasterMap(wire.furnishing_code, options.furnishingIdByToken),
        resolveIdFromMasterMap(wire.furnishing_name, options.furnishingIdByToken),
        resolveIdFromMasterMap(readMasterName(wire.furnishing), options.furnishingIdByToken)
    );

const resolveAvailabilityId = (wire: RentalPropertyWire, options: NormalizerContext): string =>
    firstString(
        wire.availability_id,
        readMasterId(wire.availability),
        resolveIdFromMasterMap(wire.availability_code, options.availabilityIdByToken),
        resolveIdFromMasterMap(wire.availability_name, options.availabilityIdByToken),
        resolveIdFromMasterMap(readMasterName(wire.availability), options.availabilityIdByToken)
    );

const toImageCandidates = (wire: RentalPropertyWire): Array<{ url: string; isPrimary: boolean; sortOrder: number }> => {
    const mediaCandidates = [
        ...asArray<UnknownRecord>(wire.images),
        ...asArray<UnknownRecord>(wire.media),
        ...asArray<UnknownRecord>(wire.image_files),
    ];

    return mediaCandidates
        .map((candidate, index) => ({
            url: firstString(candidate.image_url, candidate.url, candidate.file, candidate.media_file, candidate.image),
            isPrimary: Boolean(candidate.is_primary || candidate.is_cover || candidate.display_image),
            sortOrder: numberOrFallback(candidate.sort_order, index),
        }))
        .filter((item) => Boolean(item.url))
        .sort((a, b) => {
            if (a.isPrimary === b.isPrimary) return a.sortOrder - b.sortOrder;
            return a.isPrimary ? -1 : 1;
        });
};

const normalizeAmenities = (wire: RentalPropertyWire, options: NormalizerContext): string[] => {
    const source = asArray<RentalMasterOptionWire | string>(wire.amenities);
    if (source.length === 0) return [];
    return source
        .map((item) => {
            if (typeof item !== "string") return readMasterName(item);
            if (isUuidLike(item)) return options.amenityNameById?.[item] || "";
            return item;
        })
        .filter(Boolean);
};

const normalizeAmenityIds = (wire: RentalPropertyWire): string[] => {
    const source = asArray<RentalMasterOptionWire | string>(wire.amenities);
    if (source.length > 0) {
        return source
            .map((item) => {
                if (typeof item === "string" && isUuidLike(item)) return item;
                if (typeof item === "string") return "";
                return firstString(item.id, item.uuid);
            })
            .filter(Boolean);
    }

    if (Array.isArray(wire.amenity_ids)) {
        return wire.amenity_ids.map((item) => `${item}`.trim()).filter(Boolean);
    }

    if (typeof wire.amenity_ids === "string") {
        return wire.amenity_ids.split(",").map((item) => item.trim()).filter(Boolean);
    }

    return [];
};

const normalizeKeywords = (wire: RentalPropertyWire, options: NormalizerContext): string[] => {
    const value = wire.keywords;
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item !== "string") return readMasterName(item);
                if (isUuidLike(item)) return options.keywordNameById?.[item] || "";
                return item;
            })
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((token) => token.trim())
            .map((token) => (isUuidLike(token) ? options.keywordNameById?.[token] || "" : token))
            .filter(Boolean);
    }

    return [];
};

const normalizeKeywordIds = (wire: RentalPropertyWire): string[] => {
    const value = wire.keywords;
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === "string" && isUuidLike(item)) return item;
                if (typeof item === "string") return "";
                return firstString(item.id, item.uuid);
            })
            .filter(Boolean);
    }
    return [];
};

const maskPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6) return phone;
    const prefix = digits.slice(0, 2);
    const suffix = digits.slice(-4);
    return `+${prefix}-${"X".repeat(Math.max(0, digits.length - 6))}${suffix}`;
};

const normalizeOwner = (wire: RentalPropertyWire): OwnerContact => {
    const ownerName = firstString((wire as UnknownRecord).owner_name, (wire as UnknownRecord).contact_name, "Owner");
    const phone = firstString(wire.contact_phone, (wire as UnknownRecord).owner_phone);
    return {
        ownerName,
        maskedPhone: phone ? maskPhone(phone) : "Contact locked",
        whatsappNumber: phone || "",
    };
};

const resolveCity = (wire: RentalPropertyWire, options: NormalizerContext): { cityId: string; cityName: string } => {
    const rawCity = typeof wire.city === "string" ? wire.city.trim() : "";
    const cityId = firstString(
        wire.city_id,
        readMasterId(wire.city),
        rawCity && isUuidLike(rawCity) ? rawCity : ""
    );
    const cityName = firstString(
        wire.city_name,
        cityId ? options.cityNameById?.[cityId] : "",
        rawCity && !isUuidLike(rawCity) ? rawCity : "",
        !rawCity ? readMasterName(wire.city) : ""
    );
    return { cityId, cityName };
};

const resolveLocality = (wire: RentalPropertyWire, options: NormalizerContext): { localityId: string; localityName: string } => {
    const rawLocality = typeof wire.locality === "string" ? wire.locality.trim() : "";
    const localityId = firstString(
        wire.locality_id,
        readMasterId(wire.locality),
        rawLocality && isUuidLike(rawLocality) ? rawLocality : ""
    );
    const localityName = firstString(
        wire.locality_name,
        localityId ? options.localityNameById?.[localityId] : "",
        rawLocality && !isUuidLike(rawLocality) ? rawLocality : "",
        !rawLocality ? readMasterName(wire.locality) : ""
    );
    return { localityId, localityName };
};

export const normalizeMasterOptions = (payload: WireApiEnvelope<unknown>): RentalMasterOptionWire[] => {
    const unwrapped = unwrapData(payload);
    if (Array.isArray(unwrapped)) return unwrapped as RentalMasterOptionWire[];
    return [];
};

export const normalizePropertyList = (payload: WireApiEnvelope<unknown>, options?: NormalizerOptions): PropertyListItem[] => {
    const fallbackToMock = options?.fallbackToMock ?? true;
    const unwrapped = unwrapData(payload);
    const rawList = Array.isArray(unwrapped)
        ? (unwrapped as RentalPropertyWire[])
        : asRecord(unwrapped)
        ? [unwrapped as RentalPropertyWire]
        : [];

    if (rawList.length === 0) return fallbackToMock ? mockPropertyList : [];

    return rawList.reduce<PropertyListItem[]>((acc, wire, index) => {
            const fallback = fallbackToMock ? mockPropertyList[index % mockPropertyList.length] : null;
            const id = firstString(wire.id, wire.property_id, fallback?.id);
            if (!id) return acc;

            const propertyTitle = firstString(wire.property_title, wire.title, wire.name, fallback?.title || "");
            const { cityId, cityName } = resolveCity(wire, options || {});
            const { localityId, localityName } = resolveLocality(wire, options || {});
            const pricePerMonth = numberOrFallback(firstString(wire.rent, wire.monthly_rent), fallback?.pricePerMonth || 0);
            const deposit = numberOrFallback(firstString(wire.deposit, wire.security_deposit), fallback?.deposit || 0);
            const furnishingName = firstString(readMasterName(wire.furnishing), wire.furnishing_name, wire.furnishing_code).toLowerCase();
            const furnished = furnishingName.includes("full") || furnishingName.includes("semi") ? true : fallback?.furnished || false;
            const images = toImageCandidates(wire).map((item) => item.url);
            const primaryImage = firstString(wire.display_image, images[0], fallback?.image || "");
            const bhk = toBhk(wire);
            const propertyTypes = toPropertyTypes(wire);
            const moveInOptions = toMoveInOptions(wire);
            const keywords = normalizeKeywords(wire, options || {});
            const amenities = normalizeAmenities(wire, options || {});
            const status = toStatus(wire);

            acc.push({
                ...(fallback ? fallback : {}),
                id,
                title: propertyTitle,
                propertyTitle,
                locality: localityName || fallback?.locality || "",
                localityId,
                city: cityName || fallback?.city || "",
                cityId,
                pricePerMonth,
                deposit,
                furnished,
                image: primaryImage,
                galleryImages: images.length > 0 ? images : primaryImage ? [primaryImage] : [],
                bhk,
                bhkId: resolveBhkId(wire, options || {}),
                propertyTypes,
                propertyTypeId: resolvePropertyTypeId(wire, options || {}),
                furnishingId: resolveFurnishingId(wire, options || {}),
                availabilityId: resolveAvailabilityId(wire, options || {}),
                status,
                isVerified: typeof wire.is_verified === "boolean" ? wire.is_verified : undefined,
                moveInOptions,
                badges: keywords.length > 0 ? keywords.slice(0, 2) : fallback?.badges || [],
                features: amenities.length > 0 ? amenities.slice(0, 2) : fallback?.features || [],
            } satisfies PropertyListItem);
            return acc;
        }, []);
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

export const normalizePropertyDetail = (
    payload: WireApiEnvelope<unknown>,
    propertyId: string,
    options?: NormalizerOptions
): PropertyDetail => {
    const fallbackToMock = options?.fallbackToMock ?? true;
    const fallback = fallbackToMock ? mockPropertyDetails.find((item) => item.id === propertyId) ?? mockPropertyDetails[0] : null;
    const wire = findWireProperty(payload, propertyId);

    if (!wire) {
        if (fallbackToMock && fallback) return fallback;
        return {
            id: propertyId,
            title: "",
            propertyTitle: "",
            locality: "",
            city: "",
            pricePerMonth: 0,
            deposit: 0,
            furnished: false,
            image: "",
            galleryImages: [],
            bhk: "1_bhk",
            propertyTypes: [],
            moveInOptions: [],
            badges: [],
            features: [],
            description: "",
            mapPreviewLabel: "",
            mapPreviewSubLabel: "",
            amenities: [],
            highlights: [],
            owner: {
                ownerName: "Owner",
                maskedPhone: "Contact locked",
                whatsappNumber: "",
            },
            unlockOffer: DEFAULT_UNLOCK_OFFER,
        };
    }

    const listBase =
        normalizePropertyList([wire], options)[0] ||
        ({
            id: propertyId,
            title: "",
            propertyTitle: "",
            locality: "",
            city: "",
            pricePerMonth: 0,
            deposit: 0,
            furnished: false,
            image: "",
            galleryImages: [],
            bhk: "1_bhk",
            propertyTypes: [],
            moveInOptions: [],
            badges: [],
            features: [],
        } satisfies PropertyListItem);
    const amenities = normalizeAmenities(wire, options || {});
    const keywordHighlights = normalizeKeywords(wire, options || {});
    const amenityIds = normalizeAmenityIds(wire);
    const keywordIds = normalizeKeywordIds(wire);
    const owner = normalizeOwner(wire);
    const detailBase = fallbackToMock
        ? fallback || mockPropertyDetails[0]
        : {
              description: "",
              mapPreviewLabel: "",
              mapPreviewSubLabel: "",
              amenities: [] as string[],
              highlights: [] as string[],
              owner: {
                  ownerName: "Owner",
                  maskedPhone: "Contact locked",
                  whatsappNumber: "",
              },
              unlockOffer: DEFAULT_UNLOCK_OFFER,
          };

    return {
        ...detailBase,
        ...listBase,
        description: firstString(wire.description, detailBase.description, ""),
        mapPreviewLabel: firstString((wire as UnknownRecord).map_preview_label, detailBase.mapPreviewLabel, ""),
        mapPreviewSubLabel: firstString((wire as UnknownRecord).map_preview_sub_label, detailBase.mapPreviewSubLabel, ""),
        amenities: amenities.length > 0 ? amenities : detailBase.amenities,
        amenityIds,
        highlights: keywordHighlights.length > 0 ? keywordHighlights : detailBase.highlights,
        keywordIds,
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
    const message = firstString(
        record.message,
        (record as UnknownRecord).detail,
        (record as UnknownRecord).error,
        (record as UnknownRecord).non_field_errors
    );
    return message || fallback;
};
