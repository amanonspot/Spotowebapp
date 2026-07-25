export type UnknownRecord = Record<string, unknown>;

export interface ApiErrorShape {
    error: string;
    success?: false;
    field_errors?: Record<string, string | string[]>;
    data?: unknown;
}

export interface ApiSuccessEnvelope<T> {
    success: true;
    message?: string;
    data: T;
}

export interface ApiFailureEnvelope {
    success?: false;
    message?: string;
    error?: string;
    field_errors?: Record<string, string | string[]>;
    data?: unknown;
}

export type WireApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiFailureEnvelope | ApiErrorShape | UnknownRecord | T;

export interface RentalMasterOptionDto extends UnknownRecord {
    id: string;
    name: string;
    code?: string;
    is_active?: boolean;
    sort_order?: number;
    state?: string;
    country?: string;
    city_id?: string;
    city_name?: string;
    bhk_value?: number;
}

export interface RentalPropertyImageDto {
    id: string;
    image_url?: string;
    video_url?: string;
    media_url?: string;
    media_type?: "image" | "video";
    is_primary: boolean;
    sort_order: number;
}

export interface RentalAmenityDto {
    id: string;
    name: string;
    code?: string;
    is_active?: boolean;
    sort_order?: number;
}

export interface RentalPropertyDto extends UnknownRecord {
    id: string;
    property_title: string;
    description?: string;
    address_line?: string;
    keywords?: string[];
    city_id?: string;
    city_name?: string;
    locality_id?: string;
    locality_name?: string;
    property_type_id?: string;
    property_type_name?: string;
    property_type_code?: string;
    bhk_id?: string;
    bhk_value?: number;
    bhk_name?: string;
    built_up_area_sqft?: number | string;
    rent?: number | string;
    deposit?: number | string;
    furnishing_id?: string;
    furnishing_name?: string;
    furnishing_code?: string;
    availability_id?: string;
    availability_name?: string;
    availability_code?: string;
    available_from?: string;
    contact_phone?: string;
    owner_name?: string;
    map_url?: string;
    latitude?: string | number;
    longitude?: string | number;
    images?: RentalPropertyImageDto[];
    amenities?: RentalAmenityDto[];
    amenity_ids?: string[];
    listed_by_employee_id?: string;
    listed_by_employee_name?: string;
    is_active?: boolean;
    is_verified?: boolean;
    verification_status?: string;
    status_reason?: string;
    last_status_at?: string;
    is_publicly_visible?: boolean;
    created_at?: string;
    updated_at?: string;
    property_id?: string;
    documents?: RentalOwnerDocumentDto[];
}

export interface RentalMyPropertyCreateDataDto {
    property_id: string;
    is_verified: boolean;
    verification_status?: string;
    status?: string;
    document?: RentalOwnerDocumentDto | null;
}

export interface RentalMyPropertyUpdateDataDto {
    property_id: string;
    is_verified?: boolean;
    verification_status?: string;
    status?: string;
    document?: RentalOwnerDocumentDto | null;
}

export interface RentalContactUnlockRequestDto {
    name?: string;
    phone?: string;
    message?: string;
}

export interface RentalUnlockedLeadDto {
    id: string;
    property_id: string;
    property_title: string;
    name?: string;
    phone?: string;
    message?: string;
    created_at?: string;
}

export interface RentalUnlockedOwnerDto {
    phone: string;
    email?: string;
    name?: string;
}

export interface RentalOwnerDocumentDto {
    id: string;
    document_type: string;
    document_file_url: string;
    uploaded_at?: string;
}

export interface RentalContactUnlockSuccessDataDto {
    lead: RentalUnlockedLeadDto;
    owner: RentalUnlockedOwnerDto;
    documents: RentalOwnerDocumentDto[];
}

export interface RentalPassOptionDto {
    pass_type: "one_day" | "weekly";
    price: number;
    currency: string;
    duration_days: number;
}

export interface RentalPaywallDto {
    one_day: RentalPassOptionDto;
}

export interface RentalContactUnlockSuccessDto {
    success: true;
    message?: string;
    data: RentalContactUnlockSuccessDataDto;
}

