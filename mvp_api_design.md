# Route Optimization API - MVP Design

## Base URL
```
Production: https://api.routeoptimizer.app
Staging: https://staging-api.routeoptimizer.app
```

## Authentication

### JWT Bearer Token
```
Header: Authorization: Bearer {jwt_token}
```

All endpoints (except `/auth/*`) require a valid JWT token in the Authorization header.

**Token Format:**
```json
{
  "sub": "user_123",
  "email": "user@example.com",
  "iat": 1699531200,
  "exp": 1699617600
}
```

**Token Expiration:** 24 hours

---

## Authentication Endpoints

### Register User

**POST** `/api/v1/auth/register`

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "user_id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2024-11-09T10:30:00Z"
}
```

**Error Response:** `409 Conflict`
```json
{
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "Email already registered"
  }
}
```

### Login

**POST** `/api/v1/auth/login`

Authenticate and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "user_id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

### Refresh Token

**POST** `/api/v1/auth/refresh`

Refresh an expired or soon-to-expire token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

---

## Endpoints

### 1. Parse Schedule

**POST** `/api/v1/schedules/parse`

Parse natural language schedule into structured destinations.

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request:**
```json
{
  "schedule_text": "dentist at 2pm, then grocery store, home by 5pm",
  "timezone": "America/Los_Angeles"
}
```

**Response:** `200 OK`
```json
{
  "schedule_id": "sch_a1b2c3d4",
  "user_id": "user_123",
  "destinations": [
    {
      "id": "dest_1",
      "name": "dentist",
      "address": "123 Main St, San Francisco, CA",
      "coordinates": {
        "lat": 37.7749,
        "lon": -122.4194
      },
      "time_constraint": {
        "type": "arrive_by",
        "time": "14:00"
      },
      "required": true
    },
    {
      "id": "dest_2",
      "name": "grocery store",
      "address": "456 Oak Ave, San Francisco, CA",
      "coordinates": {
        "lat": 37.7849,
        "lon": -122.4094
      },
      "time_constraint": {
        "type": "flexible",
        "time": null
      },
      "required": true
    },
    {
      "id": "dest_3",
      "name": "home",
      "address": "789 Pine St, San Francisco, CA",
      "coordinates": {
        "lat": 37.7949,
        "lon": -122.3994
      },
      "time_constraint": {
        "type": "arrive_by",
        "time": "17:00"
      },
      "required": true
    }
  ],
  "ambiguities": [
    {
      "destination_id": "dest_2",
      "issue": "multiple_locations",
      "message": "Multiple grocery stores found. Please specify which one.",
      "suggestions": [
        "Safeway on Oak Ave",
        "Whole Foods on Market St"
      ]
    }
  ],
  "created_at": "2024-11-09T10:30:00Z"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "INVALID_SCHEDULE",
    "message": "Could not parse schedule text",
    "details": "No destinations found in the provided text"
  }
}
```

**Error Response:** `422 Unprocessable Entity`
```json
{
  "error": {
    "code": "AMBIGUOUS_SCHEDULE",
    "message": "Schedule contains ambiguities that require clarification",
    "ambiguities": [...]
  }
}
```

---

### 2. Optimize Route

**POST** `/api/v1/routes/optimize`

Generate optimized route based on parsed schedule and current traffic.

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request:**
```json
{
  "schedule_id": "sch_a1b2c3d4",
  "origin": {
    "lat": 37.7649,
    "lon": -122.4294
  },
  "departure_time": "2024-11-09T13:00:00Z",
  "preferences": {
    "avoid_tolls": false,
    "avoid_highways": false
  }
}
```

**Alternative Request (without schedule_id):**
```json
{
  "destinations": [
    {
      "name": "dentist",
      "coordinates": {"lat": 37.7749, "lon": -122.4194},
      "time_constraint": {"type": "arrive_by", "time": "14:00"}
    },
    {
      "name": "grocery store",
      "coordinates": {"lat": 37.7849, "lon": -122.4094},
      "time_constraint": {"type": "flexible"}
    }
  ],
  "origin": {"lat": 37.7649, "lon": -122.4294},
  "departure_time": "2024-11-09T13:00:00Z"
}
```

**Response:** `200 OK`
```json
{
  "route_id": "rt_x1y2z3",
  "user_id": "user_123",
  "optimized_sequence": [
    {
      "order": 1,
      "destination": {
        "id": "dest_1",
        "name": "dentist",
        "address": "123 Main St, San Francisco, CA",
        "coordinates": {"lat": 37.7749, "lon": -122.4194}
      },
      "arrival_time": "2024-11-09T13:45:00Z",
      "departure_time": "2024-11-09T14:30:00Z",
      "travel_time_from_previous_minutes": 45,
      "traffic_delay_minutes": 15
    },
    {
      "order": 2,
      "destination": {
        "id": "dest_2",
        "name": "grocery store",
        "address": "456 Oak Ave, San Francisco, CA",
        "coordinates": {"lat": 37.7849, "lon": -122.4094}
      },
      "arrival_time": "2024-11-09T14:42:00Z",
      "departure_time": "2024-11-09T15:12:00Z",
      "travel_time_from_previous_minutes": 12,
      "traffic_delay_minutes": 3
    },
    {
      "order": 3,
      "destination": {
        "id": "dest_3",
        "name": "home",
        "address": "789 Pine St, San Francisco, CA",
        "coordinates": {"lat": 37.7949, "lon": -122.3994}
      },
      "arrival_time": "2024-11-09T15:27:00Z",
      "travel_time_from_previous_minutes": 15,
      "traffic_delay_minutes": 5
    }
  ],
  "summary": {
    "total_distance_meters": 15000,
    "total_time_minutes": 147,
    "total_traffic_delay_minutes": 23,
    "departure_time": "2024-11-09T13:00:00Z",
    "arrival_time": "2024-11-09T15:27:00Z"
  },
  "polyline": "encoded_polyline_string_here",
  "created_at": "2024-11-09T10:32:00Z",
  "expires_at": "2024-11-09T11:32:00Z"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "INFEASIBLE_SCHEDULE",
    "message": "Cannot satisfy all time constraints",
    "details": "Cannot arrive at 'dentist' by 14:00 with current traffic. Earliest arrival: 14:15"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": {
    "code": "SCHEDULE_NOT_FOUND",
    "message": "Schedule ID does not exist or has expired"
  }
}
```

---

### 3. Get Route Details

**GET** `/api/v1/routes/{route_id}`

Retrieve detailed turn-by-turn directions for a route.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:** `200 OK`
```json
{
  "route_id": "rt_x1y2z3",
  "user_id": "user_123",
  "optimized_sequence": [...],
  "summary": {...},
  "polyline": "encoded_polyline_string",
  "steps": [
    {
      "instruction": "Head north on Main St",
      "distance_meters": 500,
      "duration_seconds": 120,
      "start_location": {"lat": 37.7649, "lon": -122.4294},
      "end_location": {"lat": 37.7699, "lon": -122.4294},
      "maneuver": "straight"
    },
    {
      "instruction": "Turn right onto Oak Ave",
      "distance_meters": 800,
      "duration_seconds": 180,
      "start_location": {"lat": 37.7699, "lon": -122.4294},
      "end_location": {"lat": 37.7749, "lon": -122.4194},
      "maneuver": "turn-right"
    }
  ],
  "created_at": "2024-11-09T10:32:00Z",
  "expires_at": "2024-11-09T11:32:00Z"
}
```

**Error Response:** `403 Forbidden`
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this route"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Route ID does not exist or has expired"
  }
}
```

