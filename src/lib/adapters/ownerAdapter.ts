import {
    OwnerDashboardData,
    OwnerLeadCard,
    OwnerListingAdapter,
    OwnerListingVerificationState,
    OwnerListingFormInput,
    OwnerSubmissionPrefill,
    OwnerListingSummary,
    OwnerMastersData,
    OwnerVerificationResult,
    SelectOption,
} from "@/lib/adapters/types";
import { mockPropertyList } from "@/mocks/properties";
import {
    addUnlockedOwnerContact,
    consumeCredit,
    extractErrorMessage,
    getCredits,
    getUnlockedOwnerContacts,
    isUuidLike,
    normalizeMasterOptions,
    normalizePropertyList,
    RENTALS_MOCK_MODE,
    rentalsService,
    toMasterSelectOption,
    UnknownRecord,
    WireApiEnvelope,
    RentalMasterOptionDto,
    RentalPropertyDto,
    OwnerPropertyUpsertPayload,
} from "@/lib/rentals";
import { userService } from "@/lib/api";
import { authAdapter } from "@/lib/adapters/authAdapter";
import { isVideoMediaUrl, PropertyMediaItem } from "@/lib/rentals/mediaUtils";

const OWNER_LEADS_KEY = "spoto_owner_leads_v1";

const defaultFormInput: OwnerListingFormInput = {
    propertyTitle: "",
    ownerName: "",
    employeeId: "",
    propertyTypeId: "",
    cityId: "",
    localityId: "",
    bhkId: "",
    furnishingId: "",
    availabilityId: "",
    rent: "",
    deposit: "",
    builtUpAreaSqft: "",
    addressLine: "",
    streetLocalityArea: "",
    landmark: "",
    mapUrl: "",
    latitude: "",
    longitude: "",
    description: "",
    contactPhone: "",
    amenityIds: [],
    keywords: [],
    documentType: "",
    imageFiles: [],
    existingMediaItems: [],
    documentFile: null,
    documentMeta: { uploadState: "idle" },
    availableFromDate: "",
    availabilityMode: "immediate",
};

const defaultLeads: OwnerLeadCard[] = RENTALS_MOCK_MODE
    ? [
          {
              id: "lead-1",
              tenantName: "Aman",
              phoneMasked: "+91-7XX32-XXXX",
              phone: "+917003220551",
              state: "unlocked",
              propertyId: mockPropertyList[0]?.id || "listing-1",
              unlockedAt: new Date().toISOString(),
          },
          {
              id: "lead-2",
              tenantName: "Ritika",
              phoneMasked: "+91-9XX34-XXXX",
              phone: "+919843400000",
              state: "locked",
              propertyId: mockPropertyList[0]?.id || "listing-1",
          },
      ]
    : [];

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

type AdapterError = Error & {
    fieldErrors?: Record<string, string | string[]>;
    data?: unknown;
};

const toAdapterError = (error: unknown, fallback: string): AdapterError => {
    const message = extractErrorMessage(error, fallback);
    const next = new Error(message) as AdapterError;
    if (error && typeof error === "object") {
        const typed = error as { fieldErrors?: Record<string, string | string[]>; data?: unknown };
        if (typed.fieldErrors) next.fieldErrors = typed.fieldErrors;
        if (typed.data) next.data = typed.data;
        if (!typed.fieldErrors && typed.data && typeof typed.data === "object") {
            const payload = typed.data as { field_errors?: Record<string, string | string[]> };
            if (payload.field_errors) next.fieldErrors = payload.field_errors;
        }
    }
    return next;
};

const firstString = (...values: unknown[]): string => {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
        if (typeof value === "number" && Number.isFinite(value)) return String(value);
    }
    return "";
};

const isBrowser = () => typeof window !== "undefined";

const readLeads = (): OwnerLeadCard[] => {
    if (!isBrowser()) return defaultLeads;
    const raw = localStorage.getItem(OWNER_LEADS_KEY);
    if (!raw) return defaultLeads;
    try {
        return JSON.parse(raw) as OwnerLeadCard[];
    } catch {
        return defaultLeads;
    }
};

const writeLeads = (leads: OwnerLeadCard[]) => {
    if (!isBrowser()) return;
    localStorage.setItem(OWNER_LEADS_KEY, JSON.stringify(leads));
};

