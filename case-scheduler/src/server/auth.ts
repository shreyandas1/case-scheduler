import { cookies } from "next/headers";
import { db } from "~/server/db";

const SESSION_COOKIE = "sessionId";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export interface Session {
  username: string;
  userId: string;
}

export async function createSession(userId: string, username: string) {
  const sessionId = Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  // Store session in database
  await db.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt,
      token: sessionId,
    },
  });

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    return null;
  }

  try {
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      // Session expired, clean it up
      await db.session.delete({ where: { id: sessionId } });
      return null;
    }

    return {
      username: session.user.email, // Using email as username for now
      userId: session.userId,
    };
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await db.session.delete({ where: { id: sessionId } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE);
  }
}