---

### 4. Get Traffic Forecast

**GET** `/api/v1/traffic/forecast`

Get predicted traffic conditions for a specific route segment.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `origin_lat` (required): Origin latitude
- `origin_lon` (required): Origin longitude
- `dest_lat` (required): Destination latitude
- `dest_lon` (required): Destination longitude
- `departure_time` (optional): ISO 8601 timestamp, defaults to now

**Example:**
```
GET /api/v1/traffic/forecast?origin_lat=37.7749&origin_lon=-122.4194&dest_lat=37.7849&dest_lon=-122.4094&departure_time=2024-11-09T14:00:00Z
```

**Response:** `200 OK`
```json
{
  "origin": {"lat": 37.7749, "lon": -122.4194},
  "destination": {"lat": 37.7849, "lon": -122.4094},
  "departure_time": "2024-11-09T14:00:00Z",
  "travel_time": {
    "typical_minutes": 12,
    "current_minutes": 18,
    "best_case_minutes": 10,
    "worst_case_minutes": 25
  },
  "traffic_conditions": "moderate",
  "delay_minutes": 6,
  "confidence": 0.85,
  "retrieved_at": "2024-11-09T10:35:00Z"
}
```

---

### 5. Get User Routes History

**GET** `/api/v1/users/me/routes`

