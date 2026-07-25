import type {
  DraftPick,
  SleeperTradedPick,
} from "./types";

type BuildDraftPickOwnershipOptions = {
  rosterIds: number[];
  tradedPicks: SleeperTradedPick[];
  firstSeason: number;
  numberOfSeasons?: number;
  numberOfRounds?: number;
};

export function buildDraftPickOwnership({
  rosterIds,
  tradedPicks,
  firstSeason,
  numberOfSeasons = 3,
  numberOfRounds = 3,
}: BuildDraftPickOwnershipOptions): DraftPick[] {
  const picks = new Map<string, DraftPick>();

  for (
    let seasonOffset = 0;
    seasonOffset < numberOfSeasons;
    seasonOffset += 1
  ) {
    const season = String(
      firstSeason + seasonOffset
    );

    for (const originalRosterId of rosterIds) {
      for (
        let round = 1;
        round <= numberOfRounds;
        round += 1
      ) {
        const key =
          `${season}-${round}-${originalRosterId}`;

        picks.set(key, {
          season,
          round,
          originalRosterId,
          currentOwnerRosterId:
            originalRosterId,
        });
      }
    }
  }

  for (const tradedPick of tradedPicks) {
    const key =
      `${tradedPick.season}-` +
      `${tradedPick.round}-` +
      `${tradedPick.roster_id}`;

    const existingPick = picks.get(key);

    if (existingPick) {
      picks.set(key, {
        ...existingPick,
        currentOwnerRosterId:
          tradedPick.owner_id,
      });
    } else {
      picks.set(key, {
        season: tradedPick.season,
        round: tradedPick.round,
        originalRosterId:
          tradedPick.roster_id,
        currentOwnerRosterId:
          tradedPick.owner_id,
      });
    }
  }

  return [...picks.values()].sort(
    (pickA, pickB) => {
      const seasonDifference =
        Number(pickA.season) -
        Number(pickB.season);

      if (seasonDifference !== 0) {
        return seasonDifference;
      }

      const roundDifference =
        pickA.round - pickB.round;

      if (roundDifference !== 0) {
        return roundDifference;
      }

      return (
        pickA.originalRosterId -
        pickB.originalRosterId
      );
    }
  );
}