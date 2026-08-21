import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { treasuryEvmAddress, treasurySolanaAddress } from "@/lib/chain/constants";

// Body: { link, name?, description?, requestedUsd, listingId? }
// If listingId is omitted, an existing listing with the same link is reused;
// otherwise a new listing is created from name/description.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const link = String(body.link ?? "").trim();
  const requestedUsd = Number(body.requestedUsd);

  if (!link || !Number.isFinite(requestedUsd) || requestedUsd < 5) {
    return NextResponse.json(
      { error: "link and requestedUsd (min 5) are required" },
      { status: 400 }
    );
  }

  const db = supabaseAdmin();
  let listingId = body.listingId as string | undefined;

  if (!listingId) {
    const { data: existing } = await db
      .from("listings")
      .select("id")
      .ilike("link", link)
      .limit(1)
      .maybeSingle();

    if (existing) {
      listingId = existing.id;
    } else {
      const name = String(body.name ?? "").trim() || link;
      const description = String(body.description ?? "").trim();
      const { data: created, error: createError } = await db
        .from("listings")
        .insert({ name, link, description })
        .select("id")
        .single();
      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      listingId = created.id;
    }
  }

  const { data: bid, error: bidError } = await db
    .from("bids")
    .insert({ listing_id: listingId, requested_usd: requestedUsd, status: "pending" })
    .select()
    .single();

  if (bidError) {
    return NextResponse.json({ error: bidError.message }, { status: 500 });
  }

  try {
    return NextResponse.json({
      bidId: bid.id,
      listingId,
      treasury: {
        solana: treasurySolanaAddress(),
        evm: treasuryEvmAddress(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        bidId: bid.id,
        listingId,
        error: `Bid recorded but treasury wallets aren't configured: ${(err as Error).message}`,
      },
      { status: 502 }
    );
  }
}
