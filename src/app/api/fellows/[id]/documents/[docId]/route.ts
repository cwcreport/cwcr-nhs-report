/* ──────────────────────────────────────────
   API: /api/fellows/[id]/documents/[docId]
   DELETE: Soft delete (Mentor/Admin) or Permanent delete (Admin only)
   PATCH: Restore deleted document (Admin only)
   ────────────────────────────────────────── */
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Fellow } from "@/models/Fellow";
import { FellowDocument } from "@/models/FellowDocument";
import { Mentor } from "@/models/Mentor";
import "@/models/DocumentType";
import "@/models/User";
import { requireAuth } from "@/lib/auth-guard";
import { UserRole } from "@/lib/constants";
import { jsonOk } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";

type Params = { params: Promise<{ id: string; docId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
    const { session, error } = await requireAuth();
    if (error) return error;

    const userRole = session!.user.role;
    if (userRole !== UserRole.MENTOR && userRole !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, docId } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    await connectDB();

    // Verify fellow exists
    const fellow = await Fellow.findById(id).lean();
    if (!fellow) return NextResponse.json({ error: "Fellow not found" }, { status: 404 });

    if (userRole === UserRole.MENTOR) {
        if (permanent) {
            return NextResponse.json({ error: "Forbidden: Mentors cannot permanently delete documents" }, { status: 403 });
        }

        const mentorDoc = await Mentor.findOne({ authId: session!.user.id }).lean();
        if (!mentorDoc) return NextResponse.json({ error: "Mentor profile not found" }, { status: 403 });

        if (fellow.mentor.toString() !== mentorDoc._id.toString()) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Mentor can only delete active document for their fellow
        const doc = await FellowDocument.findOne({ _id: docId, fellow: id, deleted: { $ne: true } });
        if (!doc) {
            return NextResponse.json({ error: "Document not found or already deleted" }, { status: 404 });
        }

        doc.deleted = true;
        doc.deletedAt = new Date();
        doc.deletedBy = Types.ObjectId.isValid(session!.user.id) ? new Types.ObjectId(session!.user.id) : null;
        await doc.save();

        void logActivity({
            session,
            action: "SOFT_DELETE_FELLOW_DOCUMENT",
            targetType: "FellowDocument",
            targetId: docId,
            targetName: fellow.name,
        });

        return jsonOk({ success: true, message: "Document deleted successfully" });
    }

    // Admin handling
    const doc = await FellowDocument.findOne({ _id: docId, fellow: id });
    if (!doc) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (permanent) {
        await FellowDocument.findByIdAndDelete(docId);

        void logActivity({
            session,
            action: "PERMANENT_DELETE_FELLOW_DOCUMENT",
            targetType: "FellowDocument",
            targetId: docId,
            targetName: fellow.name,
        });

        return jsonOk({ success: true, message: "Document permanently deleted" });
    }

    // Admin soft delete
    doc.deleted = true;
    doc.deletedAt = new Date();
    doc.deletedBy = Types.ObjectId.isValid(session!.user.id) ? new Types.ObjectId(session!.user.id) : null;
    await doc.save();

    void logActivity({
        session,
        action: "SOFT_DELETE_FELLOW_DOCUMENT",
        targetType: "FellowDocument",
        targetId: docId,
        targetName: fellow.name,
    });

    return jsonOk({ success: true, message: "Document moved to trash" });
}

export async function PATCH(request: NextRequest, { params }: Params) {
    const { session, error } = await requireAuth();
    if (error) return error;

    const userRole = session!.user.role;
    if (userRole !== UserRole.ADMIN) {
        return NextResponse.json(
            { error: userRole === UserRole.MENTOR ? "Forbidden: Mentors cannot restore deleted documents" : "Forbidden" },
            { status: 403 }
        );
    }

    const { id, docId } = await params;
    await connectDB();

    const fellow = await Fellow.findById(id).lean();
    if (!fellow) return NextResponse.json({ error: "Fellow not found" }, { status: 404 });

    const doc = await FellowDocument.findOne({ _id: docId, fellow: id });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    doc.deleted = false;
    doc.deletedAt = null;
    doc.deletedBy = null;
    await doc.save();

    const populatedDoc = await FellowDocument.findById(doc._id)
        .populate("documentType", "title")
        .lean();

    void logActivity({
        session,
        action: "RESTORE_FELLOW_DOCUMENT",
        targetType: "FellowDocument",
        targetId: docId,
        targetName: fellow.name,
    });

    return jsonOk({ success: true, message: "Document restored successfully", document: populatedDoc });
}
