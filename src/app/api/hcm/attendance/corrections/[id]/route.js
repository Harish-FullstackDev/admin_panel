import { NextResponse } from "next/server";
import { getInternalUser, jsonError, serverError } from "@/lib/hcm/auth";
import { decideCorrection, AttendanceError } from "@/lib/hcm/attendance";

// POST { decision: approve | reject, comment? } — reporting manager or attendance.manage.
export async function POST(request, { params }) {
  const user = await getInternalUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  try {
    const { decision, comment } = await request.json();
    const updated = await decideCorrection(id, { decision, comment }, user, request);
    return NextResponse.json({ success: true, correction: updated });
  } catch (err) {
    if (err instanceof AttendanceError) return jsonError(err.message, err.status);
    return serverError("Attendance correction decide", err);
  }
}
