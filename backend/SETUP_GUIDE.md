# 🔥 Life OS — Firebase Migration Setup Guide

## What Changed
- ❌ Removed: MongoDB / Mongoose
- ✅ Added: Firebase Firestore (free tier)
- ✅ Fixed: `upload` was not exported from cloudinary config (caused document upload crash)
- ✅ Added: Missing Habits and Upgrades routes that had models but no API
- ✅ Added: `changePin`, `updateExpense` endpoints

---

## STEP 1 — Create a Firebase Project (5 minutes)

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Give it a name like `lifeos` → Continue
4. Disable Google Analytics (not needed) → Create project
5. Wait for it to be ready → Click **Continue**

---

## STEP 2 — Enable Firestore Database

1. In your Firebase project, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in production mode"** (more secure)
4. Pick a location close to you (e.g., `asia-south1` for India)
5. Click **Enable**

### Set Firestore Security Rules
After creating, go to the **Rules** tab and paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Your backend uses Admin SDK, so these rules only affect direct browser access
    // Since you're using a server backend, lock everything down
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**. (Your Node.js backend uses Admin SDK and bypasses these rules — this just prevents any direct browser access to your database.)

---

## STEP 3 — Get Your Service Account Key

This is the "password" that lets your Node.js backend talk to Firebase.

1. In Firebase Console → click the **gear icon** ⚙️ next to "Project Overview"
2. Click **"Project settings"**
3. Click the **"Service accounts"** tab
4. Make sure **"Firebase Admin SDK"** is selected
5. Click **"Generate new private key"**
6. Click **"Generate key"** in the popup
7. A JSON file will download — it looks like `lifeos-firebase-adminsdk-xxxxx.json`

### Place the key file
```
Rename the downloaded file to:   serviceAccountKey.json
Place it in your backend folder:  backend/serviceAccountKey.json
```

⚠️ **IMPORTANT**: Add `serviceAccountKey.json` to your `.gitignore` — never commit this file!

```
# Add to .gitignore
serviceAccountKey.json
.env
```

---

## STEP 4 — Replace Your Backend Files

Replace your entire `backend` folder contents with the new files from this package.

Your folder structure should look like:
```
backend/
├── serviceAccountKey.json    ← NEW (downloaded from Firebase)
├── .env                      ← same as before
├── .env.example              ← NEW
├── package.json              ← UPDATED (firebase-admin added, mongoose removed)
├── server.js                 ← UPDATED
├── config/
│   ├── firebase.js           ← NEW (replaces database.js)
│   └── cloudinary.js         ← FIXED (was crashing on document upload)
├── middleware/
│   └── auth.js               ← same (no changes needed)
├── controllers/
│   ├── authController.js     ← UPDATED
│   ├── taskController.js     ← UPDATED
│   ├── expenseController.js  ← UPDATED
│   ├── checkInController.js  ← UPDATED
│   ├── documentController.js ← UPDATED
│   ├── noteController.js     ← UPDATED
│   ├── placeController.js    ← UPDATED
│   ├── alertController.js    ← UPDATED
│   ├── searchController.js   ← UPDATED
│   ├── habitController.js    ← NEW (was missing!)
│   └── upgradeController.js  ← NEW (was missing!)
└── routes/
    ├── auth.js               ← UPDATED
    ├── tasks.js              ← same
    ├── expenses.js           ← UPDATED (added PUT)
    ├── checkins.js           ← same
    ├── documents.js          ← FIXED
    ├── notes.js              ← same
    ├── places.js             ← same
    ├── alerts.js             ← same
    ├── search.js             ← same
    ├── habits.js             ← NEW
    └── upgrades.js           ← NEW
```

---

## STEP 5 — Install Dependencies

```bash
cd backend

# Remove old node_modules
rm -rf node_modules

# Install new dependencies (mongoose removed, firebase-admin added)
npm install
```

---

## STEP 6 — Update Your .env

Your `.env` file stays mostly the same. Just make sure these are set:

```env
JWT_SECRET=your_random_secret_key_here
PORT=5000

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

No Firebase keys in `.env` — Firebase uses `serviceAccountKey.json` directly.

---

## STEP 7 — Start the Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on http://0.0.0.0:5000
🔥 Database: Firebase Firestore
```

---

## STEP 8 — Re-create Your PIN

Since you're switching databases, your old MongoDB data won't transfer automatically.

1. Call `POST /api/auth/create-pin` with your PIN to set it up fresh
2. All your other data starts fresh in Firestore

If you want to migrate your old MongoDB data, tell me and I'll write a migration script.

---

## Firebase Free Tier Limits (Spark Plan)

For a personal ERP, you'll never hit these:

| Feature | Free Limit |
|---------|-----------|
| Storage | 1 GB |
| Reads | 50,000 / day |
| Writes | 20,000 / day |
| Deletes | 20,000 / day |
| Network | 10 GB / month |

A personal app typically does 100-500 operations per day. You're safe. ✅

---

## Bugs Fixed in This Migration

1. **Document upload crash** — `upload` was imported from cloudinary config but never exported. Fixed.
2. **Habits had a model but no controller or routes** — Now working at `/api/habits`
3. **Upgrades had a model but no controller or routes** — Now working at `/api/upgrades`
4. **Expenses had no update (PUT) endpoint** — Added
5. **Auth had no change PIN endpoint** — Added at `POST /api/auth/change-pin`

---

## API Reference (All Endpoints)

```
POST   /api/auth/create-pin
POST   /api/auth/login
GET    /api/auth/check-pin
POST   /api/auth/change-pin           ← NEW

GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
PATCH  /api/tasks/:id/toggle
PATCH  /api/tasks/:id/important
DELETE /api/tasks/:id

GET    /api/expenses
POST   /api/expenses
GET    /api/expenses/summary/:year/:month
PUT    /api/expenses/:id              ← NEW
DELETE /api/expenses/:id

GET    /api/checkins
POST   /api/checkins
GET    /api/checkins/weekly-summary

POST   /api/documents
GET    /api/documents
DELETE /api/documents/:id

GET    /api/notes
POST   /api/notes
PUT    /api/notes/:id
DELETE /api/notes/:id

GET    /api/places
POST   /api/places
PUT    /api/places/:id
DELETE /api/places/:id

GET    /api/alerts
POST   /api/alerts
PUT    /api/alerts/:id/read
DELETE /api/alerts/:id

GET    /api/search?query=xxx&filter=all

GET    /api/habits                    ← NEW
POST   /api/habits                    ← NEW
PATCH  /api/habits/:id/complete       ← NEW
DELETE /api/habits/:id               ← NEW

GET    /api/upgrades                  ← NEW
POST   /api/upgrades                  ← NEW
POST   /api/upgrades/:id/log          ← NEW
DELETE /api/upgrades/:id              ← NEW

GET    /api/health
```
