"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Building2, ChevronLeft, House, Plus, Upload, X } from "lucide-react";
import OwnerMapPinPicker from "@/components/owner/OwnerMapPinPicker";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import ShimmerBlock from "@/components/revamp/ShimmerBlock";
import config from "@/config/config";
import { ownerAdapter } from "@/lib/adapters";
import { extractLatLngFromGoogleMapsUrl } from "@/lib/maps/parseGoogleMapsUrl";
import { OwnerListingFormInput, OwnerMastersData, SelectOption } from "@/lib/adapters/types";
import { RENTALS_MOCK_MODE } from "@/lib/rentals";

const CREATE_STEP_TITLES = [
    "Select Property Type",
    "Property Details",
    "Photos & Keywords",
    "Pricing & Possession",
    "Address & Submission",
];
const EDIT_STEP_TITLES = [
    "Select Property Type",
    "Property Details",
    "Photos & Keywords",
    "Pricing & Possession",
    "Address & Submission",
];

const sanitizeNumericInput = (value: string) => value.replace(/[^\d]/g, "");
const sanitizeTextInput = (value: string) => value.replace(/\u0000/g, "");
const PROPERTY_TITLE_MAX_LENGTH = 50;

/** Document categories for the verification upload dropdown. */
const DOCUMENT_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: "electricity_bill", label: "Electricity bill" },
    { value: "rent_agreement", label: "Rent / lease agreement" },
    { value: "property_tax", label: "Property tax receipt" },
    { value: "sale_deed", label: "Sale deed / title" },
    { value: "id_proof", label: "Government ID proof" },
    { value: "other", label: "Other" },
];

const emptyForm: OwnerListingFormInput = {
    propertyTitle: "",
    ownerName: "",
    employeeId: "",
    propertyTypeId: "",
    cityId: "",
    localityId: "",
    bhkId: "",
    furnishingId: "",
    availabilityId: "",
    rent: "",
    deposit: "",
    builtUpAreaSqft: "",
    addressLine: "",
    streetLocalityArea: "",
    landmark: "",
    mapUrl: "",
    latitude: "",
    longitude: "",
    description: "",
    contactPhone: "",
    amenityIds: [],
    keywords: [],
    documentType: "",
    imageFiles: [],
    documentFile: null,
    documentMeta: { uploadState: "idle" },
    availableFromDate: "",
    availabilityMode: "immediate",
};

const emptyMasters: OwnerMastersData = {
    cities: [],
    localities: [],
    propertyTypes: [],
    bhkTypes: [],
    furnishingTypes: [],
    availabilityTypes: [],
    amenities: [],
    keywords: [],
};

const fallbackOption = (name: string, id?: string): SelectOption => ({ id: id || name, name });

const fallbackPropertyTypes = [
    fallbackOption("Individual House", "individual_house"),
    fallbackOption("Stand Alone Building", "stand_alone_building"),
    fallbackOption("Flat in a Gated Society", "gated_society"),
];

const fallbackBhk = [
    fallbackOption("1 rk", "1_rk"),
    fallbackOption("1 bhk", "1_bhk"),
    fallbackOption("2 bhk", "2_bhk"),
    fallbackOption("3 bhk", "3_bhk"),
];

const fallbackFurnishing = [
    fallbackOption("Fully", "fully"),
    fallbackOption("Semi", "semi"),
    fallbackOption("Unfurnished", "unfurnished"),
];

const fallbackAmenities = [
    fallbackOption("Modular Kitchen"),
    fallbackOption("Fridge"),
    fallbackOption("Sofa"),
    fallbackOption("Wardrobe"),
    fallbackOption("Bed"),
    fallbackOption("Dining Table"),
    fallbackOption("Power Backup"),
    fallbackOption("Washing Machine"),
    fallbackOption("Geyser"),
    fallbackOption("Wifi"),
    fallbackOption("Study Table"),
    fallbackOption("Gas Pipeline"),
    fallbackOption("Lift"),
];

const fallbackKeywords = [
    fallbackOption("Near Metro"),
    fallbackOption("ITPL"),
    fallbackOption("RMZ Tech Park"),
    fallbackOption("Embasy Tech Village"),
    fallbackOption("Road Facing"),
    fallbackOption("Manyata"),
    fallbackOption("Bachelor Allowed"),
    fallbackOption("Pet Friendly"),
];

const fallbackLocalities = [
    fallbackOption("BTM Layout"),
    fallbackOption("HSR Layout"),
    fallbackOption("Bellandur"),
    fallbackOption("Marathahalli"),
];

const propertyTypeIcon = (index: number) => {
    if (index === 1) return <Building2 className="h-11 w-11" />;
    if (index === 2) return <Building2 className="h-11 w-11" />;
    return <House className="h-11 w-11" />;
};

interface OwnerListingWizardProps {
    mode?: "create" | "edit";
    propertyId?: string;
    initialValue?: OwnerListingFormInput | null;
}

type OwnerFieldKey =
    | "propertyTypeId"
    | "propertyTitle"
    | "bhkId"
    | "furnishingId"
    | "amenityIds"
    | "keywords"
    | "imageFiles"
    | "builtUpAreaSqft"
    | "rent"
    | "deposit"
    | "availabilityId"
    | "availableFromDate"
    | "cityId"
    | "localityId"
    | "addressLine"
    | "streetLocalityArea"
    | "landmark"
    | "mapUrl"
    | "latitude"
    | "longitude"
    | "employeeId"
    | "description"
    | "documentType"
    | "documentFile"
    | "contactPhone"
    | "ownerName"
    | "submit";

