import express from 'express';

const router = express.Router();

/**
 * GET /keepalive
 * Simple endpoint for keep-alive pings
 * Returns 200 OK immediately
 */
router.get('/keepalive', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export default router;

