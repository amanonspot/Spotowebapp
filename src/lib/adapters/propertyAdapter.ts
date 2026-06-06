import { clearCache } from "@/lib/api/client";
import { FilterState, HomeFeed, PropertyAdapter, PropertyDetail, PropertyListItem, SelectOption } from "@/lib/adapters/types";
import { defaultFilterState, mockHomeFeed, mockPropertyDetails, mockPropertyList } from "@/mocks/properties";
import {
    extractErrorMessage,
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
    RentalMasterOptionDto,
    RentalPropertyDto,
} from "@/lib/rentals";

const includesIgnoreCase = (source: string, target: string) => source.toLowerCase().includes(target.toLowerCase());

const sortByMode = (items: PropertyListItem[], mode: FilterState["sortBy"]) => {
    if (mode === "price_low_to_high") return [...items].sort((a, b) => a.pricePerMonth - b.pricePerMonth);
    if (mode === "price_high_to_low") return [...items].sort((a, b) => b.pricePerMonth - a.pricePerMonth);
    if (mode === "newest") return [...items].sort((a, b) => (b.id > a.id ? 1 : -1));
    return [...items];
};

const unwrapToList = (payload: WireApiEnvelope<unknown>): RentalPropertyDto[] => {
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

    return data as RentalPropertyDto[];
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

const HOME_LIST_PAGE_SIZE = 24;

const cityIdsFromPayload = (payload: WireApiEnvelope<unknown>) => {
    const cityIds = new Set<string>();
    unwrapToList(payload).forEach((wire) => {
        const cityId = `${wire.city_id || wire.city || ""}`.trim();
        if (isUuidLike(cityId)) cityIds.add(cityId);
    });
    return cityIds;
};

const contextFromMasterResults = (
    citiesRes: PromiseSettledResult<WireApiEnvelope<unknown>>,
    amenitiesRes: PromiseSettledResult<WireApiEnvelope<unknown>>,
    localitiesRes: PromiseSettledResult<WireApiEnvelope<unknown>[]>,
    propertyTypesRes: PromiseSettledResult<WireApiEnvelope<unknown>>,
    bhkRes: PromiseSettledResult<WireApiEnvelope<unknown>>,
    furnishingRes: PromiseSettledResult<WireApiEnvelope<unknown>>,
    availabilityRes: PromiseSettledResult<WireApiEnvelope<unknown>>
) => {
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

const buildNormalizationContext = async (payload: WireApiEnvelope<unknown>) => {
    const cityIds = cityIdsFromPayload(payload);

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

    return contextFromMasterResults(
        citiesRes,
        amenitiesRes,
        localitiesRes,
        propertyTypesRes,
        bhkRes,
        furnishingRes,
        availabilityRes
    );
};

const fetchMastersBundle = () =>
    Promise.allSettled([
        rentalsService.listCities(),
        rentalsService.listAmenities(),
        rentalsService.listPropertyTypes(),
        rentalsService.listBhkTypes(),
        rentalsService.listFurnishingTypes(),
        rentalsService.listAvailabilityTypes(),
    ]);

const buildNormalizationContextFast = async (
    payload: WireApiEnvelope<unknown>,
    prefetchedMasters?: PromiseSettledResult<WireApiEnvelope<unknown>>[]
) => {
    const cityIds = cityIdsFromPayload(payload);
    const [masters, localitiesSettled] = await Promise.all([
        prefetchedMasters ?? fetchMastersBundle(),
        Promise.allSettled([
            Promise.all(Array.from(cityIds).map((cityId) => rentalsService.listLocalities(cityId))),
        ]),
    ]);
    const localitiesRes = localitiesSettled[0]!;

    const [citiesRes, amenitiesRes, propertyTypesRes, bhkRes, furnishingRes, availabilityRes] = masters;

    return contextFromMasterResults(
        citiesRes,
        amenitiesRes,
        localitiesRes,
        propertyTypesRes,
        bhkRes,
        furnishingRes,
        availabilityRes
    );
};

const isTenantVisible = (item: PropertyListItem): boolean => {
    if (typeof item.isPubliclyVisible === "boolean") return item.isPubliclyVisible;
    const status = (item.status || "").toLowerCase();
    if (status.includes("reject") || status.includes("pending") || status.includes("review") || status.includes("draft")) return false;
    if (status.includes("live") || status.includes("approved")) return true;
    return Boolean(item.isVerified && item.isActive);
};

const mapFiltersToApiParams = (filters: FilterState) => {
    const params: {
        city_id?: string;
        locality_id?: string;
        property_type_id?: string;
        bhk_id?: string;
        rent_min?: number;
        rent_max?: number;
        amenity_ids?: string[];
        keywords?: string[];
        page?: number;
        page_size?: number;
    } = {};
    if (filters.budgetMin > 0) params.rent_min = filters.budgetMin;
    if (filters.budgetMax > 0) params.rent_max = filters.budgetMax;

    const localityId = filters.selectedLocalityIds?.[0] || filters.selectedLocalities.find((value) => isUuidLike(value));
    if (localityId) params.locality_id = localityId;

    const propertyTypeId = filters.selectedPropertyTypeIds?.[0];
    if (propertyTypeId && isUuidLike(propertyTypeId)) params.property_type_id = propertyTypeId;

    const bhkId = filters.selectedBhkIds?.[0];
    if (bhkId && isUuidLike(bhkId)) params.bhk_id = bhkId;

    const amenityIds = (filters.amenityIds || []).filter((value) => isUuidLike(value));
    if (amenityIds.length > 0) params.amenity_ids = amenityIds;

    const keywords = (filters.keywords || []).map((item) => item.trim()).filter(Boolean);
    if (keywords.length > 0) params.keywords = keywords;

    return params;
};

const normalizeToken = (value: string) =>
    value
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const resolvePropertyTypeIdFromFilters = async (filters: FilterState): Promise<string | undefined> => {
    if (filters.selectedPropertyTypeIds?.[0] && isUuidLike(filters.selectedPropertyTypeIds[0])) {
        return filters.selectedPropertyTypeIds[0];
    }
    if (!filters.propertyTypes || filters.propertyTypes.length === 0) return undefined;

    const selected = new Set(filters.propertyTypes.map((item) => normalizeToken(item)));
    const masters = normalizeMasterOptions(await rentalsService.listPropertyTypes());
    const match = masters.find((item) => {
        const name = normalizeToken(item.name);
        const code = normalizeToken(item.code || "");
        if (selected.has("rent house") && (name.includes("apartment") || name.includes("house") || code.includes("apartment"))) {
            return true;
        }
        if (selected.has("pg") && (name.includes("pg") || code.includes("pg"))) return true;
        if (selected.has("zero deposit") && (name.includes("zero") || code.includes("zero"))) return true;
        if (selected.has("co living") && (name.includes("co living") || code.includes("co living"))) return true;
        return false;
    });
    return match?.id;
};

const resolveBhkIdFromFilters = async (filters: FilterState): Promise<string | undefined> => {
    if (filters.selectedBhkIds?.[0] && isUuidLike(filters.selectedBhkIds[0])) {
        return filters.selectedBhkIds[0];
    }
    if (!filters.bhk || filters.bhk.length === 0) return undefined;
    const selected = new Set(filters.bhk.map((item) => normalizeToken(item)));
    const masters = normalizeMasterOptions(await rentalsService.listBhkTypes());
    const match = masters.find((item) => {
        const name = normalizeToken(item.name);
        const code = normalizeToken(item.code || "");
        if (selected.has("1 rk") && (name.includes("1 rk") || code.includes("1 rk"))) return true;
        if (selected.has("1 bhk") && (name.includes("1 bhk") || code.includes("1 bhk"))) return true;
        if (selected.has("2 bhk") && (name.includes("2 bhk") || code.includes("2 bhk"))) return true;
        if (selected.has("3 bhk") && (name.includes("3 bhk") || code.includes("3 bhk"))) return true;
        return false;
    });
    return match?.id;
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
            (item.propertyTitle ? includesIgnoreCase(item.propertyTitle, nextFilters.query) : false) ||
            includesIgnoreCase(item.locality, nextFilters.query) ||
            includesIgnoreCase(item.city, nextFilters.query);

        const localityMatch =
            selectedLocalityIds.length === 0 ||
            selectedLocalityIds.includes(item.localityId || "") ||
            selectedLocalityIds.includes(item.locality);

        const bhkMatch = (() => {
            const ids = nextFilters.selectedBhkIds || [];
            const legacy = nextFilters.bhk || [];
            if (ids.length === 0 && legacy.length === 0) return true;
            if (ids.some((id) => isUuidLike(id))) {
                return ids.includes(item.bhkId || "");
            }
            return legacy.length === 0 || legacy.some((token) => toToken(token) === toToken(item.bhk));
        })();

        const typeMatch = (() => {
            const ids = nextFilters.selectedPropertyTypeIds || [];
            const names = nextFilters.propertyTypes || [];
            if (ids.length === 0 && names.length === 0) return true;
            if (ids.some((id) => isUuidLike(id))) {
                return ids.includes(item.propertyTypeId || "");
            }
            return names.some((type) =>
                item.propertyTypes.some((itemType) => toToken(itemType) === toToken(type))
            );
        })();

        const budgetMatch = item.pricePerMonth >= nextFilters.budgetMin && item.pricePerMonth <= nextFilters.budgetMax;

        const moveInMatch =
            nextFilters.moveInBy.length === 0 ||
            nextFilters.moveInBy.some((moveIn) => item.moveInOptions.includes(moveIn));

        const amenityMatch =
            (nextFilters.amenityIds || []).length === 0 ||
            (item.amenityIds || []).some((amenityId) => (nextFilters.amenityIds || []).includes(amenityId));

        const keywordMatch =
            (nextFilters.keywords || []).length === 0 ||
            (nextFilters.keywords || []).some((keyword) => {
                const token = keyword.toLowerCase();
                return (
                    item.title.toLowerCase().includes(token) ||
                    (item.badges || []).some((badge) => badge.toLowerCase().includes(token)) ||
                    (item.features || []).some((feature) => feature.toLowerCase().includes(token))
                );
            });

        return queryMatch && localityMatch && bhkMatch && budgetMatch && typeMatch && moveInMatch && amenityMatch && keywordMatch;
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
            const [response, masters] = await Promise.all([
                rentalsService.listProperties({ page: 1, page_size: HOME_LIST_PAGE_SIZE }),
                fetchMastersBundle(),
            ]);
            const context = await buildNormalizationContextFast(response, masters);
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
            const params = mapFiltersToApiParams(filters);
            if (!params.property_type_id) {
                params.property_type_id = await resolvePropertyTypeIdFromFilters(filters);
            }
            if (!params.bhk_id) {
                params.bhk_id = await resolveBhkIdFromFilters(filters);
            }
            const [response, masters] = await Promise.all([
                rentalsService.listProperties({
                    ...params,
                    page: params.page ?? 1,
                    page_size: params.page_size ?? HOME_LIST_PAGE_SIZE,
                }),
                fetchMastersBundle(),
            ]);
            const context = await buildNormalizationContextFast(response, masters);
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
            if (!RENTALS_MOCK_MODE && !(detail.propertyTitle || detail.title)) {
                throw new Error("Property data is incomplete in backend response.");
            }
            if (!RENTALS_MOCK_MODE && !isTenantVisible(detail)) {
                throw new Error("This property is not available yet.");
            }
            if (RENTALS_MOCK_MODE) {
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
                        galleryMedia: detail.galleryMedia,
                        bhk: detail.bhk,
                        bhkId: detail.bhkId,
                        propertyTypes: detail.propertyTypes,
                        propertyTypeId: detail.propertyTypeId,
                        furnishingId: detail.furnishingId,
                        availabilityId: detail.availabilityId,
                        status: detail.status,
                        isVerified: detail.isVerified,
                        isActive: detail.isActive,
                        moveInOptions: detail.moveInOptions,
                        badges: detail.badges,
                        features: detail.features,
                    },
                    detail,
                    updatedAt: new Date().toISOString(),
                    source: "api",
                });
            }
            return detail;
        } catch (error) {
            if (RENTALS_MOCK_MODE) {
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
