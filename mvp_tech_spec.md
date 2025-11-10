# AI-Driven Route Optimization & Safety Platform
## Implementation Guide

---

## System Overview

**Purpose:** Intelligent route planning system that automatically generates optimized daily trip plans from natural language schedules or calendar input, minimizing traffic delays while ensuring personal safety.

**Core Value:**
- One-click route generation from voice/text/calendar
- Minimize time wasted in traffic congestion
- Dynamic safety-aware routing based on time-of-day risk
- Multi-modal support: walking, cycling, driving, transit

---

## Architecture

### High-Level Components

```
Mobile App (React Native)
    ↓ HTTPS
Cloud API Gateway (GCP)
    ↓
Cloud Run Services (Node.js)
├── Schedule Parser
├── Route Optimizer
├── Safety Scorer
└── Navigation Service
    ↓
Data Layer
├── Cloud SQL PostgreSQL + PostGIS (spatial data)
├── Memorystore Redis (cache)
└── Milvus on Compute Engine (vector search)
    ↓
External APIs
├── Google Maps Platform (traffic, geocoding)
├── Gemini API (schedule parsing)
├── GTFS-Realtime (transit)
└── Safety Data APIs (incidents)
```

### Technology Stack

**Backend:**
- Google Cloud Run (Node.js 18 containers)
- Cloud API Gateway (REST endpoints)
- Cloud SQL for PostgreSQL with PostGIS
- Cloud Memorystore for Redis
- Milvus vector database (Compute Engine)

**Frontend:**
- React Native (iOS & Android)
- Google Maps SDK

**External Services:**
- Google Maps Platform API
- Gemini API (schedule parsing)
- Google Cloud Speech-to-Text (voice input)
- Google Calendar API (schedule sync)

---

## Core Implementation

### 1. Schedule Parsing

**Input Processing:**
1. **Voice Input:** User records schedule → Google Cloud Speech-to-Text → text transcription
2. **Text Input:** User types schedule directly
3. **Calendar Sync:** Import events from Google Calendar via OAuth

**Gemini API Extraction:**
```
Prompt: "Extract structured schedule from: {user_input}"
Expected Output:
{
  "destinations": [
    {"name": "dentist", "address": "123 Main St", "time": "14:00", "type": "appointment"},
    {"name": "grocery store", "address": "456 Oak Ave", "time": "flexible", "type": "errand"}
  ],
  "preferences": {
    "modes": ["driving", "transit"],
    "safety_weight": 0.3,
    "time_constraints": "arrive home by 17:00"
  }
}
```

**Processing Steps:**
1. Send transcribed/typed text to Gemini API
2. Parse JSON response with extracted entities
3. Geocode addresses to coordinates using Google Maps Geocoding API
4. Validate locations exist and are reachable
5. If ambiguous, prompt user for clarification
6. Store structured schedule for route generation

### 2. Traffic Data Integration

**Real-Time Traffic:**
- Poll Google Maps Distance Matrix API every 2-5 minutes
- Query: origin-destination pairs with departure time
- Store current travel times in Memorystore Redis cache (TTL: 5 minutes)
- Update road segment weights in routing graph

**Predictive Traffic:**
- Historical patterns: store typical travel times by hour/day in Cloud SQL
- Short-term forecast: extrapolate current trends 15-60 minutes ahead
- Confidence intervals: provide best/typical/worst case estimates

**Data Structure (Cloud SQL PostgreSQL):**
```sql
CREATE TABLE segment_traffic (
  segment_id INTEGER,
  timestamp TIMESTAMP,
  travel_time_seconds INTEGER,
  speed_kmh DECIMAL,
  congestion_level VARCHAR(20), -- free_flow, moderate, heavy, severe
  PRIMARY KEY (segment_id, timestamp)
);
```

### 3. Safety Scoring

**Data Sources:**
- Crime incident APIs (municipal open data, SpotCrime)
- Historical incident database
- Street lighting inventory
- Business operating hours (proxy for activity)

**Scoring Algorithm:**
```
For each road segment:
1. Count incidents within 100m buffer (last 90 days)
2. Apply temporal decay: weight = 1 / (1 + days_since_incident)
3. Severity multiplier: assault=3.0, theft=2.0, vandalism=1.0
4. Lighting score: 0.0 (well-lit) to 1.0 (no lights)
5. Activity score: business density, transit ridership
6. Composite score: 
   safety_risk = 0.5 * incident_score + 0.3 * lighting_score + 0.2 * (1 - activity_score)
7. Time-of-day adjustment: multiply by 1.5 for nighttime (6pm-6am)
8. Normalize to 0-100 scale
```

