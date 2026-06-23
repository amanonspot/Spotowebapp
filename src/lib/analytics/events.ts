/**
 * events.ts
 *
 * Single source of truth for all GA4 event names and their TypeScript parameter
 * interfaces. Every event pushed to window.dataLayer must use a constant from
 * this file — never a raw string.
 *
 * Naming convention: lowercase_snake_case, [noun]_[verb_past_tense]
 * Versioning: event_version field increments when schema changes (v1 → v2).
 *
 * @governance
 * Before adding a new event:
 *  1. Follow the naming convention above.
 *  2. Add a JSDoc comment with: trigger, parameters, GTM tags that consume it.
 *  3. Add a TypeScript interface for its parameters.
 *  4. Increment event_version if an existing event's schema changes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared base — every event includes these fields automatically via analytics.ts
// ─────────────────────────────────────────────────────────────────────────────
export interface BaseEventParams {
    event_version: string;
    event_id: string;
    timestamp: number;
    session_id: string;
    client_id: string;
    user_id: string | null;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared property context — attached to all property-related events
// ─────────────────────────────────────────────────────────────────────────────
export interface PropertyContext {
    property_id: string;
    owner_id?: string;
    city: string;
    locality?: string;
    bhk?: string;
    rent?: number;
    property_type?: string;
    listing_age_days?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Event name constants
// ─────────────────────────────────────────────────────────────────────────────
export const ANALYTICS_EVENTS = {

    // ── Home Page ──────────────────────────────────────────────────────────────
    /** Fires when the home feed renders with property listings. */
    HOME_LOADED: 'home_loaded',

    // ── Property Performance ───────────────────────────────────────────────────
    /** Fires when a PropertyCard enters the viewport (IntersectionObserver). */
    PROPERTY_IMPRESSION: 'property_impression',
    /** Fires when the property detail page fully loads with data. */
    PROPERTY_DETAIL_VIEWED: 'property_detail_viewed',
    /** Fires when a property card is clicked (home or search). */
    PROPERTY_CARD_CLICKED: 'property_card_clicked',
    /** Fires when user taps the Unlock Contact / SwipeUnlock button. */
    PROPERTY_UNLOCK_CLICKED: 'property_unlock_clicked',
    /** Fires when contact is successfully revealed to the tenant. */
    PROPERTY_UNLOCK_SUCCESS: 'property_unlock_success',
    /** Fires when unlock attempt fails (no credits, no pass, api error). */
    PROPERTY_UNLOCK_FAILED: 'property_unlock_failed',
    /** Fires when user taps the share button on a property. */
    PROPERTY_SHARE: 'property_share',
    /** Fires when user saves/wishlists a property. */
    PROPERTY_SAVED: 'property_saved',

    // ── Lead Intent (post-unlock) ──────────────────────────────────────────────
    /** Fires when user taps the call button after contact is revealed. */
    CALL_OWNER_CLICKED: 'call_owner_clicked',
    /** Fires when user taps the WhatsApp button after contact is revealed. */
    WHATSAPP_OWNER_CLICKED: 'whatsapp_owner_clicked',
    /** Fires when user taps the share-contact button. */
    SHARE_CONTACT_CLICKED: 'share_contact_clicked',

    // ── Search ─────────────────────────────────────────────────────────────────
    /** Fires when user focuses the search input or opens the search form. */
    SEARCH_STARTED: 'search_started',
    /** Fires when user submits the search form. */
    SEARCH_PERFORMED: 'search_performed',
    /** Fires when search results are rendered. */
    SEARCH_RESULTS_VIEWED: 'search_results_viewed',
    /** Fires when a filter chip is changed. */
    SEARCH_FILTER_APPLIED: 'search_filter_applied',
    /** Fires when a filter is reset/cleared. */
    SEARCH_FILTER_CLEARED: 'search_filter_cleared',
    /**
     * Fires when user had ≥1 filter filled but navigated away without submitting.
     * Triggered on route change away from search page.
     */
    SEARCH_ABANDONED: 'search_abandoned',
    /** Fires when search returns zero properties. */
    NO_RESULTS_SHOWN: 'no_results_shown',
    /** Fires when user switches to map view in search. */
    MAP_VIEW_TOGGLED: 'map_view_toggled',

    // ── Pass Purchase Flow ─────────────────────────────────────────────────────
    /** Fires when user clicks "Buy Day Pass" CTA. */
    PASS_PURCHASE_INITIATED: 'pass_purchase_initiated',
    /** Fires when the pass paywall overlay is shown to the user. */
    PASS_PAYWALL_VIEWED: 'pass_paywall_viewed',
    /**
     * Fires when user dismisses the paywall overlay without paying.
     * Includes time_spent_seconds on the paywall.
     */
    PASS_PAYWALL_DISMISSED: 'pass_paywall_dismissed',
    /** Fires when runRazorpayCheckout is called (modal about to open). */
    PASS_PURCHASE_STARTED: 'pass_purchase_started',
    /** Fires when Razorpay modal is dismissed by the user. */
    PASS_PURCHASE_CANCELLED: 'pass_purchase_cancelled',
    /**
     * Fires on Razorpay client-side success callback.
     * NOTE: This is an UNVERIFIED signal. Use purchase_verified (backend) for revenue reports.
     */
    PASS_PURCHASE_COMPLETED: 'pass_purchase_completed',
    /** Fires when Razorpay returns a failure. */
    PASS_PURCHASE_FAILED: 'pass_purchase_failed',

    // ── Pass Banner ────────────────────────────────────────────────────────────
    /** Fires when the pass upsell banner enters the viewport. */
    PASS_BANNER_VIEWED: 'pass_banner_viewed',
    /** Fires when user clicks the pass CTA in the home banner. */
    PASS_BANNER_CLICKED: 'pass_banner_clicked',

    // ── Auth ───────────────────────────────────────────────────────────────────
    /** Fires when user clicks login / OTP screen opens. */
    AUTH_LOGIN_INITIATED: 'auth_login_initiated',
    /** Fires when phone number is submitted for OTP. */
    AUTH_OTP_REQUESTED: 'auth_otp_requested',
    /** Fires on successful OTP verification + token storage. */
    AUTH_LOGIN_SUCCESS: 'auth_login_success',
    /** Fires when OTP verification fails. */
    AUTH_LOGIN_FAILED: 'auth_login_failed',
    /** Fires on first-ever successful login (new account). */
    AUTH_SIGNUP_COMPLETED: 'auth_signup_completed',
    /** Fires when user logs out. */
    AUTH_LOGOUT: 'auth_logout',
    /**
     * Fires when an unauthenticated user tries to unlock/buy a pass.
     * They are redirected to login — this tracks the intent drop-off.
     */
    AUTH_WALL_HIT: 'auth_wall_hit',

    // ── Property Detail Engagement ─────────────────────────────────────────────
    /**
     * Fires when user navigates away from a property detail page.
     * Includes time_spent_seconds, was_unlocked, saw_paywall.
     */
    PROPERTY_DETAIL_EXITED: 'property_detail_exited',

    // ── Owner Listing Wizard ───────────────────────────────────────────────────
    /** Fires when owner opens /owner/list-property. */
    LISTING_WIZARD_STARTED: 'listing_wizard_started',
    /** Fires on each wizard step completion. */
    LISTING_WIZARD_STEP_COMPLETED: 'listing_wizard_step_completed',
    /** Fires when user leaves mid-wizard without completing. */
    LISTING_WIZARD_STEP_ABANDONED: 'listing_wizard_step_abandoned',
    /** Fires on form validation error during any wizard step. */
    LISTING_WIZARD_VALIDATION_FAILED: 'listing_wizard_validation_failed',
    /** Fires on photo upload success. */
    LISTING_PHOTO_UPLOADED: 'listing_photo_uploaded',
    /** Fires when photo upload fails. */
    LISTING_PHOTO_UPLOAD_FAILED: 'listing_photo_upload_failed',
    /** Fires when the final submission API call returns an error. */
    LISTING_SUBMIT_FAILED: 'listing_submit_failed',
    /** Fires when property is successfully published. */
    LISTING_PUBLISHED: 'listing_published',
    /** Fires when owner starts editing an existing listing. */
    LISTING_EDIT_STARTED: 'listing_edit_started',
    /** Fires when owner deletes a listing. */
    LISTING_DELETED: 'listing_deleted',

    // ── Dashboards ─────────────────────────────────────────────────────────────
    /** Fires when owner dashboard page loads. */
    OWNER_DASHBOARD_VIEWED: 'owner_dashboard_viewed',
    /** Fires when owner unlocks a tenant lead (swipe-to-unlock). */
    OWNER_LEAD_UNLOCKED: 'owner_lead_unlocked',
    /** Fires when owner opens the contacts page. */
    OWNER_CONTACTS_VIEWED: 'owner_contacts_viewed',
    /** Fires when agent dashboard page loads. */
    AGENT_DASHBOARD_VIEWED: 'agent_dashboard_viewed',

    // ── Web Vitals ─────────────────────────────────────────────────────────────
    WEB_VITAL_LCP: 'web_vital_lcp',
    WEB_VITAL_CLS: 'web_vital_cls',
    WEB_VITAL_INP: 'web_vital_inp',
    WEB_VITAL_TTFB: 'web_vital_ttfb',
    WEB_VITAL_FCP: 'web_vital_fcp',

} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// ─────────────────────────────────────────────────────────────────────────────
// Per-event parameter interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface HomeLoadedParams {
    property_count: number;
    city?: string;
    is_logged_in: boolean;
}

