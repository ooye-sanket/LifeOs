const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    // decoded.userId is now a Firestore document ID string
    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

module.exports = { authenticate };