const fallbackOptions = (values: string[]): SelectOption[] =>
    values.map((value) => ({
        id: value,
        name: value,
    }));

const defaultMasters = (): OwnerMastersData => ({
    cities: fallbackOptions(["Bengaluru"]),
    localities: fallbackOptions(Array.from(new Set(mockPropertyList.map((item) => item.locality)))),
    propertyTypes: fallbackOptions(["Rent House", "PG", "Zero Deposit", "Co-Living"]),
    bhkTypes: fallbackOptions(["1 RK", "1 BHK", "2 BHK", "3 BHK"]),
    furnishingTypes: fallbackOptions(["Fully Furnished", "Semi Furnished", "Unfurnished"]),
    availabilityTypes: fallbackOptions(["Immediate", "In 15 days", "In 30 days"]),
    amenities: fallbackOptions(["Wifi", "Lift", "Power Backup", "Wardrobe", "Fridge"]),
    keywords: fallbackOptions(["Near Metro", "Tech Park", "Road Facing"]),
});

const unwrapData = (payload: WireApiEnvelope<unknown>) => {
    const record = asRecord(payload);
    if (!record) return payload;
    if (record.data !== undefined) return record.data;
    if (record.results !== undefined) return record.results;
    if (record.items !== undefined) return record.items;
    return payload;
};

const unwrapToList = (payload: WireApiEnvelope<unknown>): RentalPropertyDto[] => {
    const data = unwrapData(payload);
    if (Array.isArray(data)) return data as RentalPropertyDto[];
    const record = asRecord(data);
    if (record) return [record as RentalPropertyDto];
    return [];
};

const toMap = (options: SelectOption[]): Record<string, string> =>
    options.reduce<Record<string, string>>((acc, option) => {
        acc[option.id] = option.name;
        return acc;
    }, {});

const toToken = (value: string) =>
    value
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const toIdByTokenMap = (wires: RentalMasterOptionDto[]): Record<string, string> =>
    wires.reduce<Record<string, string>>((acc, wire) => {
        const id = `${wire.id || ""}`.trim();
        if (!id) return acc;
        const tokens = [wire.name, wire.code, `${wire.bhk_value || ""}`]
            .map((value) => toToken(`${value || ""}`))
            .filter(Boolean);
        tokens.forEach((token) => {
            acc[token] = id;
        });
        return acc;
    }, {});

const buildNormalizationContext = async (payload: WireApiEnvelope<unknown>) => {
    const wires = unwrapToList(payload);
    const cityIds = new Set<string>();
    wires.forEach((wire) => {
        const cityId = `${wire.city_id || ""}`.trim();
        if (isUuidLike(cityId)) cityIds.add(cityId);
    });

    const [citiesRes, amenitiesRes, localitiesRes, propertyTypesRes, bhkRes, furnishingRes, availabilityRes] =
        await Promise.allSettled([
            rentalsService.listCities(),
            rentalsService.listAmenities(),
            Promise.all(Array.from(cityIds).map((cityId) => rentalsService.listLocalities(cityId))),
            rentalsService.listPropertyTypes(),
            rentalsService.listBhkTypes(),
            rentalsService.listFurnishingTypes(),
            rentalsService.listAvailabilityTypes(),
        ]);

    const propertyTypeWires =
        propertyTypesRes.status === "fulfilled" ? normalizeMasterOptions(propertyTypesRes.value) : [];
    const bhkWires = bhkRes.status === "fulfilled" ? normalizeMasterOptions(bhkRes.value) : [];
    const furnishingWires = furnishingRes.status === "fulfilled" ? normalizeMasterOptions(furnishingRes.value) : [];
    const availabilityWires =
        availabilityRes.status === "fulfilled" ? normalizeMasterOptions(availabilityRes.value) : [];

    const cityNameById =
        citiesRes.status === "fulfilled" ? toMap(normalizeMasterOptions(citiesRes.value).map(toMasterSelectOption)) : {};
    const amenityNameById =
        amenitiesRes.status === "fulfilled" ? toMap(normalizeMasterOptions(amenitiesRes.value).map(toMasterSelectOption)) : {};
    const localityNameById =
        localitiesRes.status === "fulfilled"
            ? localitiesRes.value
                  .flatMap((item) => normalizeMasterOptions(item))
                  .map(toMasterSelectOption)
                  .reduce<Record<string, string>>((acc, option) => {
                      acc[option.id] = option.name;
                      return acc;
                  }, {})
            : {};

    return {
        cityNameById,
        localityNameById,
        amenityNameById,
        propertyTypeIdByToken: toIdByTokenMap(propertyTypeWires),
        bhkIdByToken: toIdByTokenMap(bhkWires),
        furnishingIdByToken: toIdByTokenMap(furnishingWires),
        availabilityIdByToken: toIdByTokenMap(availabilityWires),
    };
};