Get all routes created by the authenticated user.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `limit` (optional): Number of results, default 20, max 100
- `offset` (optional): Pagination offset, default 0

**Response:** `200 OK`
```json
{
  "routes": [
    {
      "route_id": "rt_x1y2z3",
      "summary": {
        "total_distance_meters": 15000,
        "total_time_minutes": 147,
        "total_traffic_delay_minutes": 23,
        "departure_time": "2024-11-09T13:00:00Z",
        "arrival_time": "2024-11-09T15:27:00Z"
      },
      "destination_count": 3,
      "created_at": "2024-11-09T10:32:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 45
  }
}
```

---

### 6. Health Check

**GET** `/api/v1/health`

Check API health status. **No authentication required.**

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-11-09T10:36:00Z",
  "services": {
    "database": "healthy",
    "google_maps": "healthy",
    "gemini": "healthy"
  }
}
```

**Response:** `503 Service Unavailable`
```json
{
  "status": "degraded",
  "version": "1.0.0",
  "timestamp": "2024-11-09T10:36:00Z",
  "services": {
    "database": "healthy",
    "google_maps": "unhealthy",
    "gemini": "healthy"
  }
}
```

---

## Common Error Responses

### Unauthorized (Missing or Invalid Token)
**Response:** `401 Unauthorized`
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

### Token Expired
**Response:** `401 Unauthorized`
```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Authentication token has expired",
    "details": "Please refresh your token"
  }
}
```

### Forbidden (Valid Token, Insufficient Permission)
**Response:** `403 Forbidden`
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

### Rate Limit Exceeded
**Response:** `429 Too Many Requests`
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "retry_after_seconds": 60
  }
}
```

### Server Error
**Response:** `500 Internal Server Error`
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "request_id": "req_abc123"
  }
}
```

---

## Rate Limits

**MVP Limits (per user):**
- 100 requests per hour
- 1000 requests per day

**Headers returned with every response:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699531200
```

---

## Security

### JWT Token Generation
```javascript
// Server-side implementation
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    process.env.JWT_SECRET,
    { algorithm: 'HS256' }
  );
}
```

### Token Verification Middleware
```javascript
// Express middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing authentication token'
      }
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired'
        }
      });
    }
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    });
  }
}
```

### Password Hashing
```javascript
const bcrypt = require('bcrypt');

// Hash password on registration
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Verify password on login
async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}
```

---

## Data Models

### User Object
```typescript
{
  user_id: string;
  email: string;
  name: string;
  created_at: string; // ISO 8601
}
```

### Destination Object
```typescript
{
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  time_constraint: {
    type: "arrive_by" | "depart_after" | "flexible";
    time: string | null; // ISO 8601
  };
  required: boolean;
}
```

### Route Summary Object
```typescript
{
  total_distance_meters: number;
  total_time_minutes: number;
  total_traffic_delay_minutes: number;
  departure_time: string; // ISO 8601
  arrival_time: string; // ISO 8601
}
```

### Error Object
```typescript
{
  error: {
    code: string;
    message: string;
    details?: string;
    request_id?: string;
  }
}
```

---

## Implementation Notes

### JWT Storage (Client-Side)
- **Mobile App:** Store in secure storage (iOS Keychain, Android KeyStore)
- **Web App:** Store in memory or httpOnly cookies (not localStorage)

### Token Refresh Strategy
- Refresh token when it's within 1 hour of expiration
- Implement automatic retry with new token on 401 responses

### Idempotency
- Schedule parsing is idempotent: same text returns same schedule_id
- Route optimization is not idempotent: traffic changes over time

### Caching
- Parsed schedules: cached for 1 hour per user
- Optimized routes: cached for 10 minutes per user
- Traffic forecasts: cached for 5 minutes (shared across users)

