import Link from "next/link";
import { TimezoneSelector } from "./timezone-selector";

type AppHeaderProps = {
  activePage: "availability" | "browse";
  username: string;
};

export function AppHeader({ activePage, username }: AppHeaderProps) {
  const linkClass = (page: AppHeaderProps["activePage"]) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${
      activePage === page
        ? "bg-white/10 text-white"
        : "text-gray-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <nav className="border-b border-gray-700 px-4 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold">Case Scheduler</h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/availability" className={linkClass("availability")}>
              Availability
            </Link>
            <Link href="/browse-availability" className={linkClass("browse")}>
              Browse Availability
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <TimezoneSelector compact />
          <span className="text-gray-300">Welcome, {username}!</span>
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
  );
}
