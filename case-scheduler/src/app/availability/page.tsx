import { getSession } from "~/server/auth";
import { redirect } from "next/navigation";
import { AvailabilityGrid } from "./availability-grid";
import { db } from "~/server/db";
import { AppHeader } from "../_components/app-header";

export default async function AvailabilityPage() {
  const session = await getSession();

  if (!session?.username) {
    redirect("/");
  }

  const savedSlots = await db.availability.findMany({
    where: { userId: session.userId },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
    select: {
      day: true,
      startTime: true,
      endTime: true,
    },
  });

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#172554] via-[#111827] to-[#052e2b] text-white">
      <AppHeader activePage="availability" username={session.username} />
      <div className="flex flex-1 justify-center px-4 py-10">
        <AvailabilityGrid
          savedSlots={savedSlots.map((slot) => ({
            day: slot.day.toISOString().slice(0, 10),
            startTime: slot.startTime,
            endTime: slot.endTime,
          }))}
        />
      </div>
    </main>
  );
}
