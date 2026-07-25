import type { TeamPlayer } from "./types";

const POSITION_BASE_VALUES: Record<string, number> = {
  QB: 64,
  RB: 58,
  WR: 60,
  TE: 52,
  K: 18,
  DEF: 20,
};

function getAgeAdjustment(
  position: string,
  age: number | null
): number {
  if (age === null) {
    return 0;
  }

  if (position === "QB") {
    if (age <= 25) return 12;
    if (age <= 28) return 10;
    if (age <= 31) return 6;
    if (age <= 35) return 1;

    return -8;
  }

  if (position === "RB") {
    if (age <= 22) return 14;
    if (age <= 24) return 10;
    if (age <= 26) return 5;
    if (age <= 27) return 1;
    if (age <= 29) return -8;

    return -17;
  }

  if (position === "WR") {
    if (age <= 23) return 14;
    if (age <= 26) return 10;
    if (age <= 29) return 5;
    if (age <= 31) return 0;
    if (age <= 33) return -7;

    return -14;
  }

  if (position === "TE") {
    if (age <= 24) return 10;
    if (age <= 28) return 8;
    if (age <= 31) return 3;
    if (age <= 33) return -2;

    return -9;
  }

  return 0;
}

export function calculatePlayerValue(player: {
  position?: string;
  age?: number | null;
  years_exp?: number | null;
  status?: string | null;
  injury_status?: string | null;
}): number {
  const position = player.position ?? "N/A";

  let value =
    POSITION_BASE_VALUES[position] ?? 15;

  value += getAgeAdjustment(
    position,
    player.age ?? null
  );

  if (player.years_exp === 0) {
    value += 5;
  }

  if (
    player.status?.toLowerCase() ===
    "inactive"
  ) {
    value -= 16;
  }

  if (
    player.injury_status === "Out" ||
    player.injury_status === "IR"
  ) {
    value -= 8;
  }

  return Math.max(
    1,
    Math.min(100, Math.round(value))
  );
}

function selectBestPlayer(
  availablePlayers: TeamPlayer[],
  eligiblePositions: string[]
): TeamPlayer | undefined {
  const eligiblePlayers =
    availablePlayers
      .filter((player) =>
        eligiblePositions.includes(
          player.position
        )
      )
      .sort(
        (playerA, playerB) =>
          playerB.value -
          playerA.value
      );

  const selectedPlayer =
    eligiblePlayers[0];

  if (selectedPlayer) {
    const selectedIndex =
      availablePlayers.findIndex(
        (player) =>
          player.playerId ===
          selectedPlayer.playerId
      );

    availablePlayers.splice(
      selectedIndex,
      1
    );
  }

  return selectedPlayer;
}

export function optimizeLineup(
  players: TeamPlayer[],
  rosterPositions: string[]
): TeamPlayer[] {
  const availablePlayers = [...players];

  const optimizedLineup: TeamPlayer[] =
    [];

  for (const rosterSlot of rosterPositions) {
    if (
      rosterSlot === "BN" ||
      rosterSlot === "TAXI" ||
      rosterSlot === "IR" ||
      rosterSlot === "RESERVE"
    ) {
      continue;
    }

    let eligiblePositions = [
      rosterSlot,
    ];

    if (rosterSlot === "FLEX") {
      eligiblePositions = [
        "RB",
        "WR",
        "TE",
      ];
    }

    if (rosterSlot === "WRRB_FLEX") {
      eligiblePositions = [
        "WR",
        "RB",
      ];
    }

    if (rosterSlot === "REC_FLEX") {
      eligiblePositions = [
        "WR",
        "TE",
      ];
    }

    if (rosterSlot === "SUPER_FLEX") {
      eligiblePositions = [
        "QB",
        "RB",
        "WR",
        "TE",
      ];
    }

    const selectedPlayer =
      selectBestPlayer(
        availablePlayers,
        eligiblePositions
      );

    if (selectedPlayer) {
      optimizedLineup.push(
        selectedPlayer
      );
    }
  }

  return optimizedLineup;
}

function getAverage(
  values: number[]
): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce(
    (sum, value) => sum + value,
    0
  );

  return total / values.length;
}

function getYouthValue(
  player: TeamPlayer
): number {
  if (player.age === null) {
    return 50;
  }

  if (player.position === "QB") {
    if (player.age <= 24) return 100;
    if (player.age <= 27) return 90;
    if (player.age <= 30) return 75;
    if (player.age <= 33) return 60;
    if (player.age <= 36) return 40;

    return 20;
  }

  if (player.position === "RB") {
    if (player.age <= 22) return 100;
    if (player.age <= 24) return 85;
    if (player.age <= 26) return 65;
    if (player.age <= 28) return 40;

    return 20;
  }

  if (player.position === "WR") {
    if (player.age <= 22) return 100;
    if (player.age <= 25) return 90;
    if (player.age <= 28) return 75;
    if (player.age <= 31) return 55;

    return 30;
  }

  if (player.position === "TE") {
    if (player.age <= 23) return 100;
    if (player.age <= 26) return 88;
    if (player.age <= 29) return 72;
    if (player.age <= 32) return 50;

    return 30;
  }

  return 50;
}

export function calculateTeamScores(
  players: TeamPlayer[],
  rosterPositions: string[]
) {
  const starters = optimizeLineup(
    players,
    rosterPositions
  );

  const starterPlayerIds = new Set(
    starters.map(
      (player) => player.playerId
    )
  );

  const bench = players.filter(
    (player) =>
      !starterPlayerIds.has(
        player.playerId
      )
  );

  const starterAverage = getAverage(
    starters.map(
      (player) => player.value
    )
  );

  const bestBenchPlayers = [...bench]
    .sort(
      (playerA, playerB) =>
        playerB.value -
        playerA.value
    )
    .slice(0, 8);

  const benchAverage = getAverage(
    bestBenchPlayers.map(
      (player) => player.value
    )
  );

  const mostValuablePlayers = [
    ...players,
  ]
    .sort(
      (playerA, playerB) =>
        playerB.value -
        playerA.value
    )
    .slice(0, 15);

  const teamValueAverage = getAverage(
    mostValuablePlayers.map(
      (player) => player.value
    )
  );

  const youthPlayers = players.filter(
    (player) =>
      player.position === "QB" ||
      player.position === "RB" ||
      player.position === "WR" ||
      player.position === "TE"
  );

  const youthScore = Math.round(
    getAverage(
      youthPlayers.map(getYouthValue)
    )
  );

  const starterScore = Math.round(
    starterAverage
  );

  const depthScore = Math.round(
    benchAverage
  );

  const teamValueScore = Math.round(
    teamValueAverage
  );

  const contenderScore = Math.round(
    starterScore * 0.7 +
      depthScore * 0.2 +
      teamValueScore * 0.1
  );

  const score = Math.round(
    starterScore * 0.55 +
      depthScore * 0.15 +
      teamValueScore * 0.2 +
      youthScore * 0.1
  );

  return {
    starters,
    bench,
    starterScore,
    depthScore,
    teamValueScore,
    youthScore,
    contenderScore,
    score,
  };
}