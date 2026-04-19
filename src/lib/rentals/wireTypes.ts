export type UnknownRecord = Record<string, unknown>;

export type WireApiEnvelope<T> =
    | T
    | {
          data?: T;
          results?: T;
          items?: T;
          count?: number;
          message?: string;
          status?: string | number;
      };

export interface RentalMasterOptionWire extends UnknownRecord {
    id?: string;
    uuid?: string;
    name?: string;
    label?: string;
    code?: string;
    value?: string | number;
    is_active?: boolean;
}

export interface RentalMediaWire extends UnknownRecord {
    id?: string;
    url?: string;
    image_url?: string;
    file?: string;
    media_file?: string;
    image?: string;
    is_cover?: boolean;
    display_image?: boolean;
    is_primary?: boolean;
    sort_order?: number;
}

export interface RentalPropertyWire extends UnknownRecord {
    id?: string;
    property_id?: string;
    title?: string;
    property_title?: string;
    name?: string;
    rent?: number | string;
    monthly_rent?: number | string;
    deposit?: number | string;
    security_deposit?: number | string;
    description?: string;
    address_line?: string;
    city?: RentalMasterOptionWire | string;
    city_id?: string;
    city_name?: string;
    locality?: RentalMasterOptionWire | string;
    locality_id?: string;
    locality_name?: string;
    property_type?: RentalMasterOptionWire | string;
    property_type_id?: string;
    property_type_code?: string;
    property_type_name?: string;
    bhk?: RentalMasterOptionWire | string;
    bhk_id?: string;
    bhk_name?: string;
    bhk_value?: number | string;
    furnishing?: RentalMasterOptionWire | string;
    furnishing_id?: string;
    furnishing_name?: string;
    furnishing_code?: string;
    availability?: RentalMasterOptionWire | string;
    availability_id?: string;
    availability_name?: string;
    availability_code?: string;
    built_up_area_sqft?: number | string;
    amenities?: Array<RentalMasterOptionWire | string>;
    amenity_ids?: string[] | string;
    keywords?: Array<RentalMasterOptionWire | string> | string;
    status?: string;
    is_verified?: boolean;
    contact_phone?: string;
    images?: RentalMediaWire[];
    image_files?: RentalMediaWire[];
    media?: RentalMediaWire[];
    display_image?: string;
    created_at?: string;
    updated_at?: string;
}

export interface RentalContactUnlockRequestWire {
    name: string;
    phone: string;
    message?: string;
}

export interface RentalContactUnlockResponseWire extends UnknownRecord {
    success?: boolean;
    message?: string;
    phone?: string;
    owner_phone?: string;
    whatsapp?: string;
    owner_name?: string;
    contact?: UnknownRecord;
    data?: UnknownRecord;
}

export interface RentalPassActivatePayloadWire {
    pass_type: string;
}

export interface RentalPassActivateResponseWire extends UnknownRecord {
    success?: boolean;
    message?: string;
    order_id?: string;
    payment_url?: string;
    data?: UnknownRecord;
}

export interface OwnerPropertyUpsertPayload {
    propertyTitle: string;
    title?: string;
    propertyTypeId: string;
    cityId: string;
    localityId: string;
    rent: number;
    deposit: number;
    addressLine: string;
    bhkId: string;
    builtUpAreaSqft: number;
    furnishingId: string;
    availabilityId: string;
    description: string;
    contactPhone: string;
    amenityIds: string[];
    keywords: string[];
    documentType?: string;
    imageFiles?: File[];
    documentFile?: File | null;
    clearImages?: boolean;
    clearDocuments?: boolean;
}
