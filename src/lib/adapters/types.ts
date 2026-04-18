export type BHKOption = "1_rk" | "1_bhk" | "2_bhk" | "3_bhk";
export type PropertyType = "rent_house" | "pg" | "zero_deposit" | "co_living";
export type MoveInOption = "immediately" | "15_days" | "30_days";
export type SortOption = "recommended" | "price_low_to_high" | "price_high_to_low" | "newest";

export interface FilterState {
    query: string;
    selectedLocalities: string[];
    bhk: BHKOption[];
    budgetMin: number;
    budgetMax: number;
    propertyTypes: PropertyType[];
    moveInBy: MoveInOption[];
    sortBy: SortOption;
}

export interface PropertyListItem {
    id: string;
    title: string;
    locality: string;
    city: string;
    pricePerMonth: number;
    deposit: number;
    furnished: boolean;
    image: string;
    bhk: BHKOption;
    propertyTypes: PropertyType[];
    moveInOptions: MoveInOption[];
    badges: string[];
    features: string[];
}

export interface UnlockOffer {
    weeklyPassPrice: number;
    headline: string;
    subHeadline: string;
    bullets: string[];
    ctaLabel: string;
}

export interface OwnerContact {
    ownerName: string;
    maskedPhone: string;
    whatsappNumber: string;
}

export interface PropertyDetail extends PropertyListItem {
    description: string;
    mapPreviewLabel: string;
    mapPreviewSubLabel: string;
    amenities: string[];
    highlights: string[];
    owner: OwnerContact;
    unlockOffer: UnlockOffer;
}

export interface HomeFeed {
    categories: string[];
    localities: string[];
    recommended: PropertyListItem[];
    listings: PropertyListItem[];
    topEvents: PropertyListItem[];
    promoBannerText: string;
}

export interface PropertyAdapter {
    getHomeFeed(): Promise<HomeFeed>;
    searchProperties(filters: FilterState): Promise<PropertyListItem[]>;
    getPropertyDetail(id: string): Promise<PropertyDetail>;
    refreshListings(): Promise<void>;
}

export interface AuthSession {
    isAuthenticated: boolean;
    isGuest: boolean;
    phone?: string;
    userName?: string;
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
}

export interface OtpRequestResult {
    success: boolean;
    message: string;
    demoCode?: string;
}

export interface AuthAdapter {
    requestOtp(phone: string): Promise<OtpRequestResult>;
    verifyOtp(code: string): Promise<AuthSession>;
    getSession(): AuthSession;
}

export type CheckoutStatus = "idle" | "pending" | "success" | "failed";

export interface StartUnlockPayload {
    propertyId: string;
    amount: number;
}

export interface CheckoutState {
    id: string;
    propertyId: string;
    amount: number;
    status: CheckoutStatus;
    message: string;
    updatedAt: string;
    unlockedPhone?: string;
    unlockedName?: string;
    creditsRemaining?: number;
}

export interface CheckoutAdapter {
    startUnlock(payload: StartUnlockPayload): Promise<CheckoutState>;
    confirmUnlock(id: string, outcome?: "success" | "failed"): Promise<CheckoutState>;
    getUnlockStatus(id: string): Promise<CheckoutState | null>;
}

export interface SelectOption {
    id: string;
    name: string;
}

export interface OwnerListingFormInput {
    title: string;
    propertyTypeId: string;
    cityId: string;
    localityId: string;
    bhkId: string;
    furnishingId: string;
    availabilityId: string;
    rent: string;
    deposit: string;
    builtUpAreaSqft: string;
    addressLine: string;
    description: string;
    contactPhone: string;
    amenityIds: string[];
    keywords: string[];
    documentType: string;
    imageFiles: File[];
    documentFile: File | null;
    clearImages?: boolean;
    clearDocuments?: boolean;
}

export interface OwnerListingSummary {
    id: string;
    title: string;
    locality: string;
    city: string;
    rent: number;
    deposit: number;
    status: string;
    image: string;
    updatedAt: string;
}

export type OwnerLeadState = "locked" | "unlocked";

export interface OwnerLeadCard {
    id: string;
    tenantName: string;
    phoneMasked: string;
    phone: string;
    state: OwnerLeadState;
    propertyId: string;
    unlockedAt?: string;
}

export interface OwnerDashboardData {
    ownerName: string;
    creditsLeft: number;
    listings: OwnerListingSummary[];
    leads: OwnerLeadCard[];
}

export interface OwnerMastersData {
    cities: SelectOption[];
    localities: SelectOption[];
    propertyTypes: SelectOption[];
    bhkTypes: SelectOption[];
    furnishingTypes: SelectOption[];
    availabilityTypes: SelectOption[];
    amenities: SelectOption[];
    keywords: SelectOption[];
}

export interface OwnerListingAdapter {
    getOwnerEntryRoute(): Promise<"/owner/dashboard" | "/owner/list-property">;
    getDashboard(): Promise<OwnerDashboardData>;
    getMasters(cityId?: string): Promise<OwnerMastersData>;
    getPropertyForEdit(id: string): Promise<OwnerListingFormInput>;
    createProperty(input: OwnerListingFormInput): Promise<OwnerListingSummary>;
    updateProperty(id: string, input: OwnerListingFormInput): Promise<OwnerListingSummary>;
    unlockLead(leadId: string): Promise<OwnerLeadCard>;
}
