# Waywise App

AI-powered route optimization application built with React Native and React Native Web.

Available as both mobile app (iOS/Android) and web application.

## Features

- **Natural Language Input**: Tell the app your schedule in plain English
- **Voice Input**: Record your schedule using voice commands
- **Route Optimization**: Get optimal routes considering traffic and safety
- **Real-time Navigation**: Turn-by-turn directions with live traffic updates
- **Safety Scoring**: Routes that avoid high-risk areas
- **Multi-modal Transport**: Support for driving, walking, transit

## Tech Stack

- **Framework**: React Native 0.72 + React Native Web
- **Navigation**: React Navigation 6
- **UI Library**: React Native Paper
- **Maps**: React Native Maps (Mobile) / Web fallback (Web)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: React Native Vector Icons (Mobile) / Emoji fallback (Web)
- **Build Tools**: Webpack 5 (Web), Metro (Mobile)

## Prerequisites

- Node.js 18+
- React Native development environment
- iOS Simulator or Android Emulator
- Waywise Backend API running

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Install iOS pods (iOS only):
   ```bash
   cd ios && pod install && cd ..
   ```

4. Update API base URL in `src/services/api.js` if needed

## Running the App

### Web Application

```bash
# Start web development server
npm run web
```

The web app will open at `http://localhost:3001`

### Mobile Apps

#### iOS

```bash
npm run ios
```

#### Android

```bash
npm run android
```

#### Start Metro bundler

```bash
npm start
```

## Development

```bash
# Start with cache reset
npm start -- --reset-cache

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── navigation/     # Navigation configuration
├── screens/        # Screen components
├── services/       # API services and utilities
└── utils/          # Helper functions
```

## Key Screens

1. **Login/Register**: User authentication
2. **Schedule Input**: Enter schedule via text or voice
3. **Route Planning**: View and optimize routes
4. **Navigation**: Real-time turn-by-turn directions
5. **Settings**: User preferences and account settings

## API Integration

The app integrates with the Waywise backend API for:
- User authentication
- Schedule parsing
- Route optimization
- Traffic data
- Navigation instructions

## Platform-Specific Setup

### iOS

- Ensure you have Xcode installed
- iOS 11+ required
- Location permissions configured in Info.plist

### Android

- Android SDK installed
- Android 6+ (API level 23+) required
- Location permissions configured in AndroidManifest.xml

### Web

- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Maps display as visual placeholders (real mapping on mobile)

## Environment Configuration

The app automatically detects development vs production environment:
- Development: Uses `http://localhost:3000` for API calls
- Production: Uses production API URL

## Building for Release

### Web

```bash
# Build optimized web bundle
npm run build:web
```

Output will be in `web-build/` directory - ready to deploy to any static hosting service.

### iOS

```bash
# Build for iOS
cd ios
xcodebuild -workspace Waywise.xcworkspace -scheme Waywise -configuration Release
```

### Android

```bash
# Build APK
cd android
./gradlew assembleRelease
```

## Features Implementation Status

- ✅ User Authentication
- ✅ Schedule Input (Text)
- ✅ Route Planning UI
- ✅ Navigation Interface
- ✅ Settings Screen
- 🚧 Voice Input (Coming Soon)
- 🚧 Calendar Integration (Coming Soon)
- 🚧 Real-time Location Tracking (Coming Soon)
- 🚧 Push Notifications (Coming Soon)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Try `npm start -- --reset-cache`
2. **iOS build issues**: Clean build folder and reinstall pods
3. **Android build issues**: Clean gradle cache with `cd android && ./gradlew clean`

### API Connection Issues

- Ensure backend API is running
- Check network connectivity
- Verify API URL in `src/services/api.js`

## License

MIT