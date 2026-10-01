import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiFail, apiOk } from "@/lib/utils/api-envelope";
import { getReportMetrics } from "@/features/reports/dashboard/composition/get-report-metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(apiFail("Unauthorized"), { status: 401 });
  }

  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const metrics = await getReportMetrics(supabase, params);
    return NextResponse.json(apiOk(metrics));
  } catch (err) {
    console.error("[GET /api/admin/reports]", err);
    return NextResponse.json(apiFail("Failed to load reports."), { status: 500 });
  }
}
