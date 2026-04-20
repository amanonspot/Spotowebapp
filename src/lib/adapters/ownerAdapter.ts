import {
    OwnerDashboardData,
    OwnerLeadCard,
    OwnerListingAdapter,
    OwnerListingFormInput,
    OwnerListingSummary,
    OwnerMastersData,
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

const OWNER_LEADS_KEY = "spoto_owner_leads_v1";

const defaultFormInput: OwnerListingFormInput = {
    propertyTitle: "",
    title: "",
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
    description: "",
    contactPhone: "",
    amenityIds: [],
    keywords: [],
    documentType: "",
    imageFiles: [],
    documentFile: null,
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

    const [citiesRes, amenitiesRes, keywordsRes, localitiesRes, propertyTypesRes, bhkRes, furnishingRes, availabilityRes] =
        await Promise.allSettled([
            rentalsService.listCities(),
            rentalsService.listAmenities(),
            rentalsService.listKeywords(),
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
    const keywordNameById =
        keywordsRes.status === "fulfilled" ? toMap(normalizeMasterOptions(keywordsRes.value).map(toMasterSelectOption)) : {};
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
        keywordNameById,
        propertyTypeIdByToken: toIdByTokenMap(propertyTypeWires),
        bhkIdByToken: toIdByTokenMap(bhkWires),
        furnishingIdByToken: toIdByTokenMap(furnishingWires),
        availabilityIdByToken: toIdByTokenMap(availabilityWires),
    };
};

const toSummary = (listing: ReturnType<typeof normalizePropertyList>[number]): OwnerListingSummary => ({
    id: listing.id,
    title: listing.propertyTitle || listing.title,
    locality: listing.locality,
    city: listing.city,
    rent: listing.pricePerMonth,
    deposit: listing.deposit,
    status: listing.status || "pending_review",
    image: listing.image,
    updatedAt: new Date().toISOString(),
});

const titleFromInput = (input: OwnerListingFormInput) => input.propertyTitle.trim();

const toUpsertPayload = (input: OwnerListingFormInput): OwnerPropertyUpsertPayload => ({
    propertyTitle: titleFromInput(input),
    propertyTypeId: input.propertyTypeId,
    cityId: input.cityId,
    localityId: input.localityId,
    bhkId: input.bhkId,
    furnishingId: input.furnishingId,
    availabilityId: input.availabilityId,
    rent: Number(input.rent || 0),
    deposit: Number(input.deposit || 0),
    builtUpAreaSqft: Number(input.builtUpAreaSqft || 0),
    addressLine: input.addressLine.trim(),
    description: input.description.trim(),
    contactPhone: input.contactPhone.trim(),
    amenityIds: input.amenityIds.filter((item) => isUuidLike(item)),
    keywordIds: input.keywords.filter((item) => isUuidLike(item)),
    documentType: input.documentType || undefined,
    imageFiles: input.imageFiles,
    documentFile: input.documentFile,
    clearImages: input.clearImages,
    clearDocuments: input.clearDocuments,
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
    propertyTitle: firstString(wire.title, wire.property_title),
    propertyTypeId: firstString(wire.property_type_id),
    cityId: firstString(wire.city_id),
    localityId: firstString(wire.locality_id),
    bhkId: firstString(wire.bhk_id),
    furnishingId: firstString(wire.furnishing_id),
    availabilityId: firstString(wire.availability_id),
    rent: Number(wire.rent || 0),
    deposit: Number(wire.deposit || 0),
    builtUpAreaSqft: Number(wire.built_up_area_sqft || 0),
    addressLine: firstString(wire.address_line),
    description: firstString(wire.description),
    contactPhone: firstString(wire.contact_phone),
    amenityIds: (() => {
        const fromObjects = asArray<RentalMasterOptionDto>(wire.amenities)
            .map((item) => firstString(item.id))
            .filter(Boolean);
        if (fromObjects.length > 0) return fromObjects;
        return asArray<string>(wire.amenity_ids).filter(Boolean);
    })(),
    keywordIds: (() => {
        const fromKeywords = asArray<string | RentalMasterOptionDto>(wire.keywords)
            .map((item) => (typeof item === "string" ? item : firstString(item.id)))
            .filter((item) => isUuidLike(item));
        if (fromKeywords.length > 0) return fromKeywords;
        return asArray<string>(wire.keyword_ids).filter((item) => isUuidLike(item));
    })(),
    documentType: undefined,
    imageFiles: [],
    documentFile: null,
    clearImages: false,
    clearDocuments: false,
});

const toFormFromWire = (wire: RentalPropertyDto): OwnerListingFormInput => ({
    ...defaultFormInput,
    propertyTitle: firstString(wire.title, wire.property_title),
    title: firstString(wire.title, wire.property_title),
    propertyTypeId: firstString(wire.property_type_id),
    cityId: firstString(wire.city_id),
    localityId: firstString(wire.locality_id),
    bhkId: firstString(wire.bhk_id),
    furnishingId: firstString(wire.furnishing_id),
    availabilityId: firstString(wire.availability_id),
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
        return asArray<string>(wire.amenity_ids).filter(Boolean);
    })(),
    keywords: (() => {
        const fromKeywords = asArray<string | RentalMasterOptionDto>(wire.keywords)
            .map((item) => (typeof item === "string" ? item : firstString(item.id)))
            .filter(Boolean);
        if (fromKeywords.length > 0) return fromKeywords;
        return asArray<string>(wire.keyword_ids).filter(Boolean);
    })(),
});