const mapVerificationState = (params: {
    verificationStatus?: string;
    status?: string;
    isVerified?: boolean;
    isActive?: boolean;
    isPubliclyVisible?: boolean;
}): OwnerListingVerificationState => {
    const raw = firstString(params.verificationStatus, params.status).toLowerCase();
    if (raw === "live") return "live";
    if (raw === "awaiting_owner_login") return "awaiting_owner_login";
    if (raw === "rejected") return "rejected";
    if (raw === "verification_pending") return "verification_pending";
    if (raw === "verification_retry") return "verification_retry";
    if (raw === "verifying") return "verifying";
    if (raw === "in_review") return "in_review";

    if (params.isPubliclyVisible === true) return "live";
    if (params.isVerified === true && params.isActive !== false) return "live";
    if (params.isVerified === false) return "in_review";
    return "in_review";
};

const verificationMessage = (state: OwnerListingVerificationState, reason?: string): string => {
    if (reason && reason.trim()) return reason.trim();
    if (state === "live") return "Property is live now.";
    if (state === "awaiting_owner_login") {
        return "Your field agent submitted this listing. Log in with this phone number to activate it.";
    }
    if (state === "rejected") return "Property verification was rejected.";
    if (state === "verifying" || state === "verification_retry" || state === "verification_pending") {
        return "Employee code verification is in progress.";
    }
    return "Property is under review.";
};

const toSummary = (listing: ReturnType<typeof normalizePropertyList>[number]): OwnerListingSummary => {
    const verificationStatus = firstString(listing.verificationStatus, listing.status);
    const resolved = mapVerificationState({
        verificationStatus,
        status: listing.status,
        isVerified: listing.isVerified,
        isActive: listing.isActive,
        isPubliclyVisible: listing.isPubliclyVisible,
    });

    return {
        id: listing.id,
        title: listing.propertyTitle || listing.title,
        locality: listing.locality,
        city: listing.city,
        rent: listing.pricePerMonth,
        deposit: listing.deposit,
        status: listing.status || verificationStatus || "in_review",
        verificationStatus: verificationStatus || undefined,
        statusReason: listing.statusReason,
        lastStatusAt: listing.lastStatusAt,
        image: listing.image,
        updatedAt: new Date().toISOString(),
        isVerified: listing.isVerified,
        isActive: listing.isActive,
        isPubliclyVisible: listing.isPubliclyVisible,
        verificationState: resolved,
        verificationMessage: verificationMessage(resolved, listing.statusReason),
    };
};

const titleFromInput = (input: OwnerListingFormInput) => input.propertyTitle.trim();

const composeDescription = (input: OwnerListingFormInput): string => {
    const direct = input.description.trim();
    const extra = [input.streetLocalityArea, input.landmark, input.mapUrl]
        .map((value) => (value || "").trim())
        .filter(Boolean)
        .join("\n");
    if (direct && extra) return `${direct}\n${extra}`.trim();
    return direct || extra;
};

