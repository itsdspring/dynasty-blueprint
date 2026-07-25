type TeamPlayer = {
  playerId: string;
  name: string;
  position: string;
  nflTeam: string | null;
};

type TeamCardProps = {
  rosterId: number;
  teamName: string;
  managerName: string;
  playerCount: number;
  wins: number;
  losses: number;
  ties: number;
  players?: TeamPlayer[];
};

const positionOrder: Record<string, number> = {
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 4,
  K: 5,
  DEF: 6,
};

export default function TeamCard({
  rosterId,
  teamName,
  managerName,
  playerCount,
  wins,
  losses,
  ties,
  players = [],
}: TeamCardProps) {
  const sortedPlayers = [...players].sort((a, b) => {
    const positionDifference =
      (positionOrder[a.position] ?? 99) -
      (positionOrder[b.position] ?? 99);

    if (positionDifference !== 0) {
      return positionDifference;
    }

    return a.name.localeCompare(b.name);
  });

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">{teamName}</h3>

          <p className="mt-1 text-sm text-slate-400">
            Manager: {managerName}
          </p>
        </div>

        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          #{rosterId}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-950 p-3">
          <p className="text-xs text-slate-400">Players</p>

          <p className="mt-1 text-lg font-semibold">{playerCount}</p>
        </div>

        <div className="rounded-xl bg-slate-950 p-3">
          <p className="text-xs text-slate-400">Record</p>

          <p className="mt-1 text-lg font-semibold">
            {wins}-{losses}
            {ties > 0 ? `-${ties}` : ""}
          </p>
        </div>
      </div>

      {sortedPlayers.length > 0 && (
        <div className="mt-5 border-t border-slate-800 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Roster
          </p>

          <div className="mt-3 space-y-2">
            {sortedPlayers.map((player) => (
              <div
                key={player.playerId}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-950 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{player.name}</p>

                  <p className="text-xs text-slate-500">
                    {player.nflTeam ?? "Free Agent"}
                  </p>
                </div>

                <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">
                  {player.position || "N/A"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}