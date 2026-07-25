"use client";

import { useState } from "react";
import TeamCard from "./components/TeamCard";

type SleeperLeague = {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
  status: string;
};

type SleeperUser = {
  user_id: string;
  display_name: string;
  metadata?: {
    team_name?: string;
  };
};

type SleeperRoster = {
  roster_id: number;
  owner_id: string | null;
  players: string[] | null;
  settings?: {
    wins?: number;
    losses?: number;
    ties?: number;
  };
};

type SleeperPlayer = {
  player_id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string | null;
};

type TeamPlayer = {
  playerId: string;
  name: string;
  position: string;
  nflTeam: string | null;
};

type LeagueTeam = {
  rosterId: number;
  teamName: string;
  managerName: string;
  playerCount: number;
  wins: number;
  losses: number;
  ties: number;
  players: TeamPlayer[];
};

export default function Home() {
  const [leagueId, setLeagueId] = useState("");
  const [league, setLeague] = useState<SleeperLeague | null>(null);
  const [teams, setTeams] = useState<LeagueTeam[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function analyzeLeague() {
    const trimmedLeagueId = leagueId.trim();

    if (!trimmedLeagueId) {
      setError("Please enter a Sleeper League ID.");
      setLeague(null);
      setTeams([]);
      return;
    }

    setIsLoading(true);
    setError("");
    setLeague(null);
    setTeams([]);

    try {
      const leagueResponse = await fetch(
        `https://api.sleeper.app/v1/league/${trimmedLeagueId}`
      );

      if (!leagueResponse.ok) {
        throw new Error("League not found.");
      }

      const leagueData: SleeperLeague | null =
        await leagueResponse.json();

      if (!leagueData?.league_id) {
        throw new Error("League not found.");
      }

      const [usersResponse, rostersResponse, playersResponse] =
        await Promise.all([
          fetch(
            `https://api.sleeper.app/v1/league/${trimmedLeagueId}/users`
          ),
          fetch(
            `https://api.sleeper.app/v1/league/${trimmedLeagueId}/rosters`
          ),
          fetch("/api/players"),
        ]);

      if (
        !usersResponse.ok ||
        !rostersResponse.ok ||
        !playersResponse.ok
      ) {
        throw new Error("League data could not be loaded.");
      }

      const users: SleeperUser[] = await usersResponse.json();
      const rosters: SleeperRoster[] =
        await rostersResponse.json();
      const playerDatabase: Record<string, SleeperPlayer> =
        await playersResponse.json();

      const usersById = new Map(
        users.map((user) => [user.user_id, user])
      );

      const leagueTeams: LeagueTeam[] = rosters
        .map((roster) => {
          const owner = roster.owner_id
            ? usersById.get(roster.owner_id)
            : undefined;

          const managerName =
            owner?.display_name ?? "Unassigned Manager";

          const teamName =
            owner?.metadata?.team_name?.trim() ||
            managerName ||
            `Roster ${roster.roster_id}`;

          const rosterPlayers: TeamPlayer[] = (
            roster.players ?? []
          ).map((playerId) => {
            const player = playerDatabase[playerId];

            const fallbackName = [
              player?.first_name,
              player?.last_name,
            ]
              .filter(Boolean)
              .join(" ");

            return {
              playerId,
              name:
                player?.full_name ||
                fallbackName ||
                `Unknown Player (${playerId})`,
              position: player?.position ?? "N/A",
              nflTeam: player?.team ?? null,
            };
          });

          return {
            rosterId: roster.roster_id,
            teamName,
            managerName,
            playerCount: rosterPlayers.length,
            wins: roster.settings?.wins ?? 0,
            losses: roster.settings?.losses ?? 0,
            ties: roster.settings?.ties ?? 0,
            players: rosterPlayers,
          };
        })
        .sort((a, b) => a.rosterId - b.rosterId);

      setLeague(leagueData);
      setTeams(leagueTeams);
    } catch {
      setError(
        "We could not load that league. Check the League ID and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-6xl text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Dynasty Fantasy Football Analytics
        </p>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Dynasty Blueprint
        </h1>

        <p className="mt-6 text-lg text-slate-300">
          Build your dynasty. Win your league.
        </p>

        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <label
            htmlFor="league-id"
            className="mb-3 block text-left text-sm font-medium text-slate-200"
          >
            Sleeper League ID
          </label>

          <input
            suppressHydrationWarning
            id="league-id"
            type="text"
            inputMode="numeric"
            value={leagueId}
            onChange={(event) =>
              setLeagueId(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void analyzeLeague();
              }
            }}
            placeholder="Enter your Sleeper League ID"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-emerald-400"
          />

          <button
            type="button"
            onClick={() => void analyzeLeague()}
            disabled={isLoading}
            className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Loading League and Rosters..."
              : "Analyze League"}
          </button>

          {error && (
            <p className="mt-4 text-left text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {league && (
          <>
            <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-emerald-400/30 bg-slate-900 p-6 text-left">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                League found
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {league.name}
              </h2>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-950 p-3">
                  <p className="text-xs text-slate-400">
                    Season
                  </p>
                  <p className="mt-1 font-semibold">
                    {league.season}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-3">
                  <p className="text-xs text-slate-400">
                    Teams
                  </p>
                  <p className="mt-1 font-semibold">
                    {league.total_rosters}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-3">
                  <p className="text-xs text-slate-400">
                    Status
                  </p>
                  <p className="mt-1 font-semibold capitalize">
                    {league.status.replaceAll("_", " ")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 text-left">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                    League Rosters
                  </p>

                  <h2 className="mt-2 text-3xl font-bold">
                    {teams.length} teams imported
                  </h2>
                </div>

                <p className="text-sm text-slate-400">
                  Live roster and player data from Sleeper
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                  <TeamCard
                    key={team.rosterId}
                    rosterId={team.rosterId}
                    teamName={team.teamName}
                    managerName={team.managerName}
                    playerCount={team.playerCount}
                    wins={team.wins}
                    losses={team.losses}
                    ties={team.ties}
                    players={team.players}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <p className="mt-10 text-sm text-slate-500">
          Power rankings, predicted standings, and championship
          odds.
        </p>
      </section>
    </main>
  );
}