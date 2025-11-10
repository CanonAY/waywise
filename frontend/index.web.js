import {AppRegistry} from 'react-native';
import {name as appName} from './package.json';
import App from './src/App';

// Register the app
AppRegistry.registerComponent(appName, () => App);

// Run the app
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('app-root'),
});