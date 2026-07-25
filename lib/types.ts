export type SleeperLeague = {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
  status: string;
  roster_positions?: string[];
  settings?: {
    playoff_teams?: number;
    playoff_week_start?: number;
  };
};

export type SleeperUser = {
  user_id: string;
  display_name: string;
  metadata?: {
    team_name?: string;
  };
};

export type SleeperRoster = {
  roster_id: number;
  owner_id: string | null;
  players: string[] | null;
  starters?: string[] | null;
  reserve?: string[] | null;
  taxi?: string[] | null;
  settings?: {
    wins?: number;
    losses?: number;
    ties?: number;
  };
};

export type SleeperPlayer = {
  player_id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  fantasy_positions?: string[];
  team?: string | null;
  age?: number | null;
  years_exp?: number | null;
  status?: string | null;
  injury_status?: string | null;
};

export type SleeperTradedPick = {
  season: string;
  round: number;
  roster_id: number;
  previous_owner_id: number;
  owner_id: number;
};

export type DraftPick = {
  season: string;
  round: number;
  originalRosterId: number;
  currentOwnerRosterId: number;
};

export type TeamPlayer = {
  playerId: string;
  name: string;
  position: string;
  nflTeam: string | null;
  age: number | null;
  yearsExperience: number | null;
  status: string | null;
  injuryStatus: string | null;
  value: number;
};

export type LeagueTeam = {
  rosterId: number;
  teamName: string;
  managerName: string;
  playerCount: number;
  wins: number;
  losses: number;
  ties: number;
  players: TeamPlayer[];
  starters: TeamPlayer[];
  bench: TeamPlayer[];
  score: number;
  starterScore: number;
  depthScore: number;
  draftPicks: DraftPick[];
};