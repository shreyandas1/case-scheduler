import { NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: {
        email: true,
      },
      orderBy: {
        email: "asc",
      },
    });

    const usernames = users.map((user) => user.email);

    return NextResponse.json({ usernames }, { status: 200 });
  } catch (error) {
    console.error("Error fetching usernames:", error);
    return NextResponse.json(
      { message: "Failed to fetch usernames" },
      { status: 500 }
    );
  }
}
