import { api, apiFormData } from "@/lib/api";
import { clearCache } from "@/lib/api/client";
import {
    OwnerPropertyUpsertPayload,
    RentalAgentCreateDataDto,
    RentalAgentMeDataDto,
    RentalContactUnlockRequestDto,
    RentalContactUnlockResponseDto,
    RentalMasterOptionDto,
    RentalPassActivatePayloadDto,
    RentalPassActivateResponseDto,
    RentalMyPropertyCreateDataDto,
    RentalMyPropertyUpdateDataDto,
    RentalPropertyDto,
    WireApiEnvelope,
} from "@/lib/rentals/wireTypes";

export interface RentalPropertyListParams {
    city_id?: string;
    locality_id?: string;
    property_type_id?: string;
    bhk_id?: string;
    rent_min?: number;
    rent_max?: number;
    amenity_ids?: string[];
    keywords?: string[];
    property_id?: string;
    lat?: number;
    lng?: number;
    radius_km?: number;
}

type UpsertMode = "create" | "update";

const appendFileIfPresent = (formData: FormData, key: string, file: File | null | undefined) => {
    if (!file) return;
    formData.append(key, file);
};

const appendText = (
    formData: FormData,
    key: string,
    value: string | number | null | undefined,
    options?: { allowEmpty?: boolean }
) => {
    if (value === undefined || value === null) return;
    const next = String(value);
    if (next.length === 0 && !options?.allowEmpty) return;
    formData.append(key, next);
};

const shouldInclude = (
    mode: UpsertMode,
    changedKeys: Set<keyof OwnerPropertyUpsertPayload> | undefined,
    key: keyof OwnerPropertyUpsertPayload
) => mode === "create" || Boolean(changedKeys?.has(key));

const ensureDocumentPair = (
    mode: UpsertMode,
    changedKeys: Set<keyof OwnerPropertyUpsertPayload> | undefined,
    payload: OwnerPropertyUpsertPayload
) => {
    const documentTypeChanged = shouldInclude(mode, changedKeys, "documentType");
    const documentFileChanged = shouldInclude(mode, changedKeys, "documentFile");
    const mustValidatePair = mode === "create" || documentTypeChanged || documentFileChanged;
    if (!mustValidatePair) return;

    const hasDocumentType = Boolean(payload.documentType && payload.documentType.trim());
    const hasDocumentFile = Boolean(payload.documentFile);
    if (hasDocumentType !== hasDocumentFile) {
        throw new Error("document_type and document_file must be provided together.");
    }
};

const buildOwnerFormData = (
    payload: OwnerPropertyUpsertPayload,
    options: { mode: UpsertMode; changedKeys?: Set<keyof OwnerPropertyUpsertPayload> }
): FormData => {
    const { mode, changedKeys } = options;
    const formData = new FormData();

    ensureDocumentPair(mode, changedKeys, payload);

    const title = payload.propertyTitle.trim();

    if (shouldInclude(mode, changedKeys, "propertyTitle")) {
        appendText(formData, "property_title", title);
    }
    if (shouldInclude(mode, changedKeys, "ownerName")) {
        appendText(formData, "owner_name", payload.ownerName || "");
    }
    if (payload.ownerPhone && mode === "create") {
        appendText(formData, "owner_phone", payload.ownerPhone);
    }
    if (payload.ownerPhone && shouldInclude(mode, changedKeys, "ownerPhone")) {
        appendText(formData, "owner_phone", payload.ownerPhone);
    }
    if (shouldInclude(mode, changedKeys, "propertyTypeId")) {
        appendText(formData, "property_type_id", payload.propertyTypeId);
    }
    if (shouldInclude(mode, changedKeys, "cityId")) {
        appendText(formData, "city_id", payload.cityId);
    }
    if (shouldInclude(mode, changedKeys, "rent")) {
        appendText(formData, "rent", payload.rent);
    }
    if (shouldInclude(mode, changedKeys, "employeeId")) {
        appendText(formData, "employee_id", payload.employeeId);
    }
    if (shouldInclude(mode, changedKeys, "deposit")) {
        appendText(formData, "deposit", payload.deposit);
    }
    if (shouldInclude(mode, changedKeys, "localityId")) {
        if (payload.localityId) {
            appendText(formData, "locality_id", payload.localityId, { allowEmpty: mode === "update" });
        } else if (payload.localityName) {
            appendText(formData, "locality_name", payload.localityName);
        }
    }
    if (shouldInclude(mode, changedKeys, "addressLine")) {
        appendText(formData, "address_line", payload.addressLine);
    }
    if (shouldInclude(mode, changedKeys, "bhkId")) {
        appendText(formData, "bhk_id", payload.bhkId, { allowEmpty: mode === "update" });
    }
    if (shouldInclude(mode, changedKeys, "builtUpAreaSqft")) {
        appendText(formData, "built_up_area_sqft", payload.builtUpAreaSqft);
    }
    if (shouldInclude(mode, changedKeys, "furnishingId")) {
        appendText(formData, "furnishing_id", payload.furnishingId);
    }
    if (shouldInclude(mode, changedKeys, "availabilityId")) {
        appendText(formData, "availability_id", payload.availabilityId);
    }
    if (shouldInclude(mode, changedKeys, "availableFrom")) {
        appendText(formData, "available_from", payload.availableFrom || "", {
            allowEmpty: mode === "update",
        });
    }
    if (shouldInclude(mode, changedKeys, "mapUrl")) {
        appendText(formData, "map_url", payload.mapUrl || "", { allowEmpty: mode === "update" });
    }
    if (shouldInclude(mode, changedKeys, "latitude")) {
        appendText(formData, "latitude", payload.latitude || "", { allowEmpty: mode === "update" });
    }
    if (shouldInclude(mode, changedKeys, "longitude")) {
        appendText(formData, "longitude", payload.longitude || "", { allowEmpty: mode === "update" });
    }
    if (shouldInclude(mode, changedKeys, "description")) {
        appendText(formData, "description", payload.description);
    }
    if (shouldInclude(mode, changedKeys, "contactPhone")) {
        appendText(formData, "contact_phone", payload.contactPhone);
    }

    if (shouldInclude(mode, changedKeys, "amenityIds")) {
        appendText(formData, "amenity_ids", JSON.stringify(payload.amenityIds || []), {
            allowEmpty: mode === "update",
        });
    }
    if (shouldInclude(mode, changedKeys, "keywords")) {
        const keywords = (payload.keywords || []).map((item) => item.trim()).filter(Boolean);
        appendText(formData, "keywords", JSON.stringify(keywords), {
            allowEmpty: mode === "update",
        });
    }
    if (shouldInclude(mode, changedKeys, "clearImages") && payload.clearImages) {
        appendText(formData, "clear_images", "true");
    }
    if (shouldInclude(mode, changedKeys, "clearDocuments") && payload.clearDocuments) {
        appendText(formData, "clear_documents", "true");
    }
    if (shouldInclude(mode, changedKeys, "documentType")) {
        appendText(formData, "document_type", payload.documentType || "");
    }
    if (shouldInclude(mode, changedKeys, "imageFiles")) {
        payload.imageFiles?.forEach((file) => appendFileIfPresent(formData, "image_files", file));
    }
    if (shouldInclude(mode, changedKeys, "documentFile")) {
        appendFileIfPresent(formData, "document_file", payload.documentFile);
    }

    return formData;
};

