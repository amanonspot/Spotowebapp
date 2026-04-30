import {
    BHKOption,
    MoveInOption,
    OwnerContact,
    OwnerDocument,
    PropertyDetail,
    PropertyListItem,
    PropertyType,
} from "@/lib/adapters/types";
import { mockPropertyDetails, mockPropertyList } from "@/mocks/properties";
import { isUuidLike } from "@/lib/rentals/runtime";
import {
    RentalMasterOptionDto,
    RentalPropertyDto,
    UnknownRecord,
    WireApiEnvelope,
} from "@/lib/rentals/wireTypes";
import { stripMapLinksFromDescription } from "@/lib/rentals/stripMapLinksFromDescription";

type NormalizerContext = {
    cityNameById?: Record<string, string>;
    localityNameById?: Record<string, string>;
    amenityNameById?: Record<string, string>;
    propertyTypeIdByToken?: Record<string, string>;
    bhkIdByToken?: Record<string, string>;
    furnishingIdByToken?: Record<string, string>;
    availabilityIdByToken?: Record<string, string>;
};

type NormalizerOptions = NormalizerContext & {
    fallbackToMock?: boolean;
};

const DEFAULT_UNLOCK_OFFER: PropertyDetail["unlockOffer"] = {
    headline: "Get Direct Owner's Contacts",
    subHeadline: "Unlock verified owner details",
    bullets: ["Direct Owner Contact", "Exact map location", "Unlimited contacts for 24 hours", "No brokerage"],
    ctaLabel: "SPOTO Day Pass - ₹99*",
};

const asRecord = (value: unknown): UnknownRecord | null =>
    value !== null && typeof value === "object" ? (value as UnknownRecord) : null;

const asArray = <T = unknown>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const parseStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (typeof item === "string") return item.trim();
                if (typeof item === "number" && Number.isFinite(item)) return String(item);
                return "";
            })
            .filter(Boolean);
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((item) => (typeof item === "string" ? item.trim() : ""))
                    .filter(Boolean);
            }
        } catch {
            return [trimmed];
        }
    }
    return [];
};

const parseLooseUrlList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map((item) => stringOrFallback(item))
            .filter(Boolean);
    }
    if (typeof value !== "string") return [];

    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
            return parsed
                .map((item) => stringOrFallback(item))
                .filter(Boolean);
        }
    } catch {
        // fall through to delimiter parsing
    }

    return trimmed
        .split(/[,\n]+/)
        .map((part) => part.trim())
        .filter(Boolean);
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
        const next = value.trim();
        if (next) return next;
    }
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return fallback;
};

const firstString = (...values: unknown[]): string => {
    for (const value of values) {
        const next = stringOrFallback(value);
        if (next) return next;
    }
    return "";
};

const numberOrFallback = (value: unknown, fallback = 0): number => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
};

const readNullablePositiveInt = (value: unknown): number | null => {
    if (value == null || value === "") return null;
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n);
};

const API_ORIGIN = (() => {
    const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (!rawBase) return "";
    try {
        return new URL(rawBase).origin;
    } catch {
        return "";
    }
})();

const toAbsoluteMediaUrl = (value: unknown): string => {
    const raw = stringOrFallback(value);
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("//")) return `https:${raw}`;
    if (!API_ORIGIN) return raw;
    if (raw.startsWith("/")) return `${API_ORIGIN}${raw}`;
    return `${API_ORIGIN}/${raw.replace(/^\/+/, "")}`;
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

const toBhk = (wire: RentalPropertyDto): BHKOption => {
    const code = firstString(wire.bhk_name, wire.bhk_value, wire.bhk_id).toLowerCase();
    if (code.includes("3")) return "3_bhk";
    if (code.includes("2")) return "2_bhk";
    if (code.includes("rk") || code.includes("studio")) return "1_rk";
    return "1_bhk";
};

const resolvePropertyTypeCode = (wire: RentalPropertyDto): string =>
    firstString(wire.property_type_code, wire.property_type_name).toLowerCase();

