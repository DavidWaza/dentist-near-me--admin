import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseReportRange, queryReportMetrics } from "@/lib/queries/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const params = Object.fromEntries(searchParams.entries());
  const { from, to } = parseReportRange(params);

  try {
    const metrics = await queryReportMetrics(supabase, from, to);
    return NextResponse.json({ metrics });
  } catch (err) {
    console.error("[GET /api/admin/reports]", err);
    return NextResponse.json(
      { error: "Failed to load reports" },
      { status: 500 },
    );
  }
}
