import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "~/server/auth";

export async function POST(request: NextRequest) {
  await deleteSession();
  
  return NextResponse.redirect(new URL("/", request.url));
}
