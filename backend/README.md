# Waywise Backend

AI-powered route optimization backend service for the Waywise mobile application.

## Features

- **Schedule Parsing**: Natural language processing to extract destinations from user input
- **Route Optimization**: Generate optimized routes considering traffic and user preferences
- **Traffic Integration**: Real-time traffic data integration (Google Maps API)
- **User Management**: JWT-based authentication and user management
- **RESTful API**: Clean REST endpoints for mobile app integration

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with PostGIS
- **Authentication**: JWT
- **External APIs**: Google Maps, Gemini AI
- **Deployment**: Docker, Google Cloud Run

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL with PostGIS
- Google Maps API key
- Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your API keys and database connection

5. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### Docker Development

```bash
# From the root directory
docker-compose up -d
```

This starts:
- Backend API on port 3000
- PostgreSQL database on port 5432
- PgAdmin (optional) on port 8080

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login

### Schedule & Routes
- `POST /api/v1/schedules/parse` - Parse natural language schedule
- `POST /api/v1/routes/optimize` - Generate optimized route
- `GET /api/v1/routes/:routeId` - Get route details

### Traffic
- `GET /api/v1/traffic/forecast` - Get traffic forecast

### System
- `GET /api/v1/health` - Health check

## Development

```bash
# Development with auto-reload
npm run dev

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
├── config/         # Database and external service configurations
├── controllers/    # Request handlers (future)
├── middleware/     # Custom middleware (auth, error handling)
├── models/         # Data models (future)
├── routes/         # API route definitions
├── services/       # Business logic services (future)
├── utils/          # Utility functions
└── app.js         # Express app setup
```

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `GEMINI_API_KEY` - Gemini AI API key

## Deployment

### Docker

```bash
docker build -t waywise-backend .
docker run -p 3000:3000 waywise-backend
```

### Google Cloud Run

The app is configured for deployment to Google Cloud Run. See the technical specification for detailed deployment instructions.

## License

MIT