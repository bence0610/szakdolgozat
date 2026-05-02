import { registerAs } from '@nestjs/config';

export interface CronConfig {
  loanReleaseExpression: string;
  ticketExpireExpression: string;
  timezone: string;
  loanInvitationTtlHours: number;
}

export default registerAs(
  'cron',
  (): CronConfig => ({
    loanReleaseExpression: process.env.LOAN_RELEASE_CRON ?? '0 * * * *',
    ticketExpireExpression: process.env.TICKET_EXPIRE_CRON ?? '0 4 * * *',
    timezone: process.env.CRON_TIMEZONE ?? 'Europe/Budapest',
    loanInvitationTtlHours: parseInt(process.env.LOAN_INVITATION_TTL_HOURS ?? '72', 10),
  }),
);
