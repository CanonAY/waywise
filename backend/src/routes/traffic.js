const express = require('express');
const { query, validationResult } = require('express-validator');
const router = express.Router();

// Mock traffic data function
const getTrafficForecast = async (origin, destination, departureTime) => {
  // This would integrate with Google Maps Distance Matrix API
  // For MVP, we'll return mock traffic data

  return {
    origin,
    destination,
    departure_time: departureTime,
    travel_time: {
      typical_minutes: 12,
      current_minutes: 18,
      best_case_minutes: 10,
      worst_case_minutes: 25
    },
    traffic_conditions: "moderate",
    delay_minutes: 6,
    confidence: 0.85,
    retrieved_at: new Date().toISOString()
  };
};

// Get traffic forecast endpoint
router.get('/forecast', [
  query('origin_lat').isFloat({ min: -90, max: 90 }),
  query('origin_lon').isFloat({ min: -180, max: 180 }),
  query('dest_lat').isFloat({ min: -90, max: 90 }),
  query('dest_lon').isFloat({ min: -180, max: 180 }),
  query('departure_time').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: errors.array()
        }
      });
    }

    const {
      origin_lat,
      origin_lon,
      dest_lat,
      dest_lon,
      departure_time = new Date().toISOString()
    } = req.query;

    const origin = {
      lat: parseFloat(origin_lat),
      lon: parseFloat(origin_lon)
    };

    const destination = {
      lat: parseFloat(dest_lat),
      lon: parseFloat(dest_lon)
    };

    // Get traffic forecast
    const forecast = await getTrafficForecast(origin, destination, departure_time);

    res.status(200).json(forecast);

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Traffic forecast failed'
      }
    });
  }
});

module.exports = router;