import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifySolanaPayment } from "@/lib/chain/solana";
import { verifyEvmPayment } from "@/lib/chain/evm";
import { ChainKey, EvmChainKey, TokenSymbol } from "@/lib/chain/constants";
import { fetchSiteMetadata } from "@/lib/metadata";

const VALID_CHAINS: ChainKey[] = ["solana", "ethereum", "bsc", "polygon", "base"];
const VALID_TOKENS: TokenSymbol[] = ["USDC", "USDT"];

// Body: { chain, token, txRef }
// The client already sent the on-chain transfer itself — this endpoint is
// what actually decides whether the bid counts, by re-checking the
// transaction against the chain directly. Never trust the client's say-so.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bidId } = await params;
  const body = await req.json();
  const chain = body.chain as ChainKey;
  const token = body.token as TokenSymbol;
  const txRef = String(body.txRef ?? "").trim();

  if (!txRef || !VALID_CHAINS.includes(chain) || !VALID_TOKENS.includes(token)) {
    return NextResponse.json({ error: "valid chain, token, and txRef are required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: bid, error: fetchError } = await db
    .from("bids")
    .select("id, listing_id, requested_usd, status")
    .eq("id", bidId)
    .maybeSingle();

  if (fetchError || !bid) {
    return NextResponse.json({ error: "bid not found" }, { status: 404 });
  }
  if (bid.status === "paid") {
    const listing = await getListing(db, bid.listing_id);
    return NextResponse.json({ ok: true, alreadyPaid: true, listing });
  }

  // One transaction pays for exactly one bid. The unique index in the schema
  // is the real guarantee (it also settles concurrent requests racing on the
  // same hash); this check just turns that into a readable error.
  const { data: alreadyUsed } = await db
    .from("bids")
    .select("id")
    .eq("tx_signature", txRef)
    .eq("status", "paid")
    .maybeSingle();

  if (alreadyUsed) {
    return NextResponse.json(
      { ok: false, reason: "that transaction has already been used to pay for another bid" },
      { status: 409 }
    );
  }

  const requestedUsd = Number(bid.requested_usd);
  const result =
    chain === "solana"
      ? await verifySolanaPayment(token, txRef, requestedUsd)
      : await verifyEvmPayment(chain as EvmChainKey, token, txRef as `0x${string}`, requestedUsd);

  if (!result.ok) {
    await db.from("bids").update({ status: "failed", tx_signature: txRef, chain, token }).eq("id", bidId);
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 402 });
  }

  const { error: updateError } = await db
    .from("bids")
    .update({
      status: "paid",
      amount_usd: requestedUsd,
      chain,
      token,
      payer_wallet: result.payerAddress,
      tx_signature: txRef,
      paid_at: new Date().toISOString(),
    })
    .eq("id", bidId);

  if (updateError) {
    // 23505 = the tx_signature unique index fired, i.e. another request paid
    // out this same transaction in the moment between our check and write.
    if (updateError.code === "23505") {
      return NextResponse.json(
        { ok: false, reason: "that transaction has already been used to pay for another bid" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await enrichListingFromUrl(db, bid.listing_id);
  const listing = await getListing(db, bid.listing_id);

  return NextResponse.json({ ok: true, listing });
}

async function getListing(db: ReturnType<typeof supabaseAdmin>, listingId: string) {
  const { data } = await db
    .from("listings")
    .select("id, name, description, icon_url, link")
    .eq("id", listingId)
    .maybeSingle();
  return data ?? null;
}

// Auto-fills the listing's icon and description from its own site's Open
// Graph tags on first paid bid — the "auto bio + image" behavior every
// outbid.lol-style board has, so nobody has to type it in by hand. Best
// effort: never lets a metadata-fetch failure affect the payment response.
async function enrichListingFromUrl(db: ReturnType<typeof supabaseAdmin>, listingId: string) {
  try {
    const { data: listing } = await db
      .from("listings")
      .select("link, name, description, icon_url")
      .eq("id", listingId)
      .maybeSingle();

    if (!listing || listing.icon_url) return;

    const meta = await fetchSiteMetadata(listing.link);
    const isPlaceholderName = !listing.name || listing.name === listing.link;

    await db
      .from("listings")
      .update({
        name: isPlaceholderName && meta.title ? meta.title : listing.name,
        description: listing.description || meta.description || "",
        icon_url: meta.imageUrl,
      })
      .eq("id", listingId);
  } catch (err) {
    console.error("[enrichListingFromUrl] failed:", err);
  }
}
