-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedules table
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    schedule_id UUID UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(user_id),
    original_text TEXT NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    destinations JSONB NOT NULL,
    ambiguities JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    route_id UUID UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(user_id),
    schedule_id UUID REFERENCES schedules(schedule_id),
    optimized_sequence JSONB NOT NULL,
    summary JSONB NOT NULL,
    polyline TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Road segments table (for future traffic/safety data)
CREATE TABLE road_segments (
    id SERIAL PRIMARY KEY,
    geometry GEOMETRY(LineString, 4326),
    from_node INTEGER,
    to_node INTEGER,
    length_meters DECIMAL,
    mode_restrictions VARCHAR[] DEFAULT '{}',
    speed_limit_kmh INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for road segments
CREATE INDEX idx_road_segments_geom ON road_segments USING GIST(geometry);

-- Incidents table (for future safety scoring)
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    location GEOMETRY(Point, 4326),
    incident_type VARCHAR(50),
    severity INTEGER,
    description TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for incidents
CREATE INDEX idx_incidents_location ON incidents USING GIST(location);

-- Traffic data table (for future traffic analysis)
CREATE TABLE traffic_data (
    id SERIAL PRIMARY KEY,
    segment_id INTEGER REFERENCES road_segments(id),
    timestamp TIMESTAMP NOT NULL,
    travel_time_seconds INTEGER,
    speed_kmh DECIMAL,
    congestion_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_created_at ON schedules(created_at);
CREATE INDEX idx_routes_user_id ON routes(user_id);
CREATE INDEX idx_routes_created_at ON routes(created_at);
CREATE INDEX idx_routes_expires_at ON routes(expires_at);
CREATE INDEX idx_traffic_data_segment_timestamp ON traffic_data(segment_id, timestamp);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();