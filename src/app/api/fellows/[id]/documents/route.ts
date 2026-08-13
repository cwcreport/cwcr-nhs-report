/* ──────────────────────────────────────────
   API: /api/fellows/[id]/documents
   GET: List documents for a fellow
   POST: Upload documents for a fellow
   ────────────────────────────────────────── */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Fellow } from "@/models/Fellow";
import { FellowDocument } from "@/models/FellowDocument";
import { Mentor } from "@/models/Mentor";
// Imported so the DocumentType and User models are registered before populate() runs
import "@/models/DocumentType";
import "@/models/User";
import { requireAuth } from "@/lib/auth-guard";
import { UserRole } from "@/lib/constants";
import { jsonOk, jsonCreated, parseBody } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const { session, error } = await requireAuth();
    if (error) return error;

    const userRole = session!.user.role;
    if (userRole !== UserRole.MENTOR && userRole !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    // Verify fellow exists
    const fellow = await Fellow.findById(id).lean();
    if (!fellow) return NextResponse.json({ error: "Fellow not found" }, { status: 404 });

    if (userRole === UserRole.MENTOR) {
        const mentorDoc = await Mentor.findOne({ authId: session!.user.id }).lean();
        if (!mentorDoc) return NextResponse.json({ error: "Mentor profile not found" }, { status: 403 });

        if (fellow.mentor.toString() !== mentorDoc._id.toString()) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Mentors cannot see deleted documents
        const documents = await FellowDocument.find({ fellow: id, deleted: { $ne: true } })
            .populate("documentType", "title")
            .sort({ createdAt: -1 })
            .lean();

        return jsonOk(documents);
    }

    // Admin can see all documents (including soft deleted)
    const documents = await FellowDocument.find({ fellow: id })
        .populate("documentType", "title")
        .populate("deletedBy", "name email")
        .sort({ createdAt: -1 })
        .lean();

    return jsonOk(documents);
}

export async function POST(request: NextRequest, { params }: Params) {
    const { session, error } = await requireAuth();
    if (error) return error;

    const userRole = session!.user.role;
    if (userRole !== UserRole.MENTOR && userRole !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    // Verify fellow exists
    const fellow = await Fellow.findById(id).lean();
    if (!fellow) return NextResponse.json({ error: "Fellow not found" }, { status: 404 });

    if (userRole === UserRole.MENTOR) {
        const mentorDoc = await Mentor.findOne({ authId: session!.user.id }).lean();
        if (!mentorDoc) return NextResponse.json({ error: "Mentor profile not found" }, { status: 403 });

        if (fellow.mentor.toString() !== mentorDoc._id.toString()) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    const body = await parseBody<{ documents: { documentTypeId: string; url: string }[] }>(request);
    if (!body || !Array.isArray(body.documents) || body.documents.length === 0) {
        return NextResponse.json({ error: "Invalid payload. Expected 'documents' array." }, { status: 400 });
    }

    const newDocs = body.documents.map((doc) => ({
        fellow: id,
        documentType: doc.documentTypeId,
        url: doc.url,
        deleted: false,
        deletedAt: null,
        deletedBy: null,
    }));

    const createdDocs = await FellowDocument.insertMany(newDocs);

    void logActivity({
        session,
        action: "UPLOAD_FELLOW_DOCUMENTS",
        targetType: "FellowDocument",
        targetId: id,
        targetName: fellow.name,
        meta: { count: createdDocs.length }
    });

    return jsonCreated(createdDocs);
}

