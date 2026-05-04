"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_TIME_ZONE,
  getTimeZoneAbbreviation,
  useStoredTimeZone,
} from "../_components/timezone-selector";

type DisplaySlot = {
  day: string;
  startTime: string;
  endTime: string;
  isOverlap: boolean;
};

type BrowseUser = {
  id: string;
  name: string;
  email: string;
  availability: DisplaySlot[];
  overlapCount: number;
};

function getSlotKey(slot: Pick<DisplaySlot, "day" | "startTime">) {
  return `${slot.day}|${slot.startTime}`;
}

function padTime(value: number) {
  return value.toString().padStart(2, "0");
}

function getDisplayTime(time: string) {
  const [hourValue, minute] = time.split(":");
  const hour = Number(hourValue);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

function getZonedDateTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(getPart("year")),
    month: Number(getPart("month")),
    day: Number(getPart("day")),
    hour: Number(getPart("hour")),
    minute: Number(getPart("minute")),
  };
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const parts = getZonedDateTimeParts(date, timeZone);
  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );

  return zonedAsUtc - date.getTime();
}

function getDateFromZonedTime(day: string, time: string, timeZone: string) {
  const [yearValue, monthValue, dayValue] = day.split("-");
  const [hourValue, minuteValue] = time.split(":");
  const year = Number(yearValue);
  const month = Number(monthValue);
  const date = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const utcGuess = Date.UTC(year, month - 1, date, hour, minute);
  const firstOffset = getTimeZoneOffset(new Date(utcGuess), timeZone);
  const firstInstant = new Date(utcGuess - firstOffset);
  const secondOffset = getTimeZoneOffset(firstInstant, timeZone);

  return new Date(utcGuess - secondOffset);
}

function getDateKey(date: Date, timeZone: string) {
  const parts = getZonedDateTimeParts(date, timeZone);

  return `${parts.year}-${padTime(parts.month)}-${padTime(parts.day)}`;
}

function getTimeKey(date: Date, timeZone: string) {
  const parts = getZonedDateTimeParts(date, timeZone);

  return `${padTime(parts.hour)}:${padTime(parts.minute)}`;
}

