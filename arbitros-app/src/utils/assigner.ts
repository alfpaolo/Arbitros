import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export type Game = {
  id: string;
  starts_at: string;
  ends_at: string;
  venue_id: string | null;
};

export type Referee = {
  id: string;
};

export type Availability = {
  referee_id: string;
  start_time: string;
  end_time: string;
};

export type ExistingAssignment = {
  referee_id: string;
  game_id: string;
  starts_at: string;
  ends_at: string;
  venue_id: string | null;
};

export type ProposedAssignment = { game_id: string; referee_id: string }[];

function isWithinAvailability(game: Game, avail: Availability): boolean {
  return dayjs(avail.start_time).isSameOrBefore(dayjs(game.starts_at)) && dayjs(avail.end_time).isSameOrAfter(dayjs(game.ends_at));
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return dayjs(aStart).isBefore(dayjs(bEnd)) && dayjs(bStart).isBefore(dayjs(aEnd));
}

export function assignReferees(
  games: Game[],
  referees: Referee[],
  availabilities: Availability[],
  existingAssignments: ExistingAssignment[],
): ProposedAssignment {
  // Sort games by start time
  const sortedGames = [...games].sort((a, b) => dayjs(a.starts_at).valueOf() - dayjs(b.starts_at).valueOf());
  const refereeCalendar: Record<string, ExistingAssignment[]> = {};
  for (const asg of existingAssignments) {
    refereeCalendar[asg.referee_id] ??= [];
    refereeCalendar[asg.referee_id].push(asg);
  }
  for (const key of Object.keys(refereeCalendar)) {
    refereeCalendar[key].sort((a, b) => dayjs(a.starts_at).valueOf() - dayjs(b.starts_at).valueOf());
  }

  const result: ProposedAssignment = [];

  for (const game of sortedGames) {
    const eligibleReferees = referees.filter((r) => availabilities.some((a) => a.referee_id === r.id && isWithinAvailability(game, a)));

    // Score referees by proximity in schedule: prefer same venue within 30m gap
    const scored = eligibleReferees
      .map((r) => {
        const calendar = refereeCalendar[r.id] ?? [];
        let score = 0;
        for (const asg of calendar) {
          const gapStart = dayjs(game.starts_at).diff(dayjs(asg.ends_at), "minute");
          const gapEnd = dayjs(asg.starts_at).diff(dayjs(game.ends_at), "minute");
          const isAdjacent = Math.abs(gapStart) <= 30 || Math.abs(gapEnd) <= 30;
          if (isAdjacent && game.venue_id && asg.venue_id && game.venue_id === asg.venue_id) score += 10;
        }
        return { referee: r, score };
      })
      .sort((a, b) => b.score - a.score);

    const picks: string[] = [];
    for (const { referee } of scored) {
      if (picks.length >= 2) break;
      const calendar = refereeCalendar[referee.id] ?? [];
      const hasOverlap = calendar.some((asg) => overlaps(game.starts_at, game.ends_at, asg.starts_at, asg.ends_at));
      if (hasOverlap) continue;
      picks.push(referee.id);
      // Tentatively add to calendar to avoid double-booking in same run
      refereeCalendar[referee.id] = [
        ...calendar,
        { referee_id: referee.id, game_id: game.id, starts_at: game.starts_at, ends_at: game.ends_at, venue_id: game.venue_id },
      ].sort((a, b) => dayjs(a.starts_at).valueOf() - dayjs(b.starts_at).valueOf());
    }

    for (const refereeId of picks) {
      result.push({ game_id: game.id, referee_id: refereeId });
    }
  }

  return result;
}