"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import { OwnerListingFormInput, OwnerMastersData, SelectOption } from "@/lib/adapters/types";
import { ownerAdapter } from "@/lib/adapters";

interface OwnerListingFormProps {
    mode: "create" | "edit";
    propertyId?: string;
    initialValue?: OwnerListingFormInput;
}

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
    documentType: "",
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

const sanitizeNumericInput = (value: string) => value.replace(/[^\d]/g, "");
const sanitizeKeywordInput = (value: string) => value.replace(/[^\w\s-]/g, "").slice(0, 40);
const controlBaseClass =
    "h-11 w-full rounded-xl border border-white/15 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none transition placeholder:text-white/35 focus:border-[#A67AEB]";

interface SelectInputProps {
    value: string;
    placeholder: string;
    options: SelectOption[];
    onChange: (value: string) => void;
}

function SelectInput({ value, placeholder, options, onChange }: SelectInputProps) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={`${controlBaseClass} appearance-none pr-10`}
                style={{ colorScheme: "dark" }}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.name}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"
                aria-hidden="true"
            />
        </div>
    );
}

export default function OwnerListingForm({ mode, propertyId, initialValue }: OwnerListingFormProps) {
    const router = useRouter();
    const [form, setForm] = useState<OwnerListingFormInput>(initialValue || emptyForm);
    const [masters, setMasters] = useState<OwnerMastersData>(emptyMasters);
    const [customKeyword, setCustomKeyword] = useState("");
    const [loading, setLoading] = useState(false);
    const [bootLoading, setBootLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialValue) {
            setForm(initialValue);
        }
    }, [initialValue]);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setBootLoading(true);
            try {
                const data = await ownerAdapter.getMasters(form.cityId || undefined);
                if (mounted) setMasters(data);
            } catch (loadError) {
                if (mounted) {
                    setError(loadError instanceof Error ? loadError.message : "Unable to load master values");
                }
            } finally {
                if (mounted) setBootLoading(false);
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [form.cityId]);

    const updateField = <K extends keyof OwnerListingFormInput>(key: K, value: OwnerListingFormInput[K]) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const requiredMissing = useMemo(() => {
        const required: Array<keyof OwnerListingFormInput> = [
            "propertyTitle",
            "propertyTypeId",
            "cityId",
            "localityId",
            "bhkId",
            "furnishingId",
            "availabilityId",
            "rent",
            "deposit",
            "contactPhone",
        ];

        return required.filter((key) => {
            const value = form[key];
            if (typeof value === "string") return value.trim().length === 0;
            return value === null || value === undefined;
        });
    }, [form]);

    const canSubmit = requiredMissing.length === 0 && !loading;

    const addCustomKeyword = () => {
        const normalized = customKeyword.trim();
        if (!normalized) return;
        const exists = form.keywords.some((keyword) => keyword.toLowerCase() === normalized.toLowerCase());
        if (exists) {
            setCustomKeyword("");
            return;
        }
        setForm((prev) => ({
            ...prev,
            keywords: [...prev.keywords, normalized],
        }));
        setCustomKeyword("");
    };

    const removeKeyword = (keyword: string) => {
        setForm((prev) => ({
            ...prev,
            keywords: prev.keywords.filter((item) => item !== keyword),
        }));
    };

    const toggleAmenity = (id: string) => {
        setForm((prev) => ({
            ...prev,
            amenityIds: prev.amenityIds.includes(id)
                ? prev.amenityIds.filter((item) => item !== id)
                : [...prev.amenityIds, id],
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        setError(null);

        try {
            if (mode === "create") {
                await ownerAdapter.createProperty(form);
            } else if (propertyId) {
                await ownerAdapter.updateProperty(propertyId, form);
            }
            router.push("/owner/dashboard");
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Unable to save listing");
        } finally {
            setLoading(false);
        }
    };

    const keywordOptions = useMemo(() => masters.keywords, [masters.keywords]);

    const defaultKeywordSet = useMemo(
        () => new Set(masters.keywords.map((item) => item.id)),
        [masters.keywords]
    );

    const customSelectedKeywords = useMemo(
        () => form.keywords.filter((keyword) => !defaultKeywordSet.has(keyword)),
        [form.keywords, defaultKeywordSet]
    );

    const sizeValue = Number(form.builtUpAreaSqft || 0);
    const sizeProgress = Math.min(100, Math.max(0, (sizeValue / 5000) * 100));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <section className="rounded-2xl border border-white/15 bg-[#12121A] p-4">
                <h2 className="text-lg font-semibold text-white">Basic Details</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                        value={form.propertyTitle}
                        onChange={(event) => {
                            updateField("propertyTitle", event.target.value);
                            updateField("title", event.target.value);
                        }}
                        placeholder="Property title"
                        className={controlBaseClass}
                    />
                    <input
                        value={form.contactPhone}
                        onChange={(event) => updateField("contactPhone", sanitizeNumericInput(event.target.value).slice(0, 10))}
                        placeholder="Owner phone"
                        inputMode="numeric"
                        className={controlBaseClass}
                    />
                    <SelectInput
                        value={form.cityId}
                        placeholder="Select city"
                        options={masters.cities}
                        onChange={(value) => updateField("cityId", value)}
                    />
                    <SelectInput
                        value={form.localityId}
                        placeholder="Select locality"
                        options={masters.localities}
                        onChange={(value) => updateField("localityId", value)}
                    />
                    <SelectInput
                        value={form.propertyTypeId}
                        placeholder="Property type"
                        options={masters.propertyTypes}
                        onChange={(value) => updateField("propertyTypeId", value)}
                    />
                    <SelectInput
                        value={form.bhkId}
                        placeholder="BHK type"
                        options={masters.bhkTypes}
                        onChange={(value) => updateField("bhkId", value)}
                    />
                </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-[#12121A] p-4">
                <h2 className="text-lg font-semibold text-white">Pricing & Availability</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                        value={form.rent}
                        onChange={(event) => updateField("rent", sanitizeNumericInput(event.target.value))}
                        inputMode="numeric"
                        placeholder="Monthly rent"
                        className={controlBaseClass}
                    />
                    <input
                        value={form.deposit}
                        onChange={(event) => updateField("deposit", sanitizeNumericInput(event.target.value))}
                        inputMode="numeric"
                        placeholder="Security deposit"
                        className={controlBaseClass}
                    />
                    <div className="rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2">
                        <div className="mb-2 flex items-center justify-between text-xs text-white/70">
                            <span>Property size</span>
                            <span>{sizeValue.toLocaleString("en-IN")} sq ft</span>
                        </div>
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
                    </div>
                    <SelectInput
                        value={form.availabilityId}
                        placeholder="Availability"
                        options={masters.availabilityTypes}
                        onChange={(value) => updateField("availabilityId", value)}
                    />
                    <SelectInput
                        value={form.furnishingId}
                        placeholder="Furnishing"
                        options={masters.furnishingTypes}
                        onChange={(value) => updateField("furnishingId", value)}
                    />
                </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-[#12121A] p-4">
                <h2 className="text-lg font-semibold text-white">Address & Description</h2>
                <div className="mt-3 space-y-3">
                    <input
                        value={form.addressLine}
                        onChange={(event) => updateField("addressLine", event.target.value)}
                        placeholder="Flat, street, area"
                        className={controlBaseClass}
                    />
                    <textarea
                        value={form.description}
                        onChange={(event) => updateField("description", event.target.value)}
                        placeholder="Describe your property"
                        rows={4}
                        className="w-full rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm text-white/90 outline-none transition placeholder:text-white/35 focus:border-[#A67AEB]"
                    />
                </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-[#12121A] p-4">
                <h2 className="text-lg font-semibold text-white">Amenities & Keywords</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                    {masters.amenities.map((option) => {
                        const selected = form.amenityIds.includes(option.id);
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => toggleAmenity(option.id)}
                                className={`rounded-full border px-3 py-1 text-xs transition ${
                                    selected
                                        ? "border-[#B7F041] bg-[#B7F041] text-[#111]"
                                        : "border-white/20 text-white hover:border-[#A67AEB]"
                                }`}
                            >
                                {option.name}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {keywordOptions.map((option) => {
                        const selected = form.keywords.includes(option.id);
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() =>
                                    updateField(
                                        "keywords",
                                        selected
                                            ? form.keywords.filter((item) => item !== option.id)
                                            : [...form.keywords, option.id]
                                    )
                                }
                                className={`rounded-full border px-3 py-1 text-xs transition ${
                                    selected
                                        ? "border-[#B7F041] bg-[#B7F041] text-[#111]"
                                        : "border-white/20 text-white hover:border-[#A67AEB]"
                                }`}
                            >
                                {option.name}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <input
                        value={customKeyword}
                        onChange={(event) => setCustomKeyword(sanitizeKeywordInput(event.target.value))}
                        placeholder="Add custom keyword"
                        maxLength={40}
                        className={`${controlBaseClass} flex-1`}
                    />
                    <button
                        type="button"
                        onClick={addCustomKeyword}
                        className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.99]"
                    >
                        Add
                    </button>
                </div>

                {customSelectedKeywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {customSelectedKeywords.map((keyword) => (
                            <span
                                key={keyword}
                                className="group inline-flex items-center rounded-full border border-[#A67AEB]/40 bg-[#A67AEB]/10 px-3 py-1 text-xs text-[#E6DAFF]"
                            >
                                {keyword}
                                <button
                                    type="button"
                                    onClick={() => removeKeyword(keyword)}
                                    className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-[#E6DAFF] opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-white/15 bg-[#12121A] p-4">
                <h2 className="text-lg font-semibold text-white">Media</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="rounded-xl border border-dashed border-white/25 bg-[#0d0d14] px-3 py-3 text-sm text-white/80">
                        Property images
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            multiple
                            onChange={(event) =>
                                updateField("imageFiles", Array.from(event.target.files || []))
                            }
                            className="mt-2 block w-full text-xs"
                        />
                    </label>
                    <label className="rounded-xl border border-dashed border-white/25 bg-[#0d0d14] px-3 py-3 text-sm text-white/80">
                        Verification document
                        <input
                            type="file"
                            accept=".pdf,image/jpeg,image/png,image/jpg"
                            onChange={(event) => {
                                const next = (event.target.files || [])[0] || null;
                                updateField("documentFile", next);
                                if (next && !form.documentType) {
                                    updateField("documentType", "electricity_bill");
                                }
                            }}
                            className="mt-2 block w-full text-xs"
                        />
                    </label>
                </div>
            </section>

            {error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}

            {requiredMissing.length > 0 && (
                <p className="text-xs text-[#f5b8b8]">
                    Fill required fields before submit: {requiredMissing.join(", ")}
                </p>
            )}

            <div className="sticky bottom-0 bg-[#050507] pb-24 pt-2 md:pb-4">
                <PrimaryButton
                    type="submit"
                    className="w-full"
                    disabled={!canSubmit || bootLoading}
                >
                    {loading ? "Saving..." : mode === "create" ? "Publish Listing" : "Update Listing"}
                </PrimaryButton>
            </div>
        </form>
    );
}
