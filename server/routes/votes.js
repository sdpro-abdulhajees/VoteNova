 
const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');

// Cast a vote - one per email
router.post('/', async (req, res) => {
  const { email, candidate } = req.body;
  try {
    if (!email || !candidate) return res.status(400).json({ error: 'email and candidate required' });
    const existing = await Vote.findOne({ email });
    if (existing) return res.status(409).json({ error: 'User has already voted' });
    const vote = new Vote({ email, candidate });
    await vote.save();
    res.json({ success: true, message: 'Vote recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;