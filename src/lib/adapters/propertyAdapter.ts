import { FilterState, HomeFeed, PropertyAdapter, PropertyDetail, PropertyListItem } from "@/lib/adapters/types";
import { defaultFilterState, mockHomeFeed, mockPropertyDetails, mockPropertyList } from "@/mocks/properties";
import {
    extractErrorMessage,
    getSyncedDetail,
    mergeListWithSynced,
    normalizeLocalitiesFromProperties,
    normalizePropertyDetail,
    normalizePropertyList,
    rentalsService,
    upsertSyncedListingRecord,
} from "@/lib/rentals";

const includesIgnoreCase = (source: string, target: string) =>
    source.toLowerCase().includes(target.toLowerCase());

const sortByMode = (items: PropertyListItem[], mode: FilterState["sortBy"]) => {
    if (mode === "price_low_to_high") return [...items].sort((a, b) => a.pricePerMonth - b.pricePerMonth);
    if (mode === "price_high_to_low") return [...items].sort((a, b) => b.pricePerMonth - a.pricePerMonth);
    if (mode === "newest") return [...items].sort((a, b) => (b.id > a.id ? 1 : -1));
    return [...items];
};

const mapFiltersToApiParams = (filters: FilterState) => {
    const params: Record<string, string | number | undefined> = {};
    if (filters.budgetMin > 0) params.rent_min = filters.budgetMin;
    if (filters.budgetMax > 0) params.rent_max = filters.budgetMax;
    if (filters.selectedLocalities.length > 0) params.locality_id = filters.selectedLocalities[0];
    if (filters.propertyTypes.length > 0) params.property_type_id = filters.propertyTypes[0];
    if (filters.bhk.length > 0) params.bhk_id = filters.bhk[0];
    return params;
};

const applyClientFilters = (items: PropertyListItem[], filters: FilterState): PropertyListItem[] => {
    const nextFilters = { ...defaultFilterState, ...filters };

    const filtered = items.filter((item) => {
        const queryMatch =
            !nextFilters.query ||
            includesIgnoreCase(item.title, nextFilters.query) ||
            includesIgnoreCase(item.locality, nextFilters.query) ||
            includesIgnoreCase(item.city, nextFilters.query);

        const localityMatch =
            nextFilters.selectedLocalities.length === 0 || nextFilters.selectedLocalities.includes(item.locality);

        const bhkMatch = nextFilters.bhk.length === 0 || nextFilters.bhk.includes(item.bhk);

        const budgetMatch = item.pricePerMonth >= nextFilters.budgetMin && item.pricePerMonth <= nextFilters.budgetMax;

        const typeMatch =
            nextFilters.propertyTypes.length === 0 ||
            nextFilters.propertyTypes.some((type) => item.propertyTypes.includes(type));

        const moveInMatch =
            nextFilters.moveInBy.length === 0 ||
            nextFilters.moveInBy.some((moveIn) => item.moveInOptions.includes(moveIn));

        return queryMatch && localityMatch && bhkMatch && budgetMatch && typeMatch && moveInMatch;
    });

    return sortByMode(filtered, nextFilters.sortBy);
};

const toHomeFeed = (items: PropertyListItem[]): HomeFeed => {
    const list = items.length > 0 ? items : mockPropertyList;
    return {
        ...mockHomeFeed,
        localities: normalizeLocalitiesFromProperties(list),
        listings: list,
        recommended: list.slice(0, 4),
        topEvents: list.slice(0, 6),
    };
};

class ApiFirstPropertyAdapter implements PropertyAdapter {
    async getHomeFeed(): Promise<HomeFeed> {
        try {
            const response = await rentalsService.listProperties();
            const normalized = mergeListWithSynced(normalizePropertyList(response));
            return toHomeFeed(normalized);
        } catch {
            return toHomeFeed(mergeListWithSynced(mockPropertyList));
        }
    }

    async searchProperties(filters: FilterState): Promise<PropertyListItem[]> {
        try {
            const response = await rentalsService.listProperties(mapFiltersToApiParams(filters));
            const normalized = mergeListWithSynced(normalizePropertyList(response));
            return applyClientFilters(normalized, filters);
        } catch {
            return applyClientFilters(mergeListWithSynced(mockPropertyList), filters);
        }
    }

    async getPropertyDetail(id: string): Promise<PropertyDetail> {
        try {
            const response = await rentalsService.getPropertyDetail(id);
            const detail = normalizePropertyDetail(response, id);
            upsertSyncedListingRecord({
                id: detail.id,
                listItem: {
                    id: detail.id,
                    title: detail.title,
                    locality: detail.locality,
                    city: detail.city,
                    pricePerMonth: detail.pricePerMonth,
                    deposit: detail.deposit,
                    furnished: detail.furnished,
                    image: detail.image,
                    bhk: detail.bhk,
                    propertyTypes: detail.propertyTypes,
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
            const synced = getSyncedDetail(id);
            if (synced) return synced;

            const fallback =
                mockPropertyDetails.find((item) => item.id === id) ??
                mockPropertyDetails[0];

            if (!fallback) {
                throw new Error(extractErrorMessage(error, "Property not found"));
            }

            return fallback;
        }
    }

    async refreshListings(): Promise<void> {
        return;
    }
}

export const propertyAdapter = new ApiFirstPropertyAdapter();
