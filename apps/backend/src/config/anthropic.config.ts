import { registerAs } from '@nestjs/config';

export interface AnthropicConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

export default registerAs(
  'anthropic',
  (): AnthropicConfig => ({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS ?? '1024', 10),
  }),
);
