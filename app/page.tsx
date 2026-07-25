"use client";

import { useState } from "react";

import PowerRankings from "./components/PowerRankings";
import TeamBreakdown from "./components/TeamBreakdown";

import {
  calculatePlayerValue,
  calculateTeamScores,
} from "../lib/valuation";

import {
  buildDraftPickOwnership,
} from "../lib/draftPicks";

import {
  calculateDraftCapitalScore,
} from "../lib/pickValues";

import type {
  DraftPick,
  LeagueTeam,
  SleeperLeague,
  SleeperPlayer,
  SleeperRoster,
  SleeperTradedPick,
  SleeperUser,
  TeamPlayer,
} from "../lib/types";

export default function Home() {
  const [leagueId, setLeagueId] = useState("");
  const [league, setLeague] =
    useState<SleeperLeague | null>(null);
  const [teams, setTeams] =
    useState<LeagueTeam[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  async function analyzeLeague() {
    const trimmedLeagueId =
      leagueId.trim();

    if (!trimmedLeagueId) {
      setError(
        "Please enter a Sleeper League ID."
      );
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

      const leagueData: SleeperLeague =
        await leagueResponse.json();

      const [
        usersResponse,
        rostersResponse,
        playersResponse,
        tradedPicksResponse,
      ] = await Promise.all([
        fetch(
          `https://api.sleeper.app/v1/league/${trimmedLeagueId}/users`
        ),
        fetch(
          `https://api.sleeper.app/v1/league/${trimmedLeagueId}/rosters`
        ),
        fetch("/api/players"),
        fetch(
          `https://api.sleeper.app/v1/league/${trimmedLeagueId}/traded_picks`
        ),
      ]);

      if (
        !usersResponse.ok ||
        !rostersResponse.ok ||
        !playersResponse.ok ||
        !tradedPicksResponse.ok
      ) {
        throw new Error(
          "League data could not be loaded."
        );
      }

      const users: SleeperUser[] =
        await usersResponse.json();

      const rosters: SleeperRoster[] =
        await rostersResponse.json();

      const playerDatabase: Record<
        string,
        SleeperPlayer
      > = await playersResponse.json();

      const tradedPicks:
        SleeperTradedPick[] =
          await tradedPicksResponse.json();

      const usersById = new Map(
        users.map((user) => [
          user.user_id,
          user,
        ])
      );

      const rosterPositions =
        leagueData.roster_positions?.length
          ? leagueData.roster_positions
          : [
              "QB",
              "RB",
              "RB",
              "WR",
              "WR",
              "TE",
              "FLEX",
            ];

      const rosterIds = rosters.map(
        (roster) => roster.roster_id
      );

      const currentSeason =
        Number(leagueData.season);

      const firstPickSeason =
        leagueData.status === "pre_draft"
          ? currentSeason
          : currentSeason + 1;

      const allDraftPicks =
        buildDraftPickOwnership({
          rosterIds,
          tradedPicks,
          firstSeason: firstPickSeason,
          numberOfSeasons: 3,
          numberOfRounds: 3,
        });

      const leagueTeams: LeagueTeam[] =
        rosters.map((roster) => {
          const owner = roster.owner_id
            ? usersById.get(roster.owner_id)
            : undefined;

          const managerName =
            owner?.display_name ??
            "Unassigned Manager";

          const teamName =
            owner?.metadata?.team_name?.trim() ||
            managerName ||
            `Roster ${roster.roster_id}`;

          const rosterPlayers:
            TeamPlayer[] = (
              roster.players ?? []
            ).map((playerId) => {
              const player =
                playerDatabase[playerId];

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
                position:
                  player?.position ?? "N/A",
                nflTeam:
                  player?.team ?? null,
                age:
                  player?.age ?? null,
                yearsExperience:
                  player?.years_exp ?? null,
                status:
                  player?.status ?? null,
                injuryStatus:
                  player?.injury_status ??
                  null,
                value:
                  calculatePlayerValue(
                    player ?? {}
                  ),
              };
            });

          const teamScores =
            calculateTeamScores(
              rosterPlayers,
              rosterPositions
            );

          const draftPicks: DraftPick[] =
            allDraftPicks.filter(
              (pick) =>
                pick.currentOwnerRosterId ===
                roster.roster_id
            );

          const draftCapitalScore =
            calculateDraftCapitalScore(
              draftPicks,
              currentSeason
            );

          const overallBlueprintScore =
            Math.round(
              teamScores.score * 0.8 +
                draftCapitalScore * 0.2
            );

          return {
            rosterId:
              roster.roster_id,
            teamName,
            managerName,
            playerCount:
              rosterPlayers.length,
            wins:
              roster.settings?.wins ?? 0,
            losses:
              roster.settings?.losses ?? 0,
            ties:
              roster.settings?.ties ?? 0,
            players:
              rosterPlayers,
            starters:
              teamScores.starters,
            bench:
              teamScores.bench,
            draftPicks,
            score:
              overallBlueprintScore,
            starterScore:
              teamScores.starterScore,
            depthScore:
              teamScores.depthScore,
            teamValueScore:
              teamScores.teamValueScore,
            youthScore:
              teamScores.youthScore,
            contenderScore:
              teamScores.contenderScore,
            draftCapitalScore,
          };
        });

      const rankedTeams = [
        ...leagueTeams,
      ].sort(
        (teamA, teamB) =>
          teamB.score - teamA.score
      );

      setLeague(leagueData);
      setTeams(rankedTeams);
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
              setLeagueId(
                event.target.value
              )
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
            onClick={() =>
              void analyzeLeague()
            }
            disabled={isLoading}
            className="mt-4 w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Building Your Blueprint..."
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

              <p className="mt-2 text-sm text-slate-400">
                {league.season}
                {" • "}
                {league.total_rosters} teams
                {" • "}
                {league.status.replaceAll(
                  "_",
                  " "
                )}
              </p>
            </div>

            <PowerRankings
              teams={teams}
            />

            <TeamBreakdown
              teams={teams}
            />
          </>
        )}

        <p className="mt-12 text-sm text-slate-500">
          Prototype values currently use
          position, age, experience, roster
          format, depth, and future draft picks.
        </p>
      </section>
    </main>
  );
}