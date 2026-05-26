import { OwnerListingFormInput } from "@/lib/adapters/types";
import {
    buildChangedKeys,
    toFormFromWire,
    toPayloadFromWire,
    unwrapRentalPropertyList,
} from "@/lib/adapters/ownerAdapter";
import { normalizePropertyList, rentalsService, WireApiEnvelope } from "@/lib/rentals";
import {
    OwnerPropertyUpsertPayload,
    RentalAgentCreateDataDto,
    RentalAgentMeDataDto,
    RentalPropertyDto,
} from "@/lib/rentals/wireTypes";

const unwrapData = <T,>(payload: WireApiEnvelope<T>) => {
    const record = payload as Record<string, unknown>;
    if (record.data !== undefined) return record.data as T;
    return payload as unknown as T;
};

const firstString = (...values: unknown[]): string => {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
};

const normalizePhone10 = (raw: string) => raw.replace(/\D/g, "").slice(-10);

const toAgentPayload = (input: OwnerListingFormInput): OwnerPropertyUpsertPayload => {
    const phone = normalizePhone10(input.contactPhone || "");
    return {
        propertyTitle: input.propertyTitle.trim(),
        ownerName: (input.ownerName || "").trim(),
        ownerPhone: phone,
        propertyTypeId: input.propertyTypeId,
        cityId: input.cityId,
        localityId: input.localityId,
        localityName: input.localityName,
        bhkId: input.bhkId,
        furnishingId: input.furnishingId,
        availabilityId: input.availabilityId,
        availableFrom:
            input.availabilityMode === "date" && input.availableFromDate?.trim()
                ? input.availableFromDate.trim()
                : undefined,
        mapUrl: input.mapUrl?.trim() || undefined,
        latitude: input.latitude?.trim() || undefined,
        longitude: input.longitude?.trim() || undefined,
        rent: Number(input.rent || 0),
        deposit: Number(input.deposit || 0),
        builtUpAreaSqft: Number(input.builtUpAreaSqft || 0),
        addressLine: input.addressLine.trim(),
        description: input.description.trim(),
        contactPhone: phone,
        amenityIds: input.amenityIds.filter(Boolean),
        keywords: Array.from(new Set((input.keywords || []).map((k) => k.trim()).filter(Boolean))),
        documentType: input.documentType,
        imageFiles: input.imageFiles,
        documentFile: input.documentFile,
        clearImages: input.clearImages,
        clearDocuments: input.clearDocuments,
    };
};

const findAgentPropertyWire = async (propertyId: string): Promise<RentalPropertyDto> => {
    const response = await rentalsService.getAgentProperties();
    const wires = unwrapRentalPropertyList(response);
    const wire = wires.find((item) => firstString(item.id, item.property_id) === propertyId);
    if (!wire) {
        throw new Error("Property not found in your agent listings.");
    }
    return wire;
};

export const agentAdapter = {
    async getAgentProfile() {
        const response = await rentalsService.getAgentMe();
        return unwrapData<RentalAgentMeDataDto>(response) ?? { is_agent: false, employee: null };
    },

    async listAgentProperties() {
        const response = await rentalsService.getAgentProperties();
        const list = unwrapData(response);
        return normalizePropertyList(Array.isArray(list) ? list : []);
    },

    async getPropertyForEdit(id: string): Promise<OwnerListingFormInput> {
        const wire = await findAgentPropertyWire(id);
        return toFormFromWire(wire);
    },

    async updateProperty(id: string, input: OwnerListingFormInput) {
        const phone = normalizePhone10(input.contactPhone || "");
        if (phone.length !== 10) {
            throw new Error("Enter a valid 10-digit owner mobile number.");
        }
        if (!(input.ownerName || "").trim()) {
            throw new Error("Owner name is required.");
        }

        const wire = await findAgentPropertyWire(id);
        const previous = toPayloadFromWire(wire);
        const current = toAgentPayload(input);
        const changedKeys = buildChangedKeys(current, previous);

        if ((input.imageFiles?.length || 0) > 0) changedKeys.add("imageFiles");
        if (input.documentFile) changedKeys.add("documentFile");
        if (input.clearImages) changedKeys.add("clearImages");
        if (input.clearDocuments) changedKeys.add("clearDocuments");

        if (changedKeys.size === 0) {
            throw new Error("No changes to update.");
        }

        await rentalsService.updateAgentProperty(id, current, changedKeys);
        const listings = await this.listAgentProperties();
        const updated = listings.find((item) => item.id === id);
        if (!updated) {
            throw new Error("Update succeeded but refreshed agent listings did not return this property.");
        }
        return updated;
    },

    async submitAgentListing(input: OwnerListingFormInput) {
        const phone = normalizePhone10(input.contactPhone || "");
        if (phone.length !== 10) {
            throw new Error("Enter a valid 10-digit owner mobile number.");
        }
        if (!(input.ownerName || "").trim()) {
            throw new Error("Owner name is required.");
        }

        const response = await rentalsService.createAgentProperty(toAgentPayload(input));
        const data = unwrapData<RentalAgentCreateDataDto>(response);
        const propertyId = data?.property_id || "";
        if (!propertyId) {
            throw new Error("Property created but id was missing in response.");
        }
        return {
            id: propertyId,
            ownerPhone: data.owner_phone || phone,
            verificationStatus: data.verification_status || "awaiting_owner_login",
            message:
                typeof (response as { message?: string }).message === "string"
                    ? (response as { message?: string }).message
                    : "Listing saved. Owner must log in to activate.",
        };
    },
};
