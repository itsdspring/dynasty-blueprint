export type SleeperMatchup = {
  roster_id: number;
  matchup_id: number | null;
  points?: number;
};

export type ScheduleGame = {
  week: number;
  teamOneRosterId: number;
  teamTwoRosterId: number;
};

export type TeamSimulationResult = {
  rosterId: number;
  averageWins: number;
  averageLosses: number;
  playoffOdds: number;
  championshipOdds: number;
};