type OwnerFieldErrors = Partial<Record<OwnerFieldKey, string>>;

type ErrorWithFields = Error & {
    fieldErrors?: Record<string, string | string[]>;
    data?: unknown;
};

const ownerErrorKeyMap: Record<string, OwnerFieldKey[]> = {
    property_title: ["propertyTitle"],
    title: ["propertyTitle"],
    property_type_id: ["propertyTypeId"],
    city_id: ["cityId"],
    locality_id: ["localityId"],
    bhk_id: ["bhkId"],
    furnishing_id: ["furnishingId"],
    amenity_ids: ["amenityIds"],
    keywords: ["keywords"],
    images: ["imageFiles"],
    image_files: ["imageFiles"],
    rent: ["rent"],
    deposit: ["deposit"],
    built_up_area_sqft: ["builtUpAreaSqft"],
    availability_id: ["availabilityId"],
    available_from: ["availableFromDate"],
    address_line: ["addressLine"],
    street_locality_area: ["streetLocalityArea"],
    landmark: ["landmark"],
    map_url: ["mapUrl"],
    latitude: ["latitude"],
    longitude: ["longitude"],
    employee_id: ["employeeId"],
    description: ["description"],
    document_type: ["documentType"],
    document_file: ["documentFile"],
    clear_documents: ["documentFile"],
    contact_phone: ["contactPhone"],
    phone: ["contactPhone"],
    owner_name: ["ownerName"],
    non_field_errors: ["submit"],
    detail: ["submit"],
};

const fieldErrorMessage = (value: string | string[] | undefined) => {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    return value.find((item) => typeof item === "string" && item.trim())?.trim() || "";
};

const parseFieldErrors = (error: unknown): OwnerFieldErrors => {
    const candidate = error as Partial<ErrorWithFields> | undefined;
    const fromError = candidate?.fieldErrors;
    const fromPayload =
        candidate?.data && typeof candidate.data === "object"
            ? (candidate.data as { field_errors?: Record<string, string | string[]> }).field_errors
            : undefined;
    const fieldSource = fromError || fromPayload;
    if (!fieldSource || typeof fieldSource !== "object") return {};

    const mapped: OwnerFieldErrors = {};
    Object.entries(fieldSource).forEach(([backendKey, rawValue]) => {
        const targets = ownerErrorKeyMap[backendKey] || [];
        const message = fieldErrorMessage(rawValue);
        if (!message) return;
        targets.forEach((target) => {
            mapped[target] = message;
        });
    });
    return mapped;
};