**Data Structure (Cloud SQL PostgreSQL):**
```sql
CREATE TABLE safety_scores (
  segment_id INTEGER,
  hour_of_day INTEGER, -- 0-23
  safety_score DECIMAL, -- 0-100
  confidence DECIMAL, -- 0-1
  PRIMARY KEY (segment_id, hour_of_day)
);

CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  location GEOMETRY(Point, 4326),
  incident_type VARCHAR(50),
  severity INTEGER,
  timestamp TIMESTAMP
);
```

### 4. Route Optimization

**Graph Construction:**
```sql
-- Road network
CREATE TABLE road_segments (
  id SERIAL PRIMARY KEY,
  geometry GEOMETRY(LineString, 4326),
  from_node INTEGER,
  to_node INTEGER,
  length_meters DECIMAL,
  mode_restrictions VARCHAR[], -- ['car', 'bike', 'walk']
  speed_limit_kmh INTEGER
);

-- Spatial index for fast queries
CREATE INDEX idx_segments_geom ON road_segments USING GIST(geometry);

-- Transit network
CREATE TABLE transit_routes (
  id SERIAL PRIMARY KEY,
  route_name VARCHAR(100),
  stops JSONB, -- [{stop_id, arrival_time, departure_time}]
  service_days VARCHAR[] -- ['monday', 'tuesday', ...]
);
```

**Routing Algorithm (Time-Dependent A*):**
```
Input: origin, destination, departure_time, safety_weight, mode_preferences

1. Initialize:
   - open_set = {origin}
   - g_score[origin] = 0
   - f_score[origin] = heuristic(origin, destination)

2. While open_set not empty:
   a. current = node in open_set with lowest f_score
   b. if current == destination: return reconstruct_path()
   
   c. for each neighbor of current:
      - arrival_time = departure_time + travel_time(current, neighbor)
      - edge_cost = calculate_cost(current, neighbor, arrival_time, safety_weight)
      - tentative_g = g_score[current] + edge_cost
      
      - if tentative_g < g_score[neighbor]:
          g_score[neighbor] = tentative_g
          f_score[neighbor] = g_score[neighbor] + heuristic(neighbor, destination)
          add neighbor to open_set

3. Return no path found

calculate_cost(from, to, time, safety_weight):
  traffic_time = get_travel_time(from, to, time) -- from traffic data
  safety_penalty = get_safety_score(segment, time) * safety_weight
  return traffic_time + safety_penalty
```

**Multi-Destination Sequencing:**
```
Input: list of destinations with time windows

1. Greedy initial solution:
   - Start from origin
   - Repeatedly visit nearest unvisited destination that satisfies time constraints
   - Return to final destination

2. Iterative improvement (2-opt):
   - For each pair of edges in route:
     - Try swapping order
     - If total cost decreases and constraints satisfied: accept swap
   - Repeat until no improvement found or time budget exhausted

3. Return best route found
```

### 5. Vector Search (Semantic POI Queries)

**Setup Milvus Collection:**
```python
collection_schema = {
  "fields": [
    {"name": "place_id", "type": "INT64", "is_primary": True},
    {"name": "embedding", "type": "FLOAT_VECTOR", "dim": 384},
    {"name": "name", "type": "VARCHAR"},
    {"name": "category", "type": "VARCHAR"},
    {"name": "location", "type": "VARCHAR"}, # lat,lon as string
    {"name": "attributes", "type": "JSON"} # {lighting, wifi, ev_charging, etc}
  ]
}

# Create HNSW index
index_params = {
  "metric_type": "COSINE",
  "index_type": "HNSW",
  "params": {"M": 16, "efConstruction": 200}
}
```

**Query Processing:**
```
User query: "well-lit coffee shop within 5 minutes"

1. Generate embedding:
   - Use sentence transformer model (e.g., all-MiniLM-L6-v2)
   - query_embedding = model.encode(user_query)

2. Vector search:
   - Search Milvus for top 50 similar places (cosine similarity)
   - Filter: distance < 5-minute isochrone from route

3. Attribute filtering:
   - Filter results by attributes.lighting == true
   - Filter by attributes.category == "coffee_shop"

4. Rank and return:
   - Score = 0.6 * semantic_similarity + 0.3 * proximity + 0.1 * popularity
   - Return top 10 results
```

