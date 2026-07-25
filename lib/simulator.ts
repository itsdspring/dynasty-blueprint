import type { LeagueTeam } from "./types";

import type {
  ScheduleGame,
  TeamSimulationResult,
} from "./simulationTypes";

function getWinProbability(
  teamOneScore: number,
  teamTwoScore: number
): number {
  const scoreDifference =
    teamOneScore - teamTwoScore;

  return (
    1 /
    (1 +
      Math.exp(
        -scoreDifference / 8
      ))
  );
}

function simulateGame(
  teamOne: LeagueTeam,
  teamTwo: LeagueTeam
): number {
  const teamOneWinProbability =
    getWinProbability(
      teamOne.starterScore,
      teamTwo.starterScore
    );

  return Math.random() <
    teamOneWinProbability
    ? teamOne.rosterId
    : teamTwo.rosterId;
}

function simulatePlayoffs(
  playoffTeams: LeagueTeam[]
): number | null {
  let remainingTeams = [
    ...playoffTeams,
  ].sort(
    (teamA, teamB) =>
      teamB.starterScore -
      teamA.starterScore
  );

  while (remainingTeams.length > 1) {
    const winners: LeagueTeam[] = [];

    for (
      let leftIndex = 0,
        rightIndex =
          remainingTeams.length - 1;
      leftIndex < rightIndex;
      leftIndex += 1,
        rightIndex -= 1
    ) {
      const teamOne =
        remainingTeams[leftIndex];

      const teamTwo =
        remainingTeams[rightIndex];

      const winningRosterId =
        simulateGame(
          teamOne,
          teamTwo
        );

      const winner =
        winningRosterId ===
        teamOne.rosterId
          ? teamOne
          : teamTwo;

      winners.push(winner);
    }

    if (
      remainingTeams.length % 2 ===
      1
    ) {
      winners.push(
        remainingTeams[
          Math.floor(
            remainingTeams.length /
              2
          )
        ]
      );
    }

    remainingTeams = winners.sort(
      (teamA, teamB) =>
        teamB.starterScore -
        teamA.starterScore
    );
  }

  return (
    remainingTeams[0]?.rosterId ??
    null
  );
}

export function simulateSeason({
  teams,
  schedule,
  playoffTeamCount,
  iterations = 5000,
}: {
  teams: LeagueTeam[];
  schedule: ScheduleGame[];
  playoffTeamCount: number;
  iterations?: number;
}): TeamSimulationResult[] {
  const teamsByRosterId = new Map(
    teams.map((team) => [
      team.rosterId,
      team,
    ])
  );

  const totals = new Map<
    number,
    {
      wins: number;
      losses: number;
      playoffAppearances: number;
      championships: number;
    }
  >();

  for (const team of teams) {
    totals.set(team.rosterId, {
      wins: 0,
      losses: 0,
      playoffAppearances: 0,
      championships: 0,
    });
  }

  for (
    let iteration = 0;
    iteration < iterations;
    iteration += 1
  ) {
    const simulatedWins = new Map<
      number,
      number
    >();

    const simulatedLosses = new Map<
      number,
      number
    >();

    for (const team of teams) {
      simulatedWins.set(
        team.rosterId,
        0
      );

      simulatedLosses.set(
        team.rosterId,
        0
      );
    }

    for (const game of schedule) {
      const teamOne =
        teamsByRosterId.get(
          game.teamOneRosterId
        );

      const teamTwo =
        teamsByRosterId.get(
          game.teamTwoRosterId
        );

      if (!teamOne || !teamTwo) {
        continue;
      }

      const winningRosterId =
        simulateGame(
          teamOne,
          teamTwo
        );

      const losingRosterId =
        winningRosterId ===
        teamOne.rosterId
          ? teamTwo.rosterId
          : teamOne.rosterId;

      simulatedWins.set(
        winningRosterId,
        (simulatedWins.get(
          winningRosterId
        ) ?? 0) + 1
      );

      simulatedLosses.set(
        losingRosterId,
        (simulatedLosses.get(
          losingRosterId
        ) ?? 0) + 1
      );
    }

    const standings = [...teams].sort(
      (teamA, teamB) => {
        const winsDifference =
          (simulatedWins.get(
            teamB.rosterId
          ) ?? 0) -
          (simulatedWins.get(
            teamA.rosterId
          ) ?? 0);

        if (winsDifference !== 0) {
          return winsDifference;
        }

        return (
          teamB.starterScore -
          teamA.starterScore
        );
      }
    );

    for (const team of teams) {
      const teamTotals =
        totals.get(team.rosterId);

      if (!teamTotals) {
        continue;
      }

      teamTotals.wins +=
        simulatedWins.get(
          team.rosterId
        ) ?? 0;

      teamTotals.losses +=
        simulatedLosses.get(
          team.rosterId
        ) ?? 0;
    }

    const playoffTeams =
      standings.slice(
        0,
        playoffTeamCount
      );

    for (const playoffTeam of playoffTeams) {
      const teamTotals =
        totals.get(
          playoffTeam.rosterId
        );

      if (teamTotals) {
        teamTotals.playoffAppearances +=
          1;
      }
    }

    const championRosterId =
      simulatePlayoffs(
        playoffTeams
      );

    if (
      championRosterId !== null
    ) {
      const championTotals =
        totals.get(
          championRosterId
        );

      if (championTotals) {
        championTotals.championships +=
          1;
      }
    }
  }

  return teams
    .map((team) => {
      const teamTotals =
        totals.get(
          team.rosterId
        );

      if (!teamTotals) {
        return {
          rosterId:
            team.rosterId,
          averageWins: 0,
          averageLosses: 0,
          playoffOdds: 0,
          championshipOdds: 0,
        };
      }

      return {
        rosterId:
          team.rosterId,

        averageWins:
          Number(
            (
              teamTotals.wins /
              iterations
            ).toFixed(1)
          ),

        averageLosses:
          Number(
            (
              teamTotals.losses /
              iterations
            ).toFixed(1)
          ),

        playoffOdds:
          Number(
            (
              (teamTotals.playoffAppearances /
                iterations) *
              100
            ).toFixed(1)
          ),

        championshipOdds:
          Number(
            (
              (teamTotals.championships /
                iterations) *
              100
            ).toFixed(1)
          ),
      };
    })
    .sort(
      (resultA, resultB) =>
        resultB.championshipOdds -
        resultA.championshipOdds
    );
}