import { clearCache } from "@/lib/api/client";
import { FilterState, HomeFeed, PropertyAdapter, PropertyDetail, PropertyListItem, SelectOption } from "@/lib/adapters/types";
import { defaultFilterState, mockHomeFeed, mockPropertyDetails, mockPropertyList } from "@/mocks/properties";
import {
    extractErrorMessage,
    getSyncedDetail,
    isUuidLike,
    mergeListWithSynced,
    normalizeLocalitiesFromProperties,
    normalizeMasterOptions,
    normalizePropertyDetail,
    normalizePropertyList,
    RENTALS_MOCK_MODE,
    rentalsService,
    toMasterSelectOption,
    upsertSyncedListingRecord,
    WireApiEnvelope,
    RentalMasterOptionWire,
    RentalPropertyWire,
} from "@/lib/rentals";

const includesIgnoreCase = (source: string, target: string) => source.toLowerCase().includes(target.toLowerCase());

const sortByMode = (items: PropertyListItem[], mode: FilterState["sortBy"]) => {
    if (mode === "price_low_to_high") return [...items].sort((a, b) => a.pricePerMonth - b.pricePerMonth);
    if (mode === "price_high_to_low") return [...items].sort((a, b) => b.pricePerMonth - a.pricePerMonth);
    if (mode === "newest") return [...items].sort((a, b) => (b.id > a.id ? 1 : -1));
    return [...items];
};

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

const isTenantVisible = (item: PropertyListItem): boolean => {
    if (item.isVerified === false) return false;

    const status = (item.status || "").toLowerCase();
    if (!status) return true;

    if (status.includes("reject") || status.includes("pending") || status.includes("review") || status.includes("draft")) {
        return false;
    }
    if (status.includes("approved") || status.includes("active") || status.includes("publish") || status.includes("verified")) {
        return true;
    }

    return true;
};

const mapFiltersToApiParams = (filters: FilterState) => {
    const params: Record<string, string | number | undefined> = {};
    if (filters.budgetMin > 0) params.rent_min = filters.budgetMin;
    if (filters.budgetMax > 0) params.rent_max = filters.budgetMax;

    const localityId = filters.selectedLocalityIds?.[0] || filters.selectedLocalities.find((value) => isUuidLike(value));
    if (localityId) params.locality_id = localityId;

    const propertyTypeId = filters.selectedPropertyTypeIds?.[0];
    if (propertyTypeId && isUuidLike(propertyTypeId)) params.property_type_id = propertyTypeId;

    const bhkId = filters.selectedBhkIds?.[0];
    if (bhkId && isUuidLike(bhkId)) params.bhk_id = bhkId;

    return params;
};

const applyClientFilters = (items: PropertyListItem[], filters: FilterState): PropertyListItem[] => {
    const nextFilters = { ...defaultFilterState, ...filters };

    const selectedLocalityIds =
        nextFilters.selectedLocalityIds?.length && nextFilters.selectedLocalityIds.length > 0
            ? nextFilters.selectedLocalityIds
            : nextFilters.selectedLocalities;

    const filtered = items.filter((item) => {
        const queryMatch =
            !nextFilters.query ||
            includesIgnoreCase(item.title, nextFilters.query) ||
            includesIgnoreCase(item.locality, nextFilters.query) ||
            includesIgnoreCase(item.city, nextFilters.query);

        const localityMatch =
            selectedLocalityIds.length === 0 ||
            selectedLocalityIds.includes(item.localityId || "") ||
            selectedLocalityIds.includes(item.locality);

        const bhkMatch =
            (nextFilters.selectedBhkIds || []).length > 0
                ? (nextFilters.selectedBhkIds || []).includes(item.bhkId || "")
                : nextFilters.bhk.length === 0 || nextFilters.bhk.includes(item.bhk);

        const budgetMatch = item.pricePerMonth >= nextFilters.budgetMin && item.pricePerMonth <= nextFilters.budgetMax;

        const typeMatch =
            (nextFilters.selectedPropertyTypeIds || []).length > 0
                ? (nextFilters.selectedPropertyTypeIds || []).includes(item.propertyTypeId || "")
                : nextFilters.propertyTypes.length === 0 ||
                  nextFilters.propertyTypes.some((type) => item.propertyTypes.includes(type));

        const moveInMatch =
            nextFilters.moveInBy.length === 0 ||
            nextFilters.moveInBy.some((moveIn) => item.moveInOptions.includes(moveIn));

        return queryMatch && localityMatch && bhkMatch && budgetMatch && typeMatch && moveInMatch;
    });

    return sortByMode(filtered, nextFilters.sortBy);
};