### 6. Navigation & Real-Time Updates

**Active Navigation Loop:**
```
1. User starts navigation with selected route

2. Every 30 seconds:
   a. Get current GPS position
   b. Map-match to nearest road segment
   c. Check if user deviated from route → trigger reroute
   
   d. Fetch updated traffic data
   e. Recalculate remaining route with current conditions
   f. If new route saves >5 minutes: notify user with alternative

3. Provide turn-by-turn instructions:
   - Next maneuver (turn left, continue straight, etc)
   - Distance to maneuver
   - Estimated arrival time
   - Lane guidance for complex intersections

4. Safety alerts:
   - If entering high-risk segment: "Approaching higher-risk area"
   - Suggest safer alternative if available
```

---

## API Endpoints

### Schedule & Route Planning

**POST /api/schedules/parse**
```json
Request:
{
  "input_text": "dentist at 2pm, grocery shopping, home by 5",
  "input_type": "text|voice|calendar",
  "audio_url": "gs://bucket/audio.wav" // if voice
}

Response:
{
  "schedule_id": "sch_123",
  "destinations": [...],
  "preferences": {...}
}
```

**POST /api/routes/generate**
```json
Request:
{
  "schedule_id": "sch_123",
  "safety_weight": 0.3, // 0.0-1.0
  "modes": ["driving", "transit", "walking"]
}

Response:
{
  "route_id": "rt_456",
  "routes": [
    {
      "total_time_minutes": 85,
      "traffic_delay_minutes": 15,
      "safety_score": 75, // 0-100, higher is safer
      "segments": [...],
      "mode_breakdown": {...}
    }
  ]
}
```

**GET /api/routes/{route_id}/navigation**
```json
Response:
{
  "current_segment": {...},
  "next_maneuver": "Turn left on Main St in 0.3 miles",
  "eta": "2024-11-04T15:30:00Z",
  "traffic_ahead": [...],
  "safety_alerts": [...]
}
```

### Real-Time Data

**GET /api/traffic/forecast**
```json
Request params: ?origin_lat=37.7749&origin_lon=-122.4194&destination_lat=...&departure_time=...

Response:
{
  "travel_time_minutes": 45,
  "confidence_interval": [40, 55],
  "congestion_segments": [...]
}
```

**GET /api/safety/heatmap**
```json
Request params: ?bounds=lat1,lon1,lat2,lon2&hour_of_day=14

Response:
{
  "grid": [[score, score, ...], ...], // safety scores for grid cells
  "resolution": 100, // meters per cell
  "incidents": [...] // recent incidents with locations
}
```

---

## Data Pipeline

### Background Jobs (Cloud Scheduler + Cloud Functions/Cloud Run)

**Traffic Data Refresh (every 2 minutes):**
```
1. Query Google Maps for current traffic on major roads
2. Update segment_traffic table in Cloud SQL
3. Invalidate Memorystore Redis cache for affected segments
4. Trigger route recalculation for active navigations
```

**Safety Data Ingestion (every 15 minutes):**
```
1. Poll crime/incident APIs for new incidents
2. Geocode incident locations to road segments
3. Insert into incidents table in Cloud SQL
4. Recalculate safety scores for affected segments
5. Update safety_scores table
```

**Transit Schedule Sync (daily):**
```
1. Download latest GTFS-Static feeds
2. Parse routes, stops, schedules
3. Update transit_routes table
4. Fetch GTFS-Realtime for current positions (every 60 seconds)
```

**Vector Embedding Generation (weekly):**
```
1. Fetch new/updated POIs from Google Places API
2. Generate embeddings: name + category + description
3. Insert/update Milvus collection
4. Rebuild HNSW index if needed
```

---

## Mobile App Implementation

### Key Screens

**1. Schedule Input:**
- Microphone button with recording indicator
- Text input with autocomplete
- Calendar sync toggle
- Display parsed destinations for confirmation

**2. Route Planning:**
- Map showing all destinations
- Safety slider (0-100%)
- Departure time picker
- "Generate Routes" button
- Loading state with progress

