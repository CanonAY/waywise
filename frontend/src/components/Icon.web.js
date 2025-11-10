import React from 'react';
import {Text} from 'react-native';

// Material Icons mapping for web
const iconMap = {
  // Navigation icons
  'home': '🏠',
  'settings': '⚙️',
  'navigation': '🧭',
  'route': '📍',
  'microphone': '🎤',
  'stop': '⏹️',
  'calendar': '📅',

  // Transportation icons
  'car': '🚗',
  'directions-car': '🚗',
  'traffic-light': '🚥',
  'traffic': '🚦',

  // Time and location icons
  'access-time': '⏰',
  'clock-outline': '🕐',
  'map-marker': '📍',

  // Actions icons
  'chevron-right': '▶️',
  'logout': '↩️',
  'email': '📧',
  'help-circle': '❓',
  'information': 'ℹ️',

  // Account icons
  'account': '👤',
  'shield': '🛡️',
  'toll': '💰',
  'office-building': '🏢',
  'chart-line': '📈',

  // Default fallback
  'default': '•'
};

const Icon = ({name, size = 24, color = '#000', style}) => {
  const iconChar = iconMap[name] || iconMap['default'];

  return (
    <Text
      style={[
        {
          fontSize: size,
          color,
          textAlign: 'center',
          lineHeight: size,
        },
        style
      ]}
    >
      {iconChar}
    </Text>
  );
};

export default Icon;