const toUpsertPayload = (input: OwnerListingFormInput): OwnerPropertyUpsertPayload => ({
    propertyTitle: titleFromInput(input),
    ownerName: (input.ownerName || "").trim() || undefined,
    employeeId: (input.employeeId || "").trim() || undefined,
    propertyTypeId: input.propertyTypeId,
    cityId: input.cityId,
    localityId: input.localityId,
    localityName: input.localityName,
    bhkId: input.bhkId,
    furnishingId: input.furnishingId,
    availabilityId: input.availabilityId,
    availableFrom:
        input.availabilityMode === "date" && (input.availableFromDate || "").trim()
            ? (input.availableFromDate || "").trim()
            : undefined,
    mapUrl: (input.mapUrl || "").trim() || undefined,
    latitude: (input.latitude || "").trim() || undefined,
    longitude: (input.longitude || "").trim() || undefined,
    rent: Number(input.rent || 0),
    deposit: Number(input.deposit || 0),
    builtUpAreaSqft: Number(input.builtUpAreaSqft || 0),
    addressLine: input.addressLine.trim(),
    description: composeDescription(input),
    contactPhone: input.contactPhone.trim(),
    amenityIds: input.amenityIds.filter((item) => isUuidLike(item)),
    keywords: Array.from(new Set((input.keywords || []).map((item) => item.trim()).filter(Boolean))),
    documentType: input.documentType || undefined,
    imageFiles: input.imageFiles,
    documentFile: input.documentFile,
    clearImages: input.clearImages,
    clearDocuments: input.clearDocuments,
    deleteImageIds: (input.deletedImageIds || []).filter(Boolean),
});

const toComparableString = (value: unknown) => JSON.stringify(value ?? null);

const buildChangedKeys = (
    current: OwnerPropertyUpsertPayload,
    previous: OwnerPropertyUpsertPayload
): Set<keyof OwnerPropertyUpsertPayload> => {
    const changed = new Set<keyof OwnerPropertyUpsertPayload>();
    (Object.keys(current) as Array<keyof OwnerPropertyUpsertPayload>).forEach((key) => {
        if (toComparableString(current[key]) !== toComparableString(previous[key])) {
            changed.add(key);
        }
    });
    return changed;
};

const toPayloadFromWire = (wire: RentalPropertyDto): OwnerPropertyUpsertPayload => ({
    propertyTitle: firstString(wire.property_title),
    ownerName: firstString((wire as UnknownRecord).owner_name, (wire as UnknownRecord).contact_name) || undefined,
    employeeId: firstString((wire as UnknownRecord).listed_by_employee_id) || undefined,
    propertyTypeId: firstString(wire.property_type_id),
    cityId: firstString(wire.city_id),
    localityId: firstString(wire.locality_id),
    bhkId: firstString(wire.bhk_id),
    furnishingId: firstString(wire.furnishing_id),
    availabilityId: firstString(wire.availability_id),
    availableFrom: firstString((wire as UnknownRecord).available_from),
    mapUrl: firstString((wire as UnknownRecord).map_url),
    latitude: firstString((wire as UnknownRecord).latitude),
    longitude: firstString((wire as UnknownRecord).longitude),
    rent: Number(wire.rent || 0),
    deposit: Number(wire.deposit || 0),
    builtUpAreaSqft: Number(wire.built_up_area_sqft || 0),
    addressLine: firstString(wire.address_line),
    description: firstString(wire.description),
    contactPhone: firstString(wire.contact_phone),
    ownerPhone: firstString(wire.contact_phone).replace(/\D/g, "").slice(-10) || undefined,
    amenityIds: (() => {
        const fromObjects = asArray<RentalMasterOptionDto>(wire.amenities)
            .map((item) => firstString(item.id))
            .filter(Boolean);
        if (fromObjects.length > 0) return fromObjects;
        return parseStringArray(wire.amenity_ids).filter(Boolean);
    })(),
    keywords: parseStringArray(wire.keywords),
    documentType: undefined,
    imageFiles: [],
    documentFile: null,
    clearImages: false,
    clearDocuments: false,
    deleteImageIds: [],
});

const toExistingMediaFromWire = (wire: RentalPropertyDto): PropertyMediaItem[] => {
    return asArray<UnknownRecord>(wire.images)
        .map((img) => {
            const mediaTypeRaw = firstString(img.media_type).toLowerCase();
            const videoUrl = firstString(img.video_url, img.media_url);
            const imageUrl = firstString(img.image_url, img.media_url, img.url);
            const isVideo = mediaTypeRaw === "video" || (Boolean(videoUrl) && !imageUrl);
            const url = isVideo ? videoUrl || imageUrl : imageUrl || videoUrl;
            if (!url) return null;
            return {
                id: firstString(img.id) || undefined,
                url,
                mediaType: isVideo || isVideoMediaUrl(url) ? ("video" as const) : ("image" as const),
            };
        })
        .filter((item): item is PropertyMediaItem => item !== null);
};

