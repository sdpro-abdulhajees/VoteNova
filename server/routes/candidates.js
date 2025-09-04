 
const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');

// List candidates
router.get('/', async (req, res) => {
  const items = await Candidate.find({}).sort({ name: 1 });
  res.json(items);
});

// Upsert candidate (admin)
router.post('/upsert', async (req, res) => {
  const { id, name, party, manifesto, photoUrl } = req.body;
  try {
    const payload = { name, party, manifesto, photoUrl, updatedAt: new Date() };
    let doc;
    if (id) doc = await Candidate.findByIdAndUpdate(id, payload, { new: true });
    else doc = await Candidate.create(payload);
    res.json({ success: true, candidate: doc });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List votes (admin)
router.get('/votes', async (req, res) => {
  const items = await Vote.find({}).sort({ createdAt: -1 });
  res.json(items);
});

module.exports = router;