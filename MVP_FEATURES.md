# Waywise MVP Features Implementation Plan

This document outlines the features and integrations needed to transform the current base project into a working MVP.

## 🎯 Current Status

The project currently has:
- ✅ Complete project structure (backend + frontend)
- ✅ Authentication system with JWT
- ✅ API endpoints with mock data
- ✅ React Native mobile app
- ✅ Web application support
- ✅ Docker deployment setup
- ✅ Database schema and migrations
- ✅ UI screens and navigation

## 🚀 MVP Features to Implement

### 1. **AI Schedule Parsing** 🤖
**Status**: Mock implementation exists
**Priority**: HIGH

**Current Implementation**:
```javascript
// backend/src/routes/schedules.js - Line 8
const parseScheduleText = async (scheduleText) => {
  // Returns hardcoded mock data
};
```

**Required Implementation**:
- [ ] **Integrate Gemini AI API** for natural language processing
- [ ] **Parse user input** to extract destinations, times, and constraints
- [ ] **Handle ambiguities** and request clarifications
- [ ] **Geocoding integration** with Google Maps API
- [ ] **Error handling** for unparseable schedules

**Files to Update**:
- `backend/src/services/geminiService.js` (new)
- `backend/src/services/geocodingService.js` (new)
- `backend/src/routes/schedules.js`

**Example Integration**:
```javascript
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{
      parts: [{ text: `Extract destinations and times from: "${scheduleText}"` }]
    }]
  })
});
```

---

### 2. **Real Traffic Data Integration** 🚦
**Status**: Mock implementation exists
**Priority**: HIGH

**Current Implementation**:
```javascript
// backend/src/routes/traffic.js - Line 6
const getTrafficForecast = async () => {
  // Returns hardcoded mock traffic data
};
```

**Required Implementation**:
- [ ] **Google Maps Distance Matrix API** integration
- [ ] **Real-time traffic data** collection
- [ ] **Historical traffic patterns** storage
- [ ] **Traffic prediction** algorithms
- [ ] **Cache management** for performance

**Files to Update**:
- `backend/src/services/trafficService.js` (new)
- `backend/src/routes/traffic.js`
- `backend/src/routes/routes.js`