**3. Route Selection:**
- List of 2-3 alternative routes
- Cards showing: time, traffic delay, safety score, mode icons
- Tap to view detailed map
- "Start Navigation" button

**4. Active Navigation:**
- Full-screen map with route overlay
- Current position indicator
- Next turn instruction bar at top
- ETA and distance remaining
- Reroute notifications

**5. Settings:**
- Default safety preference
- Saved places (home, work)
- Calendar integration
- Privacy controls

### State Management

**React Native Context/Redux Store:**
```javascript
{
  user: {
    preferences: {safety_weight, default_modes, saved_places},
    calendar_token: oauth_token
  },
  schedule: {
    destinations: [...],
    parsed: true
  },
  routes: {
    alternatives: [...],
    selected: route_id,
    navigation_active: boolean
  },
  realtime: {
    current_position: {lat, lon},
    traffic_updates: [...],
    safety_alerts: [...]
  }
}
```

### API Integration

**Schedule Parsing Flow:**
```javascript
// Voice input
const audioBlob = await recordAudio();
const audioUrl = await uploadToGCS(audioBlob);
const transcription = await speechToText(audioUrl);
const schedule = await api.post('/schedules/parse', {
  input_text: transcription,
  input_type: 'voice'
});

// Calendar sync
const events = await googleCalendar.getEvents(startDate, endDate);
const schedule = await api.post('/schedules/parse', {
  calendar_events: events,
  input_type: 'calendar'
});
```

**Route Generation:**
```javascript
const routes = await api.post('/routes/generate', {
  schedule_id: schedule.id,
  safety_weight: userPreferences.safety_weight,
  modes: userPreferences.modes
});

// Display alternatives
routes.forEach(route => {
  displayRouteCard(route);
});
```

**Navigation Updates:**
```javascript
// Poll every 30 seconds
setInterval(async () => {
  const position = await getCurrentPosition();
  const navUpdate = await api.get(`/routes/${routeId}/navigation`, {
    params: {current_lat: position.lat, current_lon: position.lon}
  });
  
  updateMapPosition(position);
  updateNextManeuver(navUpdate.next_maneuver);
  
  if (navUpdate.reroute_available) {
    showRerouteNotification(navUpdate.alternative_route);
  }
}, 30000);
```

---

## Deployment

### Infrastructure Setup (Terraform)

**Cloud Run Services:**
- scheduleParser: 1GB memory, 60s timeout
- routeOptimizer: 2GB memory, 60s timeout
- safetyScorer: 512MB memory, 30s timeout
- navigationService: 512MB memory, 30s timeout

**Database:**
- Cloud SQL PostgreSQL 14 + PostGIS 3.3
- Instance: db-n1-standard-2 (2 vCPU, 7.5GB RAM)
- Storage: 500GB SSD
- High Availability: enabled

**Cache:**
- Cloud Memorystore for Redis 7.0
- Tier: Standard (with failover)
- Memory: 5GB

**Milvus Vector Database:**
- Compute Engine: n2-standard-4 (4 vCPU, 16GB RAM)
- Persistent disk: 1TB SSD
- Standalone deployment

**Cloud API Gateway:**
- REST API with regional endpoint
- API key authentication
- Rate limit: 100 requests/hour per user
- CORS enabled

**Cloud Storage:**
- Bucket for audio files, logs, backups
- Standard storage class
- Lifecycle policies: delete audio after 7 days, move logs to Coldline after 90 days

**Cloud CDN:**
- Frontend assets distribution
- Cache static content globally

### Environment Variables (Cloud Secret Manager)

```
# External APIs
GOOGLE_MAPS_API_KEY=xxx
GEMINI_API_KEY=xxx
GOOGLE_SPEECH_API_KEY=xxx

# Database
DATABASE_URL=postgresql://...
REDIS_HOST=xxx
REDIS_PORT=6379
MILVUS_HOST=xxx

# GCP
GCP_PROJECT_ID=your-project-id
GCS_BUCKET=route-app-assets
```

### CI/CD Pipeline (Cloud Build)

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/route-optimizer', '.']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/route-optimizer']
  
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'route-optimizer'
      - '--image=gcr.io/$PROJECT_ID/route-optimizer'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'