const toPropertyTypes = (wire: RentalPropertyDto): PropertyType[] => {
    const raw = resolvePropertyTypeCode(wire);
    const title = firstString(wire.property_title).toLowerCase();
    const desc = firstString(wire.description).toLowerCase();
    const haystack = `${raw} ${title} ${desc}`;

    const types = new Set<PropertyType>();
    if (raw.includes("pg") || /\bpg\b/.test(haystack) || haystack.includes("paying guest")) types.add("pg");
    if ((raw.includes("co") && raw.includes("liv")) || /co[\s-]?living|coliving|\bco living\b/.test(haystack)) {
        types.add("co_living");
    }
    if (raw.includes("zero") || /zero deposit|no deposit|nil deposit/.test(haystack)) types.add("zero_deposit");

    const dep = wire.deposit;
    const depNum = typeof dep === "number" ? dep : Number(String(dep).replace(/,/g, ""));
    if (dep !== undefined && dep !== null && String(dep).trim() !== "" && !Number.isNaN(depNum) && depNum === 0) {
        types.add("zero_deposit");
    }

    const isPg = types.has("pg");
    const isCoLiving = types.has("co_living");
    if (
        !isPg &&
        !isCoLiving &&
        (raw.includes("apartment") ||
            raw.includes("house") ||
            raw.includes("rent") ||
            raw.includes("flat") ||
            types.size === 0 ||
            /\b(bhk|flat|apartment|studio|villa|independent)\b/.test(haystack))
    ) {
      types.add("rent_house");
    }
    return Array.from(types);
};

const toMoveInOptions = (wire: RentalPropertyDto): MoveInOption[] => {
    const raw = firstString(wire.availability_name, wire.availability_code).toLowerCase();
    if (raw.includes("15")) return ["15_days"];
    if (raw.includes("30")) return ["30_days"];
    return ["immediately"];
};

const toStatus = (wire: RentalPropertyDto): string => {
    const explicit = firstString(wire.verification_status, (wire as UnknownRecord).status);
    if (explicit) return explicit;
    if (wire.is_active === false) return "inactive";
    if (wire.is_verified === true) return "verified";
    if (wire.is_verified === false) return "pending_review";
    return "";
};

const resolvePropertyTypeId = (wire: RentalPropertyDto, options: NormalizerContext): string =>
    firstString(
        wire.property_type_id,
        resolveIdFromMasterMap(wire.property_type_code, options.propertyTypeIdByToken),
        resolveIdFromMasterMap(wire.property_type_name, options.propertyTypeIdByToken)
    );

const resolveBhkId = (wire: RentalPropertyDto, options: NormalizerContext): string =>
    firstString(
        wire.bhk_id,
        resolveIdFromMasterMap(wire.bhk_name, options.bhkIdByToken),
        resolveIdFromMasterMap(wire.bhk_value, options.bhkIdByToken)
    );

const resolveFurnishingId = (wire: RentalPropertyDto, options: NormalizerContext): string =>
    firstString(
        wire.furnishing_id,
        resolveIdFromMasterMap(wire.furnishing_code, options.furnishingIdByToken),
        resolveIdFromMasterMap(wire.furnishing_name, options.furnishingIdByToken)
    );

const resolveAvailabilityId = (wire: RentalPropertyDto, options: NormalizerContext): string =>
    firstString(
        wire.availability_id,
        resolveIdFromMasterMap(wire.availability_code, options.availabilityIdByToken),
        resolveIdFromMasterMap(wire.availability_name, options.availabilityIdByToken)
    );

const toImageCandidates = (wire: RentalPropertyDto): Array<{ url: string; isPrimary: boolean; sortOrder: number }> => {
    const wireRecord = wire as UnknownRecord;
    const mediaCandidates = [
        ...asArray<UnknownRecord>(wire.images),
        ...asArray<UnknownRecord>(wireRecord.image_files),
        ...asArray<UnknownRecord>(wireRecord.property_images),
        ...asArray<UnknownRecord>(wireRecord.photos),
        ...asArray<UnknownRecord>(wireRecord.media),
    ];

    const objectCandidates = mediaCandidates
        .map((candidate, index) => ({
            url: firstString(
                candidate.image_url,
                candidate.url,
                candidate.image,
                candidate.file,
                candidate.media_file,
                candidate.media_url,
                candidate.src,
                candidate.document_file_url,
                candidate.file_url
            ),
            isPrimary: Boolean(candidate.is_primary || candidate.is_cover || candidate.is_display || candidate.display_image),
            sortOrder: numberOrFallback(candidate.sort_order, index),
        }));

    const stringCandidates = [
        ...parseLooseUrlList(wireRecord.gallery_images),
        ...parseLooseUrlList(wireRecord.galleryImages),
        ...parseLooseUrlList(wireRecord.image_urls),
        ...parseLooseUrlList(wireRecord.images_urls),
        ...parseLooseUrlList(wireRecord.photo_urls),
        ...parseLooseUrlList(wireRecord.photos_urls),
    ].map((url, index) => ({
        url: stringOrFallback(url),
        isPrimary: false,
        sortOrder: mediaCandidates.length + index,
    }));

    const topLevelImageObject = asRecord(wireRecord.image);
    const topLevelCandidates = [
        wireRecord.image_url,
        wireRecord.image,
        wireRecord.thumbnail,
        wireRecord.cover_image,
        wireRecord.cover_image_url,
        wireRecord.display_image,
        wireRecord.display_image_url,
        wireRecord.primary_image,
        wireRecord.primary_image_url,
        wireRecord.file_url,
        topLevelImageObject?.image_url,
        topLevelImageObject?.url,
    ]
        .map((url, index) => ({
            url: stringOrFallback(url),
            isPrimary: index === 0,
            sortOrder: mediaCandidates.length + stringCandidates.length + index,
        }))
        .filter((item) => Boolean(item.url));

    const ranked = [...objectCandidates, ...stringCandidates, ...topLevelCandidates]
        .map((item) => ({ ...item, url: toAbsoluteMediaUrl(item.url) }))
        .filter((item) => Boolean(item.url))
        .sort((a, b) => {
            if (a.isPrimary === b.isPrimary) return a.sortOrder - b.sortOrder;
            return a.isPrimary ? -1 : 1;
        });

    const seen = new Set<string>();
    return ranked.filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
    });
};

