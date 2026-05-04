import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { createSession } from "~/server/auth";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { message: "Username is required" },
        { status: 400 }
      );
    }

    if (username.trim().length === 0) {
      return NextResponse.json(
        { message: "Username cannot be empty" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { email: username },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          id: `user_${Math.random().toString(36).substring(2, 15)}`,
          email: username,
          name: username,
          emailVerified: true,
        },
      });
    }

    // Create session
    await createSession(user.id, username);

    return NextResponse.json(
      { message: "Login successful", user: { username } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Login failed" },
      { status: 500 }
    );
  }
}
