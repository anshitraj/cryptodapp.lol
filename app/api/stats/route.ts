import { NextResponse } from "next/server";
import { getSiteStats } from "@/lib/stats";

export async function GET() {
  const stats = await getSiteStats();
  return NextResponse.json(stats);
}
