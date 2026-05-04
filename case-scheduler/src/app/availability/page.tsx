import { getSession } from "~/server/auth";
import { redirect } from "next/navigation";
import { AvailabilityGrid } from "./availability-grid";
import { db } from "~/server/db";

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
      <nav className="border-b border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Case Scheduler</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Welcome, {session.username}!</span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>
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
