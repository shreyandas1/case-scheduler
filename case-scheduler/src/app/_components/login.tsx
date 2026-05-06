"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function getErrorMessage(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return "Login failed";
}

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useExisting, setUseExisting] = useState(true);
  const [existingUsernames, setExistingUsernames] = useState<string[]>([]);
  const [usernameFetchError, setUsernameFetchError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUsernames = async () => {
      try {
        const response = await fetch("/api/auth/usernames");
        if (response.ok) {
          const data = await response.json() as { usernames?: string[] };
          if (data.usernames && Array.isArray(data.usernames)) {
            setExistingUsernames(data.usernames);
            if (data.usernames.length > 0) {
              setUsername(data.usernames[0] ?? "");
            }
          }
        } else {
          setUsernameFetchError("Could not load existing usernames");
        }
      } catch (err) {
        setUsernameFetchError("Failed to fetch usernames");
      }
    };

    fetchUsernames();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const data: unknown = await response.json();
        throw new Error(getErrorMessage(data));
      }

      router.push("/availability");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Login Method
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-white">
            <input
              type="radio"
              checked={useExisting}
              onChange={() => {
                setUseExisting(true);
                if (existingUsernames.length > 0) {
                  setUsername(existingUsernames[0]);
                }
                setError(null);
              }}
              disabled={isLoading || existingUsernames.length === 0}
              className="cursor-pointer"
            />
            <span>Existing User</span>
          </label>
          <label className="flex items-center gap-2 text-white">
            <input
              type="radio"
              checked={!useExisting}
              onChange={() => {
                setUseExisting(false);
                setUsername("");
                setError(null);
              }}
              disabled={isLoading}
              className="cursor-pointer"
            />
            <span>New User</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        {useExisting ? (
          <>
            <label htmlFor="existing-user" className="block text-sm font-medium text-white">
              Select Username
            </label>
            <select
              id="existing-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading || existingUsernames.length === 0}
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none disabled:opacity-50"
            >
              {existingUsernames.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
            {existingUsernames.length === 0 && (
              <p className="text-sm text-gray-400">No existing users. Try creating a new user.</p>
            )}
            {usernameFetchError && (
              <p className="text-sm text-yellow-400">{usernameFetchError}</p>
            )}
          </>
        ) : (
          <>
            <label htmlFor="new-user" className="block text-sm font-medium text-white">
              Enter Username
            </label>
            <input
              id="new-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none disabled:opacity-50"
              placeholder="Enter your username"
            />
          </>
        )}
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <button
        type="submit"
        disabled={!username || isLoading}
        className="w-full rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
