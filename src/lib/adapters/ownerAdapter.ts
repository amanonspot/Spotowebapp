import {
    OwnerDashboardData,
    OwnerLeadCard,
    OwnerListingAdapter,
    OwnerListingFormInput,
    OwnerListingSummary,
    OwnerMastersData,
    SelectOption,
} from "@/lib/adapters/types";
import { mockPropertyDetails, mockPropertyList } from "@/mocks/properties";
import {
    addUnlockedOwnerContact,
    consumeCredit,
    extractErrorMessage,
    getCredits,
    getUnlockedOwnerContacts,
    normalizeMasterOptions,
    normalizePropertyDetail,
    normalizePropertyList,
    rentalsService,
    readSyncedListingStore,
    toMasterSelectOption,
    upsertSyncedListingRecord,
} from "@/lib/rentals";

const OWNER_LEADS_KEY = "spoto_owner_leads_v1";

const defaultFormInput: OwnerListingFormInput = {
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

const defaultLeads: OwnerLeadCard[] = [
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
    {
        id: "lead-3",
        tenantName: "Rahul",
        phoneMasked: "+91-8XX12-XXXX",
        phone: "+918891255551",
        state: "locked",
        propertyId: mockPropertyList[1]?.id || "listing-2",
    },
];

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

const toSummary = (listing: ReturnType<typeof normalizePropertyList>[number]): OwnerListingSummary => ({
    id: listing.id,
    title: listing.title,
    locality: listing.locality,
    city: listing.city,
    rent: listing.pricePerMonth,
    deposit: listing.deposit,
    status: "pending_review",
    image: listing.image,
    updatedAt: new Date().toISOString(),
});

const toOwnerForm = (summary: OwnerListingSummary): OwnerListingFormInput => ({
    ...defaultFormInput,
    title: summary.title,
    cityId: summary.city,
    localityId: summary.locality,
    rent: String(summary.rent),
    deposit: String(summary.deposit),
    description: "",
});

const toUpsertPayload = (input: OwnerListingFormInput) => ({
    title: input.title.trim(),
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

const syncTenantListing = (summary: OwnerListingSummary) => {
    const fallbackDetail = mockPropertyDetails[0];
    upsertSyncedListingRecord({
        id: summary.id,
        listItem: {
            id: summary.id,
            title: summary.title,
            locality: summary.locality,
            city: summary.city,
            pricePerMonth: summary.rent,
            deposit: summary.deposit,
            furnished: true,
            image: summary.image || fallbackDetail.image,
            bhk: "1_bhk",
            propertyTypes: ["rent_house"],
            moveInOptions: ["immediately"],
            badges: ["Owner Updated"],
            features: ["Verified"],
        },
        detail: {
            ...fallbackDetail,
            id: summary.id,
            title: summary.title,
            locality: summary.locality,
            city: summary.city,
            pricePerMonth: summary.rent,
            deposit: summary.deposit,
            image: summary.image || fallbackDetail.image,
        },
        updatedAt: summary.updatedAt,
        source: "owner_update",
    });
};

class HybridOwnerAdapter implements OwnerListingAdapter {
    async getOwnerEntryRoute(): Promise<"/owner/dashboard" | "/owner/list-property"> {
        const dashboard = await this.getDashboard();
        return dashboard.listings.length > 0 ? "/owner/dashboard" : "/owner/list-property";
    }

    async getDashboard(): Promise<OwnerDashboardData> {
        try {
            const response = await rentalsService.getOwnerProperties();
            const listings = normalizePropertyList(response, { fallbackToMock: false }).map(toSummary);
            const leads = readLeads();
            return {
                ownerName: "Owner",
                creditsLeft: getCredits("owner"),
                listings,
                leads,
            };
        } catch {
            const syncedListings = Object.values(readSyncedListingStore()).map((record) => toSummary(record.listItem));
            return {
                ownerName: "Owner",
                creditsLeft: getCredits("owner"),
                listings: syncedListings,
                leads: readLeads(),
            };
        }
    }

    async getMasters(cityId?: string): Promise<OwnerMastersData> {
        const fallback = defaultMasters();

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

        return {
            cities: cities.status === "fulfilled" ? normalizeMasterOptions(cities.value).map(toMasterSelectOption) : fallback.cities,
            localities:
                localities.status === "fulfilled"
                    ? normalizeMasterOptions(localities.value).map(toMasterSelectOption)
                    : fallback.localities,
            propertyTypes:
                propertyTypes.status === "fulfilled"
                    ? normalizeMasterOptions(propertyTypes.value).map(toMasterSelectOption)
                    : fallback.propertyTypes,
            bhkTypes:
                bhkTypes.status === "fulfilled"
                    ? normalizeMasterOptions(bhkTypes.value).map(toMasterSelectOption)
                    : fallback.bhkTypes,
            furnishingTypes:
                furnishingTypes.status === "fulfilled"
                    ? normalizeMasterOptions(furnishingTypes.value).map(toMasterSelectOption)
                    : fallback.furnishingTypes,
            availabilityTypes:
                availabilityTypes.status === "fulfilled"
                    ? normalizeMasterOptions(availabilityTypes.value).map(toMasterSelectOption)
                    : fallback.availabilityTypes,
            amenities:
                amenities.status === "fulfilled"
                    ? normalizeMasterOptions(amenities.value).map(toMasterSelectOption)
                    : fallback.amenities,
            keywords:
                keywords.status === "fulfilled"
                    ? normalizeMasterOptions(keywords.value).map(toMasterSelectOption)
                    : fallback.keywords,
        };
    }

    async getPropertyForEdit(id: string): Promise<OwnerListingFormInput> {
        try {
            const detailResponse = await rentalsService.getPropertyDetail(id);
            const detail = normalizePropertyDetail(detailResponse, id);
            return {
                ...defaultFormInput,
                title: detail.title,
                cityId: detail.city,
                localityId: detail.locality,
                rent: String(detail.pricePerMonth),
                deposit: String(detail.deposit),
                description: detail.description,
                contactPhone: detail.owner.whatsappNumber,
                keywords: [...detail.highlights],
                amenityIds: [...detail.amenities],
            };
        } catch {
            const dashboard = await this.getDashboard();
            const listing = dashboard.listings.find((item) => item.id === id);
            if (!listing) return defaultFormInput;
            return toOwnerForm(listing);
        }
    }

    async createProperty(input: OwnerListingFormInput): Promise<OwnerListingSummary> {
        try {
            const response = await rentalsService.createOwnerProperty(toUpsertPayload(input));
            const parsed = normalizePropertyList([response])[0];
            const summary = toSummary(parsed);
            syncTenantListing(summary);
            return summary;
        } catch (error) {
            const fallbackSummary: OwnerListingSummary = {
                id: `owner-${Date.now()}`,
                title: input.title,
                locality: input.localityId || "Bengaluru",
                city: input.cityId || "Bengaluru",
                rent: Number(input.rent || 0),
                deposit: Number(input.deposit || 0),
                status: "pending_review",
                image: mockPropertyList[0]?.image || "",
                updatedAt: new Date().toISOString(),
            };
            syncTenantListing(fallbackSummary);
            if (input.title.trim().length === 0) {
                throw new Error(extractErrorMessage(error, "Title is required"));
            }
            return fallbackSummary;
        }
    }

    async updateProperty(id: string, input: OwnerListingFormInput): Promise<OwnerListingSummary> {
        try {
            const response = await rentalsService.updateOwnerProperty(id, toUpsertPayload(input));
            const parsed = normalizePropertyList([response])[0];
            const summary = toSummary(parsed);
            syncTenantListing(summary);
            return summary;
        } catch (error) {
            if (input.title.trim().length === 0) {
                throw new Error(extractErrorMessage(error, "Title is required"));
            }
            const fallbackSummary: OwnerListingSummary = {
                id,
                title: input.title,
                locality: input.localityId || "Bengaluru",
                city: input.cityId || "Bengaluru",
                rent: Number(input.rent || 0),
                deposit: Number(input.deposit || 0),
                status: "pending_review",
                image: mockPropertyList[0]?.image || "",
                updatedAt: new Date().toISOString(),
            };
            syncTenantListing(fallbackSummary);
            return fallbackSummary;
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
