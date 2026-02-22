# 🚀 Life OS — Complete Deployment Guide
## Frontend → Vercel | Backend → AWS Lambda (Both FREE)

---

## ═══════════════════════════════════
## PART 1 — PREPARE YOUR BACKEND
## ═══════════════════════════════════

### Step 1 — Replace your backend folder
Replace EVERYTHING in your `backend/` folder with files from this zip.
Keep your existing `serviceAccountKey.json` and `.env` — don't delete those.

Your folder should look like:
```
lifeOs/
├── frontend/         ← your React app (don't touch)
└── backend/
    ├── serviceAccountKey.json  ← KEEP (your Firebase key)
    ├── .env                    ← KEEP + update (see Step 2)
    ├── .gitignore              ← NEW
    ├── package.json            ← UPDATED
    ├── server.js               ← UPDATED (works local + Lambda)
    ├── serverless.yml          ← NEW
    ├── config/
    │   ├── firebase.js         ← UPDATED
    │   └── cloudinary.js
    ├── controllers/
    ├── middleware/
    └── routes/
```

### Step 2 — Update your .env file
Open `backend/.env` and make sure it has ALL of these:

```env
# JWT
JWT_SECRET=lifeos_super_secret_key_change_this_123456

# Server
PORT=5000

# Cloudinary (same as before)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (fill in AFTER you deploy to Vercel - Step 8)
FRONTEND_URL=http://localhost:3000
```

### Step 3 — Install new dependencies
```bash
cd backend
npm install
```

### Step 4 — Test locally first!
```bash
npm run dev
```
Open browser: `http://localhost:5000/api/health`
You should see: `{ "status": "OK", "database": "Firebase Firestore" }`
✅ If you see this — backend is perfect, continue!

---

## ═══════════════════════════════════
## PART 2 — PREPARE YOUR FRONTEND
## ═══════════════════════════════════

### Step 5 — Find your API URL in the frontend
Search your `frontend/src/` folder for wherever you have `localhost:5000`.
It's usually in one of these files:
- `src/config.js`
- `src/api.js`
- `src/services/api.js`
- `src/utils/api.js`

### Step 6 — Update the API URL to use an environment variable

**Find this (exact text may differ):**
```js
const API_URL = 'http://localhost:5000';
// OR
const baseURL = 'http://localhost:5000';
// OR
axios.create({ baseURL: 'http://localhost:5000' })
```

**Replace with:**
```js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```
> ⚠️ In React, env vars MUST start with `REACT_APP_` or they won't work!

### Step 7 — Create frontend .env file (for local dev)
In your `frontend/` folder, create a file called `.env`:
```env
REACT_APP_API_URL=http://localhost:5000
```
This makes it still work locally while you're developing.

Also add to `frontend/.gitignore`:
```
.env
.env.local
```

---

## ═══════════════════════════════════
## PART 3 — DEPLOY FRONTEND TO VERCEL
## ═══════════════════════════════════

### Step 8 — Push code to GitHub

First, make sure you have a `.gitignore` in your ROOT `lifeOs/` folder:
```
# lifeOs/.gitignore
node_modules/
.env
serviceAccountKey.json
frontend/.env
backend/.env
.serverless/
```

Then push to GitHub:
```bash
cd lifeOs   ← go to ROOT of your project (not frontend or backend)

git init
git add .
git commit -m "Life OS ready for deployment"
```

Now go to https://github.com → New repository → name it `lifeos`
```bash
git remote add origin https://github.com/YOUR_USERNAME/lifeos.git
git branch -M main
git push -u origin main
```

### Step 9 — Deploy to Vercel

1. Go to **https://vercel.com** → Sign up with GitHub (free)
2. Click **"Add New Project"**
3. Find and click **Import** on your `lifeos` repo
4. ⚠️ IMPORTANT — Before clicking Deploy:
   - Look for **"Root Directory"** setting
   - Change it from `.` to **`frontend`**
   - (This tells Vercel your React app is inside the frontend folder)
5. Click **"Environment Variables"** and add:
   ```
   Name:  REACT_APP_API_URL
   Value: http://localhost:5000   ← temporary! We'll update this after Lambda
   ```
6. Click **Deploy** → Wait ~1 minute
7. 🎉 Your frontend is live! Copy your URL: `https://lifeos-xyz.vercel.app`

---

## ═══════════════════════════════════
## PART 4 — DEPLOY BACKEND TO AWS LAMBDA
## ═══════════════════════════════════

### Step 10 — AWS Account Setup
1. Go to **https://console.aws.amazon.com** → Create free account (needs credit card but WON'T charge you — free tier)
2. After logging in, click your account name (top right) → **Security credentials**
3. Scroll to **"Access keys"** → **Create access key**
4. Choose **"Command Line Interface (CLI)"** → tick checkbox → Next → Create
5. COPY both keys — you won't see the secret again!

### Step 11 — Connect AWS to your computer
Open PowerShell/Terminal:
```bash
serverless config credentials --provider aws --key YOUR_ACCESS_KEY_ID --secret YOUR_SECRET_ACCESS_KEY --region ap-south-1
```
Replace with your actual keys from Step 10.