const toFormFromWire = (wire: RentalPropertyDto): OwnerListingFormInput => ({
    ...defaultFormInput,
    propertyTitle: firstString(wire.property_title),
    ownerName: firstString((wire as UnknownRecord).owner_name, (wire as UnknownRecord).contact_name),
    employeeId: firstString((wire as UnknownRecord).listed_by_employee_id),
    propertyTypeId: firstString(wire.property_type_id),
    cityId: firstString(wire.city_id),
    localityId: firstString(wire.locality_id),
    bhkId: firstString(wire.bhk_id),
    furnishingId: firstString(wire.furnishing_id),
    availabilityId: firstString(wire.availability_id),
    availableFromDate: firstString((wire as UnknownRecord).available_from),
    availabilityMode: firstString((wire as UnknownRecord).available_from) ? "date" : "immediate",
    mapUrl: firstString((wire as UnknownRecord).map_url),
    latitude: firstString((wire as UnknownRecord).latitude),
    longitude: firstString((wire as UnknownRecord).longitude),
    rent: firstString(wire.rent),
    deposit: firstString(wire.deposit),
    builtUpAreaSqft: firstString(wire.built_up_area_sqft),
    addressLine: firstString(wire.address_line),
    description: firstString(wire.description),
    contactPhone: firstString(wire.contact_phone).replace(/\D/g, "").slice(-10),
    amenityIds: (() => {
        const fromObjects = asArray<RentalMasterOptionDto>(wire.amenities)
            .map((item) => firstString(item.id))
            .filter(Boolean);
        if (fromObjects.length > 0) return fromObjects;
        return parseStringArray(wire.amenity_ids).filter(Boolean);
    })(),
    keywords: parseStringArray(wire.keywords),
    existingMediaItems: toExistingMediaFromWire(wire),
    documentType: firstString(asArray<UnknownRecord>((wire as UnknownRecord).documents)[0]?.document_type),
    documentMeta: (() => {
        const documents = asArray<UnknownRecord>((wire as UnknownRecord).documents);
        const latest = documents[0];
        const existingDocumentUrl = firstString(latest?.document_file_url);
        const existingUploadedAt = firstString(latest?.uploaded_at);
        const existingDocumentType = firstString(latest?.document_type);
        return {
            uploadState: existingDocumentUrl ? "uploaded" : "idle",
            existingDocumentUrl: existingDocumentUrl || undefined,
            existingUploadedAt: existingUploadedAt || undefined,
            existingDocumentType: existingDocumentType || undefined,
            selectedName: existingDocumentUrl ? existingDocumentUrl.split("/").pop() : undefined,
        };
    })(),
});

const getCreatedPropertyMeta = (
    payload: WireApiEnvelope<unknown>
): { propertyId: string; isVerified: boolean | null; verificationStatus: string } => {
    const data = asRecord(unwrapData(payload));
    const propertyId = firstString(data?.property_id, data?.id);
    const isVerified = typeof data?.is_verified === "boolean" ? data.is_verified : null;
    const verificationStatus = firstString(data?.verification_status, data?.status);
    return { propertyId, isVerified, verificationStatus };
};

class HybridOwnerAdapter implements OwnerListingAdapter {
    async getOwnerEntryRoute(): Promise<"/owner/dashboard" | "/owner/list-property"> {
        return "/owner/dashboard";
    }

    async getOwnerSubmissionPrefill(): Promise<OwnerSubmissionPrefill> {
        try {
            const [userData, session] = await Promise.allSettled([
                userService.getUserDetails(),
                Promise.resolve(authAdapter.getSession()),
            ]);

            const firstName = userData.status === "fulfilled" ? firstString(userData.value?.first_name) : "";
            const lastName = userData.status === "fulfilled" ? firstString(userData.value?.last_name) : "";
            const ownerName = `${firstName} ${lastName}`.trim();
            const phoneFromUser = userData.status === "fulfilled" ? firstString(userData.value?.phone) : "";
            const phoneFromSession = session.status === "fulfilled" ? firstString(session.value?.phone) : "";

            const contactPhone = firstString(phoneFromUser, phoneFromSession).replace(/\D/g, "").slice(-10);
            return {
                ownerName: ownerName || undefined,
                contactPhone: contactPhone || undefined,
            };
        } catch {
            return {};
        }
    }

