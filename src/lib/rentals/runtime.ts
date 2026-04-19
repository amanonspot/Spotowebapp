const readBool = (value: string | undefined, fallback: boolean) => {
    if (value === undefined) return fallback;
    return value.toLowerCase() === "true";
};

export const RENTALS_MOCK_MODE = readBool(process.env.NEXT_PUBLIC_RENTALS_MOCK_MODE, false);
export const OWNER_MOCK_MODE = readBool(process.env.NEXT_PUBLIC_OWNER_MOCK_MODE, false);

export const isUuidLike = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

