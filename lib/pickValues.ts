import type { DraftPick } from "./types";

const ROUND_VALUES: Record<number, number> = {
  1: 100,
  2: 45,
  3: 20,
  4: 10,
};

function getFutureDiscount(
  pickSeason: number,
  currentSeason: number
): number {
  const yearsAway = Math.max(
    1,
    pickSeason - currentSeason
  );

  if (yearsAway === 1) return 0.92;
  if (yearsAway === 2) return 0.84;
  if (yearsAway === 3) return 0.76;

  return Math.max(
    0.55,
    0.76 - (yearsAway - 3) * 0.07
  );
}

export function calculateDraftPickValue(
  pick: DraftPick,
  currentSeason: number
): number {
  const baseValue =
    ROUND_VALUES[pick.round] ?? 5;

  const futureDiscount =
    getFutureDiscount(
      Number(pick.season),
      currentSeason
    );

  return Math.round(
    baseValue * futureDiscount
  );
}

function calculateNormalPickBaseline(
  currentSeason: number
): number {
  let baseline = 0;

  for (
    let yearsAway = 1;
    yearsAway <= 3;
    yearsAway += 1
  ) {
    const season =
      currentSeason + yearsAway;

    for (
      let round = 1;
      round <= 3;
      round += 1
    ) {
      baseline += calculateDraftPickValue(
        {
          season: String(season),
          round,
          originalRosterId: 0,
          currentOwnerRosterId: 0,
        },
        currentSeason
      );
    }
  }

  return baseline;
}

export function calculateDraftCapitalScore(
  picks: DraftPick[],
  currentSeason: number
): number {
  const totalPickValue = picks.reduce(
    (sum, pick) =>
      sum +
      calculateDraftPickValue(
        pick,
        currentSeason
      ),
    0
  );

  const normalBaseline =
    calculateNormalPickBaseline(
      currentSeason
    );

  const differenceFromNormal =
    totalPickValue - normalBaseline;

  const score =
    50 + differenceFromNormal / 8;

  return Math.max(
    0,
    Math.min(100, Math.round(score))
  );
}