# Deployment flow:
1. Push code to GitHub
2. Cloud Build trigger activated
3. Run tests (unit + integration)
4. Build Docker containers
5. Push to Container Registry
6. Deploy to Cloud Run (staging)
7. Run smoke tests
8. Manual approval
9. Deploy to Cloud Run (production)
10. Monitor for 30 minutes
11. Auto-rollback if error rate > 1%
```

### Monitoring & Logging

**Cloud Monitoring:**
- Dashboard with key metrics (latency, error rate, traffic)
- Alerting policies for critical thresholds
- Uptime checks for API endpoints

**Cloud Logging:**
- Structured JSON logs from all Cloud Run services
- Log-based metrics for custom monitoring
- Log retention: 30 days

**Cloud Trace:**
- Distributed tracing across services
- Identify performance bottlenecks
- Latency analysis

---

## Key Configuration

### Safety Scoring Weights
```javascript
const SAFETY_WEIGHTS = {
  incident_density: 0.5,
  lighting: 0.3,
  activity: 0.2,
  nighttime_multiplier: 1.5
};
```

### Cache TTLs
```javascript
const CACHE_TTL = {
  traffic: 300,        // 5 minutes
  transit: 60,         // 1 minute
  routes: 600,         // 10 minutes
  safety_heatmap: 3600 // 1 hour
};
```

### Route Optimization Limits
```javascript
const ROUTING_CONFIG = {
  max_destinations: 10,
  max_computation_time_ms: 2000,
  alternative_routes_count: 3,
  min_time_difference_seconds: 180, // alternatives must differ by 3+ min
  max_safety_penalty_multiplier: 2.0
};
```

---

*This implementation guide provides the critical technical specifications needed to build the complete system on Google Cloud Platform. For detailed code implementation, refer to the respective service repositories.*

---

## Core Implementation

### 1. Schedule Parsing

**Input Processing:**
1. **Voice Input:** User records schedule → Google Speech-to-Text → text transcription
2. **Text Input:** User types schedule directly
3. **Calendar Sync:** Import events from Google Calendar via OAuth

**LLM Extraction:**
```
Prompt: "Extract structured schedule from: {user_input}"
Expected Output:
{
  "destinations": [
    {"name": "dentist", "address": "123 Main St", "time": "14:00", "type": "appointment"},
    {"name": "grocery store", "address": "456 Oak Ave", "time": "flexible", "type": "errand"}
  ],
  "preferences": {
    "modes": ["driving", "transit"],
    "safety_weight": 0.3,
    "time_constraints": "arrive home by 17:00"
  }
}
```

**Processing Steps:**
1. Send transcribed/typed text to LLM API
2. Parse JSON response with extracted entities
3. Geocode addresses to coordinates using Google Maps Geocoding API
4. Validate locations exist and are reachable
5. If ambiguous, prompt user for clarification
6. Store structured schedule for route generation

### 2. Traffic Data Integration

**Real-Time Traffic:**
- Poll Google Maps Distance Matrix API every 2-5 minutes
- Query: origin-destination pairs with departure time
- Store current travel times in Redis cache (TTL: 5 minutes)
- Update road segment weights in routing graph

**Predictive Traffic:**
- Historical patterns: store typical travel times by hour/day in PostgreSQL
- Short-term forecast: extrapolate current trends 15-60 minutes ahead
- Confidence intervals: provide best/typical/worst case estimates

**Data Structure (PostgreSQL):**
```sql
CREATE TABLE segment_traffic (
  segment_id INTEGER,
  timestamp TIMESTAMP,
  travel_time_seconds INTEGER,
  speed_kmh DECIMAL,
  congestion_level VARCHAR(20), -- free_flow, moderate, heavy, severe
  PRIMARY KEY (segment_id, timestamp)
);
```

### 3. Safety Scoring

**Data Sources:**
- Crime incident APIs (municipal open data, SpotCrime)
- Historical incident database
- Street lighting inventory
- Business operating hours (proxy for activity)

**Scoring Algorithm:**
```
For each road segment:
1. Count incidents within 100m buffer (last 90 days)
2. Apply temporal decay: weight = 1 / (1 + days_since_incident)
3. Severity multiplier: assault=3.0, theft=2.0, vandalism=1.0
4. Lighting score: 0.0 (well-lit) to 1.0 (no lights)
5. Activity score: business density, transit ridership
6. Composite score: 
   safety_risk = 0.5 * incident_score + 0.3 * lighting_score + 0.2 * (1 - activity_score)
