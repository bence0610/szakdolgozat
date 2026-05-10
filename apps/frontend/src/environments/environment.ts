export interface AppEnvironment {
  production: boolean;
  apiUrl: string;
  stripePublishableKey: string;
  weatherCity: string;
}

export const environment: AppEnvironment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  stripePublishableKey:
    'pk_test_51TVVa4BTAZJ1lF1DZMAGlqXW9HdDTJqtpuW0Rt4xPEDU5lZR1zjkKs6hLHCwhmvnXDGVw0Dwf6KrmvbZP86E5pci00IcdmaTat',
  weatherCity: 'Kecskemet,HU',
};
