import type { LeagueTeam } from "../../lib/types";

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

export default function PowerRankings({
  teams,
}: {
  teams: LeagueTeam[];
}) {
  return (
    <section className="mt-12 text-left">
      <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
        Power Rankings
      </p>

      <h2 className="mt-2 text-3xl font-bold">
        Blueprint Scores
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Rankings include optimized starters, depth,
        youth, team value, and draft capital.
      </p>

      <div className="mt-6 space-y-3">
        {teams.map((team, index) => (
          <article
            key={team.rosterId}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="text-2xl font-bold text-emerald-400">
                  #{index + 1}
                </div>

                <div>
                  <h3 className="font-bold">
                    {team.teamName}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {team.managerName}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold">
                  {team.score}
                </p>

                <p className="text-sm font-semibold text-emerald-400">
                  {getGrade(team.score)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Starters
                </p>

                <p className="mt-1 font-semibold">
                  {team.starterScore}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Depth
                </p>

                <p className="mt-1 font-semibold">
                  {team.depthScore}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Value
                </p>

                <p className="mt-1 font-semibold">
                  {team.teamValueScore}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Youth
                </p>

                <p className="mt-1 font-semibold">
                  {team.youthScore}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Picks
                </p>

                <p className="mt-1 font-semibold">
                  {team.draftCapitalScore}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Contender
                </p>

                <p className="mt-1 font-semibold">
                  {team.contenderScore}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}