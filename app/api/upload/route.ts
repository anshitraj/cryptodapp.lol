import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAllowedLogoType, MAX_LOGO_BYTES, uploadLogo } from "@/lib/r2";

// multipart/form-data: { file, bidId }
// bidId just has to belong to some paid bid — proves whoever's uploading
// actually paid for a listing, so this can't be used as free file hosting.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  const bidId = String(form.get("bidId") ?? "");

  if (!(file instanceof File) || !bidId) {
    return NextResponse.json({ error: "file and bidId are required" }, { status: 400 });
  }

  if (!isAllowedLogoType(file.type)) {
    return NextResponse.json(
      { error: "Only PNG, JPEG, WebP, GIF, or SVG images are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_LOGO_BYTES) {
    return NextResponse.json({ error: "Image must be 2MB or smaller" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: bid } = await db
    .from("bids")
    .select("id")
    .eq("id", bidId)
    .eq("status", "paid")
    .maybeSingle();

  if (!bid) {
    return NextResponse.json({ error: "no paid bid found for that id" }, { status: 403 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadLogo(buffer, file.type);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: `Upload failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
