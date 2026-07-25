"use client";

import { useState } from "react";

type SleeperLeague = {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
  status: string;
};

export default function Home() {
  const [leagueId, setLeagueId] = useState("");
  const [league, setLeague] = useState<SleeperLeague | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function analyzeLeague() {
    const trimmedLeagueId = leagueId.trim();

    if (!trimmedLeagueId) {
      setError("Please enter a Sleeper League ID.");
      setLeague(null);
      return;
    }

    setIsLoading(true);
    setError("");
    setLeague(null);

    try {
      const response = await fetch(
        `https://api.sleeper.app/v1/league/${trimmedLeagueId}`
      );

      if (!response.ok) {
        throw new Error("League not found.");
      }

      const data: SleeperLeague | null = await response.json();

      if (!data?.league_id) {
        throw new Error("League not found.");
      }

      setLeague(data);
    } catch {
      setError(
        "We could not find that league. Check the League ID and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
      <section className="w-full max-w-xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Dynasty Fantasy Football Analytics
        </p>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Dynasty Blueprint
        </h1>

        <p className="mt-6 text-lg text-slate-300">
          Build your dynasty. Win your league.
        </p>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <label
            htmlFor="league-id"
            className="mb-3 block text-left text-sm font-medium text-slate-200"
          >
            Sleeper League ID
          </label>

          <input suppressHydrationWarning
            id="league-id"
            type="text"
            inputMode="numeric"
            value={leagueId}
            onChange={(event) => setLeagueId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                analyzeLeague();
              }
            }}
            placeholder="Enter your Sleeper League ID"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400"
          />

          <button
            type="button"
            onClick={analyzeLeague}
            disabled={isLoading}
            className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Analyzing League..." : "Analyze League"}
          </button>

          {error && (
            <p className="mt-4 text-left text-sm text-red-400">{error}</p>
          )}
        </div>

        {league && (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-slate-900 p-6 text-left">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
              League found
            </p>

            <h2 className="mt-2 text-2xl font-bold">{league.name}</h2>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-400">Season</p>
                <p className="mt-1 font-semibold">{league.season}</p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-400">Teams</p>
                <p className="mt-1 font-semibold">{league.total_rosters}</p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-400">Status</p>
                <p className="mt-1 capitalize font-semibold">
                  {league.status}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="mt-6 text-sm text-slate-500">
          Power rankings, predicted standings, and championship odds.
        </p>
      </section>
    </main>
  );
}