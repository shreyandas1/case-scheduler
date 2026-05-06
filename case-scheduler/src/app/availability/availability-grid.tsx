"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_TIME_ZONE,
  getTimeZoneAbbreviation,
  useStoredTimeZone,
} from "../_components/timezone-selector";

type SavedSlot = {
  day: string;
  startTime: string;
  endTime: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type Toast = {
  type: "success" | "error";
  text: string;
};

const START_HOUR = 0;
const END_HOUR = 24;
const DAYS_IN_WEEK = 7;

function padTime(value: number) {
  return value.toString().padStart(2, "0");
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(date.getUTCDate() + days);
  return next;
}

function getZonedDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(getPart("year")),
    month: Number(getPart("month")),
    day: Number(getPart("day")),
  };
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

function getDateKey(date: Date, timeZone: string) {
  const { year, month, day } = getZonedDateParts(date, timeZone);

  return `${year}-${padTime(month)}-${padTime(day)}`;
}

function getTimeKey(date: Date, timeZone: string) {
  const { hour, minute } = getZonedDateTimeParts(date, timeZone);

  return `${padTime(hour)}:${padTime(minute)}`;
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

function getPacificSlotKey(
  displayDay: string,
  displayTime: string,
  timeZone: string,
) {
  const instant = getDateFromZonedTime(displayDay, displayTime, timeZone);

  return getSlotKey(
    getDateKey(instant, DEFAULT_TIME_ZONE),
    getTimeKey(instant, DEFAULT_TIME_ZONE),
  );
}

function getTodayInTimeZone(timeZone: string) {
  const { year, month, day } = getZonedDateParts(new Date(), timeZone);

  return new Date(Date.UTC(year, month - 1, day, 12));
}

function getTimeSlots() {
  const slots: string[] = [];

  for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
    slots.push(`${padTime(hour)}:00`);
    slots.push(`${padTime(hour)}:30`);
  }

  return slots;
}

function getEndTime(startTime: string) {
  const [hourValue, minuteValue] = startTime.split(":");
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const endMinute = minute + 30;

  if (endMinute === 60) {
    return `${padTime(hour + 1)}:00`;
  }

  return `${padTime(hour)}:${padTime(endMinute)}`;
}

function getSlotKey(day: string, startTime: string) {
  return `${day}|${startTime}`;
}