### Timeouts
- Schedule parsing: 10 seconds
- Route optimization: 30 seconds
- Traffic forecast: 5 seconds

---

## Example Usage Flow

### 1. Register and login
```bash
# Register
curl -X POST https://api.routeoptimizer.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "John Doe"
  }'

# Login
curl -X POST https://api.routeoptimizer.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'

# Save the access_token from response
```

### 2. Parse user's schedule
```bash
curl -X POST https://api.routeoptimizer.app/api/v1/schedules/parse \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_text": "dentist at 2pm, grocery store, home by 5",
    "timezone": "America/Los_Angeles"
  }'
```

### 3. Optimize route
```bash
curl -X POST https://api.routeoptimizer.app/api/v1/routes/optimize \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_id": "sch_a1b2c3d4",
    "origin": {"lat": 37.7649, "lon": -122.4294},
    "departure_time": "2024-11-09T13:00:00Z"
  }'
```

### 4. Get detailed directions
```bash
curl -X GET https://api.routeoptimizer.app/api/v1/routes/rt_x1y2z3 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Testing Endpoints

### Staging Environment
```
Base URL: https://staging-api.routeoptimizer.app
Test User: test@example.com
Test Password: testPassword123
```

### Test Data
```json
{
  "schedule_text": "coffee shop at 9am, office at 10am, lunch at 12pm",
  "timezone": "America/Los_Angeles"
}
```

Expected response will use mock traffic data with predictable delays.

---

*This API design uses JWT authentication for secure user-specific access while maintaining simplicity for MVP deployment.*

### 1. Parse Schedule

**POST** `/api/v1/schedules/parse`

Parse natural language schedule into structured destinations.

**Request:**
```json
{
  "schedule_text": "dentist at 2pm, then grocery store, home by 5pm",
  "timezone": "America/Los_Angeles"
}
```

**Response:** `200 OK`
```json
{
  "schedule_id": "sch_a1b2c3d4",
  "destinations": [
    {
      "id": "dest_1",
      "name": "dentist",
      "address": "123 Main St, San Francisco, CA",
      "coordinates": {
        "lat": 37.7749,
        "lon": -122.4194
      },
      "time_constraint": {
        "type": "arrive_by",
        "time": "14:00"
      },
      "required": true
    },
    {
      "id": "dest_2",
      "name": "grocery store",
      "address": "456 Oak Ave, San Francisco, CA",
      "coordinates": {
        "lat": 37.7849,
        "lon": -122.4094
      },
      "time_constraint": {
        "type": "flexible",
        "time": null
      },
      "required": true
    },
    {
      "id": "dest_3",
      "name": "home",
      "address": "789 Pine St, San Francisco, CA",
      "coordinates": {
        "lat": 37.7949,
        "lon": -122.3994
      },
      "time_constraint": {
        "type": "arrive_by",
        "time": "17:00"
      },
      "required": true
    }
  ],
  "ambiguities": [
    {
      "destination_id": "dest_2",
      "issue": "multiple_locations",
      "message": "Multiple grocery stores found. Please specify which one.",
      "suggestions": [
        "Safeway on Oak Ave",
        "Whole Foods on Market St"
      ]
    }
  ],
  "created_at": "2024-11-09T10:30:00Z"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "INVALID_SCHEDULE",
    "message": "Could not parse schedule text",
    "details": "No destinations found in the provided text"
  }
}
```

**Error Response:** `422 Unprocessable Entity`
```json
{
  "error": {
    "code": "AMBIGUOUS_SCHEDULE",
    "message": "Schedule contains ambiguities that require clarification",
    "ambiguities": [...]
  }
}
```

---

### 2. Optimize Route

**POST** `/api/v1/routes/optimize`

Generate optimized route based on parsed schedule and current traffic.

**Request:**
```json
{
  "schedule_id": "sch_a1b2c3d4",
  "origin": {
    "lat": 37.7649,
    "lon": -122.4294
  },
  "departure_time": "2024-11-09T13:00:00Z",
  "preferences": {
    "avoid_tolls": false,
    "avoid_highways": false
  }
}
```

**Alternative Request (without schedule_id):**
```json
{
  "destinations": [
    {
      "name": "dentist",
      "coordinates": {"lat": 37.7749, "lon": -122.4194},
      "time_constraint": {"type": "arrive_by", "time": "14:00"}
    },
    {
      "name": "grocery store",
      "coordinates": {"lat": 37.7849, "lon": -122.4094},
      "time_constraint": {"type": "flexible"}
    }
  ],
  "origin": {"lat": 37.7649, "lon": -122.4294},
  "departure_time": "2024-11-09T13:00:00Z"
}
```

**Response:** `200 OK`
```json
{
  "route_id": "rt_x1y2z3",
  "optimized_sequence": [
    {
      "order": 1,
      "destination": {
        "id": "dest_1",
        "name": "dentist",
        "address": "123 Main St, San Francisco, CA",
        "coordinates": {"lat": 37.7749, "lon": -122.4194}
      },
      "arrival_time": "2024-11-09T13:45:00Z",
      "departure_time": "2024-11-09T14:30:00Z",
      "travel_time_from_previous_minutes": 45,
      "traffic_delay_minutes": 15
    },
    {
      "order": 2,
      "destination": {
        "id": "dest_2",
        "name": "grocery store",
        "address": "456 Oak Ave, San Francisco, CA",
        "coordinates": {"lat": 37.7849, "lon": -122.4094}
      },
      "arrival_time": "2024-11-09T14:42:00Z",
      "departure_time": "2024-11-09T15:12:00Z",
      "travel_time_from_previous_minutes": 12,
      "traffic_delay_minutes": 3
    },
    {
      "order": 3,
      "destination": {
        "id": "dest_3",
        "name": "home",
        "address": "789 Pine St, San Francisco, CA",
        "coordinates": {"lat": 37.7949, "lon": -122.3994}
      },
      "arrival_time": "2024-11-09T15:27:00Z",
      "travel_time_from_previous_minutes": 15,
      "traffic_delay_minutes": 5
    }
  ],
  "summary": {
    "total_distance_meters": 15000,
    "total_time_minutes": 147,
    "total_traffic_delay_minutes": 23,
    "departure_time": "2024-11-09T13:00:00Z",
    "arrival_time": "2024-11-09T15:27:00Z"
  },
  "polyline": "encoded_polyline_string_here",
  "created_at": "2024-11-09T10:32:00Z",
  "expires_at": "2024-11-09T11:32:00Z"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "error": {
    "code": "INFEASIBLE_SCHEDULE",
    "message": "Cannot satisfy all time constraints",
    "details": "Cannot arrive at 'dentist' by 14:00 with current traffic. Earliest arrival: 14:15"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": {
    "code": "SCHEDULE_NOT_FOUND",
    "message": "Schedule ID does not exist or has expired"
  }
}
```

---

### 3. Get Route Details

**GET** `/api/v1/routes/{route_id}`

Retrieve detailed turn-by-turn directions for a route.

**Response:** `200 OK`
```json
{
  "route_id": "rt_x1y2z3",
  "optimized_sequence": [...],
  "summary": {...},
  "polyline": "encoded_polyline_string",
  "steps": [
    {
      "instruction": "Head north on Main St",
      "distance_meters": 500,
      "duration_seconds": 120,
      "start_location": {"lat": 37.7649, "lon": -122.4294},
      "end_location": {"lat": 37.7699, "lon": -122.4294},
      "maneuver": "straight"
    },
    {
      "instruction": "Turn right onto Oak Ave",
      "distance_meters": 800,
      "duration_seconds": 180,
      "start_location": {"lat": 37.7699, "lon": -122.4294},
      "end_location": {"lat": 37.7749, "lon": -122.4194},
      "maneuver": "turn-right"
    }
  ],
  "created_at": "2024-11-09T10:32:00Z",
  "expires_at": "2024-11-09T11:32:00Z"
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Route ID does not exist or has expired"
  }
}
```

---

### 4. Get Traffic Forecast

**GET** `/api/v1/traffic/forecast`

Get predicted traffic conditions for a specific route segment.

**Query Parameters:**
- `origin_lat` (required): Origin latitude
- `origin_lon` (required): Origin longitude
- `dest_lat` (required): Destination latitude
- `dest_lon` (required): Destination longitude
- `departure_time` (optional): ISO 8601 timestamp, defaults to now

**Example:**
```
GET /api/v1/traffic/forecast?origin_lat=37.7749&origin_lon=-122.4194&dest_lat=37.7849&dest_lon=-122.4094&departure_time=2024-11-09T14:00:00Z
```

**Response:** `200 OK`
```json
{
  "origin": {"lat": 37.7749, "lon": -122.4194},
  "destination": {"lat": 37.7849, "lon": -122.4094},
  "departure_time": "2024-11-09T14:00:00Z",
  "travel_time": {
    "typical_minutes": 12,
    "current_minutes": 18,
    "best_case_minutes": 10,
    "worst_case_minutes": 25
  },
  "traffic_conditions": "moderate",
  "delay_minutes": 6,
  "confidence": 0.85,
  "retrieved_at": "2024-11-09T10:35:00Z"
}
```

---

### 5. Health Check

**GET** `/api/v1/health`

Check API health status.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-11-09T10:36:00Z",
  "services": {
    "database": "healthy",
    "google_maps": "healthy",
    "gemini": "healthy"
  }
}
```

