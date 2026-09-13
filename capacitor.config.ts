import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tinysurvivor.game',
  appName: 'Tiny Survivor',
  webDir: 'dist',
  android: {
    backgroundColor: '#071322',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#071322',
    },
    AdMob: {
      initializeForTesting: true,
      testingDevices: [],
    },
  },
};

export default config;