    async getDashboard(): Promise<OwnerDashboardData> {
        try {
            const [ownerResponse, userResponse] = await Promise.allSettled([
                rentalsService.getOwnerProperties(),
                userService.getUserDetails(),
            ]);
            if (ownerResponse.status !== "fulfilled") {
                throw ownerResponse.reason;
            }
            const response = ownerResponse.value;
            const context = await buildNormalizationContext(response);
            const listings = normalizePropertyList(response, { fallbackToMock: false, ...context }).map(toSummary);
            const ownerName =
                userResponse.status === "fulfilled"
                    ? `${firstString(userResponse.value?.first_name)} ${firstString(userResponse.value?.last_name)}`.trim() ||
                      "Owner"
                    : "Owner";
            return {
                ownerName,
                creditsLeft: getCredits("owner"),
                listings,
                leads: readLeads(),
            };
        } catch (error) {
            if (RENTALS_MOCK_MODE) {
                return {
                    ownerName: "Owner",
                    creditsLeft: getCredits("owner"),
                    listings: mockPropertyList.map((item) => toSummary(item)),
                    leads: readLeads(),
                };
            }
            throw toAdapterError(error, "Unable to load owner dashboard");
        }
    }

    async getMasters(cityId?: string): Promise<OwnerMastersData> {
        const [cities, propertyTypes, bhkTypes, furnishingTypes, availabilityTypes, amenities] =
            await Promise.allSettled([
                rentalsService.listCities(),
                rentalsService.listPropertyTypes(),
                rentalsService.listBhkTypes(),
                rentalsService.listFurnishingTypes(),
                rentalsService.listAvailabilityTypes(),
                rentalsService.listAmenities(),
            ]);

        const cityOptions =
            cities.status === "fulfilled" ? normalizeMasterOptions(cities.value).map(toMasterSelectOption) : [];
        const effectiveCityId = cityId || (cityOptions.length === 1 ? cityOptions[0].id : undefined);
        const localities = effectiveCityId
            ? await Promise.allSettled([rentalsService.listLocalities(effectiveCityId)])
            : [];
        const localitiesResult = localities[0];

        const parsed: OwnerMastersData = {
            cities: cityOptions,
            localities:
                localitiesResult && localitiesResult.status === "fulfilled"
                    ? normalizeMasterOptions(localitiesResult.value).map(toMasterSelectOption)
                    : [],
            propertyTypes:
                propertyTypes.status === "fulfilled" ? normalizeMasterOptions(propertyTypes.value).map(toMasterSelectOption) : [],
            bhkTypes: bhkTypes.status === "fulfilled" ? normalizeMasterOptions(bhkTypes.value).map(toMasterSelectOption) : [],
            furnishingTypes:
                furnishingTypes.status === "fulfilled"
                    ? normalizeMasterOptions(furnishingTypes.value).map(toMasterSelectOption)
                    : [],
            availabilityTypes:
                availabilityTypes.status === "fulfilled"
                    ? normalizeMasterOptions(availabilityTypes.value).map(toMasterSelectOption)
                    : [],
            amenities: amenities.status === "fulfilled" ? normalizeMasterOptions(amenities.value).map(toMasterSelectOption) : [],
            keywords: [],
        };

        if (RENTALS_MOCK_MODE) {
            const fallback = defaultMasters();
            return {
                cities: parsed.cities.length > 0 ? parsed.cities : fallback.cities,
                localities: parsed.localities.length > 0 ? parsed.localities : fallback.localities,
                propertyTypes: parsed.propertyTypes.length > 0 ? parsed.propertyTypes : fallback.propertyTypes,
                bhkTypes: parsed.bhkTypes.length > 0 ? parsed.bhkTypes : fallback.bhkTypes,
                furnishingTypes: parsed.furnishingTypes.length > 0 ? parsed.furnishingTypes : fallback.furnishingTypes,
                availabilityTypes: parsed.availabilityTypes.length > 0 ? parsed.availabilityTypes : fallback.availabilityTypes,
                amenities: parsed.amenities.length > 0 ? parsed.amenities : fallback.amenities,
                keywords: parsed.keywords.length > 0 ? parsed.keywords : fallback.keywords,
            };
        }

        return parsed;
    }

