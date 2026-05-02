import { registerAs } from '@nestjs/config';

export interface QrConfig {
  signingSecret: string;
  ticketIssuer: string;
  loanIssuer: string;
}

export default registerAs(
  'qr',
  (): QrConfig => ({
    signingSecret: process.env.QR_SIGNING_SECRET ?? 'replace-with-strong-random-secret',
    ticketIssuer: process.env.QR_TICKET_ISSUER ?? 'kte-jegyportal',
    loanIssuer: process.env.QR_LOAN_ISSUER ?? 'kte-loan',
  }),
);
