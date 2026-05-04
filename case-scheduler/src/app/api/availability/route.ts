import { NextResponse } from "next/server";

import { getSession } from "~/server/auth";
import { db } from "~/server/db";

type AvailabilitySlot = {
  day: string;
  startTime: string;
  endTime: string;
};

const START_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const END_TIME_PATTERN = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SLOTS = 366 * 48;

function isValidSlot(value: unknown): value is AvailabilitySlot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const slot = value as Record<string, unknown>;

  return (
    typeof slot.day === "string" &&
    DAY_PATTERN.test(slot.day) &&
    typeof slot.startTime === "string" &&
    START_TIME_PATTERN.test(slot.startTime) &&
    typeof slot.endTime === "string" &&
    END_TIME_PATTERN.test(slot.endTime)
  );
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;

  if (!body || typeof body !== "object" || !("slots" in body)) {
    return NextResponse.json({ message: "Slots are required" }, { status: 400 });
  }

  const slots = body.slots;

  if (!Array.isArray(slots) || slots.length > MAX_SLOTS) {
    return NextResponse.json({ message: "Invalid slots" }, { status: 400 });
  }

  if (!slots.every(isValidSlot)) {
    return NextResponse.json({ message: "Invalid slot data" }, { status: 400 });
  }

  const uniqueSlots = Array.from(
    new Map(
      slots.map((slot) => [`${slot.day}|${slot.startTime}`, slot] as const),
    ).values(),
  );

  await db.$transaction(async (tx) => {
    await tx.availability.deleteMany({
      where: { userId: session.userId },
    });

    if (uniqueSlots.length === 0) {
      return;
    }

    await tx.availability.createMany({
      data: uniqueSlots.map((slot) => ({
        userId: session.userId,
        day: new Date(`${slot.day}T00:00:00.000Z`),
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    });
  });

  return NextResponse.json({
    message: "Availability saved",
    count: uniqueSlots.length,
  });
}
