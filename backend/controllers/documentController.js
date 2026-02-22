const { db, snapshotToArray } = require('../config/firebase');
const { cloudinary } = require('../config/cloudinary');

const COLLECTION = 'documents';

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, category, tags, notes } = req.body;

    const documentData = {
      userId: req.userId,
      title,
      category,
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      publicId: req.file.filename,
      thumbnail: req.file.path,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      notes: notes || '',
      uploadDate: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTION).add(documentData);
    res.status(201).json({ _id: docRef.id, ...documentData });
  } catch (error) {
    console.error('uploadDocument error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all documents
exports.getDocuments = async (req, res) => {
  try {
    const { category } = req.query;
    let query = db.collection(COLLECTION).where('userId', '==', req.userId);

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.get();
    let documents = snapshotToArray(snapshot);

    // Sort by uploadDate desc
    documents.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    res.json(documents);
  } catch (error) {
    console.error('getDocuments error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const docRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(doc.data().publicId);

    await docRef.delete();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('deleteDocument error:', error);
    res.status(500).json({ error: error.message });
  }
};