const normalizeAmenities = (wire: RentalPropertyDto, options: NormalizerContext): string[] => {
    const source = asArray<RentalMasterOptionDto | string>(wire.amenities);
    const fromAmenities = source
        .map((item) => {
            if (typeof item === "string") {
                if (isUuidLike(item)) return options.amenityNameById?.[item] || "";
                return item;
            }
            return firstString(item.name);
        })
        .filter(Boolean);
    if (fromAmenities.length > 0) return fromAmenities;

    return parseStringArray(wire.amenity_ids)
        .map((amenityId) => options.amenityNameById?.[amenityId] || "")
        .filter(Boolean);
};

const normalizeAmenityIds = (wire: RentalPropertyDto): string[] =>
    (() => {
        const fromObjects = asArray<RentalMasterOptionDto>(wire.amenities)
            .map((item) => firstString(item.id))
            .filter(Boolean);
        if (fromObjects.length > 0) return fromObjects;
        return parseStringArray(wire.amenity_ids).filter(Boolean);
    })();

const normalizeKeywords = (wire: RentalPropertyDto): string[] => {
    const fromKeywords = parseStringArray(wire.keywords);
    return Array.from(new Set(fromKeywords.map((item) => item.trim()).filter(Boolean)));
};

const maskPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    // Normalize to 10-digit Indian number (strip leading 91 if present)
    const local = digits.length === 12 && digits.startsWith("91")
        ? digits.slice(2)
        : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits;
    if (local.length < 6) return "+91 XXXXXXXXXX";
    const visible = local.slice(-4);
    const masked = "X".repeat(local.length - 4);
    return `+91 ${masked.slice(0, 3)} ${masked.slice(3)}${visible}`;
};

const normalizeOwnerDocuments = (wire: RentalPropertyDto): OwnerDocument[] =>
    asArray<UnknownRecord>((wire as UnknownRecord).documents)
        .map((item) => ({
            id: firstString(item.id) || undefined,
            documentType: firstString(item.document_type, "document"),
            documentUrl: firstString(item.document_file_url),
            uploadedAt: firstString(item.uploaded_at) || undefined,
        }))
        .filter((item) => Boolean(item.documentUrl));

const normalizeOwner = (wire: RentalPropertyDto): OwnerContact => {
    const ownerName = firstString((wire as UnknownRecord).owner_name, (wire as UnknownRecord).contact_name, "Owner");
    const phone = firstString(wire.contact_phone, (wire as UnknownRecord).owner_phone);
    const documents = normalizeOwnerDocuments(wire);
    return {
        ownerName,
        maskedPhone: phone ? maskPhone(phone) : "Contact locked",
        whatsappNumber: phone || "",
        documents,
    };
};

const resolveCity = (wire: RentalPropertyDto, options: NormalizerContext): { cityId: string; cityName: string } => {
    const rawCity = typeof (wire as UnknownRecord).city === "string" ? String((wire as UnknownRecord).city).trim() : "";
    const cityId = firstString(wire.city_id, readMasterId((wire as UnknownRecord).city), rawCity && isUuidLike(rawCity) ? rawCity : "");
    const cityName = firstString(
        wire.city_name,
        cityId ? options.cityNameById?.[cityId] : "",
        rawCity && !isUuidLike(rawCity) ? rawCity : "",
        !rawCity ? readMasterName((wire as UnknownRecord).city) : ""
    );
    return { cityId, cityName };
};