7. Time-of-day adjustment: multiply by 1.5 for nighttime (6pm-6am)
8. Normalize to 0-100 scale
```

**Data Structure (PostgreSQL):**
```sql
CREATE TABLE safety_scores (
  segment_id INTEGER,
  hour_of_day INTEGER, -- 0-23
  safety_score DECIMAL, -- 0-100
  confidence DECIMAL, -- 0-1
  PRIMARY KEY (segment_id, hour_of_day)
);

CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  location GEOMETRY(Point, 4326),
  incident_type VARCHAR(50),
  severity INTEGER,
  timestamp TIMESTAMP
);
```

### 4. Route Optimization

**Graph Construction:**
```sql
-- Road network
CREATE TABLE road_segments (
  id SERIAL PRIMARY KEY,
  geometry GEOMETRY(LineString, 4326),
  from_node INTEGER,
  to_node INTEGER,
  length_meters DECIMAL,
  mode_restrictions VARCHAR[], -- ['car', 'bike', 'walk']
  speed_limit_kmh INTEGER
);

-- Spatial index for fast queries
CREATE INDEX idx_segments_geom ON road_segments USING GIST(geometry);

-- Transit network
CREATE TABLE transit_routes (
  id SERIAL PRIMARY KEY,
  route_name VARCHAR(100),
  stops JSONB, -- [{stop_id, arrival_time, departure_time}]
  service_days VARCHAR[] -- ['monday', 'tuesday', ...]
);
```

**Routing Algorithm (Time-Dependent A*):**
```
Input: origin, destination, departure_time, safety_weight, mode_preferences

1. Initialize:
   - open_set = {origin}
   - g_score[origin] = 0
   - f_score[origin] = heuristic(origin, destination)

2. While open_set not empty:
   a. current = node in open_set with lowest f_score
   b. if current == destination: return reconstruct_path()
   
   c. for each neighbor of current:
      - arrival_time = departure_time + travel_time(current, neighbor)
      - edge_cost = calculate_cost(current, neighbor, arrival_time, safety_weight)
      - tentative_g = g_score[current] + edge_cost
      
      - if tentative_g < g_score[neighbor]:
          g_score[neighbor] = tentative_g
          f_score[neighbor] = g_score[neighbor] + heuristic(neighbor, destination)
          add neighbor to open_set

3. Return no path found

calculate_cost(from, to, time, safety_weight):
  traffic_time = get_travel_time(from, to, time) -- from traffic data
  safety_penalty = get_safety_score(segment, time) * safety_weight
  return traffic_time + safety_penalty
```

**Multi-Destination Sequencing:**
```
Input: list of destinations with time windows

1. Greedy initial solution:
   - Start from origin
   - Repeatedly visit nearest unvisited destination that satisfies time constraints
   - Return to final destination

2. Iterative improvement (2-opt):
   - For each pair of edges in route:
     - Try swapping order
     - If total cost decreases and constraints satisfied: accept swap
   - Repeat until no improvement found or time budget exhausted

3. Return best route found
```

### 5. Vector Search (Semantic POI Queries)

**Setup Milvus Collection:**
```python
collection_schema = {
  "fields": [
    {"name": "place_id", "type": "INT64", "is_primary": True},
    {"name": "embedding", "type": "FLOAT_VECTOR", "dim": 384},
    {"name": "name", "type": "VARCHAR"},
    {"name": "category", "type": "VARCHAR"},
    {"name": "location", "type": "VARCHAR"}, # lat,lon as string
    {"name": "attributes", "type": "JSON"} # {lighting, wifi, ev_charging, etc}
  ]
}

# Create HNSW index
index_params = {
  "metric_type": "COSINE",
  "index_type": "HNSW",
  "params": {"M": 16, "efConstruction": 200}
}
```

**Query Processing:**
```
User query: "well-lit coffee shop within 5 minutes"

1. Generate embedding:
   - Use sentence transformer model (e.g., all-MiniLM-L6-v2)
   - query_embedding = model.encode(user_query)

2. Vector search:
   - Search Milvus for top 50 similar places (cosine similarity)
   - Filter: distance < 5-minute isochrone from route

3. Attribute filtering:
   - Filter results by attributes.lighting == true
   - Filter by attributes.category == "coffee_shop"

