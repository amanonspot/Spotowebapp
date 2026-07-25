"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminConfirmModal } from "@/components/admin/AdminConfirmModal";
import { adminAdapter } from "@/lib/adapters/adminAdapter";
import { RentalAgentEmployeeDto } from "@/lib/rentals/wireTypes";

export default function AdminAgentsPage() {
    const [agents, setAgents] = useState<RentalAgentEmployeeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState<RentalAgentEmployeeDto | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<RentalAgentEmployeeDto | null>(null);
    const [working, setWorking] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [assignPhone, setAssignPhone] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const rows = await adminAdapter.listAgents();
            setAgents(rows);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to load agents.");
            setAgents([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Agent name is required.");
            return;
        }
        setWorking(true);
        try {
            await adminAdapter.createAgent({ name, phone, email });
            toast.success("Agent created.");
            setCreateOpen(false);
            setName("");
            setPhone("");
            setEmail("");
            await load();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Create failed.");
        } finally {
            setWorking(false);
        }
    };

    const handleAssign = async () => {
        if (!assignTarget) return;
        setWorking(true);
        try {
            await adminAdapter.assignAgentUser(assignTarget.employee_id, assignPhone);
            toast.success("User linked to agent.");
            setAssignTarget(null);
            setAssignPhone("");
            await load();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Assign failed.");
        } finally {
            setWorking(false);
        }
    };

    const handleUnassign = async (agent: RentalAgentEmployeeDto) => {
        setWorking(true);
        try {
            await adminAdapter.unassignAgentUser(agent.employee_id);
            toast.success("User unlinked.");
            await load();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unassign failed.");
        } finally {
            setWorking(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setWorking(true);
        try {
            await adminAdapter.deleteAgent(deleteTarget.employee_id);
            toast.success("Agent deleted.");
            setDeleteTarget(null);
            await load();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Delete failed.");
        } finally {
            setWorking(false);
        }
    };

    return (
        <>
            <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
                <div>
                    <p className="text-sm font-semibold text-[#A67AEB]">Team</p>
                    <h1 className="mt-1 text-3xl font-bold text-white">Field agents</h1>
                </div>
                <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#A67AEB] px-4 text-sm font-semibold text-[#111]"
                >
                    <Plus className="h-4 w-4" /> Add agent
                </button>
            </header>

            {loading ? (
                <AdminCard className="text-sm text-white/55">Loading agents…</AdminCard>
            ) : agents.length === 0 ? (
                <AdminCard className="text-sm text-white/55">No agents yet. Create one to get started.</AdminCard>
            ) : (
                <>
                    <AdminCard className="hidden overflow-hidden p-0 lg:block">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-white/10 bg-[#0d0d14] text-white/55">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Employee ID</th>
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="px-4 py-3 font-semibold">Phone</th>
                                    <th className="px-4 py-3 font-semibold">Linked user</th>
                                    <th className="px-4 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agents.map((agent) => (
                                    <tr key={agent.id} className="border-b border-white/5 last:border-0">
                                        <td className="px-4 py-3 font-mono text-xs text-[#A67AEB]">{agent.employee_id}</td>
                                        <td className="px-4 py-3 font-semibold text-white">{agent.name || "—"}</td>
                                        <td className="px-4 py-3 text-white/70">{agent.phone || "—"}</td>
                                        <td className="px-4 py-3 text-white/70">{agent.user_phone || "Not linked"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAssignTarget(agent);
                                                        setAssignPhone(agent.user_phone || "");
                                                    }}
                                                    className="rounded-lg border border-[#A67AEB]/40 px-3 py-1.5 text-xs font-semibold text-[#D9C4FF]"
                                                >
                                                    {agent.user_phone ? "Re-link" : "Link user"}
                                                </button>
                                                {agent.user_phone ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUnassign(agent)}
                                                        disabled={working}
                                                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70"
                                                    >
                                                        Unlink
                                                    </button>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(agent)}
                                                    className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </AdminCard>

                    <div className="grid gap-3 lg:hidden">
                        {agents.map((agent) => (
                            <AdminCard key={agent.id} className="p-4">
                                <p className="font-mono text-xs text-[#A67AEB]">{agent.employee_id}</p>
                                <p className="mt-1 text-lg font-semibold text-white">{agent.name}</p>
                                <p className="text-sm text-white/55">{agent.phone || "No phone"}</p>
                                <p className="mt-2 text-sm text-white/70">Linked: {agent.user_phone || "Not linked"}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAssignTarget(agent);
                                            setAssignPhone(agent.user_phone || "");
                                        }}
                                        className="inline-flex items-center gap-1 rounded-lg border border-[#A67AEB]/40 px-3 py-2 text-xs font-semibold text-[#D9C4FF]"
                                    >
                                        <UserPlus className="h-3.5 w-3.5" /> Link user
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(agent)}
                                        className="rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </AdminCard>
                        ))}
                    </div>
                </>
            )}

            <AdminConfirmModal
                open={createOpen}
                title="Add field agent"
                description="Creates a new employee ID for agent login assignment."
                confirmLabel="Create"
                loading={working}
                onCancel={() => setCreateOpen(false)}
                onConfirm={handleCreate}
            >
                <div className="space-y-3">
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Agent name"
                        className="h-12 w-full rounded-xl border border-white/15 bg-[#0d0d14] px-3 text-sm text-white outline-none focus:border-[#A67AEB]"
                    />
                    <input
                        value={phone}
                        onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="Phone (optional)"
                        className="h-12 w-full rounded-xl border border-white/15 bg-[#0d0d14] px-3 text-sm text-white outline-none focus:border-[#A67AEB]"
                    />
                    <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Email (optional)"
                        className="h-12 w-full rounded-xl border border-white/15 bg-[#0d0d14] px-3 text-sm text-white outline-none focus:border-[#A67AEB]"
                    />
                </div>
            </AdminConfirmModal>

            <AdminConfirmModal
                open={Boolean(assignTarget)}
                title={`Link user to ${assignTarget?.employee_id || "agent"}`}
                description="Enter the Spoto login phone number for this field agent."
                confirmLabel="Link user"
                loading={working}
                onCancel={() => {
                    setAssignTarget(null);
                    setAssignPhone("");
                }}
                onConfirm={handleAssign}
            >
                <input
                    value={assignPhone}
                    onChange={(event) => setAssignPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit user phone"
                    className="h-12 w-full rounded-xl border border-white/15 bg-[#0d0d14] px-3 text-sm text-white outline-none focus:border-[#A67AEB]"
                />
            </AdminConfirmModal>

            <AdminConfirmModal
                open={Boolean(deleteTarget)}
                title={`Delete ${deleteTarget?.employee_id || "agent"}?`}
                description="This removes the employee record. Linked listings stay, but the agent login link is removed."
                confirmLabel="Delete"
                confirmTone="danger"
                loading={working}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
            />
        </>
    );
}
