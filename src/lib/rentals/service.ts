import { api, apiFormData } from "@/lib/api";
import {
    OwnerPropertyUpsertPayload,
    RentalContactUnlockRequestWire,
    RentalContactUnlockResponseWire,
    RentalMasterOptionWire,
    RentalPassActivatePayloadWire,
    RentalPassActivateResponseWire,
    RentalPropertyWire,
} from "@/lib/rentals/wireTypes";

export interface RentalPropertyListParams {
    city_id?: string;
    locality_id?: string;
    property_type_id?: string;
    bhk_id?: string;
    rent_min?: number;
    rent_max?: number;
    amenity_ids?: string;
    keywords?: string;
}

const appendIfPresent = (formData: FormData, key: string, value: string | number | boolean | null | undefined) => {
    if (value === undefined || value === null) return;
    formData.append(key, String(value));
};

const appendFileIfPresent = (formData: FormData, key: string, file: File | null | undefined) => {
    if (!file) return;
    formData.append(key, file);
};

const buildOwnerFormData = (payload: OwnerPropertyUpsertPayload): FormData => {
    const formData = new FormData();

    appendIfPresent(formData, "title", payload.title);
    appendIfPresent(formData, "property_type_id", payload.propertyTypeId);
    appendIfPresent(formData, "city_id", payload.cityId);
    appendIfPresent(formData, "rent", payload.rent);
    appendIfPresent(formData, "deposit", payload.deposit);
    appendIfPresent(formData, "locality_id", payload.localityId);
    appendIfPresent(formData, "address_line", payload.addressLine);
    appendIfPresent(formData, "bhk_id", payload.bhkId);
    appendIfPresent(formData, "built_up_area_sqft", payload.builtUpAreaSqft);
    appendIfPresent(formData, "furnishing_id", payload.furnishingId);
    appendIfPresent(formData, "availability_id", payload.availabilityId);
    appendIfPresent(formData, "description", payload.description);
    appendIfPresent(formData, "contact_phone", payload.contactPhone);
    appendIfPresent(formData, "amenity_ids", payload.amenityIds.join(","));
    appendIfPresent(formData, "keywords", payload.keywords.join(","));
    appendIfPresent(formData, "document_type", payload.documentType || "");
    appendIfPresent(formData, "clear_images", payload.clearImages ? "true" : undefined);
    appendIfPresent(formData, "clear_documents", payload.clearDocuments ? "true" : undefined);

    payload.imageFiles?.forEach((file) => formData.append("image_files", file));
    appendFileIfPresent(formData, "document_file", payload.documentFile);

    return formData;
};

export const rentalsService = {
    listProperties: (params?: RentalPropertyListParams) =>
        api.get<RentalPropertyWire[]>("/api/rental/properties/", { params }),

    getPropertyDetail: (propertyId: string) =>
        api.get<RentalPropertyWire | RentalPropertyWire[]>("/api/rental/properties/", {
            params: { property_id: propertyId },
        }),

    unlockPropertyContact: (propertyId: string, payload: RentalContactUnlockRequestWire) =>
        api.post<RentalContactUnlockResponseWire>("/api/rental/properties/get-contact/", payload, {
            params: { property_id: propertyId },
        }),

    activatePass: (payload: RentalPassActivatePayloadWire) => {
        const formData = new FormData();
        formData.append("pass_type", payload.pass_type);
        return apiFormData.post<RentalPassActivateResponseWire>("/api/rental/passes/activate/", formData);
    },

    getOwnerProperties: () => api.get<RentalPropertyWire[]>("/api/rental/my/properties/"),

    createOwnerProperty: (payload: OwnerPropertyUpsertPayload) =>
        apiFormData.post<RentalPropertyWire>("/api/rental/my/properties/create/", buildOwnerFormData(payload)),

    updateOwnerProperty: (propertyId: string, payload: OwnerPropertyUpsertPayload) =>
        apiFormData.post<RentalPropertyWire>(`/api/rental/my/properties/?property_id=${encodeURIComponent(propertyId)}`, buildOwnerFormData(payload)),

    listCities: () => api.get<RentalMasterOptionWire[]>("/api/rental/masters/cities/"),
    listLocalities: (cityId?: string) =>
        api.get<RentalMasterOptionWire[]>("/api/rental/masters/localities/", {
            params: cityId ? { city_id: cityId } : undefined,
        }),
    listPropertyTypes: () => api.get<RentalMasterOptionWire[]>("/api/rental/masters/property-types/"),
    listBhkTypes: () => api.get<RentalMasterOptionWire[]>("/api/rental/masters/bhk-types/"),
    listFurnishingTypes: () => api.get<RentalMasterOptionWire[]>("/api/rental/masters/furnishing-types/"),
    listAvailabilityTypes: () => api.get<RentalMasterOptionWire[]>("/api/rental/masters/availability-types/"),
    listAmenities: () => api.get<RentalMasterOptionWire[]>("/api/rental/masters/amenities/"),
    listKeywords: () => api.get<RentalMasterOptionWire[]>("/api/rental/masters/keywords/"),
};