4. Rank and return:
   - Score = 0.6 * semantic_similarity + 0.3 * proximity + 0.1 * popularity
   - Return top 10 results
```

### 6. Navigation & Real-Time Updates

**Active Navigation Loop:**
```
1. User starts navigation with selected route

2. Every 30 seconds:
   a. Get current GPS position
   b. Map-match to nearest road segment
   c. Check if user deviated from route → trigger reroute
   
   d. Fetch updated traffic data
   e. Recalculate remaining route with current conditions
   f. If new route saves >5 minutes: notify user with alternative

3. Provide turn-by-turn instructions:
   - Next maneuver (turn left, continue straight, etc)
   - Distance to maneuver
   - Estimated arrival time
   - Lane guidance for complex intersections

4. Safety alerts:
   - If entering high-risk segment: "Approaching higher-risk area"
   - Suggest safer alternative if available
```

---

## API Endpoints

### Schedule & Route Planning

**POST /api/schedules/parse**
```json
Request:
{
  "input_text": "dentist at 2pm, grocery shopping, home by 5",
  "input_type": "text|voice|calendar",
  "audio_url": "s3://bucket/audio.wav" // if voice
}

Response:
{
  "schedule_id": "sch_123",
  "destinations": [...],
  "preferences": {...}
}
```

**POST /api/routes/generate**
```json
Request:
{
  "schedule_id": "sch_123",
  "safety_weight": 0.3, // 0.0-1.0
  "modes": ["driving", "transit", "walking"]
}

Response:
{
  "route_id": "rt_456",
  "routes": [
    {
      "total_time_minutes": 85,
      "traffic_delay_minutes": 15,
      "safety_score": 75, // 0-100, higher is safer
      "segments": [...],
      "mode_breakdown": {...}
    }
  ]
}
```

**GET /api/routes/{route_id}/navigation**
```json
Response:
{
  "current_segment": {...},
  "next_maneuver": "Turn left on Main St in 0.3 miles",
  "eta": "2024-11-04T15:30:00Z",
  "traffic_ahead": [...],
  "safety_alerts": [...]
}
```

### Real-Time Data

**GET /api/traffic/forecast**
```json
Request params: ?origin_lat=37.7749&origin_lon=-122.4194&destination_lat=...&departure_time=...

Response:
{
  "travel_time_minutes": 45,
  "confidence_interval": [40, 55],
  "congestion_segments": [...]
}
```

**GET /api/safety/heatmap**
```json
Request params: ?bounds=lat1,lon1,lat2,lon2&hour_of_day=14

Response:
{
  "grid": [[score, score, ...], ...], // safety scores for grid cells
  "resolution": 100, // meters per cell
  "incidents": [...] // recent incidents with locations
}
```

---

## Data Pipeline

### Background Jobs

**Traffic Data Refresh (every 2 minutes):**
```
1. Query Google Maps for current traffic on major roads
2. Update segment_traffic table
3. Invalidate Redis cache for affected segments
4. Trigger route recalculation for active navigations
```

**Safety Data Ingestion (every 15 minutes):**
```
1. Poll crime/incident APIs for new incidents
2. Geocode incident locations to road segments
3. Insert into incidents table
4. Recalculate safety scores for affected segments
5. Update safety_scores table
```

**Transit Schedule Sync (daily):**
```
1. Download latest GTFS-Static feeds
2. Parse routes, stops, schedules
3. Update transit_routes table
4. Fetch GTFS-Realtime for current positions (every 60 seconds)
```

**Vector Embedding Generation (weekly):**
```
1. Fetch new/updated POIs from Google Places API
2. Generate embeddings: name + category + description
3. Insert/update Milvus collection
4. Rebuild HNSW index if needed
```

---

## Mobile App Implementation

### Key Screens

**1. Schedule Input:**
- Microphone button with recording indicator
- Text input with autocomplete
- Calendar sync toggle
- Display parsed destinations for confirmation

**2. Route Planning:**
- Map showing all destinations
- Safety slider (0-100%)
- Departure time picker
- "Generate Routes" button
- Loading state with progress

**3. Route Selection:**
- List of 2-3 alternative routes
- Cards showing: time, traffic delay, safety score, mode icons
- Tap to view detailed map
- "Start Navigation" button

**4. Active Navigation:**
- Full-screen map with route overlay
- Current position indicator
- Next turn instruction bar at top
- ETA and distance remaining
- Reroute notifications

**5. Settings:**
- Default safety preference
- Saved places (home, work)
- Calendar integration
- Privacy controls

### State Management

**React Native Context/Redux Store:**
```javascript
{
  user: {
    preferences: {safety_weight, default_modes, saved_places},
    calendar_token: oauth_token
  },
  schedule: {
    destinations: [...],
    parsed: true
  },
  routes: {
    alternatives: [...],
    selected: route_id,
    navigation_active: boolean
  },
  realtime: {
    current_position: {lat, lon},
    traffic_updates: [...],
    safety_alerts: [...]
  }
}
```

### API Integration

**Schedule Parsing Flow:**
```javascript
// Voice input
const audioBlob = await recordAudio();
const audioUrl = await uploadToS3(audioBlob);
const transcription = await speechToText(audioUrl);
const schedule = await api.post('/schedules/parse', {
  input_text: transcription,
  input_type: 'voice'
});