const toHomeFeed = (items: PropertyListItem[]): HomeFeed => {
    const localities = normalizeLocalitiesFromProperties(items);
    const localityOptions = Array.from(
        new Map(
            items
                .filter((item) => item.localityId && item.locality)
                .map((item) => [item.localityId as string, { id: item.localityId as string, name: item.locality }])
        ).values()
    );

    return {
        ...mockHomeFeed,
        localities,
        localityOptions,
        listings: items,
        recommended: items.slice(0, 4),
        topEvents: items.slice(0, 6),
    };
};

class ApiFirstPropertyAdapter implements PropertyAdapter {
    async getHomeFeed(): Promise<HomeFeed> {
        try {
            const response = await rentalsService.listProperties();
            const context = await buildNormalizationContext(response);
            const normalized = normalizePropertyList(response, { fallbackToMock: RENTALS_MOCK_MODE, ...context });
            const liveVisible = RENTALS_MOCK_MODE ? normalized : normalized.filter(isTenantVisible);
            const merged = RENTALS_MOCK_MODE ? mergeListWithSynced(liveVisible) : liveVisible;
            return toHomeFeed(merged);
        } catch (error) {
            if (RENTALS_MOCK_MODE) {
                return toHomeFeed(mergeListWithSynced(mockPropertyList));
            }
            throw new Error(extractErrorMessage(error, "Unable to load properties"));
        }
    }

    async searchProperties(filters: FilterState): Promise<PropertyListItem[]> {
        try {
            const response = await rentalsService.listProperties(mapFiltersToApiParams(filters));
            const context = await buildNormalizationContext(response);
            const normalized = normalizePropertyList(response, { fallbackToMock: RENTALS_MOCK_MODE, ...context });
            const liveVisible = RENTALS_MOCK_MODE ? normalized : normalized.filter(isTenantVisible);
            const merged = RENTALS_MOCK_MODE ? mergeListWithSynced(liveVisible) : liveVisible;
            return applyClientFilters(merged, filters);
        } catch (error) {
            if (RENTALS_MOCK_MODE) {
                return applyClientFilters(mergeListWithSynced(mockPropertyList), filters);
            }
            throw new Error(extractErrorMessage(error, "Unable to search properties"));
        }
    }

    async getPropertyDetail(id: string): Promise<PropertyDetail> {
        try {
            const response = await rentalsService.getPropertyDetail(id);
            const context = await buildNormalizationContext(response);
            const detail = normalizePropertyDetail(response, id, { fallbackToMock: RENTALS_MOCK_MODE, ...context });
            if (!RENTALS_MOCK_MODE && detail.id !== id) {
                throw new Error("Property not found for the requested ID.");
            }
            if (!RENTALS_MOCK_MODE && !isTenantVisible(detail)) {
                throw new Error("This property is not available yet.");
            }
            upsertSyncedListingRecord({
                id: detail.id,
                listItem: {
                    id: detail.id,
                    title: detail.title,
                    propertyTitle: detail.propertyTitle || detail.title,
                    locality: detail.locality,
                    localityId: detail.localityId,
                    city: detail.city,
                    cityId: detail.cityId,
                    pricePerMonth: detail.pricePerMonth,
                    deposit: detail.deposit,
                    furnished: detail.furnished,
                    image: detail.image,
                    galleryImages: detail.galleryImages,
                    bhk: detail.bhk,
                    bhkId: detail.bhkId,
                    propertyTypes: detail.propertyTypes,
                    propertyTypeId: detail.propertyTypeId,
                    furnishingId: detail.furnishingId,
                    availabilityId: detail.availabilityId,
                    status: detail.status,
                    isVerified: detail.isVerified,
                    moveInOptions: detail.moveInOptions,
                    badges: detail.badges,
                    features: detail.features,
                },
                detail,
                updatedAt: new Date().toISOString(),
                source: "api",
            });
            return detail;
        } catch (error) {
            if (RENTALS_MOCK_MODE) {
                const synced = getSyncedDetail(id);
                if (synced) return synced;
                const fallback = mockPropertyDetails.find((item) => item.id === id) ?? mockPropertyDetails[0];
                if (fallback) return fallback;
            }
            throw new Error(extractErrorMessage(error, "Property not found"));
        }
    }

    async refreshListings(): Promise<void> {
        clearCache("/api/rental/properties/");
    }
}

export const propertyAdapter = new ApiFirstPropertyAdapter();