export interface RentalContactUnlockPaywallDto {
    success?: false;
    error: string;
    data: RentalPaywallDto;
}

export type RentalContactUnlockResponseDto = RentalContactUnlockSuccessDto | RentalContactUnlockPaywallDto | ApiErrorShape;

export interface RentalPassActivatePayloadDto {
    pass_type: "one_day";
    property_id?: string;
}

export interface RentalPassActivateDataDto {
    payment_id: string;
    razorpay_order_id: string;
    razorpay_key_id: string;
    amount: number;
    currency: string;
    pass_type: "one_day" | "weekly";
}

export type RentalPassActivateResponseDto = ApiSuccessEnvelope<RentalPassActivateDataDto> | ApiErrorShape | ApiFailureEnvelope;

export interface RentalAgentEmployeeDto {
    id: string;
    employee_id: string;
    is_agent?: boolean;
    user_id?: string | null;
    user_phone?: string | null;
    name: string;
    phone?: string;
    email?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface RentalAdminListMetaDto {
    page: number;
    page_size: number;
    total: number;
    has_more: boolean;
    verification_status?: string;
}

export interface RentalAdminListingsResponseDto {
    success?: boolean;
    data: RentalPropertyDto[];
    meta?: RentalAdminListMetaDto;
}

export interface RentalAgentMeDataDto {
    is_agent: boolean;
    employee: RentalAgentEmployeeDto | null;
}

export interface RentalAgentCreateDataDto {
    property_id: string;
    owner_phone?: string;
    owner_id?: string;
    verification_status?: string;
    is_verified?: boolean;
    listed_by_employee_id?: string;
    document?: RentalOwnerDocumentDto | null;
}

export interface OwnerPropertyUpsertPayload {
    propertyTitle: string;
    ownerName?: string;
    ownerPhone?: string;
    propertyTypeId: string;
    cityId: string;
    localityId: string;
    localityName?: string;
    rent: number;
    deposit: number;
    addressLine: string;
    bhkId: string;
    builtUpAreaSqft: number;
    furnishingId: string;
    availabilityId: string;
    availableFrom?: string;
    mapUrl?: string;
    latitude?: string;
    longitude?: string;
    description: string;
    contactPhone: string;
    amenityIds: string[];
    keywords: string[];
    employeeId?: string;
    documentType?: string;
    imageFiles?: File[];
    documentFile?: File | null;
    clearImages?: boolean;
    clearDocuments?: boolean;
    deleteImageIds?: string[];
}

export interface AdminDailyCountDto {
    day: string;
    count: number;
}

export interface AdminUsersFunnelDto {
    signups: number;
    logged_in: number;
    unlocked_contact: number;
    bought_pass: number;
}

export interface AdminUsersStatsDto {
    period_days: number;
    total_users: number;
    new_users_today: number;
    new_users_period: number;
    active_users_period: number;
    new_users_7d: number;
    active_users_7d: number;
    owners: number;
    total_unlocks: number;
    unlocks_period: number;
    unlocks_7d: number;
    pass_purchases: number;
    pass_purchases_period: number;
    pass_revenue_inr: number;
    pass_revenue_period_inr: number;
    total_listings: number;
    live_listings: number;
    signup_trend: AdminDailyCountDto[];
    login_trend: AdminDailyCountDto[];
    funnel: AdminUsersFunnelDto;
    /** @deprecated use funnel + period_days */
    funnel_30d?: AdminUsersFunnelDto | null;
}

export interface AdminUserRowDto {
    id: string;
    display_name: string;
    phone?: string | null;
    email?: string | null;
    date_joined?: string | null;
    last_login?: string | null;
    is_owner: boolean;
    is_staff: boolean;
    is_agent: boolean;
    listings_count: number;
    unlocks_count: number;
    pass_purchases_count: number;
    login_count: number;
}

export interface AdminUsersListResponseDto {
    data: AdminUserRowDto[];
    meta: {
        page: number;
        page_size: number;
        total: number;
        has_more: boolean;
    };
}