**Response:** `503 Service Unavailable`
```json
{
  "status": "degraded",
  "version": "1.0.0",
  "timestamp": "2024-11-09T10:36:00Z",
  "services": {
    "database": "healthy",
    "google_maps": "unhealthy",
    "gemini": "healthy"
  }
}
```

---

## Common Error Responses

### Rate Limit Exceeded
**Response:** `429 Too Many Requests`
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "retry_after_seconds": 60
  }
}
```

### Unauthorized
**Response:** `401 Unauthorized`
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  }
}
```

### Server Error
**Response:** `500 Internal Server Error`
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "request_id": "req_abc123"
  }
}
```

---

## Rate Limits

**MVP Limits:**
- 100 requests per hour per API key
- 1000 requests per day per API key

**Headers returned with every response:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699531200
```

---

## Data Models

### Destination Object
```typescript
{
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  time_constraint: {
    type: "arrive_by" | "depart_after" | "flexible";
    time: string | null; // ISO 8601
  };
  required: boolean;
}
```

### Route Summary Object
```typescript
{
  total_distance_meters: number;
  total_time_minutes: number;
  total_traffic_delay_minutes: number;
  departure_time: string; // ISO 8601
  arrival_time: string; // ISO 8601
}
```

### Error Object
```typescript
{
  error: {
    code: string;
    message: string;
    details?: string;
    request_id?: string;
  }
}
```