const serializePropertyListParams = (params: RentalPropertyListParams = {}) => {
    const search = new URLSearchParams();
    if (params.city_id) search.append("city_id", params.city_id);
    if (params.locality_id) search.append("locality_id", params.locality_id);
    if (params.property_type_id) search.append("property_type_id", params.property_type_id);
    if (params.bhk_id) search.append("bhk_id", params.bhk_id);
    if (params.property_id) search.append("property_id", params.property_id);
    if (typeof params.rent_min === "number") search.append("rent_min", String(params.rent_min));
    if (typeof params.rent_max === "number") search.append("rent_max", String(params.rent_max));
    if (typeof params.lat === "number") search.append("lat", String(params.lat));
    if (typeof params.lng === "number") search.append("lng", String(params.lng));
    if (typeof params.radius_km === "number") search.append("radius_km", String(params.radius_km));
    if (params.amenity_ids && params.amenity_ids.length > 0) {
        search.append("amenity_ids", JSON.stringify(params.amenity_ids));
    }
    if (params.keywords && params.keywords.length > 0) {
        search.append("keywords", JSON.stringify(params.keywords));
    }
    return search.toString();
};

export const rentalsService = {
    listProperties: (params?: RentalPropertyListParams) =>
        api.get<WireApiEnvelope<RentalPropertyDto[]>>("/api/rental/properties/", {
            params,
            paramsSerializer: (input) => serializePropertyListParams(input as RentalPropertyListParams),
            skipAuth: true,
        }),

    getPropertyDetail: (propertyId: string) =>
        api.get<WireApiEnvelope<RentalPropertyDto>>("/api/rental/properties/", {
            params: { property_id: propertyId },
            skipAuth: true,
        }),

    unlockPropertyContact: (propertyId: string, payload: RentalContactUnlockRequestDto) =>
        api.post<RentalContactUnlockResponseDto>("/api/rental/properties/get-contact/", payload, {
            params: { property_id: propertyId },
            headers: { "Content-Type": "application/json" },
        }),

    activatePass: (payload: RentalPassActivatePayloadDto) => {
        const formData = new FormData();
        formData.append("pass_type", payload.pass_type);
        if (payload.property_id) {
            formData.append("property_id", payload.property_id);
        }
        return apiFormData.post<RentalPassActivateResponseDto>("/api/rental/passes/activate/", formData);
    },

    updateAgentProperty: async (
        propertyId: string,
        payload: OwnerPropertyUpsertPayload,
        changedKeys?: Set<keyof OwnerPropertyUpsertPayload>
    ) => {
        const updated = await api.patch<WireApiEnvelope<RentalAgentCreateDataDto>>(
            `/api/rental/agent/properties/update/?property_id=${encodeURIComponent(propertyId)}`,
            buildOwnerFormData({ ...payload, ownerPhone: payload.ownerPhone || payload.contactPhone }, { mode: "update", changedKeys }),
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        clearCache("/api/rental/agent/properties/");
        clearCache("/api/rental/properties/");
        clearCache(`/api/rental/properties/?property_id=${encodeURIComponent(propertyId)}`);
        return updated;
    },

    getAgentMe: () => api.get<WireApiEnvelope<RentalAgentMeDataDto>>("/api/rental/agent/me/"),

    getAgentProperties: () =>
        api.get<WireApiEnvelope<RentalPropertyDto[]>>("/api/rental/agent/properties/"),

    createAgentProperty: async (payload: OwnerPropertyUpsertPayload) => {
        const phone = (payload.ownerPhone || payload.contactPhone || "").replace(/\D/g, "").slice(-10);
        if (phone.length !== 10) {
            throw new Error("Owner phone must be a valid 10-digit mobile number.");
        }
        const body = buildOwnerFormData({ ...payload, ownerPhone: phone, contactPhone: phone }, { mode: "create" });
        const created = await apiFormData.post<WireApiEnvelope<RentalAgentCreateDataDto>>(
            "/api/rental/agent/properties/create/",
            body
        );
        clearCache("/api/rental/agent/properties/");
        clearCache("/api/rental/my/properties/");
        clearCache("/api/rental/properties/");
        return created;
    },

    getOwnerProperties: () => api.get<WireApiEnvelope<RentalPropertyDto[]>>("/api/rental/my/properties/"),

    createOwnerProperty: async (payload: OwnerPropertyUpsertPayload) => {
        const created = await apiFormData.post<WireApiEnvelope<RentalMyPropertyCreateDataDto>>(
            "/api/rental/my/properties/create/",
            buildOwnerFormData(payload, { mode: "create" })
        );
        clearCache("/api/rental/my/properties/");
        clearCache("/api/rental/properties/");
        clearCache("/api/rental/properties/?property_id=");
        return created;
    },

    updateOwnerProperty: async (
        propertyId: string,
        payload: OwnerPropertyUpsertPayload,
        changedKeys?: Set<keyof OwnerPropertyUpsertPayload>
    ) => {
        const updated = await api.patch<WireApiEnvelope<RentalMyPropertyUpdateDataDto>>(
            `/api/rental/my/properties/update/?property_id=${encodeURIComponent(propertyId)}`,
            buildOwnerFormData(payload, { mode: "update", changedKeys }),
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        clearCache("/api/rental/my/properties/");
        clearCache("/api/rental/properties/");
        clearCache(`/api/rental/properties/?property_id=${encodeURIComponent(propertyId)}`);
        return updated;
    },

    deleteOwnerProperty: async (propertyId: string) => {
        const deleted = await api.delete<WireApiEnvelope<{ message?: string }>>(
            `/api/rental/my/properties/delete/?property_id=${encodeURIComponent(propertyId)}`
        );
        clearCache("/api/rental/my/properties/");
        clearCache("/api/rental/properties/");
        clearCache(`/api/rental/properties/?property_id=${encodeURIComponent(propertyId)}`);
        return deleted;
    },

    approveProperty: (propertyId: string) =>
        api.patch<WireApiEnvelope<{ message?: string }>>(
            `/api/rental/admin/properties/approve/?property_id=${encodeURIComponent(propertyId)}`
        ),
    rejectProperty: (propertyId: string) =>
        api.patch<WireApiEnvelope<{ message?: string }>>(
            `/api/rental/admin/properties/reject/?property_id=${encodeURIComponent(propertyId)}`
        ),

    getMyPassStatus: () =>
        api.get<WireApiEnvelope<{
            free_contacts_used: number;
            free_contacts_remaining: number;
            has_one_day_active: boolean;
            has_weekly_active: boolean;
            one_day_pass_expires_at: string | null;
            weekly_pass_expires_at: string | null;
        }>>("/api/rental/my/pass-status/"),

    listCities: () => api.get<WireApiEnvelope<RentalMasterOptionDto[]>>("/api/rental/masters/cities/", { skipAuth: true }),
    listLocalities: (cityId: string) =>
        api.get<WireApiEnvelope<RentalMasterOptionDto[]>>("/api/rental/masters/localities/", {
            params: { city_id: cityId },
            skipAuth: true,
        }),
    listPropertyTypes: () =>
        api.get<WireApiEnvelope<RentalMasterOptionDto[]>>("/api/rental/masters/property-types/", { skipAuth: true }),
    listBhkTypes: () => api.get<WireApiEnvelope<RentalMasterOptionDto[]>>("/api/rental/masters/bhk-types/", { skipAuth: true }),
    listFurnishingTypes: () =>
        api.get<WireApiEnvelope<RentalMasterOptionDto[]>>("/api/rental/masters/furnishing-types/", { skipAuth: true }),
    listAvailabilityTypes: () =>
        api.get<WireApiEnvelope<RentalMasterOptionDto[]>>("/api/rental/masters/availability-types/", { skipAuth: true }),
    listAmenities: () => api.get<WireApiEnvelope<RentalMasterOptionDto[]>>("/api/rental/masters/amenities/", { skipAuth: true }),
};
