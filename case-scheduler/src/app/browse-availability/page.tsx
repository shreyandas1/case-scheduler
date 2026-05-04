import { redirect } from "next/navigation";

import { AppHeader } from "../_components/app-header";
import { BrowseAvailabilityList } from "./browse-availability-list";
import { getSession } from "~/server/auth";
import { db } from "~/server/db";

type Slot = {
  day: Date;
  startTime: string;
};

function getSlotKey(slot: Pick<Slot, "day" | "startTime">) {
  return `${slot.day.toISOString().slice(0, 10)}|${slot.startTime}`;
}

export default async function BrowseAvailabilityPage() {
  const session = await getSession();

  if (!session?.username) {
    redirect("/");
  }

  const [mySlots, otherUsers] = await Promise.all([
    db.availability.findMany({
      where: { userId: session.userId },
      select: {
        day: true,
        startTime: true,
        endTime: true,
      },
    }),
    db.user.findMany({
      where: {
        id: { not: session.userId },
      },
      select: {
        id: true,
        email: true,
        name: true,
        availabilities: {
          orderBy: [{ day: "asc" }, { startTime: "asc" }],
          select: {
            day: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    }),
  ]);

  const mySlotKeys = new Set(mySlots.map(getSlotKey));
  const users = otherUsers
    .map((user) => {
      const availability = user.availabilities.map((slot) => ({
        ...slot,
        isOverlap: mySlotKeys.has(getSlotKey(slot)),
      }));
      const overlapCount = availability.filter((slot) => slot.isOverlap).length;

      return {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        availability: availability.map((slot) => ({
          day: slot.day.toISOString().slice(0, 10),
          startTime: slot.startTime,
          endTime: slot.endTime,
          isOverlap: slot.isOverlap,
        })),
        overlapCount,
      };
    })
    .sort(
      (first, second) =>
        second.overlapCount - first.overlapCount ||
        first.name.localeCompare(second.name),
    );

  const overlapTotal = users.reduce(
    (total, user) => total + user.overlapCount,
    0,
  );

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#172554] via-[#111827] to-[#052e2b] text-white">
      <AppHeader activePage="browse" username={session.username} />
      <div className="flex flex-1 justify-center px-4 py-10">
        <section className="w-full max-w-5xl">
          <div className="mb-6">
            <h2 className="text-3xl font-bold">Browse Availability</h2>
            <p className="mt-1 text-sm text-gray-300">
              Browse every other user. Slots that overlap your saved
              availability are highlighted.
            </p>
          </div>

          {mySlots.length === 0 ? (
            <div className="mb-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
              Save your availability first to light up overlapping slots.
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm text-emerald-100">
              Found {overlapTotal} overlapping slot
              {overlapTotal === 1 ? "" : "s"} across {users.length} user
              {users.length === 1 ? "" : "s"}.
            </div>
          )}

          <BrowseAvailabilityList users={users} />
        </section>
      </div>
    </main>
  );
}
