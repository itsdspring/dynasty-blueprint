type SleeperPlayer = {
  player_id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string | null;
  status?: string;
  fantasy_positions?: string[];
};

export async function GET() {
  try {
    const response = await fetch(
      "https://api.sleeper.app/v1/players/nfl",
      {
        next: {
          revalidate: 86400,
        },
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: "Unable to load Sleeper players." },
        { status: 502 }
      );
    }

    const players: Record<string, SleeperPlayer> =
      await response.json();

    return Response.json(players);
  } catch {
    return Response.json(
      { error: "Unable to load Sleeper players." },
      { status: 500 }
    );
  }
}