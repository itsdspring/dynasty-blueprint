import DraftPickList from "./DraftPickList";
import TeamCard from "./TeamCard";
import type { LeagueTeam } from "../../lib/types";

export default function TeamBreakdown({
  teams,
}: {
  teams: LeagueTeam[];
}) {
  const teamNamesByRosterId = new Map(
    teams.map((team) => [
      team.rosterId,
      team.teamName,
    ])
  );

  return (
    <section className="mt-12 text-left">
      <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
        Team Blueprints
      </p>

      <h2 className="mt-2 text-3xl font-bold">
        Full Team Analysis
      </h2>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {teams.map((team, index) => (
          <div key={team.rosterId}>
            <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
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
                  {team.score}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs text-slate-400">
                  Starters
                </p>

                <p className="mt-1 font-bold">
                  {team.starterScore}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs text-slate-400">
                  Depth
                </p>

                <p className="mt-1 font-bold">
                  {team.depthScore}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs text-slate-400">
                  Youth
                </p>

                <p className="mt-1 font-bold">
                  {team.youthScore}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs text-slate-400">
                  Picks
                </p>

                <p className="mt-1 font-bold">
                  {team.draftCapitalScore}
                </p>
              </div>
            </div>

            <TeamCard
              rosterId={team.rosterId}
              teamName={team.teamName}
              managerName={team.managerName}
              playerCount={team.playerCount}
              wins={team.wins}
              losses={team.losses}
              ties={team.ties}
              players={team.players}
            />

            <DraftPickList
              picks={team.draftPicks}
              teamNamesByRosterId={
                teamNamesByRosterId
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}