---

## Implementation Notes

### Idempotency
- Schedule parsing is idempotent: same text returns same schedule_id
- Route optimization is not idempotent: traffic changes over time

### Caching
- Parsed schedules: cached for 1 hour
- Optimized routes: cached for 10 minutes
- Traffic forecasts: cached for 5 minutes

### Timeouts
- Schedule parsing: 10 seconds
- Route optimization: 30 seconds
- Traffic forecast: 5 seconds

### Pagination
Not needed for MVP (max 10 destinations per route)

---

## Example Usage Flow

### 1. Parse user's schedule
```bash
curl -X POST https://api.routeoptimizer.app/api/v1/schedules/parse \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_text": "dentist at 2pm, grocery store, home by 5",
    "timezone": "America/Los_Angeles"
  }'
```

### 2. Optimize route
```bash
curl -X POST https://api.routeoptimizer.app/api/v1/routes/optimize \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_id": "sch_a1b2c3d4",
    "origin": {"lat": 37.7649, "lon": -122.4294},
    "departure_time": "2024-11-09T13:00:00Z"
  }'
```

### 3. Get detailed directions
```bash
curl -X GET https://api.routeoptimizer.app/api/v1/routes/rt_x1y2z3 \
  -H "X-API-Key: your_api_key"
```

---

## Testing Endpoints

### Staging Environment
```
Base URL: https://staging-api.routeoptimizer.app
Test API Key: test_key_abc123
```

### Test Data
```json
{
  "schedule_text": "coffee shop at 9am, office at 10am, lunch at 12pm",
  "timezone": "America/Los_Angeles"
}
```

Expected response will use mock traffic data with predictable delays.

---

*This API design prioritizes simplicity and clarity for MVP while maintaining extensibility for future features.*