export default function OwnerListingWizard({ mode = "create", propertyId, initialValue = null }: OwnerListingWizardProps) {
    const router = useRouter();
    const isEditMode = mode === "edit";
    const stepTitles = isEditMode ? EDIT_STEP_TITLES : CREATE_STEP_TITLES;
    const totalSteps = stepTitles.length;
    const [step, setStep] = useState(1);
    const [masters, setMasters] = useState<OwnerMastersData>(emptyMasters);
    const [form, setForm] = useState<OwnerListingFormInput>(emptyForm);
    const [loadingMasters, setLoadingMasters] = useState(true);
    const [loadingInitial, setLoadingInitial] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<OwnerFieldErrors>({});
    const [customKeyword, setCustomKeyword] = useState("");
    const [coverIndex, setCoverIndex] = useState(0);
    const [initialLoadNonce, setInitialLoadNonce] = useState(0);
    const [localitySearch, setLocalitySearch] = useState("");
    const [prefillHydrated, setPrefillHydrated] = useState(false);

    useEffect(() => {
        if (!isEditMode) {
            setLoadingInitial(false);
            return;
        }

        let mounted = true;
        const loadInitial = async () => {
            try {
                if (initialValue) {
                    if (mounted) {
                        setForm((prev) => ({ ...prev, ...initialValue }));
                        setLoadingInitial(false);
                    }
                    return;
                }
                if (propertyId) {
                    const editable = await ownerAdapter.getPropertyForEdit(propertyId);
                    if (mounted) {
                        setForm((prev) => ({ ...prev, ...editable }));
                        setLoadingInitial(false);
                    }
                    return;
                }
                if (mounted) setLoadingInitial(false);
            } catch (loadError) {
                if (mounted) {
                    setError(loadError instanceof Error ? loadError.message : "Unable to load editable property.");
                    setLoadingInitial(false);
                }
            }
        };

        loadInitial();
        return () => {
            mounted = false;
        };
    }, [isEditMode, initialValue, propertyId, initialLoadNonce]);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoadingMasters(true);
            setError(null);
            try {
                const response = await ownerAdapter.getMasters(form.cityId || undefined);
                if (mounted) setMasters(response);
            } catch (loadError) {
                if (mounted) {
                    setMasters(emptyMasters);
                    setError(loadError instanceof Error ? loadError.message : "Unable to load listing masters.");
                }
            } finally {
                if (mounted) setLoadingMasters(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [form.cityId]);

    useEffect(() => {
        if (form.cityId || masters.cities.length !== 1) return;
        setForm((prev) => ({ ...prev, cityId: masters.cities[0].id }));
    }, [form.cityId, masters.cities]);

    useEffect(() => {
        if (prefillHydrated) return;
        if (isEditMode && loadingInitial) return;

        let mounted = true;

        const hydratePrefill = async () => {
            try {
                const prefill = await ownerAdapter.getOwnerSubmissionPrefill();
                if (!mounted) return;

                setForm((prev) => {
                    const next = { ...prev };
                    if (!isEditMode && !prev.ownerName?.trim() && prefill.ownerName) {
                        next.ownerName = prefill.ownerName;
                    }
                    if (!prev.contactPhone?.trim() && prefill.contactPhone) {
                        next.contactPhone = prefill.contactPhone.replace(/\D/g, "").slice(-10);
                    }
                    return next;
                });
            } finally {
                if (mounted) setPrefillHydrated(true);
            }
        };

        hydratePrefill();
        return () => {
            mounted = false;
        };
    }, [isEditMode, prefillHydrated, loadingInitial]);

    const propertyTypeOptions = useMemo(
        () => (masters.propertyTypes.length > 0 ? masters.propertyTypes : RENTALS_MOCK_MODE ? fallbackPropertyTypes : []),
        [masters.propertyTypes]
    );
    const bhkOptions = useMemo(
        () => (masters.bhkTypes.length > 0 ? masters.bhkTypes : RENTALS_MOCK_MODE ? fallbackBhk : []),
        [masters.bhkTypes]
    );
    const furnishingOptions = useMemo(
        () => (masters.furnishingTypes.length > 0 ? masters.furnishingTypes : RENTALS_MOCK_MODE ? fallbackFurnishing : []),
        [masters.furnishingTypes]
    );
    const amenityOptions = useMemo(
        () => (masters.amenities.length > 0 ? masters.amenities : RENTALS_MOCK_MODE ? fallbackAmenities : []),
        [masters.amenities]
    );
    const keywordOptions = useMemo(
        () => (masters.keywords.length > 0 ? masters.keywords : RENTALS_MOCK_MODE ? fallbackKeywords : []),
        [masters.keywords]
    );
    const localityOptions = useMemo(
        () => (masters.localities.length > 0 ? masters.localities : RENTALS_MOCK_MODE ? fallbackLocalities : []),
        [masters.localities]
    );
    const cityOptions = useMemo(
        () => (masters.cities.length > 0 ? masters.cities : RENTALS_MOCK_MODE ? [fallbackOption("Bengaluru")] : []),
        [masters.cities]
    );

    const filteredLocalities = useMemo(() => {
        const query = localitySearch.trim().toLowerCase();
        if (!query) return localityOptions;
        return localityOptions.filter((option) => option.name.toLowerCase().includes(query));
    }, [localityOptions, localitySearch]);

    const selectedCityName = useMemo(
        () => cityOptions.find((option) => option.id === form.cityId)?.name || "",
        [cityOptions, form.cityId]
    );
    const selectedLocalityName = useMemo(
        () => localityOptions.find((option) => option.id === form.localityId)?.name || "",
        [localityOptions, form.localityId]
    );

    const mapQuery = [selectedLocalityName, selectedCityName].filter(Boolean).join(", ");

    const hasGoogleMapsKey = Boolean((config.googleMapsApiKey || config.googlePlacesApiKey || "").trim());

    const imagePreviews = useMemo(
        () => form.imageFiles.map((file) => URL.createObjectURL(file)),
        [form.imageFiles]
    );

    useEffect(() => {
        return () => {
            imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [imagePreviews]);

    const sizeValue = Number(form.builtUpAreaSqft || 0);
    const sizeProgress = Math.min(100, Math.max(0, (sizeValue / 5000) * 100));
    const keywordSuggestionTokens = useMemo(
        () => keywordOptions.map((option) => option.name.trim().toLowerCase()).filter(Boolean),
        [keywordOptions]
    );
    const customKeywordValues = useMemo(
        () =>
            (form.keywords || [])
                .map((item) => item.trim())
                .filter(Boolean)
                .filter((item) => !keywordSuggestionTokens.includes(item.toLowerCase())),
        [form.keywords, keywordSuggestionTokens]
    );
    const documentSelected = Boolean(form.documentFile || form.documentMeta?.existingDocumentUrl);
    const immediateAvailability = (masters.availabilityTypes.find((option) => option.name.toLowerCase().includes("immediate")) || null);

    const updateField = <K extends keyof OwnerListingFormInput>(key: K, value: OwnerListingFormInput[K]) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
        const ownerKey = key as OwnerFieldKey;
        setFieldErrors((prev) => {
            if (!prev[ownerKey]) return prev;
            const next = { ...prev };
            delete next[ownerKey];
            return next;
        });
    };

    const setKeywordState = (values: string[]) => {
        setForm((prev) => ({
            ...prev,
            keywords: Array.from(new Set(values.map((item) => item.trim()).filter(Boolean))),
        }));
        setFieldErrors((prev) => {
            if (!prev.keywords) return prev;
            const next = { ...prev };
            delete next.keywords;
            return next;
        });
    };

    const getFieldError = (...keys: OwnerFieldKey[]) => {
        for (const key of keys) {
            const value = fieldErrors[key];
            if (value) return value;
        }
        return "";
    };

    const clearFieldError = (...keys: OwnerFieldKey[]) => {
        setFieldErrors((prev) => {
            let changed = false;
            const next = { ...prev };
            keys.forEach((key) => {
                if (next[key]) {
                    delete next[key];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    };

    const handleMapUrlInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = sanitizeTextInput(event.target.value);
        const extracted = extractLatLngFromGoogleMapsUrl(next);
        setForm((prev) => ({
            ...prev,
            mapUrl: next,
            ...(extracted ? { latitude: extracted.lat, longitude: extracted.lng } : {}),
        }));
        clearFieldError("mapUrl", "latitude", "longitude");
    };

    const renderFieldError = (...keys: OwnerFieldKey[]) => {
        const message = getFieldError(...keys);
        if (!message) return null;
        return (
            <p className="mt-2 rounded-lg border border-red-500/35 bg-red-500/10 px-2 py-1 text-xs text-red-200">
                {message}
            </p>
        );
    };

    const toggleSelection = (key: "amenityIds", value: string) => {
        setForm((prev) => {
            const exists = prev[key].includes(value);
            return {
                ...prev,
                [key]: exists ? prev[key].filter((item) => item !== value) : [...prev[key], value],
            };
        });
        clearFieldError("amenityIds");
    };

    const addCustomKeyword = () => {
        const normalized = customKeyword.replace(/[^\w\s-]/g, "").trim();
        if (!normalized) return;
        if ((form.keywords || []).some((item) => item.toLowerCase() === normalized.toLowerCase())) {
            setCustomKeyword("");
            return;
        }
        setKeywordState([...(form.keywords || []), normalized]);
        setCustomKeyword("");
    };

    const removeCustomKeyword = (keyword: string) => {
        setKeywordState((form.keywords || []).filter((item) => item !== keyword));
    };

    const removeImage = (index: number) => {
        setForm((prev) => ({
            ...prev,
            imageFiles: prev.imageFiles.filter((_, currentIndex) => currentIndex !== index),
        }));
        setCoverIndex((prev) => Math.max(0, Math.min(prev, form.imageFiles.length - 2)));
        clearFieldError("imageFiles");
    };

    const stepValid = useMemo(() => {
        const availabilityValid = form.availabilityMode === "date" ? Boolean(form.availableFromDate) : Boolean(form.availabilityId);
        if (step === 1) return Boolean(form.propertyTypeId);
        if (step === 2)
            return Boolean(
                form.propertyTitle.trim() &&
                    form.propertyTitle.trim().length <= PROPERTY_TITLE_MAX_LENGTH &&
                    form.bhkId &&
                    form.furnishingId
            );
        if (step === 3) return form.imageFiles.length > 0;
        if (step === 4) return Boolean(form.rent && form.deposit && form.builtUpAreaSqft && availabilityValid);
        if (step === 5)
            return Boolean(
                form.cityId &&
                    form.localityId &&
                    form.addressLine.trim() &&
                    form.ownerName?.trim() &&
                    form.contactPhone.length === 10 &&
                    (!form.documentFile || Boolean(form.documentType))
            );
        return false;
    }, [step, form]);

    const goBack = () => {
        if (step === 1) {
            router.push("/");
            return;
        }
        setStep((prev) => Math.max(1, prev - 1));
    };

    const handleNext = async () => {
        if (!stepValid || submitting) return;
        setError(null);
        setSubmitError(null);
        setFieldErrors({});

        if (step < totalSteps) {
            setStep((prev) => prev + 1);
            return;
        }

        setSubmitting(true);
        setSubmitError(null);
        setFieldErrors({});
        try {
            const orderedImages = [...form.imageFiles];
            if (coverIndex > 0 && orderedImages[coverIndex]) {
                const [cover] = orderedImages.splice(coverIndex, 1);
                orderedImages.unshift(cover);
            }

            const fallbackTitle = `${form.bhkId || "Property"} in ${selectedLocalityName || selectedCityName || "Bengaluru"}`;
            const payload: OwnerListingFormInput = {
                ...form,
                propertyTitle: form.propertyTitle.trim() || fallbackTitle,
                imageFiles: orderedImages,
                availabilityId: form.availabilityId || immediateAvailability?.id || "immediate",
                keywords: Array.from(new Set((form.keywords || []).map((item) => item.trim()).filter(Boolean))),
                availabilityMode: form.availabilityMode || "immediate",
                availableFromDate: form.availabilityMode === "date" ? form.availableFromDate : "",
            };

            if (isEditMode && propertyId) {
                await ownerAdapter.updateProperty(propertyId, payload);
                router.push("/owner/dashboard");
                return;
            }

            const created = await ownerAdapter.submitListingFinalStep(payload);
            router.push(`/owner/list-property/pending?property_id=${encodeURIComponent(created.id)}`);
        } catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : "Unable to publish listing.";
            const parsedFieldErrors = parseFieldErrors(submitError);
            const hasFieldErrors = Object.keys(parsedFieldErrors).length > 0;
            if (hasFieldErrors) setFieldErrors(parsedFieldErrors);
            setSubmitError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const nextLabel =
        step === totalSteps
            ? submitting
                ? isEditMode
                    ? "Updating..."
                    : "Publishing..."
                : isEditMode
                ? "Update Listing"
                : "Submit"
            : "Next";

    const sectionCardClass = "rounded-2xl border border-white/20 bg-[#12121A] p-4";
    const chipClass =
        "rounded-xl border border-white/20 px-3 py-2 text-sm text-white/85 transition hover:border-[#A67AEB] active:scale-[0.98]";

    return (
        <main className="min-h-[100dvh] min-h-screen bg-[#050507] text-white">
            <div className="mx-auto w-full max-w-full px-4 pb-[max(2rem,calc(1.5rem+env(safe-area-inset-bottom,0px)))] pt-4 sm:px-6 sm:pb-8 sm:pt-5 md:max-w-2xl md:px-7 lg:max-w-3xl lg:px-8 xl:max-w-4xl 2xl:max-w-5xl">
                {/* Step header */}
                <div className="mb-5 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={goBack}
                        className="btn-shimmer inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/90 hover:border-[#A67AEB] active:scale-95"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    {/* Progress bar */}
                    <div className="flex flex-1 flex-col gap-1">
                        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-[#A67AEB] transition-all duration-500"
                                style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                            />
                        </div>
                        <p className="text-center text-[11px] text-white/45">
                            Step {step} of {totalSteps} — {stepTitles[step - 1]}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push("/owner/dashboard")}
                        className="btn-shimmer inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/90 hover:border-[#A67AEB] active:scale-95"
                    >
                        <Bell className="h-5 w-5" />
                    </button>
                </div>

                <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{stepTitles[step - 1]}</h1>

                {loadingInitial ? (
                    <div className="mt-5 rounded-xl border border-white/20 bg-[#0d0d14] px-3 py-3">
                        <ShimmerBlock className="h-4 w-32 rounded-md" />
                        <ShimmerBlock className="mt-2 h-10 w-full rounded-lg" />
                        <ShimmerBlock className="mt-2 h-10 w-full rounded-lg" />
                    </div>
                ) : isEditMode && error ? (
                    <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-200">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => setInitialLoadNonce((prev) => prev + 1)}
                            className="mt-2 rounded-lg border border-red-400/40 px-2 py-1 text-xs"
                        >
                            Retry loading listing
                        </button>
                    </div>
                ) : null}

                <div className="mt-5 space-y-4">
                    {step === 1 && (
                        <section className={sectionCardClass}>
                            <p className="mb-4 text-lg font-semibold">Select Property Type</p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {propertyTypeOptions.map((option, index) => {
                                    const active = form.propertyTypeId === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => updateField("propertyTypeId", option.id)}
                                            className={`w-full rounded-2xl border px-4 py-5 text-left transition active:scale-[0.97] ${
                                                active
                                                    ? "border-[#B7F041] bg-[#B7F041] text-[#111] shadow-[0_4px_16px_rgba(183,240,65,0.3)]"
                                                    : "border-white/15 bg-[#15151d] text-white hover:border-[#A67AEB]/50"
                                            }`}
                                        >
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                {propertyTypeIcon(index)}
                                                <span className="text-sm font-semibold sm:text-base">{option.name}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                                {propertyTypeOptions.length === 0 ? (
                                    <p className="rounded-xl border border-white/20 bg-[#0d0d14] px-3 py-2 text-sm text-white/70">
                                        Property types are unavailable right now. Please retry.
                                    </p>
                                ) : null}
                                {renderFieldError("propertyTypeId")}
                            </div>
                        </section>
                    )}

                    {step === 2 && (
                        <>
                            <input
                                value={form.propertyTitle}
                                onChange={(event) => {
                                    const nextTitle = sanitizeTextInput(event.target.value);
                                    updateField("propertyTitle", nextTitle);
                                }}
                                maxLength={PROPERTY_TITLE_MAX_LENGTH}
                                placeholder="Property Title"
                                className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                            />
                            <div className="mt-1 flex items-center justify-between text-xs">
                                <span className={form.propertyTitle.trim().length > PROPERTY_TITLE_MAX_LENGTH ? "text-red-300" : "text-white/60"}>
                                    Max {PROPERTY_TITLE_MAX_LENGTH} characters
                                </span>
                                <span className={form.propertyTitle.trim().length > PROPERTY_TITLE_MAX_LENGTH ? "text-red-300" : "text-white/60"}>
                                    {form.propertyTitle.trim().length}/{PROPERTY_TITLE_MAX_LENGTH}
                                </span>
                            </div>
                            {form.propertyTitle.trim().length > PROPERTY_TITLE_MAX_LENGTH ? (
                                <p className="mt-2 rounded-lg border border-red-500/35 bg-red-500/10 px-2 py-1 text-xs text-red-200">
                                    Property title cannot exceed {PROPERTY_TITLE_MAX_LENGTH} characters.
                                </p>
                            ) : null}
                            {renderFieldError("propertyTitle")}

                            <section className={sectionCardClass}>
                                <p className="mb-3 text-sm font-semibold text-white/75">BHK type</p>
                                <div className="flex flex-wrap gap-2">
                                    {bhkOptions.map((option) => {
                                        const active = form.bhkId === option.id;
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => updateField("bhkId", option.id)}
                                                className={`${chipClass} ${active ? "border-[#B7F041] bg-[#B7F041] text-[#111]" : ""}`}
                                            >
                                                {option.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                {renderFieldError("bhkId")}
                            </section>

                            <section className={sectionCardClass}>
                                <p className="mb-3 text-sm font-semibold text-white/75">Furnishing</p>
                                <div className="flex flex-wrap gap-2">
                                    {furnishingOptions.map((option) => {
                                        const active = form.furnishingId === option.id;
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => updateField("furnishingId", option.id)}
                                                className={`${chipClass} ${active ? "border-[#B7F041] bg-[#B7F041] text-[#111]" : ""}`}
                                            >
                                                {option.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                {renderFieldError("furnishingId")}
                            </section>

                            <section className={sectionCardClass}>
                                <p className="mb-3 text-sm font-semibold text-white/75">Amenities</p>
                                <div className="flex flex-wrap gap-2">
                                    {amenityOptions.map((option) => {
                                        const active = form.amenityIds.includes(option.id);
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => toggleSelection("amenityIds", option.id)}
                                                className={`${chipClass} ${active ? "border-[#B7F041] bg-[#B7F041] text-[#111]" : ""}`}
                                            >
                                                {option.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                {renderFieldError("amenityIds")}
                            </section>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <section className={sectionCardClass}>
                                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/25 bg-[#0f0f16] px-4 py-5">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35">
                                        <Plus className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold">Add Property Photos, videos...</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/jpg"
                                        multiple
                                        onChange={(event) => {
                                            const files = Array.from(event.target.files || []);
                                            if (files.length === 0) return;
                                            updateField("imageFiles", [...form.imageFiles, ...files]);
                                        }}
                                        className="hidden"
                                    />
                                </label>

                                {form.imageFiles.length > 0 && (
                                    <>
                                        <p className="mt-4 text-sm font-semibold text-white/80">Cover</p>
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            {imagePreviews.map((preview, index) => {
                                                const active = coverIndex === index;
                                                return (
                                                    <button
                                                        key={`${preview}-${index}`}
                                                        type="button"
                                                        onClick={() => setCoverIndex(index)}
                                                        className={`relative overflow-hidden rounded-xl border ${
                                                            active ? "border-[#B7F041]" : "border-white/20"
                                                        }`}
                                                    >
                                                        <img src={preview} alt={`property-${index + 1}`} className="h-32 w-full object-cover" />
                                                        {active ? (
                                                            <span className="absolute left-2 top-2 rounded-md bg-[#B7F041] px-2 py-1 text-[10px] font-semibold text-black">
                                                                Cover
                                                            </span>
                                                        ) : null}
                                                        <span
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                removeImage(index);
                                                            }}
                                                            className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#B7F041] text-black"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                                {renderFieldError("imageFiles")}
                            </section>

                            <section className={sectionCardClass}>
                                <p className="mb-3 text-sm font-semibold text-white/75">Add keyword</p>
                                <div className="flex flex-wrap gap-2">
                                    {keywordOptions.map((option) => {
                                        const token = option.name.trim();
                                        const active = (form.keywords || []).some(
                                            (item) => item.toLowerCase() === token.toLowerCase()
                                        );
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => {
                                                    const exists = (form.keywords || []).some(
                                                        (item) => item.toLowerCase() === token.toLowerCase()
                                                    );
                                                    setKeywordState(
                                                        exists
                                                            ? (form.keywords || []).filter(
                                                                  (item) => item.toLowerCase() !== token.toLowerCase()
                                                              )
                                                            : [...(form.keywords || []), token]
                                                    );
                                                }}
                                                className={`${chipClass} ${active ? "border-[#B7F041] bg-[#B7F041] text-[#111]" : ""}`}
                                            >
                                                {option.name}
                                            </button>
                                        );
                                    })}
                                </div>

                                <p className="mt-4 text-sm font-semibold text-white/75">Add custom keyword</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <input
                                        value={customKeyword}
                                        onChange={(event) => setCustomKeyword(sanitizeTextInput(event.target.value))}
                                        placeholder="near RMZ Ecoworld, etc..."
                                        className="h-11 flex-1 rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                                    />
                                    <button
                                        type="button"
                                        onClick={addCustomKeyword}
                                        className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-black"
                                    >
                                        Add
                                    </button>
                                </div>
                                {customKeywordValues.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {customKeywordValues.map((keyword) => (
                                            <button
                                                type="button"
                                                key={keyword}
                                                onClick={() => removeCustomKeyword(keyword)}
                                                className="rounded-xl border border-[#A67AEB]/50 bg-[#A67AEB]/10 px-3 py-2 text-sm text-[#e2d4ff]"
                                            >
                                                {keyword} ×
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                                {renderFieldError("keywords")}
                            </section>
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <section className={sectionCardClass}>
                                <div className="mb-2 flex items-center justify-between text-sm text-white/80">
                                    <span>Property Size</span>
                                    <span>5000 sq feet</span>
                                </div>
                                <p className="mb-2 text-sm text-white/55">0 sq feet</p>
                                <input
                                    type="range"
                                    min={0}
                                    max={5000}
                                    step={10}
                                    value={sizeValue}
                                    onChange={(event) => updateField("builtUpAreaSqft", sanitizeNumericInput(event.target.value))}
                                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-[#B7F041]"
                                    style={{
                                        background: `linear-gradient(90deg, #B7F041 ${sizeProgress}%, rgba(255,255,255,0.3) ${sizeProgress}%)`,
                                    }}
                                />
                                <p className="mt-2 text-xs text-white/70">Selected size: {sizeValue.toLocaleString("en-IN")} sq feet</p>
                                {renderFieldError("builtUpAreaSqft")}
                            </section>

                            <input
                                value={form.rent}
                                onChange={(event) => updateField("rent", sanitizeNumericInput(event.target.value))}
                                placeholder="Monthly Rent (₹)"
                                inputMode="numeric"
                                className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                            />
                            {renderFieldError("rent")}
                            <input
                                value={form.deposit}
                                onChange={(event) => updateField("deposit", sanitizeNumericInput(event.target.value))}
                                placeholder="Security Deposit (₹)"
                                inputMode="numeric"
                                className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                            />
                            {renderFieldError("deposit")}

                            <section className={sectionCardClass}>
                                <p className="mb-3 text-sm font-semibold text-white/75">Available to Move In</p>
                                <input
                                    type="date"
                                    value={form.availableFromDate || ""}
                                    onChange={(event) => {
                                        const nextDate = event.target.value;
                                        updateField("availableFromDate", nextDate);
                                        if (nextDate) {
                                            updateField("availabilityMode", "date");
                                        } else if (form.availabilityMode === "date") {
                                            updateField("availabilityMode", "immediate");
                                        }
                                    }}
                                    className="mb-3 h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none focus:border-[#A67AEB]"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {(masters.availabilityTypes.length > 0
                                        ? masters.availabilityTypes
                                        : RENTALS_MOCK_MODE
                                        ? [fallbackOption("Immediate", "immediate")]
                                        : []).map((option) => {
                                        const active = form.availabilityId === option.id;
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => {
                                                    updateField("availabilityId", option.id);
                                                    const isImmediate = option.name.toLowerCase().includes("immediate");
                                                    if (isImmediate) {
                                                        updateField("availabilityMode", "immediate");
                                                        updateField("availableFromDate", "");
                                                    }
                                                }}
                                                className={`${chipClass} ${active ? "border-[#B7F041] bg-[#B7F041] text-[#111]" : ""}`}
                                            >
                                                {option.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                {renderFieldError("availabilityId", "availableFromDate")}
                            </section>
                        </>
                    )}

                    {step === 5 && (
                        <>
                            <section className={`${sectionCardClass} space-y-3`}>
                                <p className="text-sm font-semibold text-white/90">City &amp; locality</p>
                                <input
                                    value={localitySearch}
                                    onChange={(event) => setLocalitySearch(sanitizeTextInput(event.target.value))}
                                    placeholder="Search locality…"
                                    className="h-11 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                                />

                                <div>
                                    <p className="text-xs font-medium text-white/55">City</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {cityOptions.map((option) => {
                                            const active = form.cityId === option.id;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setLocalitySearch("");
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            cityId: option.id,
                                                            localityId: prev.cityId === option.id ? prev.localityId : "",
                                                        }));
                                                    }}
                                                    className={`${chipClass} ${active ? "border-[#B7F041] bg-[#B7F041] text-[#111]" : ""}`}
                                                >
                                                    {option.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {renderFieldError("cityId")}
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-white/55">Locality</p>
                                    <div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto pr-1">
                                        {filteredLocalities.map((option) => {
                                            const active = form.localityId === option.id;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => updateField("localityId", option.id)}
                                                    className={`${chipClass} ${active ? "border-[#B7F041] bg-[#B7F041] text-[#111]" : ""}`}
                                                >
                                                    {option.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {renderFieldError("localityId")}
                                    {filteredLocalities.length === 0 ? (
                                        <p className="mt-2 text-xs text-white/60">No localities match this search.</p>
                                    ) : null}
                                </div>
                            </section>

                            <section className={`${sectionCardClass} space-y-3`}>
                                <p className="text-sm font-semibold text-white/90">Street address</p>
                                <input
                                    value={form.addressLine}
                                    onChange={(event) => updateField("addressLine", sanitizeTextInput(event.target.value))}
                                    placeholder="Flat / house no., building, street"
                                    className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                                />
                                {renderFieldError("addressLine")}
                            </section>

                            <section className={`${sectionCardClass} space-y-3`}>
                                <p className="text-sm font-semibold text-white/90">Map link &amp; coordinates</p>
                                {hasGoogleMapsKey ? (
                                    <OwnerMapPinPicker
                                        mapQuery={mapQuery}
                                        initialLat={form.latitude || ""}
                                        initialLng={form.longitude || ""}
                                        onPick={({ lat, lng, mapUrl }) => {
                                            setForm((prev) => ({
                                                ...prev,
                                                latitude: lat,
                                                longitude: lng,
                                                mapUrl,
                                            }));
                                            clearFieldError("mapUrl", "latitude", "longitude");
                                        }}
                                    />
                                ) : null}
                                <input
                                    value={form.mapUrl || ""}
                                    onChange={handleMapUrlInputChange}
                                    placeholder="Google Maps share link"
                                    className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                                />
                                {renderFieldError("mapUrl")}
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        value={form.latitude || ""}
                                        onChange={(event) => updateField("latitude", sanitizeTextInput(event.target.value))}
                                        placeholder="Latitude"
                                        className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                                    />
                                    <input
                                        value={form.longitude || ""}
                                        onChange={(event) => updateField("longitude", sanitizeTextInput(event.target.value))}
                                        placeholder="Longitude"
                                        className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                                    />
                                </div>
                                {renderFieldError("latitude", "longitude")}
                            </section>

                            <section className={`${sectionCardClass} space-y-3`}>
                                <p className="text-sm font-semibold text-white/90">Description</p>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={(event) => updateField("description", sanitizeTextInput(event.target.value))}
                                    placeholder="Describe the property for tenants"
                                    className="w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 py-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                                />
                                {renderFieldError("description")}
                                <input
                                    value={form.streetLocalityArea || ""}
                                    onChange={(event) => updateField("streetLocalityArea", sanitizeTextInput(event.target.value))}
                                    placeholder="Street / area (optional)"
                                    className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                                />
                                {renderFieldError("streetLocalityArea")}
                                <input
                                    value={form.landmark || ""}
                                    onChange={(event) => updateField("landmark", sanitizeTextInput(event.target.value))}
                                    placeholder="Landmark (optional)"
                                    className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                                />
                                {renderFieldError("landmark")}
                            </section>

                            <section className={`${sectionCardClass} space-y-3`}>
                                <p className="text-sm font-semibold text-white/90">Owner contact</p>
                                <input
                                    value={form.ownerName || ""}
                                    onChange={(event) => updateField("ownerName", sanitizeTextInput(event.target.value))}
                                    placeholder="Full name"
                                    className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                                />
                                {renderFieldError("ownerName")}
                                <div className="flex h-12 items-stretch overflow-hidden rounded-xl border border-white/20 bg-[#0d0d14]">
                                    <span className="flex shrink-0 items-center border-r border-white/10 bg-white/5 px-3 text-sm font-medium leading-none text-white/90 whitespace-nowrap">
                                        🇮🇳 +91
                                    </span>
                                    <input
                                        value={form.contactPhone}
                                        onChange={(event) =>
                                            updateField("contactPhone", sanitizeNumericInput(event.target.value).slice(0, 10))
                                        }
                                        placeholder="10-digit mobile number"
                                        inputMode="numeric"
                                        className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:ring-0"
                                    />
                                </div>
                                {renderFieldError("contactPhone")}
                            </section>

                            <section className={`${sectionCardClass} space-y-3`}>
                                <p className="text-sm font-semibold text-white/90">Verification document</p>
                                <select
                                    value={form.documentType || ""}
                                    onChange={(event) => {
                                        const v = event.target.value;
                                        updateField("documentType", v);
                                        clearFieldError("documentType", "documentFile");
                                    }}
                                    className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-white/20 bg-[#0d0d14] py-0 pr-10 pl-3 text-sm text-white/90 outline-none focus:border-[#A67AEB] bg-[length:1.25rem] bg-[position:right_0.65rem_center] bg-no-repeat"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23ffffffb3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                    }}
                                >
                                    <option value="">Select document type…</option>
                                    {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-[#0d0d14] px-3 py-3 text-sm text-white/80">
                                    <Upload className="h-4 w-4" />
                                    {documentSelected ? "Replace document file" : "Upload document file"}
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                        onChange={(event) => {
                                            const next = (event.target.files || [])[0] || null;
                                            updateField("documentFile", next);
                                            updateField("clearDocuments", false);
                                            if (next && !form.documentType) {
                                                updateField("documentType", "electricity_bill");
                                            }
                                            updateField(
                                                "documentMeta",
                                                next
                                                    ? {
                                                          selectedName: next.name,
                                                          selectedSize: next.size,
                                                          selectedType: next.type,
                                                          uploadState: "selected",
                                                      }
                                                    : { uploadState: "idle" }
                                            );
                                        }}
                                        className="hidden"
                                    />
                                </label>
                                {documentSelected ? (
                                    <div className="rounded-xl border border-white/20 bg-[#0d0d14] px-3 py-2 text-xs text-white/75">
                                        <p className="font-semibold text-white/90">
                                            {form.documentMeta?.selectedName ||
                                                form.documentFile?.name ||
                                                form.documentMeta?.existingDocumentUrl?.split("/").pop() ||
                                                "Document selected"}
                                        </p>
                                        <p>
                                            {(form.documentMeta?.selectedSize || form.documentFile?.size || 0) > 0
                                                ? `${(
                                                      (form.documentMeta?.selectedSize || form.documentFile?.size || 0) /
                                                      1024 /
                                                      1024
                                                  ).toFixed(2)} MB`
                                                : form.documentMeta?.existingUploadedAt
                                                  ? `Uploaded on ${new Date(form.documentMeta.existingUploadedAt).toLocaleString("en-IN")}`
                                                  : "Existing document on file"}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                updateField("documentFile", null);
                                                updateField("documentType", "");
                                                updateField("clearDocuments", true);
                                                updateField("documentMeta", { uploadState: "idle" });
                                            }}
                                            className="mt-2 rounded-lg border border-red-400/40 px-2 py-1 text-red-200"
                                        >
                                            Remove document
                                        </button>
                                    </div>
                                ) : null}
                                {renderFieldError("documentType", "documentFile")}
                            </section>

                            <section className={`${sectionCardClass} space-y-3`}>
                                <p className="text-sm font-semibold text-white/90">SPOTO employee ID (optional)</p>
                                <input
                                    value={form.employeeId || ""}
                                    onChange={(event) => updateField("employeeId", sanitizeTextInput(event.target.value))}
                                    placeholder="Employee ID (optional)"
                                    className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                                />
                                {renderFieldError("employeeId")}
                            </section>
                        </>
                    )}
                </div>

                {error && !(isEditMode && !loadingInitial) ? (
                    <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {error}
                    </p>
                ) : null}
                {submitError ? (
                    <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        Listing submit failed: {submitError}
                    </p>
                ) : null}
                {renderFieldError("submit")}
                <div className="sticky bottom-0 z-10 mt-6 border-t border-white/10 bg-[#050507]/90 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md supports-[backdrop-filter]:bg-[#050507]/80">
                    <PrimaryButton
                        type="button"
                        className="h-12 w-full text-base"
                        onClick={handleNext}
                        disabled={!stepValid || submitting || loadingMasters || loadingInitial}
                    >
                        {nextLabel}
                    </PrimaryButton>
                </div>
            </div>
        </main>
    );
}
