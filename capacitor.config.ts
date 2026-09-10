import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trustpay.exchange',
  appName: 'TrustPay',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: { androidScheme: 'https' },
  plugins: { StatusBar: { style: 'DARK' } }
};

export default config;
