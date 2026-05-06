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

    const usernames = users.map((user) => user.email).filter((email): email is string => Boolean(email));

    return NextResponse.json({ usernames });
  } catch (error) {
    console.error("Error fetching usernames:", error);
    return NextResponse.json(
      { usernames: [] },
      { status: 200 }
    );
  }
}
