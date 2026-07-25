import type { DraftPick } from "./types";

const ROUND_VALUES: Record<number, number> = {
  1: 72,
  2: 42,
  3: 24,
  4: 12,
};

export function calculateDraftPickValue(
  pick: DraftPick,
  currentSeason: number
): number {
  const baseValue =
    ROUND_VALUES[pick.round] ?? 6;

  const yearsAway =
    Number(pick.season) - currentSeason;

  const futureDiscount =
    Math.max(0.7, 1 - yearsAway * 0.1);

  return Math.round(
    baseValue * futureDiscount
  );
}

export function calculateDraftCapitalScore(
  picks: DraftPick[],
  currentSeason: number
): number {
  if (picks.length === 0) {
    return 0;
  }

  const totalValue = picks.reduce(
    (sum, pick) =>
      sum +
      calculateDraftPickValue(
        pick,
        currentSeason
      ),
    0
  );

  return Math.min(
    100,
    Math.round(totalValue / 3)
  );
}