const getCreatedPropertyMeta = (
    payload: WireApiEnvelope<unknown>
): { propertyId: string; isVerified: boolean | null } => {
    const data = asRecord(unwrapData(payload));
    const propertyId = firstString(data?.property_id, data?.id);
    const isVerified = typeof data?.is_verified === "boolean" ? data.is_verified : null;
    return { propertyId, isVerified };
};

class HybridOwnerAdapter implements OwnerListingAdapter {
    async getOwnerEntryRoute(): Promise<"/owner/dashboard" | "/owner/list-property"> {
        const dashboard = await this.getDashboard();
        return dashboard.listings.length > 0 ? "/owner/dashboard" : "/owner/list-property";
    }

    async getDashboard(): Promise<OwnerDashboardData> {
        try {
            const response = await rentalsService.getOwnerProperties();
            const context = await buildNormalizationContext(response);
            const listings = normalizePropertyList(response, { fallbackToMock: false, ...context }).map(toSummary);
            return {
                ownerName: "Owner",
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
            throw new Error(extractErrorMessage(error, "Unable to load owner dashboard"));
        }
    }

    async getMasters(cityId?: string): Promise<OwnerMastersData> {
        const [cities, localities, propertyTypes, bhkTypes, furnishingTypes, availabilityTypes, amenities, keywords] =
            await Promise.allSettled([
                rentalsService.listCities(),
                rentalsService.listLocalities(cityId),
                rentalsService.listPropertyTypes(),
                rentalsService.listBhkTypes(),
                rentalsService.listFurnishingTypes(),
                rentalsService.listAvailabilityTypes(),
                rentalsService.listAmenities(),
                rentalsService.listKeywords(),
            ]);

        const parsed: OwnerMastersData = {
            cities: cities.status === "fulfilled" ? normalizeMasterOptions(cities.value).map(toMasterSelectOption) : [],
            localities: localities.status === "fulfilled" ? normalizeMasterOptions(localities.value).map(toMasterSelectOption) : [],
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
            keywords: keywords.status === "fulfilled" ? normalizeMasterOptions(keywords.value).map(toMasterSelectOption) : [],
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
            throw new Error(extractErrorMessage(error, "Unable to load listing for edit"));
        }
    }

    async createProperty(input: OwnerListingFormInput): Promise<OwnerListingSummary> {
        if (titleFromInput(input).length === 0) {
            throw new Error("Property title is required");
        }

        try {
            const response = await rentalsService.createOwnerProperty(toUpsertPayload(input));
            const { propertyId } = getCreatedPropertyMeta(response);
            const dashboard = await this.getDashboard();
            const created = dashboard.listings.find((item) => item.id === propertyId);
            if (created) return created;
            if (!propertyId) {
                throw new Error("Create succeeded but property_id was missing in backend response.");
            }
            throw new Error("Create succeeded but listing was not returned by owner dashboard yet. Please refresh.");
        } catch (error) {
            if (RENTALS_MOCK_MODE) {
                return {
                    id: `owner-${Date.now()}`,
                    title: titleFromInput(input),
                    locality: input.localityId || "Bengaluru",
                    city: input.cityId || "Bengaluru",
                    rent: Number(input.rent || 0),
                    deposit: Number(input.deposit || 0),
                    status: "pending_review",
                    image: mockPropertyList[0]?.image || "",
                    updatedAt: new Date().toISOString(),
                };
            }
            throw new Error(extractErrorMessage(error, "Unable to publish listing"));
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

            if ((input.imageFiles?.length || 0) > 0) changedKeys.add("imageFiles");
            if (input.documentFile) changedKeys.add("documentFile");
            if (input.clearImages) changedKeys.add("clearImages");
            if (input.clearDocuments) changedKeys.add("clearDocuments");

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
                    status: "pending_review",
                    image: mockPropertyList[0]?.image || "",
                    updatedAt: new Date().toISOString(),
                };
            }
            throw new Error(extractErrorMessage(error, "Unable to update listing"));
        }
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
