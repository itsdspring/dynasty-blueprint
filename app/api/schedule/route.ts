import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const leagueId = request.nextUrl.searchParams.get("leagueId");

  if (!leagueId) {
    return NextResponse.json(
      { error: "Missing leagueId" },
      { status: 400 }
    );
  }

  const schedule = [];

  for (let week = 1; week <= 17; week++) {
    const response = await fetch(
      `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
    );

    if (!response.ok) {
      continue;
    }

    const matchups = await response.json();

    schedule.push({
      week,
      matchups,
    });
  }

  return NextResponse.json(schedule);
}