function getDisplayTime(time: string) {
  const [hourValue, minute] = time.split(":");
  const hour = Number(hourValue);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

function getInitialSelection(savedSlots: SavedSlot[]) {
  return new Set(
    savedSlots.map((slot) => getSlotKey(slot.day, slot.startTime)),
  );
}

export function AvailabilityGrid({
  savedSlots,
}: {
  savedSlots: SavedSlot[];
}) {
  const [timeZone] = useStoredTimeZone();
  const [weekOffset, setWeekOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const days = useMemo(
    () => {
      const today = getTodayInTimeZone(timeZone);
      const weekStart = addDays(
        today,
        -today.getUTCDay() + weekOffset * DAYS_IN_WEEK,
      );

      return Array.from({ length: DAYS_IN_WEEK }, (_, index) => {
        const date = addDays(weekStart, index);
        return {
          key: getDateKey(date, timeZone),
          weekday: new Intl.DateTimeFormat(undefined, {
            timeZone,
            weekday: "short",
          }).format(date),
          label: new Intl.DateTimeFormat(undefined, {
            timeZone,
            month: "short",
            day: "numeric",
          }).format(date),
          week: new Intl.DateTimeFormat(undefined, {
            timeZone,
            month: "short",
            day: "numeric",
          }).format(weekStart),
          isWeekStart: index === 0 || date.getUTCDay() === 0,
        };
      });
    },
    [timeZone, weekOffset],
  );
  const visibleWeekLabel = days[0]?.week ?? "";
  const timeSlots = useMemo(() => getTimeSlots(), []);
  const displayDays = useMemo(
    () => (isMobile ? days.slice(0, 5) : days),
    [days, isMobile],
  );
  const displayTimeSlots = useMemo(
    () => (isMobile ? timeSlots : timeSlots),
    [timeSlots, isMobile],
  );
  const timeZoneAbbreviation = useMemo(
    () => getTimeZoneAbbreviation(timeZone),
    [timeZone],
  );
  const [selectedSlots, setSelectedSlots] = useState(() =>
    getInitialSelection(savedSlots),
  );
  const [paintMode, setPaintMode] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activePointerId, setActivePointerId] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  const selectedCount = selectedSlots.size;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  function setSlot(
    slotKey: string,
    shouldSelect: boolean,
    clearSaveState = false,
  ) {
    setSelectedSlots((current) => {
      const alreadySelected = current.has(slotKey);
      if (shouldSelect === alreadySelected) {
        return current;
      }

      const next = new Set(current);
      if (shouldSelect) {
        next.add(slotKey);
      } else {
        next.delete(slotKey);
      }

      return next;
    });

    if (clearSaveState) {
      setSaveState("idle");
      setMessage("");
    }
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    slotKey: string,
  ) {
    event.preventDefault();
    const shouldSelect = !selectedSlots.has(slotKey);
    setPaintMode(shouldSelect);
    setIsDragging(true);
    setActivePointerId(event.pointerId);
    event.currentTarget.setPointerCapture(event.pointerId);
    setSlot(slotKey, shouldSelect, true);
  }

  function handlePointerEnter(slotKey: string) {
    if (paintMode === null || !isDragging) {
      return;
    }

    setSlot(slotKey, paintMode);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (paintMode === null || !isDragging || activePointerId !== e.pointerId) {
      return;
    }

    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element) return;

    const button = element.closest("button[data-slot-key]");
    if (!button) return;

    const slotKey = button.getAttribute("data-slot-key");
    if (slotKey) {
      setSlot(slotKey, paintMode);
    }
  }

  function handlePointerUp() {
    setPaintMode(null);
    setIsDragging(false);
    setActivePointerId(null);
  }


  async function handleSubmit() {
    const slots = Array.from(selectedSlots)
      .map((key) => {
        const [day, startTime] = key.split("|");

        if (!day || !startTime) {
          return null;
        }

        return {
          day,
          startTime,
          endTime: getEndTime(startTime),
        };
      })
      .filter((slot): slot is SavedSlot => slot !== null)
      .sort((first, second) =>
        `${first.day} ${first.startTime}`.localeCompare(
          `${second.day} ${second.startTime}`,
        ),
      );

    setSaveState("saving");
    setMessage("");

    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slots }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      setSaveState("saved");
      const saveMessage = `Saved ${slots.length} time slot${slots.length === 1 ? "" : "s"} in ${timeZoneAbbreviation}.`;
      setMessage(saveMessage);
      setToast({ type: "success", text: saveMessage });
    } catch {
      const errorMessage = "Could not save availability. Please try again.";
      setSaveState("error");
      setMessage(errorMessage);
      setToast({ type: "error", text: errorMessage });
    }
  }

  return (
    <section className="w-full max-w-7xl min-w-0">
      {toast ? (
        <div className="fixed right-4 top-4 z-50 max-w-sm" role="status">
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-medium shadow-2xl shadow-black/30 ${
              toast.type === "success"
                ? "border-emerald-300/40 bg-emerald-500 text-slate-950"
                : "border-rose-300/40 bg-rose-500 text-white"
            }`}
          >
            {toast.text}
          </div>
        </div>
      ) : null}
      <div className="mb-4 flex flex-col gap-3 text-white lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Your Availability</h2>
          <p className="mt-1 text-sm text-gray-300">
            Drag across half-hour blocks to add or remove available times in{" "}
            {timeZoneAbbreviation}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
        
          <div className="flex items-center overflow-hidden rounded-md border border-white/15 bg-slate-950">
            <button
              type="button"
              onClick={() => {
                setWeekOffset((current) => current - 1);
                setSaveState("idle");
                setMessage("");
              }}
              className="px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-300"
              aria-label="Previous week"
            >
              {"<"}
            </button>
            <div className="min-w-32 border-x border-white/15 px-3 py-2 text-center text-sm font-medium text-gray-200">
              Week of {visibleWeekLabel}
            </div>
            <button
              type="button"
              onClick={() => {
                setWeekOffset((current) => current + 1);
                setSaveState("idle");
                setMessage("");
              }}
              className="px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-300"
              aria-label="Next week"
            >
              {">"}
            </button>
          </div>
          <span className="text-sm text-gray-300">
            {selectedCount} selected
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saveState === "saving"}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700 disabled:text-emerald-100"
          >
            {saveState === "saving" ? "Saving..." : "Save Times"}
          </button>
        </div>
      </div>

      <div
        className="max-w-full max-h-[calc(100vh-250px)] overflow-x-auto overflow-y-auto rounded-lg border border-white/15 bg-slate-950/40 shadow-2xl shadow-black/25 touch-none"
        onPointerLeave={() => setPaintMode(null)}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <table className="w-full min-w-0 md:min-w-[720px] table-fixed select-none border-separate border-spacing-0 h-full">
          <colgroup>
            <col className="w-16 md:w-24" />
            {displayDays.map((day) => (
              <col key={day.key} className="w-[80px] md:w-[104px]" />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 h-8 md:h-12 border-b border-r border-white/15 bg-slate-950/95 px-2 md:px-3 text-left text-[10px] md:text-xs font-semibold uppercase text-gray-300"
              >
                Time
              </th>
              {displayDays.map((day) => (
                <th
                  key={day.key}
                  scope="col"
                  className="h-12 md:h-16 border-b border-r border-white/10 bg-slate-950/80 px-1 md:px-2 text-center"
                >
                  <div className="flex h-full flex-col items-center justify-center gap-0.5">
                    {day.isWeekStart ? (
                      <div className="text-[9px] font-semibold uppercase text-emerald-300">
                        Week of {day.week}
                      </div>
                    ) : null}
                    <div className="text-[10px] md:text-sm font-semibold text-white">
                      {day.weekday}
                    </div>
                    <div className="text-[9px] md:text-xs font-medium text-gray-300">
                      {day.label}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayTimeSlots.map((slot) => (
              <tr key={slot} className="h-7 md:h-9">
                <th
                  scope="row"
                  className="sticky left-0 z-10 h-7 md:h-9 border-b border-r border-white/15 bg-slate-950/95 px-1 md:px-2 text-center text-[10px] md:text-xs font-medium text-gray-300"
                >
                  {getDisplayTime(slot)}
                </th>
                {displayDays.map((day) => {
                  const key = getPacificSlotKey(day.key, slot, timeZone);
                  const isSelected = selectedSlots.has(key);

                  return (
                    <td
                      key={key}
                      className="h-10 border-b border-r border-white/10 p-0"
                    >
                      <button
                        type="button"
                        data-slot-key={key}
                        aria-pressed={isSelected}
                        aria-label={`${day.weekday} ${day.label} at ${getDisplayTime(slot)} ${timeZoneAbbreviation}`}
                        onPointerDown={(e) => handlePointerDown(e, key)}
                        onPointerEnter={() => handlePointerEnter(key)}
                        className={`block h-full min-h-10 w-full touch-none transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-200 ${
                          isSelected
                            ? "bg-emerald-400 hover:bg-emerald-300"
                            : "bg-white/[0.03] hover:bg-cyan-400/40"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 min-h-6 text-sm">
        {message ? (
          <p
            className={
              saveState === "error" ? "text-rose-300" : "text-emerald-300"
            }
            role="status"
          >
            {message}
          </p>
        ) : (
          <p className="text-gray-400">
            Hover previews a block; drag to paint a stretch of available time.
          </p>
        )}
      </div>
    </section>
  );
}
