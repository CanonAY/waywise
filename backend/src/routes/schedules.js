const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Mock schedule storage for MVP
const schedules = new Map();

// Mock Gemini API call for schedule parsing
const parseScheduleText = async (scheduleText) => {
  // This would integrate with actual Gemini API
  // For MVP, we'll return mock structured data

  const mockDestinations = [
    {
      id: uuidv4(),
      name: "dentist",
      address: "123 Main St, San Francisco, CA",
      coordinates: { lat: 37.7749, lon: -122.4194 },
      time_constraint: { type: "arrive_by", time: "14:00" },
      required: true
    },
    {
      id: uuidv4(),
      name: "grocery store",
      address: "456 Oak Ave, San Francisco, CA",
      coordinates: { lat: 37.7849, lon: -122.4094 },
      time_constraint: { type: "flexible", time: null },
      required: true
    }
  ];

  return {
    destinations: mockDestinations,
    ambiguities: []
  };
};

// Parse schedule endpoint
router.post('/parse', [
  body('schedule_text').notEmpty().trim(),
  body('timezone').optional().isString()
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

    const { schedule_text, timezone = 'UTC' } = req.body;
    const userId = req.user.sub;

    // Parse schedule using AI (mock implementation)
    const parsedData = await parseScheduleText(schedule_text);

    if (!parsedData.destinations || parsedData.destinations.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_SCHEDULE',
          message: 'Could not parse schedule text',
          details: 'No destinations found in the provided text'
        }
      });
    }

    // Create schedule object
    const schedule = {
      schedule_id: uuidv4(),
      user_id: userId,
      original_text: schedule_text,
      timezone,
      destinations: parsedData.destinations,
      ambiguities: parsedData.ambiguities,
      created_at: new Date().toISOString()
    };

    // Store schedule
    schedules.set(schedule.schedule_id, schedule);

    // Return response
    res.status(200).json({
      schedule_id: schedule.schedule_id,
      user_id: userId,
      destinations: schedule.destinations,
      ambiguities: schedule.ambiguities,
      created_at: schedule.created_at
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Schedule parsing failed'
      }
    });
  }
});

// Get schedule by ID
router.get('/:scheduleId', (req, res) => {
  const { scheduleId } = req.params;
  const userId = req.user.sub;

  const schedule = schedules.get(scheduleId);

  if (!schedule) {
    return res.status(404).json({
      error: {
        code: 'SCHEDULE_NOT_FOUND',
        message: 'Schedule ID does not exist or has expired'
      }
    });
  }

  if (schedule.user_id !== userId) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have access to this schedule'
      }
    });
  }

  res.status(200).json(schedule);
});

module.exports = router;