const resolveLocality = (wire: RentalPropertyDto, options: NormalizerContext): { localityId: string; localityName: string } => {
    const rawLocality =
        typeof (wire as UnknownRecord).locality === "string" ? String((wire as UnknownRecord).locality).trim() : "";
    const localityId = firstString(
        wire.locality_id,
        readMasterId((wire as UnknownRecord).locality),
        rawLocality && isUuidLike(rawLocality) ? rawLocality : ""
    );
    const localityName = firstString(
        wire.locality_name,
        localityId ? options.localityNameById?.[localityId] : "",
        rawLocality && !isUuidLike(rawLocality) ? rawLocality : "",
        !rawLocality ? readMasterName((wire as UnknownRecord).locality) : ""
    );
    return { localityId, localityName };
};

export const normalizeMasterOptions = (payload: WireApiEnvelope<unknown>): RentalMasterOptionDto[] => {
    const unwrapped = unwrapData(payload);
    const list = asArray<UnknownRecord>(unwrapped);
    return list.reduce<RentalMasterOptionDto[]>((acc, item) => {
            const id = firstString(item.id, item.uuid);
            const name = firstString(item.name, item.label, item.code, item.value);
            if (!id || !name) return acc;
            acc.push({
                id,
                name,
                code: firstString(item.code),
                is_active: typeof item.is_active === "boolean" ? item.is_active : undefined,
                sort_order: typeof item.sort_order === "number" ? item.sort_order : undefined,
                state: firstString(item.state),
                country: firstString(item.country),
                city_id: firstString(item.city_id),
                city_name: firstString(item.city_name),
                bhk_value: typeof item.bhk_value === "number" ? item.bhk_value : undefined,
            } satisfies RentalMasterOptionDto);
            return acc;
        }, []);
};

export const normalizePropertyList = (payload: WireApiEnvelope<unknown>, options?: NormalizerOptions): PropertyListItem[] => {
    const fallbackToMock = options?.fallbackToMock ?? false;
    const unwrapped = unwrapData(payload);
    const rawList = Array.isArray(unwrapped)
        ? (unwrapped as RentalPropertyDto[])
        : asRecord(unwrapped)
        ? [unwrapped as RentalPropertyDto]
        : [];

    if (rawList.length === 0) return fallbackToMock ? mockPropertyList : [];

    return rawList.reduce<PropertyListItem[]>((acc, wire, index) => {
        const fallback = fallbackToMock ? mockPropertyList[index % mockPropertyList.length] : null;
        const id = firstString(wire.id, wire.property_id, fallback?.id);
        if (!id) return acc;

        const propertyTitle = firstString(wire.property_title, fallback?.title || "");
        const { cityId, cityName } = resolveCity(wire, options || {});
        const { localityId, localityName } = resolveLocality(wire, options || {});
        const pricePerMonth = numberOrFallback(wire.rent, fallback?.pricePerMonth || 0);
        const deposit = numberOrFallback(wire.deposit, fallback?.deposit || 0);
        const furnishingName = firstString(wire.furnishing_name, wire.furnishing_code).toLowerCase();
        const furnished = furnishingName.includes("full") || furnishingName.includes("semi") ? true : fallback?.furnished || false;
        const images = toImageCandidates(wire).map((item) => item.url);
        const primaryImage = firstString(images[0], fallback?.image || "");
        const bhk = toBhk(wire);
        const propertyTypes = toPropertyTypes(wire);
        const moveInOptions = toMoveInOptions(wire);
        const keywords = normalizeKeywords(wire);
        const amenities = normalizeAmenities(wire, options || {});
        const amenityIds = normalizeAmenityIds(wire);
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
            verificationStatus: firstString(wire.verification_status),
            statusReason: firstString(wire.status_reason),
            lastStatusAt: firstString(wire.last_status_at),
            isVerified: typeof wire.is_verified === "boolean" ? wire.is_verified : undefined,
            isActive: typeof wire.is_active === "boolean" ? wire.is_active : undefined,
            isPubliclyVisible: typeof wire.is_publicly_visible === "boolean" ? wire.is_publicly_visible : undefined,
            moveInOptions,
            badges: keywords.length > 0 ? keywords.slice(0, 2) : fallback?.badges || [],
            features: amenities.length > 0 ? amenities.slice(0, 2) : fallback?.features || [],
            amenityIds,
        } satisfies PropertyListItem);

        return acc;
    }, []);
};

