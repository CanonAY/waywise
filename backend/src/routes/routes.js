const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Mock route storage for MVP
const routes = new Map();

// Mock route optimization function
const optimizeRoute = async (destinations, origin, departureTime, preferences = {}) => {
  // This would integrate with actual Google Maps API and optimization algorithms
  // For MVP, we'll return mock optimized route data

  const mockOptimizedSequence = destinations.map((dest, index) => ({
    order: index + 1,
    destination: dest,
    arrival_time: new Date(Date.now() + (index + 1) * 45 * 60000).toISOString(),
    departure_time: new Date(Date.now() + (index + 1) * 45 * 60000 + 30 * 60000).toISOString(),
    travel_time_from_previous_minutes: 45,
    traffic_delay_minutes: 15
  }));

  return {
    optimized_sequence: mockOptimizedSequence,
    summary: {
      total_distance_meters: 15000,
      total_time_minutes: 147,
      total_traffic_delay_minutes: 23,
      departure_time: departureTime,
      arrival_time: mockOptimizedSequence[mockOptimizedSequence.length - 1]?.arrival_time
    },
    polyline: "encoded_polyline_string_here"
  };
};

// Generate route steps (turn-by-turn directions)
const generateRouteSteps = () => {
  return [
    {
      instruction: "Head north on Main St",
      distance_meters: 500,
      duration_seconds: 120,
      start_location: { lat: 37.7649, lon: -122.4294 },
      end_location: { lat: 37.7699, lon: -122.4294 },
      maneuver: "straight"
    },
    {
      instruction: "Turn right onto Oak Ave",
      distance_meters: 800,
      duration_seconds: 180,
      start_location: { lat: 37.7699, lon: -122.4294 },
      end_location: { lat: 37.7749, lon: -122.4194 },
      maneuver: "turn-right"
    }
  ];
};

// Optimize route endpoint
router.post('/optimize', [
  body('schedule_id').optional().isString(),
  body('destinations').optional().isArray(),
  body('origin').isObject(),
  body('departure_time').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const { schedule_id, destinations, origin, departure_time, preferences } = req.body;
    const userId = req.user.sub;

    let routeDestinations = destinations;

    // If schedule_id provided, get destinations from stored schedule
    if (schedule_id) {
      // This would fetch from database
      // For MVP, return mock data or error
      if (!routeDestinations) {
        return res.status(404).json({
          error: {
            code: 'SCHEDULE_NOT_FOUND',
            message: 'Schedule ID does not exist or has expired'
          }
        });
      }
    }

    if (!routeDestinations || routeDestinations.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'No destinations provided'
        }
      });
    }

    // Optimize route
    const optimizedData = await optimizeRoute(
      routeDestinations,
      origin,
      departure_time,
      preferences
    );

    // Create route object
    const route = {
      route_id: uuidv4(),
      user_id: userId,
      ...optimizedData,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    };

    // Store route
    routes.set(route.route_id, route);

    res.status(200).json(route);

  } catch (error) {
    if (error.message.includes('infeasible')) {
      return res.status(400).json({
        error: {
          code: 'INFEASIBLE_SCHEDULE',
          message: 'Cannot satisfy all time constraints',
          details: error.message
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Route optimization failed'
      }
    });
  }
});

// Get route details
router.get('/:routeId', (req, res) => {
  const { routeId } = req.params;
  const userId = req.user.sub;

  const route = routes.get(routeId);

  if (!route) {
    return res.status(404).json({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route ID does not exist or has expired'
      }
    });
  }

  if (route.user_id !== userId) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have access to this route'
      }
    });
  }

  // Add turn-by-turn steps
  const routeWithSteps = {
    ...route,
    steps: generateRouteSteps()
  };

  res.status(200).json(routeWithSteps);
});

module.exports = router;