import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { visitorId } = await req.json();
  if (!visitorId) {
    return NextResponse.json({ error: "visitorId required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  await db
    .from("page_visits")
    .upsert({ visitor_id: visitorId }, { onConflict: "visitor_id", ignoreDuplicates: true });

  return NextResponse.json({ ok: true });
}
