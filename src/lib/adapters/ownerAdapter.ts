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
    normalizePropertyDetail,
    normalizePropertyList,
    RENTALS_MOCK_MODE,
    rentalsService,
    toMasterSelectOption,
    WireApiEnvelope,
    RentalMasterOptionWire,
    RentalPropertyWire,
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
    documentType: "electricity_bill",
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

const unwrapToList = (payload: WireApiEnvelope<unknown>): RentalPropertyWire[] => {
    const envelope = payload as Record<string, unknown>;
    const data = Array.isArray(payload)
        ? payload
        : Array.isArray(envelope.data)
        ? envelope.data
        : Array.isArray(envelope.results)
        ? envelope.results
        : Array.isArray(envelope.items)
        ? envelope.items
        : envelope.data && typeof envelope.data === "object"
        ? [envelope.data]
        : [];

    return data as RentalPropertyWire[];
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

const toIdByTokenMap = (wires: RentalMasterOptionWire[]): Record<string, string> =>
    wires.reduce<Record<string, string>>((acc, wire) => {
        const id = `${wire.id || wire.uuid || ""}`.trim();
        if (!id) return acc;
        const tokens = [wire.name, wire.label, wire.code, `${wire.value || ""}`]
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
        const cityId = `${wire.city_id || wire.city || ""}`.trim();
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

const titleFromInput = (input: OwnerListingFormInput) => input.propertyTitle.trim() || input.title?.trim() || "";

const toUpsertPayload = (input: OwnerListingFormInput) => ({
    propertyTitle: titleFromInput(input),
    title: titleFromInput(input),
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
    amenityIds: input.amenityIds,
    keywords: input.keywords,
    documentType: input.documentType,
    imageFiles: input.imageFiles,
    documentFile: input.documentFile,
    clearImages: input.clearImages,
    clearDocuments: input.clearDocuments,
});

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
            const detailResponse = await rentalsService.getPropertyDetail(id);
            const context = await buildNormalizationContext(detailResponse);
            const detail = normalizePropertyDetail(detailResponse, id, { fallbackToMock: false, ...context });
            return {
                ...defaultFormInput,
                propertyTitle: detail.propertyTitle || detail.title,
                title: detail.propertyTitle || detail.title,
                propertyTypeId: detail.propertyTypeId || "",
                cityId: detail.cityId || "",
                localityId: detail.localityId || "",
                bhkId: detail.bhkId || "",
                furnishingId: detail.furnishingId || "",
                availabilityId: detail.availabilityId || "",
                rent: String(detail.pricePerMonth),
                deposit: String(detail.deposit),
                description: detail.description,
                contactPhone: detail.owner.whatsappNumber.replace(/\D/g, "").slice(-10),
                keywords: [...detail.highlights],
                amenityIds: detail.amenityIds && detail.amenityIds.length > 0 ? [...detail.amenityIds] : [...detail.amenities],
            };
        } catch (error) {
            if (RENTALS_MOCK_MODE) return defaultFormInput;
            throw new Error(extractErrorMessage(error, "Unable to load listing for edit"));
        }
    }

    async createProperty(input: OwnerListingFormInput): Promise<OwnerListingSummary> {
        try {
            const response = await rentalsService.createOwnerProperty(toUpsertPayload(input));
            const context = await buildNormalizationContext(response);
            const parsed = normalizePropertyList(response, { fallbackToMock: false, ...context })[0];
            if (!parsed) throw new Error("Unable to parse created listing");
            return toSummary(parsed);
        } catch (error) {
            if (RENTALS_MOCK_MODE) {
                const fallbackSummary: OwnerListingSummary = {
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
                return fallbackSummary;
            }

            if (titleFromInput(input).length === 0) {
                throw new Error("Property title is required");
            }
            throw new Error(extractErrorMessage(error, "Unable to publish listing"));
        }
    }

    async updateProperty(id: string, input: OwnerListingFormInput): Promise<OwnerListingSummary> {
        try {
            const response = await rentalsService.updateOwnerProperty(id, toUpsertPayload(input));
            const context = await buildNormalizationContext(response);
            const parsed = normalizePropertyList(response, { fallbackToMock: false, ...context })[0];
            if (!parsed) throw new Error("Unable to parse updated listing");
            return toSummary(parsed);
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
            if (titleFromInput(input).length === 0) {
                throw new Error("Property title is required");
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
