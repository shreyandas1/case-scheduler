"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const DEFAULT_TIME_ZONE = "America/Los_Angeles";
export const TIME_ZONE_STORAGE_KEY = "caseSchedulerTimeZone:v2";
export const TIME_ZONE_CHANGE_EVENT = "caseSchedulerTimeZoneChange";
export const TIME_ZONE_OPTIONS = [
  { value: "America/Los_Angeles", label: "PDT/Pacific" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/New_York", label: "Eastern" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London" },
  { value: "Asia/Kolkata", label: "India" },
  { value: "Africa/Lagos", label: "West African Time" },
  { value: "Asia/Taipei", label: "Taipei" },
  { value: "Asia/Dubai", label: "Abu Dhabi" },

] as const;

export function isSupportedTimeZone(value: string) {
  return TIME_ZONE_OPTIONS.some((option) => option.value === value);
}

export function getTimeZoneAbbreviation(timeZone: string) {
  return (
    new Intl.DateTimeFormat(undefined, {
      timeZone,
      timeZoneName: "short",
    })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value ?? timeZone
  );
}

export function getStoredTimeZone() {
  if (typeof window === "undefined") {
    return DEFAULT_TIME_ZONE;
  }

  const storedTimeZone = window.localStorage.getItem(TIME_ZONE_STORAGE_KEY);

  return storedTimeZone && isSupportedTimeZone(storedTimeZone)
    ? storedTimeZone
    : DEFAULT_TIME_ZONE;
}

export function useStoredTimeZone() {
  const [timeZone, setTimeZone] = useState(DEFAULT_TIME_ZONE);

  useEffect(() => {
    setTimeZone(getStoredTimeZone());

    function handleTimeZoneChange(event: Event) {
      const nextTimeZone =
        event instanceof CustomEvent && typeof event.detail === "string"
          ? event.detail
          : getStoredTimeZone();

      if (isSupportedTimeZone(nextTimeZone)) {
        setTimeZone(nextTimeZone);
      }
    }

    window.addEventListener(TIME_ZONE_CHANGE_EVENT, handleTimeZoneChange);
    window.addEventListener("storage", handleTimeZoneChange);

    return () => {
      window.removeEventListener(TIME_ZONE_CHANGE_EVENT, handleTimeZoneChange);
      window.removeEventListener("storage", handleTimeZoneChange);
    };
  }, []);

  const updateTimeZone = useCallback((nextTimeZone: string) => {
    if (!isSupportedTimeZone(nextTimeZone)) {
      return;
    }

    setTimeZone(nextTimeZone);
    window.localStorage.setItem(TIME_ZONE_STORAGE_KEY, nextTimeZone);
    window.dispatchEvent(
      new CustomEvent(TIME_ZONE_CHANGE_EVENT, { detail: nextTimeZone }),
    );
  }, []);

  return [timeZone, updateTimeZone] as const;
}

export function TimezoneSelector({ compact = false }: { compact?: boolean }) {
  const [timeZone, setTimeZone] = useStoredTimeZone();
  const timeZoneAbbreviation = useMemo(
    () => getTimeZoneAbbreviation(timeZone),
    [timeZone],
  );

  return (
    <label
      className={
        compact
          ? "flex items-center gap-2 text-sm text-gray-300"
          : "block space-y-2"
      }
    >
      <span
        className={
          compact ? "text-sm font-medium text-gray-300" : "block text-sm font-medium text-white"
        }
      >
        Timezone
      </span>
      <select
        value={timeZone}
        onChange={(event) => setTimeZone(event.target.value)}
        className={
          compact
            ? "rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-sm font-medium text-white outline-none transition hover:border-white/30 focus:border-emerald-300"
            : "w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
        }
      >
        {TIME_ZONE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {compact ? null : (
        <p className="text-xs text-gray-400">
          Times display in {timeZoneAbbreviation}.
        </p>
      )}
    </label>
  );
}
