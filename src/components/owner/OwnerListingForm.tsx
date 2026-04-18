"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import { OwnerListingFormInput, OwnerMastersData, SelectOption } from "@/lib/adapters/types";
import { ownerAdapter } from "@/lib/adapters";

interface OwnerListingFormProps {
    mode: "create" | "edit";
    propertyId?: string;
    initialValue?: OwnerListingFormInput;
}

const emptyForm: OwnerListingFormInput = {
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

const toKeywordOption = (value: string): SelectOption => ({
    id: value.toLowerCase().replace(/\s+/g, "-"),
    name: value,
});

const sanitizeNumericInput = (value: string) => value.replace(/[^\d]/g, "");
const sanitizeKeywordInput = (value: string) => value.replace(/[^\w\s-]/g, "").slice(0, 40);

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
            "title",
            "cityId",
            "localityId",
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

    const keywordOptions = useMemo(() => {
        const seeded = masters.keywords.map((item) => item.name);
        const merged = [...seeded, ...form.keywords].filter(Boolean);
        return Array.from(new Set(merged)).map(toKeywordOption);
    }, [masters.keywords, form.keywords]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <section className="rounded-2xl border border-white/15 bg-[#12121A] p-4">
                <h2 className="text-lg font-semibold text-white">Basic Details</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                        value={form.title}
                        onChange={(event) => updateField("title", event.target.value)}
                        placeholder="Property title"
                        className="rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
                    />
                    <input
                        value={form.contactPhone}
                        onChange={(event) => updateField("contactPhone", sanitizeNumericInput(event.target.value).slice(0, 10))}
                        placeholder="Owner phone"
                        inputMode="numeric"
                        className="rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
                    />
                    <select
                        value={form.cityId}
                        onChange={(event) => updateField("cityId", event.target.value)}
                        className="rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
                    >
                        <option value="">Select city</option>
                        {masters.cities.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={form.localityId}
                        onChange={(event) => updateField("localityId", event.target.value)}
                        className="rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
                    >
                        <option value="">Select locality</option>
                        {masters.localities.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={form.propertyTypeId}
                        onChange={(event) => updateField("propertyTypeId", event.target.value)}
                        className="rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
                    >
                        <option value="">Property type</option>
                        {masters.propertyTypes.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={form.bhkId}
                        onChange={(event) => updateField("bhkId", event.target.value)}
                        className="rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
                    >
                        <option value="">BHK type</option>
                        {masters.bhkTypes.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
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
                        className="rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
                    />
                    <input
                        value={form.deposit}
                        onChange={(event) => updateField("deposit", sanitizeNumericInput(event.target.value))}
                        inputMode="numeric"
                        placeholder="Security deposit"
                        className="rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
                    />
                    <div className="rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2">
                        <div className="mb-2 flex items-center justify-between text-xs text-white/70">
                            <span>Property size</span>
                            <span>{form.builtUpAreaSqft || "0"} sq ft</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={5000}
                            step={10}
                            value={Number(form.builtUpAreaSqft || 0)}
                            onChange={(event) => updateField("builtUpAreaSqft", sanitizeNumericInput(event.target.value))}
                            className="w-full accent-[#B7F041]"
                        />
                    </div>
                    <select
                        value={form.availabilityId}
                        onChange={(event) => updateField("availabilityId", event.target.value)}
                        className="rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
                    >
                        <option value="">Availability</option>
                        {masters.availabilityTypes.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={form.furnishingId}
                        onChange={(event) => updateField("furnishingId", event.target.value)}
                        className="rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
                    >
                        <option value="">Furnishing</option>
                        {masters.furnishingTypes.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-[#12121A] p-4">
                <h2 className="text-lg font-semibold text-white">Address & Description</h2>
                <div className="mt-3 space-y-3">
                    <input
                        value={form.addressLine}
                        onChange={(event) => updateField("addressLine", event.target.value)}
                        placeholder="Flat, street, area"
                        className="w-full rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
                    />
                    <textarea
                        value={form.description}
                        onChange={(event) => updateField("description", event.target.value)}
                        placeholder="Describe your property"
                        rows={4}
                        className="w-full rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
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
                        const selected = form.keywords.includes(option.name);
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() =>
                                    updateField(
                                        "keywords",
                                        selected
                                            ? form.keywords.filter((item) => item !== option.name)
                                            : [...form.keywords, option.name]
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
                        className="flex-1 rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2 text-sm outline-none focus:border-[#A67AEB]"
                    />
                    <button
                        type="button"
                        onClick={addCustomKeyword}
                        className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90"
                    >
                        Add
                    </button>
                </div>

                {form.keywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {form.keywords.map((keyword) => (
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
                            onChange={(event) =>
                                updateField("documentFile", (event.target.files || [])[0] || null)
                            }
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
