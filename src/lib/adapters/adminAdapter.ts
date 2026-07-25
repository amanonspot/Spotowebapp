import { userService } from "@/lib/api";
import { normalizePropertyDetail, normalizePropertyList, rentalsService, WireApiEnvelope } from "@/lib/rentals";
import { fetchMastersBundleCached } from "@/lib/rentals/mastersCache";
import { RentalAgentEmployeeDto, RentalPropertyDto } from "@/lib/rentals/wireTypes";
import { PropertyDetail, PropertyListItem } from "@/lib/adapters/types";

export interface AdminDashboardStats {
    pendingReview: number;
    live: number;
    rejected: number;
    awaitingOwner: number;
    activeAgents: number;
}

export interface AdminListingsResult {
    listings: PropertyListItem[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

const unwrapData = <T,>(payload: WireApiEnvelope<T>): T | null => {
    const record = payload as Record<string, unknown>;
    if (record.data !== undefined) return record.data as T;
    return (payload as T) ?? null;
};

const unwrapList = (payload: { data?: RentalPropertyDto[]; meta?: { total?: number; page?: number; page_size?: number; has_more?: boolean } }) => {
    const list = Array.isArray(payload?.data) ? payload.data : [];
    return {
        listings: normalizePropertyList(list),
        total: payload.meta?.total ?? list.length,
        page: payload.meta?.page ?? 1,
        pageSize: payload.meta?.page_size ?? list.length,
        hasMore: Boolean(payload.meta?.has_more),
    };
};

const countForStatus = async (verificationStatus: string) => {
    const response = await rentalsService.listAdminProperties({
        verification_status: verificationStatus,
        page: 1,
        page_size: 1,
    });
    return response.meta?.total ?? (Array.isArray(response.data) ? response.data.length : 0);
};

export const adminAdapter = {
    async isAdminUser(): Promise<boolean> {
        try {
            const user = await userService.getUserDetails();
            return Boolean(user.is_staff);
        } catch {
            return false;
        }
    },

    async getDashboardStats(): Promise<AdminDashboardStats> {
        const [pendingReview, live, rejected, awaitingOwner, employeesResponse] = await Promise.all([
            countForStatus("in_review"),
            countForStatus("live"),
            countForStatus("rejected"),
            countForStatus("awaiting_owner_login"),
            rentalsService.listEmployees({ is_active: true }),
        ]);
        const employees = unwrapData<RentalAgentEmployeeDto[]>(employeesResponse);
        return {
            pendingReview,
            live,
            rejected,
            awaitingOwner,
            activeAgents: (employees || []).filter((item) => item.is_agent).length,
        };
    },

    async listListings(params?: {
        verification_status?: string;
        page?: number;
        page_size?: number;
    }): Promise<AdminListingsResult> {
        const response = await rentalsService.listAdminProperties(params);
        return unwrapList(response);
    },

    async getListingDetail(propertyId: string): Promise<PropertyDetail> {
        const [response, masters] = await Promise.all([
            rentalsService.getAdminPropertyDetail(propertyId),
            fetchMastersBundleCached(),
        ]);
        const detail = normalizePropertyDetail(response, propertyId, {
            fallbackToMock: false,
            ...masters,
        });
        if (!detail.propertyTitle && !detail.title) {
            throw new Error("Property not found");
        }
        return detail;
    },

    async approveListing(propertyId: string) {
        await rentalsService.approveProperty(propertyId);
    },

    async rejectListing(propertyId: string, reason?: string) {
        await rentalsService.rejectProperty(propertyId, reason);
    },

    async deleteListing(propertyId: string) {
        await rentalsService.deleteAdminProperty(propertyId);
    },

    async listAgents(): Promise<RentalAgentEmployeeDto[]> {
        const response = await rentalsService.listEmployees();
        return unwrapData<RentalAgentEmployeeDto[]>(response) || [];
    },

    async createAgent(input: { name: string; phone?: string; email?: string }) {
        const response = await rentalsService.createEmployee({
            name: input.name.trim(),
            phone: input.phone?.trim() || undefined,
            email: input.email?.trim() || undefined,
            is_active: true,
        });
        const data = unwrapData<RentalAgentEmployeeDto>(response);
        if (!data) {
            throw new Error("Employee created but response was empty.");
        }
        return data;
    },

    async assignAgentUser(employeeId: string, userPhone: string) {
        const phone = userPhone.replace(/\D/g, "").slice(-10);
        if (phone.length !== 10) {
            throw new Error("Enter a valid 10-digit user phone number.");
        }
        const response = await rentalsService.assignEmployeeUser({
            employee_id: employeeId,
            user_phone: phone,
        });
        const data = unwrapData<RentalAgentEmployeeDto>(response);
        if (!data) {
            throw new Error("Assign failed — empty response.");
        }
        return data;
    },

    async unassignAgentUser(employeeId: string) {
        const response = await rentalsService.assignEmployeeUser({ employee_id: employeeId });
        const data = unwrapData<RentalAgentEmployeeDto>(response);
        if (!data) {
            throw new Error("Unassign failed — empty response.");
        }
        return data;
    },

    async deleteAgent(employeeId: string) {
        await rentalsService.deleteEmployee(employeeId);
    },
};