export interface PropertyImpressionParams extends PropertyContext {
    position_index: number;
    source: 'home' | 'search';
}

export interface PropertyDetailViewedParams extends PropertyContext {
    image_count?: number;
    amenity_count?: number;
    furnishing?: string;
    availability?: string;
}

export interface PropertyCardClickedParams extends PropertyContext {
    position_index: number;
    source: 'home' | 'search';
}

export interface PropertyUnlockClickedParams extends PropertyContext {
    credits_available: number;
    has_pass: boolean;
    unlock_method_available: 'credit' | 'pass' | 'none';
}

export interface PropertyUnlockSuccessParams extends PropertyContext {
    unlock_method: 'credit' | 'pass';
    credits_remaining_after?: number;
}

export interface PropertyUnlockFailedParams extends PropertyContext {
    failure_reason: 'no_credits' | 'no_pass' | 'api_error' | string;
}

export type LeadIntentParams = PropertyContext;


export interface SearchStartedParams {
    source_page: string;
}

export interface SearchPerformedParams {
    city?: string;
    locality?: string;
    bhk_type?: string;
    min_rent?: number;
    max_rent?: number;
    furnishing?: string;
    availability?: string;
    amenities?: string[];
    filter_count: number;
}

export interface SearchResultsViewedParams {
    result_count: number;
    city?: string;
    bhk_type?: string;
}

