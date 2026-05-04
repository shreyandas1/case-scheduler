import { getSession } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function AvailabilityPage() {
  const session = await getSession();
  
  if (!session?.username) {
    redirect("/");
  }
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
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
      <div className="flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h2 className="text-3xl font-bold">Your Availability</h2>
        <p className="text-gray-300">Select your available timeslots</p>
        <p className="text-gray-400">[Availability form coming soon]</p>
      </div>
    </main>
  );
}
