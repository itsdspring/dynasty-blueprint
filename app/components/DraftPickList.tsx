import type { DraftPick } from "../../lib/types";

function getRoundLabel(round: number) {
  if (round === 1) return "1st";
  if (round === 2) return "2nd";
  if (round === 3) return "3rd";

  return `${round}th`;
}

export default function DraftPickList({
  picks,
  teamNamesByRosterId,
}: {
  picks: DraftPick[];
  teamNamesByRosterId: Map<number, string>;
}) {
  const picksBySeason = new Map<
    string,
    DraftPick[]
  >();

  for (const pick of picks) {
    const seasonPicks =
      picksBySeason.get(pick.season) ?? [];

    seasonPicks.push(pick);

    picksBySeason.set(
      pick.season,
      seasonPicks
    );
  }

  return (
    <details className="mt-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <summary className="cursor-pointer font-semibold text-emerald-400">
        Draft Capital ({picks.length} picks)
      </summary>

      <div className="mt-4 space-y-5">
        {[...picksBySeason.entries()].map(
          ([season, seasonPicks]) => (
            <div key={season}>
              <p className="text-sm font-bold">
                {season} Picks
              </p>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {seasonPicks.map((pick) => {
                  const wasAcquired =
                    pick.originalRosterId !==
                    pick.currentOwnerRosterId;

                  const originalTeamName =
                    teamNamesByRosterId.get(
                      pick.originalRosterId
                    ) ??
                    `Roster ${pick.originalRosterId}`;

                  return (
                    <div
                      key={
                        `${pick.season}-` +
                        `${pick.round}-` +
                        `${pick.originalRosterId}`
                      }
                      className="rounded-xl bg-slate-950 px-3 py-2"
                    >
                      <p className="font-semibold">
                        {getRoundLabel(
                          pick.round
                        )}{" "}
                        Round
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {wasAcquired
                          ? `Originally ${originalTeamName}`
                          : "Original team pick"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>
    </details>
  );
}