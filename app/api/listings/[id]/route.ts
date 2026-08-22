import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Body: { bidId, name, description, iconUrl }
// bidId acts as the edit credential — there's no login on this site, so
// whoever holds the id of the most recent PAID bid on this listing (handed
// to their browser right after their payment confirmed) is who's allowed to
// touch the listing. An older/outbid payer's bidId no longer qualifies.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const body = await req.json();
  const bidId = String(body.bidId ?? "").trim();
  const name = String(body.name ?? "").trim().slice(0, 100);
  const description = String(body.description ?? "").trim().slice(0, 300);
  const iconUrl = String(body.iconUrl ?? "").trim().slice(0, 500);

  if (!bidId || !name) {
    return NextResponse.json({ error: "bidId and name are required" }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: latestPaidBid } = await db
    .from("bids")
    .select("id")
    .eq("listing_id", listingId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestPaidBid || latestPaidBid.id !== bidId) {
    return NextResponse.json(
      { error: "this bid can no longer edit the listing" },
      { status: 403 }
    );
  }

  const { data: updated, error } = await db
    .from("listings")
    .update({
      name,
      description,
      icon_url: iconUrl || null,
    })
    .eq("id", listingId)
    .select("id, name, description, icon_url, link")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listing: updated });
}
