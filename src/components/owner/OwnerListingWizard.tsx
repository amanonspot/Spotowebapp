"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Building2, ChevronLeft, House, Plus, Upload, X } from "lucide-react";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import { OwnerListingFormInput, OwnerMastersData, SelectOption } from "@/lib/adapters/types";
import { ownerAdapter } from "@/lib/adapters";
import { RENTALS_MOCK_MODE } from "@/lib/rentals";

const TOTAL_STEPS = 7;
const STEP_TITLES = [
    "Select Property Type",
    "Property Details",
    "Photos & Keywords",
    "Pricing & Possession",
    "Address & Verification",
    "Owner Details",
    "Verify Phone OTP",
];

const sanitizeNumericInput = (value: string) => value.replace(/[^\d]/g, "");
const sanitizeTextInput = (value: string) => value.replace(/\s+/g, " ").trimStart();

const emptyForm: OwnerListingFormInput = {
    propertyTitle: "",
    title: "",
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
    description: "",
    contactPhone: "",
    amenityIds: [],
    keywords: [],
    documentType: "electricity_bill",
    imageFiles: [],
    documentFile: null,
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

export default function OwnerListingWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [masters, setMasters] = useState<OwnerMastersData>(emptyMasters);
    const [form, setForm] = useState<OwnerListingFormInput>(emptyForm);
    const [loadingMasters, setLoadingMasters] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customKeyword, setCustomKeyword] = useState("");
    const [coverIndex, setCoverIndex] = useState(0);
    const [ownerName, setOwnerName] = useState("");
    const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
    const [otpError, setOtpError] = useState<string | null>(null);
    const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoadingMasters(true);
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

    const propertyTypeOptions =
        masters.propertyTypes.length > 0 ? masters.propertyTypes : RENTALS_MOCK_MODE ? fallbackPropertyTypes : [];
    const bhkOptions = masters.bhkTypes.length > 0 ? masters.bhkTypes : RENTALS_MOCK_MODE ? fallbackBhk : [];
    const furnishingOptions =
        masters.furnishingTypes.length > 0 ? masters.furnishingTypes : RENTALS_MOCK_MODE ? fallbackFurnishing : [];
    const amenityOptions = masters.amenities.length > 0 ? masters.amenities : RENTALS_MOCK_MODE ? fallbackAmenities : [];
    const keywordOptions = masters.keywords.length > 0 ? masters.keywords : RENTALS_MOCK_MODE ? fallbackKeywords : [];
    const localityOptions = masters.localities.length > 0 ? masters.localities : RENTALS_MOCK_MODE ? fallbackLocalities : [];
    const cityOptions = masters.cities.length > 0 ? masters.cities : RENTALS_MOCK_MODE ? [fallbackOption("Bengaluru")] : [];

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

    const updateField = <K extends keyof OwnerListingFormInput>(key: K, value: OwnerListingFormInput[K]) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const toggleSelection = (key: "amenityIds" | "keywords", value: string) => {
        setForm((prev) => {
            const exists = prev[key].includes(value);
            return {
                ...prev,
                [key]: exists ? prev[key].filter((item) => item !== value) : [...prev[key], value],
            };
        });
    };

    const addCustomKeyword = () => {
        const normalized = customKeyword.replace(/[^\w\s-]/g, "").trim();
        if (!normalized) return;
        if (form.keywords.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
            setCustomKeyword("");
            return;
        }
        setForm((prev) => ({ ...prev, keywords: [...prev.keywords, normalized] }));
        setCustomKeyword("");
    };

    const removeImage = (index: number) => {
        setForm((prev) => ({
            ...prev,
            imageFiles: prev.imageFiles.filter((_, currentIndex) => currentIndex !== index),
        }));
        setCoverIndex((prev) => Math.max(0, Math.min(prev, form.imageFiles.length - 2)));
    };

    const stepValid = useMemo(() => {
        if (step === 1) return Boolean(form.propertyTypeId);
        if (step === 2) return Boolean(form.propertyTitle.trim() && form.bhkId && form.furnishingId);
        if (step === 3) return form.imageFiles.length > 0;
        if (step === 4) return Boolean(form.rent && form.deposit && form.builtUpAreaSqft);
        if (step === 5) return Boolean(form.cityId && form.localityId && form.addressLine.trim());
        if (step === 6) return Boolean(ownerName.trim() && form.contactPhone.length === 10);
        if (step === 7) return otpDigits.join("").length === 4;
        return false;
    }, [step, form, ownerName, otpDigits]);

    const goBack = () => {
        if (step === 1) {
            router.push("/owner/dashboard");
            return;
        }
        setStep((prev) => Math.max(1, prev - 1));
    };

    const handleOtpChange = (index: number, value: string) => {
        const digit = value.replace(/[^\d]/g, "").slice(-1);
        setOtpError(null);
        setOtpDigits((prev) => {
            const next = [...prev];
            next[index] = digit;
            return next;
        });
        if (digit && index < otpRefs.current.length - 1) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpBackspace = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = event.clipboardData.getData("text").replace(/[^\d]/g, "").slice(0, 4);
        if (!pasted) return;
        event.preventDefault();
        const next = ["", "", "", ""];
        pasted.split("").forEach((digit, index) => {
            next[index] = digit;
        });
        setOtpDigits(next);
        const targetIndex = Math.min(pasted.length, 4) - 1;
        if (targetIndex >= 0) otpRefs.current[targetIndex]?.focus();
    };

    const handleNext = async () => {
        if (!stepValid || submitting) return;
        setError(null);

        if (step < TOTAL_STEPS) {
            setStep((prev) => prev + 1);
            return;
        }

        const otp = otpDigits.join("");
        if (otp !== "0000") {
            setOtpError("Invalid OTP. Use 0000 for now.");
            return;
        }

        setSubmitting(true);
        try {
            const orderedImages = [...form.imageFiles];
            if (coverIndex > 0 && orderedImages[coverIndex]) {
                const [cover] = orderedImages.splice(coverIndex, 1);
                orderedImages.unshift(cover);
            }

            const fallbackTitle = `${form.bhkId || "Property"} in ${form.localityId || form.cityId || "Bengaluru"}`;
            await ownerAdapter.createProperty({
                ...form,
                propertyTitle: form.propertyTitle.trim() || fallbackTitle,
                title: form.propertyTitle.trim() || fallbackTitle,
                imageFiles: orderedImages,
                availabilityId: form.availabilityId || "immediate",
            });
            router.push("/owner/dashboard");
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Unable to publish listing.");
        } finally {
            setSubmitting(false);
        }
    };

    const nextLabel = step === TOTAL_STEPS ? (submitting ? "Publishing..." : "Submit") : "Next";

    const sectionCardClass = "rounded-2xl border border-white/20 bg-[#12121A] p-4";
    const chipClass =
        "rounded-xl border border-white/20 px-3 py-2 text-sm text-white/85 transition hover:border-[#A67AEB] active:scale-[0.98]";

    return (
        <main className="min-h-screen bg-[#050507] text-white">
            <div className="mx-auto w-full max-w-[420px] px-4 pb-8 pt-4">
                <div className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={goBack}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/90"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <p className="text-[11px] text-white/55">Step {step} / {TOTAL_STEPS}</p>
                    <button
                        type="button"
                        onClick={() => router.push("/owner/dashboard")}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/90"
                    >
                        <Bell className="h-5 w-5" />
                    </button>
                </div>

                <h1 className="text-3xl font-semibold leading-tight">{STEP_TITLES[step - 1]}</h1>
                <p className="mt-1 text-sm text-white/60">SPOTO · List Your Property</p>

                <div className="mt-5 space-y-4">
                    {step === 1 && (
                        <section className={sectionCardClass}>
                            <p className="mb-3 text-lg font-semibold">Select Property Type</p>
                            <div className="space-y-3">
                                {propertyTypeOptions.slice(0, 3).map((option, index) => {
                                    const active = form.propertyTypeId === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => updateField("propertyTypeId", option.id)}
                                            className={`w-full rounded-2xl border px-4 py-5 text-left transition ${
                                                active
                                                    ? "border-[#B7F041] bg-[#B7F041] text-[#111]"
                                                    : "border-white/20 bg-[#15151d] text-white"
                                            }`}
                                        >
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                {propertyTypeIcon(index)}
                                                <span className="text-base font-semibold">{option.name}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                                {propertyTypeOptions.length === 0 ? (
                                    <p className="rounded-xl border border-white/20 bg-[#0d0d14] px-3 py-2 text-sm text-white/70">
                                        Property types are unavailable right now. Please retry.
                                    </p>
                                ) : null}
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
                                    updateField("title", nextTitle);
                                }}
                                placeholder="Property Title"
                                className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                            />

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
                                        <p className="text-xs text-white/50">Best fit 1080 x 1350 (4:5) Portrait/vertical</p>
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
                            </section>

                            <section className={sectionCardClass}>
                                <p className="mb-3 text-sm font-semibold text-white/75">Add keyword</p>
                                <div className="flex flex-wrap gap-2">
                                    {keywordOptions.map((option) => {
                                        const active = form.keywords.includes(option.id);
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => toggleSelection("keywords", option.id)}
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
                            </section>

                            <input
                                value={form.rent}
                                onChange={(event) => updateField("rent", sanitizeNumericInput(event.target.value))}
                                placeholder="Monthly Rent (₹)"
                                inputMode="numeric"
                                className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                            />
                            <input
                                value={form.deposit}
                                onChange={(event) => updateField("deposit", sanitizeNumericInput(event.target.value))}
                                placeholder="Security Deposit (₹)"
                                inputMode="numeric"
                                className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                            />

                            <section className={sectionCardClass}>
                                <p className="mb-3 text-sm font-semibold text-white/75">Available to Move In</p>
                                <div className="flex flex-wrap gap-2">
                                    {(masters.availabilityTypes.length > 0
                                        ? masters.availabilityTypes
                                        : RENTALS_MOCK_MODE
                                        ? [fallbackOption("Immediately", "immediate")]
                                        : []).map((option) => {
                                        const active = form.availabilityId === option.id;
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => updateField("availabilityId", option.id)}
                                                className={`${chipClass} ${active ? "border-[#B7F041] bg-[#B7F041] text-[#111]" : ""}`}
                                            >
                                                {option.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        </>
                    )}

                    {step === 5 && (
                        <>
                            <section className={sectionCardClass}>
                                <p className="mb-3 text-sm font-semibold">Confirm Map Location</p>
                                <div className="mb-3 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/60">
                                    Search for area, street name..
                                </div>
                                <p className="text-xs text-white/55">Currently Live in:</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {localityOptions.slice(0, 4).map((option) => {
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

                                <div className="mt-3 h-36 overflow-hidden rounded-xl border border-white/15 bg-white/10">
                                    <img
                                        src="https://images.unsplash.com/photo-1569336415962-a4bd9f69c07b?auto=format&fit=crop&w=900&q=70"
                                        alt="map preview"
                                        className="h-full w-full object-cover opacity-80"
                                    />
                                </div>
                            </section>

                            <div className="flex flex-wrap gap-2">
                                {cityOptions.slice(0, 3).map((option) => {
                                    const active = form.cityId === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => updateField("cityId", option.id)}
                                            className={`${chipClass} ${active ? "border-[#B7F041] bg-[#B7F041] text-[#111]" : ""}`}
                                        >
                                            {option.name}
                                        </button>
                                    );
                                })}
                            </div>

                            <input
                                value={form.addressLine}
                                onChange={(event) => updateField("addressLine", sanitizeTextInput(event.target.value))}
                                placeholder="Flat, House No., Building, Apartment"
                                className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                            />
                            <textarea
                                rows={3}
                                value={form.description}
                                onChange={(event) => updateField("description", sanitizeTextInput(event.target.value))}
                                placeholder="Street, locality, area / landmark / maps link"
                                className="w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 py-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                            />
                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-[#0d0d14] px-3 py-3 text-sm text-white/80">
                                <Upload className="h-4 w-4" />
                                Upload Verification Document
                                <input
                                    type="file"
                                    accept=".pdf,image/jpeg,image/png,image/jpg"
                                    onChange={(event) => updateField("documentFile", (event.target.files || [])[0] || null)}
                                    className="hidden"
                                />
                            </label>
                        </>
                    )}

                    {step === 6 && (
                        <>
                            <input
                                value={ownerName}
                                onChange={(event) => setOwnerName(sanitizeTextInput(event.target.value))}
                                placeholder="Owner Name"
                                className="h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                            />
                            <div className="flex items-center rounded-xl border border-white/20 bg-[#0d0d14] px-3">
                                <span className="mr-2 rounded-md bg-white/10 px-2 py-1 text-sm">🇮🇳 +91</span>
                                <input
                                    value={form.contactPhone}
                                    onChange={(event) => updateField("contactPhone", sanitizeNumericInput(event.target.value).slice(0, 10))}
                                    placeholder="Enter mobile number"
                                    inputMode="numeric"
                                    className="h-12 w-full bg-transparent text-sm text-white/90 outline-none placeholder:text-white/35"
                                />
                            </div>
                        </>
                    )}

                    {step === 7 && (
                        <>
                            <section className={sectionCardClass}>
                                <p className="text-sm text-white/70">To confirm your number enter OTP sent to</p>
                                <p className="mt-1 text-sm font-semibold">+91-{form.contactPhone || "XXXXXXXXXX"}</p>
                            </section>
                            <div className="flex justify-center gap-3">
                                {otpDigits.map((digit, index) => (
                                    <input
                                        key={`otp-${index}`}
                                        ref={(node) => {
                                            otpRefs.current[index] = node;
                                        }}
                                        value={digit}
                                        onChange={(event) => handleOtpChange(index, event.target.value)}
                                        onKeyDown={(event) => handleOtpBackspace(index, event)}
                                        onPaste={handleOtpPaste}
                                        inputMode="numeric"
                                        maxLength={1}
                                        className="h-14 w-14 rounded-xl border border-white/20 bg-[#0d0d14] text-center text-xl font-semibold outline-none focus:border-[#A67AEB]"
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                className="h-12 w-full rounded-xl border border-[#B7F041] text-base font-semibold text-white"
                            >
                                Resend link
                            </button>
                            <p className="text-center text-xs text-white/50">Mock OTP for now: 0000</p>
                        </>
                    )}
                </div>

                {error ? (
                    <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {error}
                    </p>
                ) : null}
                {otpError ? (
                    <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {otpError}
                    </p>
                ) : null}

                <div className="sticky bottom-0 mt-6 bg-[#050507] pb-4 pt-2">
                    <PrimaryButton
                        type="button"
                        className="h-12 w-full text-base"
                        onClick={handleNext}
                        disabled={!stepValid || submitting || loadingMasters}
                    >
                        {nextLabel}
                    </PrimaryButton>
                </div>
            </div>
        </main>
    );
}
