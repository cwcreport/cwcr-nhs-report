import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AppSettings } from "@/models";
import { SavedZonalAudit } from "@/models/SavedZonalAudit";
import { Coordinator } from "@/models/Coordinator";
import { DeskOfficer } from "@/models/DeskOfficer";
import { UserRole, getZoneForState } from "@/lib/constants";
import { logActivity } from "@/lib/activity-logger";

type PopulatedCoordinator = {
    _id: string | { toString(): string };
    authId?: { name?: string; email?: string };
    states?: string[];
};

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Internal server error";
}

type NormalizedAuditResponse = Record<string, unknown> & {
    coordinator?: {
        _id: PopulatedCoordinator["_id"];
        name?: string;
        email?: string;
        state: string;
    };
    canEdit: boolean;
};

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const audit = await SavedZonalAudit.findById(id)
            .populate({
                path: "coordinator",
                populate: { path: "authId", select: "name email" },
            })
            .lean();

        if (!audit) {
            return NextResponse.json({ error: "Zonal audit not found" }, { status: 404 });
        }

        const role = session.user.role;

        // Role-based access
        if (role === UserRole.MENTOR) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (role === UserRole.COORDINATOR) {
            if (!session.user.aiAccessEnabled) {
                return NextResponse.json({ error: "AI access is required to view zonal audits." }, { status: 403 });
            }
            const coordDoc = await Coordinator.findOne({ authId: session.user.id });
            if (!coordDoc || audit.coordinator?._id?.toString() !== coordDoc._id.toString()) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        if (role === UserRole.ZONAL_DESK_OFFICER) {
            const deskDoc = await DeskOfficer.findOne({ authId: session.user.id });
            if (!deskDoc) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            const deskZones = [...new Set(deskDoc.states.map(getZoneForState).filter(Boolean))];
            if (!deskZones.includes(audit.zoneName)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        // Admin, ME Officer, Team Research Lead — unrestricted

        // Normalize coordinator for client
        const auditWithCoordinator = audit as typeof audit & { coordinator?: PopulatedCoordinator };
        const normalized: NormalizedAuditResponse = { ...(audit as unknown as Record<string, unknown>), canEdit: false };
        if (auditWithCoordinator.coordinator?.authId) {
            const c = auditWithCoordinator.coordinator;
            normalized.coordinator = {
                _id: c._id,
                name: c.authId?.name,
                email: c.authId?.email,
                state: c.states?.[0] ?? "",
            };
        }

        const settings = await AppSettings.findOne({}).lean();
        normalized.canEdit =
            !settings?.blockZonalAuditEdits &&
            (role === UserRole.ADMIN || role === UserRole.COORDINATOR);

        return NextResponse.json(normalized);
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = session.user.role;
        if (role !== UserRole.ADMIN && role !== UserRole.COORDINATOR) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();
        const audit = await SavedZonalAudit.findById(id).lean();
        if (!audit) {
            return NextResponse.json({ error: "Zonal audit not found" }, { status: 404 });
        }

        if (role === UserRole.COORDINATOR) {
            const coordDoc = await Coordinator.findOne({ authId: session.user.id });
            if (!coordDoc || audit.coordinator?.toString() !== coordDoc._id.toString()) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        await SavedZonalAudit.findByIdAndDelete(id);

        void logActivity({
            session,
            action: "DELETE_ZONAL_AUDIT",
            targetType: "SavedZonalAudit",
            targetId: id,
            targetName: `${audit.zoneName} – ${audit.month}`,
        });

        return NextResponse.json({ message: "Zonal audit deleted" });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = session.user.role;
        if (role !== UserRole.ADMIN && role !== UserRole.COORDINATOR) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        if (!body?.auditData || typeof body.auditData !== "object") {
            return NextResponse.json({ error: "auditData is required" }, { status: 400 });
        }

        await connectDB();
        const audit = await SavedZonalAudit.findById(id);
        if (!audit) {
            return NextResponse.json({ error: "Zonal audit not found" }, { status: 404 });
        }

        if (role === UserRole.COORDINATOR) {
            const coordDoc = await Coordinator.findOne({ authId: session.user.id });
            if (!coordDoc || audit.coordinator?.toString() !== coordDoc._id.toString()) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const settings = await AppSettings.findOne({}).lean();
        if (settings?.blockZonalAuditEdits) {
            return NextResponse.json({ error: "Zonal audit editing is currently disabled." }, { status: 403 });
        }

        audit.auditData = body.auditData;
        await audit.save();

        // Re-fetch with populated coordinator for normalized response
        const updated = await SavedZonalAudit.findById(id)
            .populate({
                path: "coordinator",
                populate: { path: "authId", select: "name email" },
            })
            .lean();

        if (!updated) {
            return NextResponse.json({ error: "Zonal audit not found" }, { status: 404 });
        }

        const updatedWithCoordinator = updated as typeof updated & { coordinator?: PopulatedCoordinator };
        const normalized: NormalizedAuditResponse = {
            ...(updated as unknown as Record<string, unknown>),
            canEdit: !settings?.blockZonalAuditEdits && (role === UserRole.ADMIN || role === UserRole.COORDINATOR),
        };
        if (updatedWithCoordinator.coordinator?.authId) {
            const c = updatedWithCoordinator.coordinator;
            normalized.coordinator = {
                _id: c._id,
                name: c.authId?.name,
                email: c.authId?.email,
                state: c.states?.[0] ?? "",
            };
        }

        void logActivity({
            session,
            action: "UPDATE_ZONAL_AUDIT",
            targetType: "SavedZonalAudit",
            targetId: id,
            targetName: `${audit.zoneName} – ${audit.month}`,
        });

        return NextResponse.json(normalized);
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