export interface SearchFilterAppliedParams {
    filter_type: string;
    filter_value: string;
    result_count_after?: number;
}

export interface SearchAbandonedParams {
    city_filled: boolean;
    bhk_filled: boolean;
    rent_filled: boolean;
    time_spent_seconds: number;
    fields_filled_count: number;
}

export interface NoResultsShownParams {
    city?: string;
    locality?: string;
    bhk_type?: string;
    min_rent?: number;
    max_rent?: number;
    furnishing?: string;
    availability?: string;
}

export interface PassPurchaseParams {
    pass_price: number;
    currency: string;
    source?: string;
    property_id?: string;
    property_city?: string;
    property_bhk?: string;
}

export interface PassPaywallViewedParams {
    property_id: string;
    city?: string;
    bhk?: string;
    rent?: number;
    trigger: 'no_credits' | 'buy_pass_cta' | 'resume';
}

export interface PassPaywallDismissedParams {
    property_id: string;
    city?: string;
    bhk?: string;
    time_spent_seconds: number;
    reached_razorpay: boolean;
}

export interface PropertyDetailExitedParams {
    property_id: string;
    city?: string;
    bhk?: string;
    time_spent_seconds: number;
    was_unlocked: boolean;
    saw_paywall: boolean;
    exited_to?: string;
}

export interface AuthWallHitParams {
    intent: 'unlock_contact' | 'buy_pass';
    property_id?: string;
}

export interface PassPurchaseCompletedParams extends PassPurchaseParams {
    razorpay_payment_id: string;
}

export interface PassPurchaseFailedParams extends PassPurchaseParams {
    failure_reason: string;
}

export interface AuthLoginSuccessParams {
    user_type: 'tenant' | 'owner' | 'agent';
    is_new_user: boolean;
}

export interface AuthLoginFailedParams {
    failure_reason: string;
}

export interface ListingWizardStartedParams {
    user_type: 'owner' | 'agent';
}

export interface ListingWizardStepParams {
    step_number: number;
    step_name: string;
    time_on_step_seconds?: number;
}

export interface ListingWizardValidationFailedParams {
    step_number: number;
    step_name: string;
    field_name: string;
    error_message?: string;
}

export interface ListingPhotoUploadFailedParams {
    property_id?: string;
    error_reason?: string;
    file_size_mb?: number;
    file_type?: string;
}

export interface ListingPublishedParams {
    property_id: string;
    city: string;
    bhk?: string;
    rent?: number;
}

export interface OwnerDashboardViewedParams {
    listing_count: number;
    total_leads?: number;
}

export interface OwnerLeadUnlockedParams {
    lead_id: string;
    credits_remaining_after: number;
}

export interface WebVitalParams {
    value_ms?: number;
    value?: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    page_path: string;
    navigation_type?: string;
}
