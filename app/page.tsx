"use client";

import { useState } from "react";

import TeamCard from "./components/TeamCard";
import DraftPickList from "./components/DraftPickList";

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
    const trimmedLeagueId = leagueId.trim();

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

      if (!leagueData?.league_id) {
        throw new Error("League not found.");
      }

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

      /*
       * This uses the actual Sleeper lineup format.
       *
       * If your league has:
       * - 2 FLEX spots
       * - Superflex
       * - extra WR or RB spots
       *
       * each lineup slot appears separately in this array.
       */
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

      const currentSeason = Number(
        leagueData.season
      );

      /*
       * During the regular season, start draft-pick
       * inventory with next year's draft.
       *
       * Before a league drafts, include the current
       * season's draft picks.
       */
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

          /*
           * The lineup optimizer reads every starting
           * slot supplied by Sleeper.
           *
           * Two FLEX entries means it fills two FLEX
           * players.
           */
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

          /*
           * Temporary Blueprint Score:
           *
           * 75% roster strength
           * 25% draft capital
           *
           * We will replace the player model later
           * with real projections and market values.
           */
          const blueprintScore = Math.round(
            teamScores.score * 0.75 +
              draftCapitalScore * 0.25
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

            score:
              blueprintScore,

            starterScore:
              teamScores.starterScore,

            depthScore:
              teamScores.depthScore,

            draftPicks,
          };
        });

      const rankedTeams = [...leagueTeams].sort(
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

  function getGrade(score: number) {
    if (score >= 75) return "A+";
    if (score >= 70) return "A";
    if (score >= 65) return "B+";
    if (score >= 60) return "B";
    if (score >= 55) return "C+";
    if (score >= 50) return "C";
    if (score >= 45) return "D";

    return "F";
  }

  const teamNamesByRosterId = new Map(
    teams.map((team) => [
      team.rosterId,
      team.teamName,
    ])
  );

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

            <section className="mt-12 text-left">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                Power Rankings
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Blueprint Scores
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Rankings include optimized
                starting-lineup strength,
                roster depth and draft capital.
              </p>

              <div className="mt-6 space-y-3">
                {teams.map(
                  (team, index) => {
                    const draftCapitalScore =
                      calculateDraftCapitalScore(
                        team.draftPicks,
                        Number(
                          league.season
                        )
                      );

                    return (
                      <div
                        key={
                          team.rosterId
                        }
                        className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5"
                      >
                        <div className="text-2xl font-bold text-emerald-400">
                          #{index + 1}
                        </div>

                        <div>
                          <h3 className="font-bold">
                            {
                              team.teamName
                            }
                          </h3>

                          <p className="mt-1 text-sm text-slate-400">
                            {
                              team.managerName
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Starters{" "}
                            {
                              team.starterScore
                            }
                            {" • "}
                            Depth{" "}
                            {
                              team.depthScore
                            }
                            {" • "}
                            Picks{" "}
                            {
                              draftCapitalScore
                            }
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {team.score}
                          </p>

                          <p className="text-sm font-semibold text-emerald-400">
                            {getGrade(
                              team.score
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            <section className="mt-12 text-left">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                Team Blueprints
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                Rosters and Draft Capital
              </h2>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {teams.map(
                  (team, index) => {
                    const draftCapitalScore =
                      calculateDraftCapitalScore(
                        team.draftPicks,
                        Number(
                          league.season
                        )
                      );

                    return (
                      <div
                        key={
                          team.rosterId
                        }
                      >
                        <div className="mb-3 grid grid-cols-5 gap-2">
                          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                            <p className="text-xs text-slate-400">
                              Rank
                            </p>

                            <p className="mt-1 font-bold text-emerald-400">
                              #{index + 1}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                            <p className="text-xs text-slate-400">
                              Blueprint
                            </p>

                            <p className="mt-1 font-bold">
                              {
                                team.score
                              }
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                            <p className="text-xs text-slate-400">
                              Starters
                            </p>

                            <p className="mt-1 font-bold">
                              {
                                team.starterScore
                              }
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                            <p className="text-xs text-slate-400">
                              Depth
                            </p>

                            <p className="mt-1 font-bold">
                              {
                                team.depthScore
                              }
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                            <p className="text-xs text-slate-400">
                              Picks
                            </p>

                            <p className="mt-1 font-bold">
                              {
                                draftCapitalScore
                              }
                            </p>
                          </div>
                        </div>

                        <TeamCard
                          rosterId={
                            team.rosterId
                          }
                          teamName={
                            team.teamName
                          }
                          managerName={
                            team.managerName
                          }
                          playerCount={
                            team.playerCount
                          }
                          wins={
                            team.wins
                          }
                          losses={
                            team.losses
                          }
                          ties={
                            team.ties
                          }
                          players={
                            team.players
                          }
                        />

                        <DraftPickList
                          picks={
                            team.draftPicks
                          }
                          teamNamesByRosterId={
                            teamNamesByRosterId
                          }
                        />
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          </>
        )}

        <p className="mt-12 text-sm text-slate-500">
          This is a prototype valuation model.
          Weekly projections, bye weeks,
          injuries and true dynasty market
          values still need to be added.
        </p>
      </section>
    </main>
  );
}