**Example Integration**:
```javascript
const trafficData = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&departure_time=now&traffic_model=best_guess&key=${process.env.GOOGLE_MAPS_API_KEY}`);
```

---

### 3. **Route Optimization Engine** 🛣️
**Status**: Mock implementation exists
**Priority**: HIGH

**Current Implementation**:
```javascript
// backend/src/routes/routes.js - Line 11
const optimizeRoute = async () => {
  // Returns hardcoded optimized sequence
};
```

**Required Implementation**:
- [ ] **Multi-destination routing** algorithm (TSP solver)
- [ ] **Time window constraints** handling
- [ ] **Traffic-aware optimization**
- [ ] **Multiple route alternatives** generation
- [ ] **Real-time route recalculation**

**Files to Update**:
- `backend/src/services/routeOptimizer.js` (new)
- `backend/src/routes/routes.js`

**Algorithm Approach**:
```javascript
// Implement time-dependent A* or use Google Routes API
const optimizeMultipleDestinations = (origins, destinations, timeConstraints, trafficData) => {
  // 1. Calculate all pairwise travel times
  // 2. Apply TSP optimization with time windows
  // 3. Return optimized sequence
};
```

---

### 4. **Safety Scoring System** 🛡️
**Status**: Not implemented
**Priority**: MEDIUM

**Required Implementation**:
- [ ] **Crime data integration** (municipal APIs, SpotCrime)
- [ ] **Safety score calculation** for road segments
- [ ] **Time-of-day safety adjustments**
- [ ] **Safety-aware routing** options
- [ ] **User safety preferences**

**Files to Create**:
- `backend/src/services/safetyService.js`
- `backend/src/routes/safety.js`

**Data Sources to Integrate**:
```javascript
// Example safety data sources
const crimeDataSources = [
  'https://api.spotcrime.com/v2/crimes',
  'https://data.police.uk/api/crimes-street/all-crime',
  // Municipal open data APIs
];
```

---

### 5. **Real Location Services** 📍
**Status**: Mock location used
**Priority**: HIGH

**Current Implementation**:
```javascript
// frontend/src/screens/RoutePlanningScreen.js - Line 18
setUserLocation({
  lat: 37.7649, // Hardcoded
  lon: -122.4294
});
```

**Required Implementation**:
- [ ] **GPS location access** (mobile)
- [ ] **Location permissions** handling
- [ ] **Background location** tracking during navigation
- [ ] **Location accuracy** validation
- [ ] **Fallback location** methods

**Files to Update**:
- `frontend/src/services/locationService.js` (new)
- `frontend/src/screens/RoutePlanningScreen.js`
- `frontend/src/screens/NavigationScreen.js`

---

### 6. **Interactive Maps** 🗺️
**Status**: Web fallback exists
**Priority**: MEDIUM

**Current Implementation**:
```javascript
// frontend/src/components/MapView.web.js
// Shows placeholder instead of real map on web
```

**Required Implementation**:
- [ ] **Google Maps integration** for web
- [ ] **Real-time route display** on maps
- [ ] **Turn-by-turn visualization**
- [ ] **Traffic overlay** display
- [ ] **Interactive markers** and route editing

**Files to Update**:
- `frontend/src/components/MapView.web.js`
- Add Google Maps JavaScript API

---

### 7. **Voice Input System** 🎤
**Status**: Placeholder implementation
**Priority**: LOW

**Current Implementation**:
```javascript
// frontend/src/screens/ScheduleInputScreen.js - Line 47
const handleVoiceInput = () => {
  Alert.alert('Voice Input', 'Voice recording feature coming soon!');
};
```

**Required Implementation**:
- [ ] **Speech recognition** integration
- [ ] **Audio recording** and processing
- [ ] **Voice-to-text** conversion
- [ ] **Audio file upload** to backend
- [ ] **Noise cancellation** and audio quality

**Files to Update**:
- `frontend/src/services/voiceService.js` (new)
- `frontend/src/screens/ScheduleInputScreen.js`

---

### 8. **Database Integration** 💾
**Status**: Schema exists, not connected
**Priority**: HIGH

**Current Implementation**:
```javascript
// backend/src/routes/auth.js - Line 11
const users = new Map(); // In-memory storage
```

**Required Implementation**:
- [ ] **PostgreSQL connection** setup
- [ ] **User data persistence**
- [ ] **Schedule and route storage**
- [ ] **Historical data** tracking
- [ ] **Database migrations** automation

**Files to Update**:
- `backend/src/models/userModel.js` (new)
- `backend/src/models/scheduleModel.js` (new)
- `backend/src/models/routeModel.js` (new)
- All route handlers to use database

---

### 9. **Calendar Integration** 📅
**Status**: Placeholder implementation
**Priority**: LOW

**Required Implementation**:
- [ ] **Google Calendar API** integration
- [ ] **OAuth 2.0** authentication flow
- [ ] **Calendar event parsing**
- [ ] **Automatic schedule import**
- [ ] **Calendar sync** preferences

**Files to Create**:
- `backend/src/services/calendarService.js`
- `frontend/src/services/calendarService.js`

---

### 10. **User Preferences & Settings** ⚙️
**Status**: UI exists, not functional
**Priority**: MEDIUM

**Current Implementation**:
```javascript
// frontend/src/screens/SettingsScreen.js
// Shows "Coming Soon" alerts for all settings
```

**Required Implementation**:
- [ ] **Safety preferences** storage
- [ ] **Transport mode** preferences
- [ ] **Saved locations** (home, work)
- [ ] **Route preferences** (avoid tolls, highways)
- [ ] **Notification settings**

**Files to Update**:
- `backend/src/routes/users.js` (new)
- `frontend/src/screens/SettingsScreen.js`
- `frontend/src/services/userPreferences.js` (new)

---

## 🛠️ Implementation Priority Order

### Phase 1: Core MVP (2-3 weeks)
1. **Database Integration** - Make data persistent
2. **AI Schedule Parsing** - Core value proposition
3. **Real Traffic Data** - Essential for route optimization
4. **Route Optimization** - Main algorithm implementation
5. **Real Location Services** - Required for mobile experience

### Phase 2: Enhanced Experience (1-2 weeks)
1. **Safety Scoring** - Differentiating feature
2. **User Preferences** - Personalization
3. **Interactive Maps** - Better user experience

### Phase 3: Advanced Features (1-2 weeks)
1. **Voice Input** - Convenience feature
2. **Calendar Integration** - Automation feature

---

## 📋 MVP Success Criteria

The MVP will be considered complete when a user can:

1. ✅ **Register and login** to the app
2. 🔄 **Enter a schedule** in natural language and have it parsed correctly
3. 🔄 **Get an optimized route** based on real traffic data
4. 🔄 **See their location** and navigate through the route
5. 🔄 **Access the app** on both mobile and web
6. ✅ **Store their data** persistently

---

## 🚧 Technical Debt to Address

### Code Quality
- [ ] Add comprehensive **error handling**
- [ ] Implement **input validation** throughout
- [ ] Add **unit tests** for core functions
- [ ] Improve **logging** and monitoring
- [ ] Add **API rate limiting**

### Performance
- [ ] Implement **request caching** strategies
- [ ] Optimize **database queries**
- [ ] Add **connection pooling**
- [ ] Implement **lazy loading** in frontend

### Security
- [ ] Add **input sanitization**
- [ ] Implement **CORS** properly
- [ ] Add **helmet.js** security headers
- [ ] Validate **JWT tokens** properly
- [ ] Secure **API key** storage

---

## 🔗 External Service Setup Required

### Google Cloud Services
- [ ] **Google Maps API** with geocoding and directions
- [ ] **Gemini AI API** for natural language processing
- [ ] **Google Cloud Speech-to-Text** for voice input
- [ ] **Google Calendar API** for calendar integration

### Development Tools
- [ ] **Error tracking** (Sentry)
- [ ] **Analytics** (Google Analytics)
- [ ] **Performance monitoring** (New Relic)
- [ ] **CI/CD pipeline** (GitHub Actions)

---

## 💰 Estimated Costs for MVP

### Development APIs (Monthly)
- Google Maps API: $0-200 (first $200 free)
- Gemini AI API: $0-100 (generous free tier)
- Google Speech-to-Text: $0-50 (free tier available)

### Infrastructure (Monthly)
- Cloud Run: $0-20 (pay-per-request)
- Cloud SQL: $7-15 (db-f1-micro)
- Secret Manager: $0-5
- **Total**: $7-390/month depending on usage

---

This roadmap provides a clear path from the current foundation to a fully functional MVP. Focus on Phase 1 features first to get a working product, then iterate based on user feedback.