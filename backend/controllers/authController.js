const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

const USERS_COLLECTION = 'users';

// Helper: get the single user doc (personal app = one user)
const getUser = async () => {
  const snapshot = await db.collection(USERS_COLLECTION).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { _id: doc.id, ...doc.data() };
};

// Create PIN (First time setup)
exports.createPin = async (req, res) => {
  try {
    const { pin } = req.body;

    console.log('=== CREATE PIN REQUEST ===');

    if (!pin || String(pin).length !== 4) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    // Check if user already exists
    const existingUser = await getUser();
    if (existingUser) {
      return res.status(400).json({ error: 'PIN already exists' });
    }

    // Hash PIN and store in Firestore
    const hashedPin = await bcrypt.hash(String(pin), 10);
    const userRef = await db.collection(USERS_COLLECTION).add({
      pin: hashedPin,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    });

    const token = jwt.sign(
      { userId: userRef.id },
      process.env.JWT_SECRET || 'secret'
    );

    console.log('User created successfully:', userRef.id);
    res.status(201).json({ message: 'PIN created successfully', token });
  } catch (error) {
    console.error('Create PIN error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Login with PIN
exports.login = async (req, res) => {
  try {
    const { pin } = req.body;

    console.log('=== LOGIN REQUEST ===');

    const user = await getUser();
    if (!user) {
      return res.status(404).json({ error: 'No user found. Create PIN first.' });
    }

    const isMatch = await bcrypt.compare(String(pin), user.pin);
    console.log('PIN match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect PIN' });
    }

    // Update lastLogin
    await db.collection(USERS_COLLECTION).doc(user._id).update({
      lastLogin: new Date().toISOString(),
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret'
    );

    console.log('Login successful');
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Check if PIN exists
exports.checkPin = async (req, res) => {
  try {
    const user = await getUser();
    console.log('Check PIN - User exists:', !!user);
    res.json({ pinExists: !!user });
  } catch (error) {
    console.error('Check PIN error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Change PIN
exports.changePin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;

    const user = await getUser();
    if (!user) {
      return res.status(404).json({ error: 'No user found' });
    }

    const isMatch = await bcrypt.compare(String(currentPin), user.pin);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current PIN' });
    }

    if (!newPin || String(newPin).length !== 4) {
      return res.status(400).json({ error: 'New PIN must be 4 digits' });
    }

    const hashedPin = await bcrypt.hash(String(newPin), 10);
    await db.collection(USERS_COLLECTION).doc(user._id).update({ pin: hashedPin });

    res.json({ message: 'PIN changed successfully' });
  } catch (error) {
    console.error('Change PIN error:', error);
    res.status(500).json({ error: error.message });
  }
};
