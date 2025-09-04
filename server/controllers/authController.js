const User = require('../models/User');

// Helper function for Euclidean distance
function euclideanDistance(arr1, arr2) {
  return Math.sqrt(
    arr1.reduce((sum, val, i) => sum + ((val - arr2[i]) ** 2), 0)
  );
}

// Register a new user's face descriptor
exports.registerFace = async (req, res) => {
  const { name, email, descriptor, role } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const normalizedRole = role === 'admin' ? 'admin' : 'user';
    const user = new User({ name, email, role: normalizedRole, faceDescriptor: descriptor });
    await user.save();
    res.status(201).json({ message: 'Registration successful!', role: user.role });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Basic email-only login (checks if user exists)
exports.login = async (req, res) => {
  const { email, role } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Account not found' });
    // Backward compatibility: assign role if missing
    if (!user.role && role) {
      user.role = (role === 'admin') ? 'admin' : 'user';
      await user.save();
    }
    if (role && user.role && role !== user.role) {
      return res.status(403).json({ error: 'Role mismatch', currentRole: user.role });
    }
    return res.json({ success: true, name: user.name, email: user.email, role: user.role || 'user' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Face verification (server-side matching!)
exports.verifyFace = async (req, res) => {
  const { email, descriptor } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.faceDescriptor) return res.status(400).json({ error: 'No face data for this user' });

    // Validate descriptor
    if (!Array.isArray(descriptor) || descriptor.length !== user.faceDescriptor.length) {
      return res.status(400).json({ error: 'Invalid descriptor' });
    }

    // Compare descriptors (lower is better)
    const distance = euclideanDistance(user.faceDescriptor.map(Number), descriptor.map(Number));
    const threshold = parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.40');

    if (distance < threshold) {
      return res.json({ success: true, message: 'Face verified!', distance, threshold });
    } else {
      return res.status(401).json({ success: false, message: 'Face not matched.', distance, threshold });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
