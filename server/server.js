require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const voteRoutes = require('./routes/votes');
const candidateRoutes = require('./routes/candidates');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  // These options are now obsolete, but keeping for compatibility
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/candidates', candidateRoutes);

app.get('/', (req, res) => {
  res.send('Voting system backend is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