const findWireProperty = (payload: WireApiEnvelope<unknown>, propertyId: string): RentalPropertyDto | null => {
    const unwrapped = unwrapData(payload);
    if (Array.isArray(unwrapped)) {
        const found = (unwrapped as RentalPropertyDto[]).find((item) =>
            [item.id, item.property_id].some((id) => String(id ?? "") === propertyId)
        );
        return found || null;
    }

    const record = asRecord(unwrapped);
    if (!record) return null;

    if (record.property && asRecord(record.property)) {
        return record.property as RentalPropertyDto;
    }

    return record as RentalPropertyDto;
};

export const normalizePropertyDetail = (
    payload: WireApiEnvelope<unknown>,
    propertyId: string,
    options?: NormalizerOptions
): PropertyDetail => {
    const fallbackToMock = options?.fallbackToMock ?? false;
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
            owner: { ownerName: "Owner", maskedPhone: "Contact locked", whatsappNumber: "" },
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
    const keywordHighlights = normalizeKeywords(wire);
    const amenityIds = normalizeAmenityIds(wire);
    const owner = normalizeOwner(wire);
    const detailBase = fallbackToMock
        ? fallback || mockPropertyDetails[0]
        : {
              description: "",
              mapPreviewLabel: "",
              mapPreviewSubLabel: "",
              amenities: [] as string[],
              highlights: [] as string[],
              owner: { ownerName: "Owner", maskedPhone: "Contact locked", whatsappNumber: "" },
              unlockOffer: DEFAULT_UNLOCK_OFFER,
          };

    return {
        ...detailBase,
        ...listBase,
        description: stripMapLinksFromDescription(firstString(wire.description, detailBase.description, "")),
        mapPreviewLabel: firstString(
            (wire as UnknownRecord).map_preview_label,
            `${listBase.locality}, ${listBase.city}`,
            detailBase.mapPreviewLabel
        ),
        mapPreviewSubLabel: firstString(
            (wire as UnknownRecord).map_preview_sub_label,
            "Unlock map + direct call with Day Pass (₹99)",
            detailBase.mapPreviewSubLabel
        ),
        amenities: amenities.length > 0 ? amenities : detailBase.amenities,
        amenityIds,
        highlights: keywordHighlights.length > 0 ? keywordHighlights : detailBase.highlights,
        owner,
        mapUrl: firstString((wire as UnknownRecord).map_url),
        latitude: firstString((wire as UnknownRecord).latitude),
        longitude: firstString((wire as UnknownRecord).longitude),
        availableFrom: firstString((wire as UnknownRecord).available_from),
        addressLine: firstString(wire.address_line),
        builtUpAreaSqft: readNullablePositiveInt(wire.built_up_area_sqft),
        propertyTypeLabel: firstString(wire.property_type_name),
        bhkLabel: firstString(wire.bhk_name),
        furnishingLabel: firstString(wire.furnishing_name),
        availabilityLabel: firstString(wire.availability_name),
        listedByEmployeeName: firstString(wire.listed_by_employee_name),
    };
};

export const normalizeLocalitiesFromProperties = (items: PropertyListItem[]): string[] =>
    Array.from(new Set(items.map((item) => item.locality).filter(Boolean))).sort((a, b) => a.localeCompare(b));

export const toMasterSelectOption = (wire: RentalMasterOptionDto): { id: string; name: string } => ({
    id: firstString(wire.id, wire.code),
    name: firstString(wire.name, wire.code),
});

export const extractErrorMessage = (error: unknown, fallback = "Something went wrong"): string => {
    if (error instanceof Error && error.message.trim()) return error.message.trim();
    const record = asRecord(error);
    if (!record) return fallback;
    const message = firstString(record.message, record.error, record.detail, record.non_field_errors);
    if (message) return message;
    const fieldErrors = asRecord(record.field_errors);
    if (fieldErrors) {
        for (const value of Object.values(fieldErrors)) {
            if (typeof value === "string" && value.trim()) return value.trim();
            if (Array.isArray(value)) {
                const first = value.find((entry) => typeof entry === "string" && entry.trim());
                if (typeof first === "string") return first.trim();
            }
        }
    }
    const data = asRecord(record.data);
    if (data) {
        const nested = firstString(data.message, data.error, data.detail);
        if (nested) return nested;
    }
    return fallback;
};