function getDisplayDate(day: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00.000Z`));
}

function getDisplaySlots(slots: DisplaySlot[], timeZone: string) {
  return slots
    .map((slot) => {
      const instant = getDateFromZonedTime(
        slot.day,
        slot.startTime,
        DEFAULT_TIME_ZONE,
      );

      return {
        ...slot,
        day: getDateKey(instant, timeZone),
        startTime: getTimeKey(instant, timeZone),
      };
    })
    .sort((first, second) =>
      `${first.day} ${first.startTime}`.localeCompare(
        `${second.day} ${second.startTime}`,
      ),
    );
}

function MiniAvailabilityGrid({
  slots,
  timeZone,
}: {
  slots: DisplaySlot[];
  timeZone: string;
}) {
  const displaySlots = useMemo(
    () => getDisplaySlots(slots, timeZone),
    [slots, timeZone],
  );
  const dates = Array.from(new Set(displaySlots.map((slot) => slot.day))).sort();
  const times = Array.from(
    new Set(displaySlots.map((slot) => slot.startTime)),
  ).sort();
  const slotLookup = new Map(
    displaySlots.map((slot) => [getSlotKey(slot), slot]),
  );

  return (
    <div className="mt-4 max-h-80 max-w-full overflow-auto rounded-lg border border-white/10 bg-slate-950/35">
      <table className="w-full min-w-[560px] table-fixed border-separate border-spacing-0 text-xs">
        <colgroup>
          <col className="w-20" />
          {dates.map((date) => (
            <col key={date} className="w-24" />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-20 border-b border-r border-white/10 bg-slate-950 px-2 py-2 text-left font-semibold uppercase text-gray-400">
              Time
            </th>
            {dates.map((date) => (
              <th
                key={date}
                className="sticky top-0 z-10 border-b border-r border-white/10 bg-slate-950 px-2 py-2 text-center font-semibold text-gray-200"
              >
                {getDisplayDate(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time) => (
            <tr key={time}>
              <th className="sticky left-0 z-10 h-7 border-b border-r border-white/10 bg-slate-950 px-2 text-center font-medium text-gray-400">
                {getDisplayTime(time)}
              </th>
              {dates.map((date) => {
                const slot = slotLookup.get(`${date}|${time}`);

                return (
                  <td
                    key={`${date}|${time}`}
                    className="h-7 border-b border-r border-white/10 p-0"
                  >
                    {slot ? (
                      <div
                        className={`h-full min-h-7 w-full ${
                          slot.isOverlap
                            ? "bg-emerald-400 shadow-inner shadow-emerald-100/50"
                            : "bg-cyan-400/35"
                        }`}
                        title={`${getDisplayDate(slot.day)} ${getDisplayTime(slot.startTime)}`}
                      />
                    ) : (
                      <div className="h-full min-h-7 w-full bg-white/[0.02]" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BrowseAvailabilityList({ users }: { users: BrowseUser[] }) {
  const [search, setSearch] = useState("");
  const [timeZone] = useStoredTimeZone();
  const [collapsedUsers, setCollapsedUsers] = useState(() => new Set<string>());
  const timeZoneAbbreviation = useMemo(
    () => getTimeZoneAbbreviation(timeZone),
    [timeZone],
  );
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    );
  }, [search, users]);

  function toggleUser(userId: string) {
    setCollapsedUsers((current) => {
      const next = new Set(current);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-white/15 bg-slate-950/40 p-6 text-gray-300">
        No other users yet.
      </div>
    );
  }

  return (
    <div>
      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-medium text-gray-300">
          Search Users
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          className="w-full rounded-lg border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 hover:border-white/30 focus:border-emerald-300"
        />
      </label>
      <p className="mb-4 text-sm text-gray-400">
        Times shown in {timeZoneAbbreviation}.
      </p>

      {filteredUsers.length === 0 ? (
        <div className="rounded-lg border border-white/15 bg-slate-950/40 p-6 text-gray-300">
          No users match your search.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isCollapsed = collapsedUsers.has(user.id);

            return (
              <article
                key={user.id}
                className="rounded-lg border border-white/15 bg-slate-950/40 shadow-xl shadow-black/15"
              >
                <button
                  type="button"
                  onClick={() => toggleUser(user.id)}
                  aria-expanded={!isCollapsed}
                  className="flex w-full flex-col gap-3 p-5 text-left transition hover:bg-white/[0.03] sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-400">
                        {isCollapsed ? ">" : "v"}
                      </span>
                      <h3 className="text-lg font-semibold text-white">
                        {user.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">{user.email}</p>
                  </div>
                  <span
                    className={`w-fit rounded-md px-3 py-1 text-sm font-semibold ${
                      user.overlapCount > 0
                        ? "bg-emerald-400 text-slate-950"
                        : "bg-white/10 text-gray-300"
                    }`}
                  >
                    {user.overlapCount} overlap
                    {user.overlapCount === 1 ? "" : "s"}
                  </span>
                </button>

                {!isCollapsed ? (
                  <div className="border-t border-white/10 px-5 pb-5 pt-1">
                    {user.availability.length === 0 ? (
                      <p className="mt-4 text-sm text-gray-400">
                        No availability saved.
                      </p>
                    ) : (
                      <div>
                        <MiniAvailabilityGrid
                          slots={user.availability}
                          timeZone={timeZone}
                        />
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="flex items-center gap-2 text-gray-300">
                            <span className="h-3 w-5 rounded-sm bg-cyan-400/35" />
                            Available
                          </span>
                          <span className="flex items-center gap-2 text-gray-300">
                            <span className="h-3 w-5 rounded-sm bg-emerald-400" />
                            Overlap
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
