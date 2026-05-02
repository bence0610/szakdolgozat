import { registerAs } from '@nestjs/config';

export interface LoyaltyConfig {
  registrationPoints: number;
  profileCompletionPoints: number;
  ticketPointsPerTicket: number;
  seasonPassPoints: number;
  passLoanPoints: number;
  carryoverPercent: number;
}

export default registerAs(
  'loyalty',
  (): LoyaltyConfig => ({
    registrationPoints: parseInt(process.env.LOYALTY_REGISTRATION_POINTS ?? '100', 10),
    profileCompletionPoints: parseInt(process.env.LOYALTY_PROFILE_COMPLETION_POINTS ?? '50', 10),
    ticketPointsPerTicket: parseInt(process.env.LOYALTY_TICKET_POINTS_PER_TICKET ?? '50', 10),
    seasonPassPoints: parseInt(process.env.LOYALTY_SEASON_PASS_POINTS ?? '500', 10),
    passLoanPoints: parseInt(process.env.LOYALTY_PASS_LOAN_POINTS ?? '25', 10),
    carryoverPercent: parseInt(process.env.LOYALTY_CARRYOVER_PERCENT ?? '50', 10),
  }),
);