    async getPropertyForEdit(id: string): Promise<OwnerListingFormInput> {
        try {
            const response = await rentalsService.getOwnerProperties();
            const wires = unwrapToList(response);
            const wire = wires.find((item) => firstString(item.id, item.property_id) === id);
            if (!wire) {
                throw new Error("Property not found in owner listings.");
            }
            return toFormFromWire(wire);
        } catch (error) {
            if (RENTALS_MOCK_MODE) return defaultFormInput;
            throw toAdapterError(error, "Unable to load listing for edit");
        }
    }

    async createProperty(input: OwnerListingFormInput): Promise<OwnerListingSummary> {
        return this.submitListingFinalStep(input);
    }

    async submitListingFinalStep(input: OwnerListingFormInput): Promise<OwnerListingSummary> {
        if (titleFromInput(input).length === 0) {
            throw new Error("Property title is required");
        }

        try {
            const response = await rentalsService.createOwnerProperty(toUpsertPayload(input));
            const { propertyId, isVerified, verificationStatus } = getCreatedPropertyMeta(response);
            const dashboard = await this.getDashboard();
            const created = dashboard.listings.find((item) => item.id === propertyId);
            if (created) return { ...created, isVerified: created.isVerified ?? isVerified ?? undefined };
            if (!propertyId) {
                throw new Error("Create succeeded but property_id was missing in backend response.");
            }

            const mappedVerification = mapVerificationState({
                verificationStatus: verificationStatus || (isVerified ? "live" : "in_review"),
                isVerified: isVerified ?? undefined,
                isActive: isVerified ?? undefined,
                isPubliclyVisible: Boolean(isVerified),
            });

            return {
                id: propertyId,
                title: titleFromInput(input),
                locality: "",
                city: "",
                rent: Number(input.rent || 0),
                deposit: Number(input.deposit || 0),
                status: verificationStatus || (isVerified ? "live" : "in_review"),
                verificationStatus: verificationStatus || (isVerified ? "live" : "in_review"),
                image: "",
                updatedAt: new Date().toISOString(),
                isVerified: isVerified ?? undefined,
                isPubliclyVisible: Boolean(isVerified),
                verificationState: mappedVerification,
                verificationMessage: verificationMessage(mappedVerification),
            };
        } catch (error) {
            if (RENTALS_MOCK_MODE) {
                return {
                    id: `owner-${Date.now()}`,
                    title: titleFromInput(input),
                    locality: input.localityId || "Bengaluru",
                    city: input.cityId || "Bengaluru",
                    rent: Number(input.rent || 0),
                    deposit: Number(input.deposit || 0),
                    status: "in_review",
                    verificationStatus: "in_review",
                    image: mockPropertyList[0]?.image || "",
                    updatedAt: new Date().toISOString(),
                    verificationState: "in_review",
                    verificationMessage: verificationMessage("in_review"),
                };
            }
            throw toAdapterError(error, "Unable to publish listing");
        }
    }

