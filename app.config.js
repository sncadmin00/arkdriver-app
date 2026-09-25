const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = ({ config }) => {
  if (!IS_DEV) return config;
  return {
    ...config,
    name: 'ARK Driver Dev',
    scheme: 'driver-dev',
    ios: { ...config.ios, bundleIdentifier: 'com.arkcarriers.driver.dev' },
    android: { ...config.android, package: 'com.arkcarriers.driver.dev' },
  };
};
