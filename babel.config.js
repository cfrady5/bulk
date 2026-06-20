module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Module resolver so we can import with the "@/..." alias.
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
          },
        },
      ],
      // react-native-reanimated/plugin MUST be listed last.
      'react-native-reanimated/plugin',
    ],
  };
};
