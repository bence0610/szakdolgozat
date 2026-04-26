export interface AppEnvironment {
  production: boolean;
  apiUrl: string;
  stripePublishableKey: string;
  weatherCity: string;
}

export const environment: AppEnvironment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  stripePublishableKey: 'pk_test_replace_me',
  weatherCity: 'Kecskemet,HU',
};