### Step 12 — Get your Firebase credentials for Lambda
On Lambda, you can't upload files — so we need to put your Firebase key into environment variables.

Open your `backend/serviceAccountKey.json` in any text editor (Notepad is fine).
Find these 3 values:
```json
{
  "project_id": "lifeos-xxxxx",          ← FIREBASE_PROJECT_ID
  "private_key": "-----BEGIN RSA...",    ← FIREBASE_PRIVATE_KEY
  "client_email": "firebase-adminsdk..." ← FIREBASE_CLIENT_EMAIL
}
```

### Step 13 — Add all secrets to Serverless
In your `backend/` folder, create a file called `.env.lambda`:
```env
JWT_SECRET=lifeos_super_secret_key_change_this_123456
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://lifeos-xyz.vercel.app
FIREBASE_PROJECT_ID=lifeos-xxxxx
FIREBASE_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMIIE...your full key...\n-----END RSA PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@lifeos-xxxxx.iam.gserviceaccount.com
```
> ⚠️ For FIREBASE_PRIVATE_KEY: the key has real line breaks — keep them as `\n` literally in this file.

### Step 14 — Deploy!
```bash
cd backend

# Load the lambda env vars and deploy
cp .env.lambda .env
serverless deploy
```

This takes 2-3 minutes the first time. You'll see:
```
Deploying lifeos-backend to stage dev (ap-south-1)
✔ Service deployed (45s)

endpoint: https://xxxxxxxxxxxxxxxx.lambda-url.ap-south-1.on.aws/
```

**COPY THAT URL!** It's your live backend URL.

### Step 15 — Test your Lambda backend
Open in browser:
```
https://xxxxxxxxxxxxxxxx.lambda-url.ap-south-1.on.aws/api/health
```
Should return: `{ "status": "OK", "database": "Firebase Firestore", "environment": "lambda" }`
✅

### Step 16 — Connect frontend to Lambda
Now go back to Vercel:
1. Open your project → **Settings** → **Environment Variables**
2. Find `REACT_APP_API_URL` → Edit it
3. Change value to your Lambda URL:
   ```
   https://xxxxxxxxxxxxxxxx.lambda-url.ap-south-1.on.aws
   ```
4. Go to **Deployments** → Click the 3 dots on latest → **Redeploy**

### Step 17 — Restore your local .env
Since we copied .env.lambda over .env in Step 14, restore local dev:
```bash
# In backend/ folder
cp .env .env.lambda.backup
```
Then edit `.env` and change `FRONTEND_URL` back to `http://localhost:3000`

---

## ═══════════════════════════════════
## PART 5 — FIRST TIME USE
## ═══════════════════════════════════

### Step 18 — Set up your PIN
Since data is fresh in Firebase, you need to create your PIN:
1. Open your Vercel app
2. It should show the PIN setup screen
3. Create your 4-digit PIN
4. Done! All features should work.

---

## ═══════════════════════════════════
## KEEPING LAMBDA WARM (Optional but Recommended)
## ═══════════════════════════════════

Lambda can take 1-2 seconds to "wake up" if not used for a while.
To prevent this, set up a free cron job:

1. Go to **https://cron-job.org** (free, no card needed)
2. Create account → **New Cron Job**
3. URL: `https://your-lambda-url.../api/health`
4. Schedule: **Every 5 minutes**
5. Save

This keeps Lambda warm = instant responses always.

---

## ═══════════════════════════════════
## USEFUL COMMANDS
## ═══════════════════════════════════

```bash
# Run locally
cd backend && npm run dev

# Deploy to Lambda
cd backend && serverless deploy

# See Lambda logs live
cd backend && serverless logs -f api --tail

# Redeploy after code changes
cd backend && serverless deploy
```

---

## ═══════════════════════════════════
## FREE TIER SUMMARY
## ═══════════════════════════════════

| Service | What you get FREE |
|---------|------------------|
| AWS Lambda | 1 million requests/month, 400,000 GB-seconds |
| Firebase Firestore | 50,000 reads/day, 20,000 writes/day, 1GB storage |
| Vercel | Unlimited deployments, 100GB bandwidth/month |
| Cloudinary | 25GB storage, 25GB bandwidth/month |

A personal ERP with 1 user uses maybe 500 operations/day. You'll **never** hit any limit. 100% free forever.

---

## ═══════════════════════════════════
## TROUBLESHOOTING
## ═══════════════════════════════════

**"serverless: command not found"**
→ Run `npm install -g serverless` again, then close and reopen terminal

**"AWS credentials not found"**
→ Redo Step 11 with your actual access keys

**CORS error in browser**
→ Make sure your Vercel URL is set as FRONTEND_URL in Lambda env vars → redeploy

**Lambda returns 500 error**
→ Check logs: `serverless logs -f api --tail`
→ Usually means FIREBASE_PRIVATE_KEY has wrong format

**Frontend still hitting localhost:5000**
→ Make sure REACT_APP_API_URL is set in Vercel environment variables
→ Redeploy on Vercel after changing env vars

**Firebase private key error on Lambda**
→ In .env.lambda, the private key should have literal `\n` not real newlines
→ Copy the key from serviceAccountKey.json exactly as-is