    async updateProperty(id: string, input: OwnerListingFormInput): Promise<OwnerListingSummary> {
        if (titleFromInput(input).length === 0) {
            throw new Error("Property title is required");
        }

        try {
            const response = await rentalsService.getOwnerProperties();
            const wires = unwrapToList(response);
            const wire = wires.find((item) => firstString(item.id, item.property_id) === id);
            if (!wire) {
                throw new Error("Property not found for update.");
            }

            const previous = toPayloadFromWire(wire);
            const current = toUpsertPayload(input);
            const changedKeys = buildChangedKeys(current, previous);

            if (input.imageFiles.length > 0) changedKeys.add("imageFiles");
            if (input.documentFile) changedKeys.add("documentFile");
            if (input.clearImages) changedKeys.add("clearImages");
            if (input.clearDocuments) changedKeys.add("clearDocuments");
            if ((input.deletedImageIds?.length || 0) > 0) changedKeys.add("deleteImageIds");

            if (changedKeys.size === 0) {
                throw new Error("No changes to update.");
            }

            await rentalsService.updateOwnerProperty(id, current, changedKeys);
            const dashboard = await this.getDashboard();
            const updated = dashboard.listings.find((item) => item.id === id);
            if (updated) return updated;
            throw new Error("Update succeeded but refreshed owner dashboard did not return this listing.");
        } catch (error) {
            if (RENTALS_MOCK_MODE) {
                return {
                    id,
                    title: titleFromInput(input),
                    locality: input.localityId || "Bengaluru",
                    city: input.cityId || "Bengaluru",
                    rent: Number(input.rent || 0),
                    deposit: Number(input.deposit || 0),
                    status: "in_review",
                    verificationStatus: "in_review",
                    image: mockPropertyList[0]?.image || "",
                    updatedAt: new Date().toISOString(),
                    verificationState: "in_review",
                    verificationMessage: verificationMessage("in_review"),
                };
            }
            throw toAdapterError(error, "Unable to update listing");
        }
    }

    async deleteProperty(id: string): Promise<void> {
        try {
            await rentalsService.deleteOwnerProperty(id);
        } catch (error) {
            if (RENTALS_MOCK_MODE) return;
            throw toAdapterError(error, "Unable to delete listing");
        }
    }

    async submitEmployeeCode(propertyId: string, employeeCode: string): Promise<OwnerVerificationResult> {
        const normalized = employeeCode.trim();
        if (!normalized) {
            throw new Error("Please enter employee code.");
        }
        const dashboard = await this.getDashboard();
        const current = dashboard.listings.find((item) => item.id === propertyId);
        if (!current) {
            throw new Error("Listing not found.");
        }
        if ((current.verificationState || "").toLowerCase() === "rejected") {
            throw new Error("This listing was rejected. Edit and resubmit before trying employee code again.");
        }

        const response = await rentalsService.getOwnerProperties();
        const wires = unwrapToList(response);
        const wire = wires.find((item) => firstString(item.id, item.property_id) === propertyId);
        if (!wire) {
            throw new Error("Listing not found in owner properties.");
        }

        const payload = toPayloadFromWire(wire);
        payload.employeeId = normalized;
        await rentalsService.updateOwnerProperty(
            propertyId,
            payload,
            new Set<keyof OwnerPropertyUpsertPayload>(["employeeId"])
        );

        const refreshed = await this.getDashboard();
        const updated = refreshed.listings.find((item) => item.id === propertyId);
        const state = updated?.verificationState || "in_review";
        return {
            propertyId,
            verificationState: state,
            message: updated?.verificationMessage || verificationMessage(state, updated?.statusReason),
        };
    }

    async getVerificationStatus(propertyId: string): Promise<OwnerListingVerificationState> {
        const dashboard = await this.getDashboard();
        const listing = dashboard.listings.find((item) => item.id === propertyId);
        if (listing?.verificationState) return listing.verificationState;
        return "in_review";
    }

    async unlockLead(leadId: string): Promise<OwnerLeadCard> {
        const leads = readLeads();
        const target = leads.find((lead) => lead.id === leadId);
        if (!target) throw new Error("Lead not found");
        if (target.state === "unlocked") return target;

        const creditResult = consumeCredit("owner");
        if (!creditResult.success) {
            throw new Error("No free credits left");
        }

        const unlocked: OwnerLeadCard = {
            ...target,
            state: "unlocked",
            unlockedAt: new Date().toISOString(),
        };

        const next = leads.map((lead) => (lead.id === leadId ? unlocked : lead));
        writeLeads(next);

        addUnlockedOwnerContact({
            id: `owner_unlock_${Date.now()}`,
            propertyId: unlocked.propertyId,
            name: unlocked.tenantName,
            phone: unlocked.phone,
            source: "mock",
            unlockedAt: unlocked.unlockedAt || new Date().toISOString(),
        });

        return unlocked;
    }
}

export const ownerAdapter = new HybridOwnerAdapter();

export const getOwnerUnlockedContacts = () => getUnlockedOwnerContacts();

export { toFormFromWire, toPayloadFromWire, buildChangedKeys, unwrapToList as unwrapRentalPropertyList };
