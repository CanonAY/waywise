// Platform-specific component exports
import {Platform} from 'react-native';

// Map components
let MapView, Marker, Polyline;

if (Platform.OS === 'web') {
  const MapComponents = require('./MapView.web');
  MapView = MapComponents.default;
  Marker = MapComponents.Marker;
  Polyline = MapComponents.Polyline;
} else {
  const MapComponents = require('react-native-maps');
  MapView = MapComponents.default;
  Marker = MapComponents.Marker;
  Polyline = MapComponents.Polyline;
}

// Icon component
let Icon;

if (Platform.OS === 'web') {
  Icon = require('./Icon.web').default;
} else {
  Icon = require('react-native-vector-icons/MaterialIcons').default;
}

export {MapView, Marker, Polyline, Icon};