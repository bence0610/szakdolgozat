export interface RevenueDailyPoint {
  readonly date: string;
  readonly amount: number;
  readonly ticketCount: number;
}

export interface RevenueByMatch {
  readonly matchId: string;
  readonly homeTeam: string;
  readonly awayTeam: string;
  readonly kickoffAt: string;
  readonly ticketCount: number;
  readonly revenue: number;
}

export interface RevenueSummary {
  readonly todayRevenue: number;
  readonly monthRevenue: number;
  readonly todayTicketCount: number;
  readonly monthTicketCount: number;
  readonly topMatch?: RevenueByMatch;
}

export interface RevenueStats {
  readonly summary: RevenueSummary;
  readonly daily: readonly RevenueDailyPoint[];
  readonly byMatch: readonly RevenueByMatch[];
}

export interface SectorOccupancy {
  readonly section: string;
  readonly total: number;
  readonly sold: number;
  readonly locked: number;
  readonly available: number;
  readonly occupancyPercent: number;
}

export interface MatchOccupancy {
  readonly matchId: string;
  readonly homeTeam: string;
  readonly awayTeam: string;
  readonly kickoffAt: string;
  readonly venue: string;
  readonly totalCapacity: number;
  readonly totalSold: number;
  readonly totalLocked: number;
  readonly totalAvailable: number;
  readonly occupancyPercent: number;
  readonly sectors: readonly SectorOccupancy[];
  readonly generatedAt: string;
}