// Calendar sync
const events = await googleCalendar.getEvents(startDate, endDate);
const schedule = await api.post('/schedules/parse', {
  calendar_events: events,
  input_type: 'calendar'
});
```

**Route Generation:**
```javascript
const routes = await api.post('/routes/generate', {
  schedule_id: schedule.id,
  safety_weight: userPreferences.safety_weight,
  modes: userPreferences.modes
});

// Display alternatives
routes.forEach(route => {
  displayRouteCard(route);
});
```

**Navigation Updates:**
```javascript
// Poll every 30 seconds
setInterval(async () => {
  const position = await getCurrentPosition();
  const navUpdate = await api.get(`/routes/${routeId}/navigation`, {
    params: {current_lat: position.lat, current_lon: position.lon}
  });
  
  updateMapPosition(position);
  updateNextManeuver(navUpdate.next_maneuver);
  
  if (navUpdate.reroute_available) {
    showRerouteNotification(navUpdate.alternative_route);
  }
}, 30000);
```

---

## Deployment

### Infrastructure Setup (Terraform/CloudFormation)

**Lambda Functions:**
- scheduleParser: 1GB memory, 30s timeout
- routeOptimizer: 2GB memory, 30s timeout
- safetyScorer: 512MB memory, 10s timeout
- navigationService: 512MB memory, 10s timeout

**Database:**
- PostgreSQL 14 + PostGIS 3.3
- Instance: db.r6g.xlarge (multi-AZ)
- Storage: 500GB SSD

**Cache:**
- Redis 7.0
- Instance: cache.r6g.large
- Eviction policy: LRU

**API Gateway:**
- REST API with regional endpoint
- API key authentication
- Rate limit: 100 requests/hour per user
- CORS enabled

### Environment Variables

```
# External APIs
GOOGLE_MAPS_API_KEY=xxx
LLM_API_KEY=xxx (Claude or OpenAI)
GOOGLE_SPEECH_API_KEY=xxx

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
MILVUS_HOST=xxx

# AWS
AWS_REGION=us-west-2
S3_BUCKET=route-app-assets
```

### CI/CD Pipeline (GitHub Actions)

```yaml
on: push to main

jobs:
  1. Run tests (unit + integration)
  2. Build Lambda packages
  3. Deploy to staging
  4. Run smoke tests
  5. Manual approval
  6. Deploy to production (blue-green)
  7. Monitor for 30 minutes
  8. Auto-rollback if error rate > 1%
```

---

## Key Configuration

### Safety Scoring Weights
```javascript
const SAFETY_WEIGHTS = {
  incident_density: 0.5,
  lighting: 0.3,
  activity: 0.2,
  nighttime_multiplier: 1.5
};
```

### Cache TTLs
```javascript
const CACHE_TTL = {
  traffic: 300,        // 5 minutes
  transit: 60,         // 1 minute
  routes: 600,         // 10 minutes
  safety_heatmap: 3600 // 1 hour
};
```

### Route Optimization Limits
```javascript
const ROUTING_CONFIG = {
  max_destinations: 10,
  max_computation_time_ms: 2000,
  alternative_routes_count: 3,
  min_time_difference_seconds: 180, // alternatives must differ by 3+ min
  max_safety_penalty_multiplier: 2.0
};
```

---

*This implementation guide provides the critical technical specifications needed to build the complete system. For detailed code implementation, refer to the respective service repositories.*