module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['react-native-reanimated/plugin'],
  ],
  env: {
    web: {
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
        'module:metro-react-native-babel-preset'
      ]
    }
  }
};