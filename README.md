# Job Portal — AI-Powered MERN Job Portal

A full-stack job portal where **job seekers** can browse and apply for jobs, and **recruiters** can post jobs, manage applicants, and leverage AI tools to evaluate candidates. Features include **email OTP verification**, **password reset**, **AI-powered resume analysis**, **candidate matching**, **RAG recruiter assistant**, **AI interview generation**, and **automated hiring reports**.

> Built with the MERN stack (MongoDB, Express, React, Node.js) + Gemini AI.

---

## ✨ Features

### For Job Seekers (Students)
- Register with **email OTP verification** (account is verified before login)
- Auto-login right after verifying the OTP
- Browse all jobs, search by keyword, filter by type/location
- Apply to jobs and track application status in real-time (Applied / Accepted / Rejected)
- Save / bookmark jobs for later
- **Upload resume (PDF)** — AI automatically extracts and syncs skills directly to your profile
- **AI Resume Analysis** — get a skill match score against any job you applied to
- Profile page with bio, skills, resume link, and applied-jobs history
- Edit profile and **change password** (OTP based)

### For Recruiters
- Register / login as a recruiter
- Create and manage companies
- Post jobs and edit job listings
- View all applicants in a detailed **Applicant Tracking System (ATS)**
- Accept or reject applicants with real-time status updates
- View **AI Match Score** (resume vs. job requirements) for each applicant
- **Ask AI Assistant** — a RAG-powered chat that answers recruiter queries about candidates (missing skills, comparisons, rankings, strengths, drawbacks)
- **Generate AI Interview** — auto-generates tailored technical and behavioral interview questions with ideal answer guides for each candidate
- **AI Hiring Report** — generates a complete, candidate-specific evaluation scorecard (Technical, Problem Solving, Domain Fit, Culture Fit, Strengths, Gaps, Hiring Recommendation)

### Security / Account
- **Email OTP verification** on signup (via Nodemailer + Gmail OAuth2)
- **Forgot password** flow from the login page (OTP based)
- **Change password** from the profile (OTP based)
- Passwords hashed with bcrypt, auth via JWT stored in an httpOnly cookie
- Role-based access control (RBAC) for student and recruiter routes

### AI Features
- **Resume PDF Skill Extraction** — extracts and deduplicates skills from uploaded resumes using `pdf-parse`, supports Google Drive/cloud URLs, and syncs directly to `user.profile.skills`
- **Resume-to-Job Match Scoring** — compares candidate skills against job requirements and calculates an AI match percentage with matched/missing skills breakdown
- **RAG Recruiter Assistant** — answers free-form recruiter questions about candidates with grounded, context-aware responses (candidate comparisons, skill gaps, project highlights, drawbacks)
- **AI Interview Generator** — generates 5 tailored questions with golden answer criteria per candidate based on their resume skills and job requirements
- **AI Hiring Report** — differentiated, candidate-specific scorecards with authentic strengths, skill gaps, and a hiring tier recommendation (Strong Hire / Hire / Hire with Training / Hold / Reject)
- **Google Gemini API Support** — all AI features automatically use Gemini 1.5 Flash if `GEMINI_API_KEY` is configured in `.env`, with a robust built-in fallback engine that works without any API key

---

## 🛠 Tech Stack

**Frontend**
- React 18 + Vite
- Redux Toolkit + redux-persist (state management)
- React Router DOM (routing)
- Tailwind CSS + shadcn/ui (Radix UI) components
- Framer Motion (micro-animations)
- Axios, Sonner (toasts), Lucide icons

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcryptjs (authentication)
- Multer + Cloudinary (file/image uploads)
- pdf-parse (PDF skill extraction from resumes)
- Nodemailer (Gmail OAuth2) for OTP emails
- Google Gemini API (optional, for dynamic LLM generation)

---

## 📁 Project Structure

```
JOB-PORTAL/
├── Backend/
│   ├── controllers/      # Route logic (user, job, company, application, AI)
│   ├── models/           # Mongoose schemas (User, Job, Application, AIReport, Interview, etc.)
│   ├── routes/           # Express routes
│   ├── middleware/       # Auth (JWT) + Multer upload
│   ├── utils/            # db, cloudinary, mailer, resumeExtractor, aiFallbackService
│   ├── index.js          # App entry (Express server)
│   └── .env              # Backend secrets (you create this)
│
└── Frontend/
    ├── src/
    │   ├── components/
    │   │   ├── admincomponent/    # Recruiter dashboard, ATS, AI modals
    │   │   └── components_lite/   # Job seeker views, ResumeAnalysis
    │   ├── redux/         # Slices + store
    │   ├── hooks/         # Custom data-fetching hooks
    │   └── utils/data.js  # API base URLs
    └── vite.config.js
```

---

## ✅ Prerequisites

- **Node.js** v18 or higher
- **npm** (comes with Node.js)
- A **MongoDB** database (local or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier)
- A **Cloudinary** account (for profile photo / resume uploads) — free tier works
- A **Gmail account with OAuth2** credentials (for sending OTP emails)
- *(Optional)* A **Google Gemini API key** from [Google AI Studio](https://aistudio.google.com/) for dynamic AI responses

---

## ⚙️ Setup & Installation

### 1. Clone the repo
```bash
git clone https://github.com/mohithannadata12390/job-portal.git
cd job-portal
```

### 2. Backend setup

```bash
cd Backend
npm install
```

Create a file named **`.env`** inside the `Backend/` folder:

```env
# Database
MONGO_URI = your_mongodb_connection_string

# Auth
JWT_SECRET = any_long_random_secret

# Cloudinary (image & resume uploads)
CLOUD_NAME = your_cloud_name
CLOUD_API  = your_cloudinary_api_key
API_SECRET = your_cloudinary_api_secret

# Server
PORT = 5011
NODE_ENV = development

# Allowed frontend origins (comma separated, no trailing slash)
CORS_ORIGIN = http://localhost:5173

# Email (Gmail OAuth2 - for OTP verification)
EMAIL_USER    = your_gmail_address
CLIENT_ID     = your_google_oauth_client_id
CLIENT_SECRET = your_google_oauth_client_secret
REFRESH_TOKEN = your_google_oauth_refresh_token

# AI — Google Gemini (optional, for dynamic LLM responses)
# Get a free key at https://aistudio.google.com/
GEMINI_API_KEY =
GEMINI_MODEL   = gemini-1.5-flash
```

Start the backend:
```bash
npm run dev
```
The server runs at **http://localhost:5011**

> **Note:** Set `NODE_ENV = development` while developing locally.

### 3. Frontend setup

Open a **new terminal**:

```bash
cd Frontend
npm install
npm run dev
```
The app runs at **http://localhost:5173**

---

## ▶️ Running the App

| Step | Command | Folder | URL |
|------|---------|--------|-----|
| 1. Start backend | `npm run dev` | `Backend/` | http://localhost:5011 |
| 2. Start frontend | `npm run dev` | `Frontend/` | http://localhost:5173 |

Open **http://localhost:5173** in your browser. 🎉

---

## 🤖 AI Features — How They Work

### Resume Upload & Skill Sync
1. Candidate uploads a PDF resume from their profile page.
2. Backend extracts text using `pdf-parse`, parses out all recognizable technical skills, deduplicates them (e.g. `node` and `node js` become one entry), and saves them directly to `user.profile.skills` in MongoDB.
3. The Redux store is updated instantly — no page refresh needed.

### AI Match Score
- Recruiter opens the applicants table and sees an **AI Match %** for each candidate.
- The backend compares the candidate's verified resume skills against the job's `requirements` array and calculates a percentage with `matchedSkills` and `missingSkills` arrays.

### RAG Recruiter Assistant (Ask AI)
- Recruiter opens the **Ask AI Assistant** drawer and types any question.
- If a `GEMINI_API_KEY` is set, it calls Gemini directly with all candidate and job context.
- Without a key, a built-in grounded engine handles: missing skills, candidate profiles & drawbacks, side-by-side comparisons, rankings, and specific skill queries.

### AI Interview Generator
- Recruiter clicks **Generate AI Interview** for a specific candidate.
- Gemini (or the built-in engine) generates 5 tailored technical + behavioral questions with golden answer criteria based on the candidate's skills and job requirements.
- Questions are **internal only** — visible only to the recruiter, not the applicant.

### AI Hiring Report
- Recruiter clicks **AI Hiring Report** for a candidate.
- Generates a differentiated scorecard with: Technical Score, Problem Solving, Domain Fit, Culture Fit, Strengths, Skill Gaps, and a Hiring Tier recommendation.
- Each report is unique per candidate based on their actual resume, match data, and interview performance.

---

## 🔐 Auth Flows

**Register → Verify → Auto Login**
1. Fill the register form → backend creates an unverified account and emails a 6-digit OTP.
2. Enter the OTP on the **Verify Email** page.
3. On success you are **logged in automatically**.

**Forgot Password (from Login)**
1. Click **"Forgot Password?"** → enter your email → receive OTP → enter OTP + new password.

**Change Password (from Profile)**
1. Open Profile → Edit → **Change Password** → OTP sent to email → enter OTP + new password.

---

## 🌐 Main API Endpoints

Base URL: `http://localhost:5011`

### User (`/api/user`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register + send OTP |
| POST | `/verify-otp` | Verify email OTP (auto-login) |
| POST | `/resend-otp` | Resend signup OTP |
| POST | `/forgot-password` | Send password-reset OTP |
| POST | `/reset-password` | Reset password with OTP |
| POST | `/login` | Login |
| POST | `/logout` | Logout |
| POST | `/profile/update` | Update profile (auth) |

### Jobs (`/api/job`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/get` | List/search all jobs (public) |
| GET | `/get/:id` | Get single job (public) |
| POST | `/post` | Post a job (recruiter, auth) |
| GET | `/getadminjobs` | Recruiter's jobs (auth) |

### Applications (`/api/application`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/apply/:id` | Apply to a job (student, auth) |
| GET | `/get` | Get applied jobs (student, auth) |
| GET | `/applicants/:id` | Get applicants for a job (recruiter, auth) |
| POST | `/status/:id/update` | Accept / reject applicant (recruiter, auth) |

### AI (`/api/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/resume/upload` | Upload and analyze resume |
| GET | `/resume/analysis` | Get resume analysis |
| GET | `/match/job/:jobId` | Get job match score (student) |
| GET | `/match/candidates/:jobId` | Get all candidate match scores (recruiter) |
| POST | `/assistant/chat` | RAG recruiter assistant chat |
| GET | `/assistant/history` | Get chat history |
| DELETE | `/assistant/history` | Clear chat history |
| POST | `/interview/generate` | Generate AI interview questions |
| GET | `/interview/:id` | Get an interview |
| POST | `/interview/:id/submit` | Submit candidate answers |
| POST | `/interview/:id/evaluate` | Evaluate interview answers |
| POST | `/report/generate` | Generate AI hiring report |
| GET | `/report/application/:appId` | Get report by application |

---

## 🧰 Available Scripts

**Backend**
- `npm run dev` — start with nodemon

**Frontend**
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — run ESLint

---

## 🩺 Troubleshooting

- **CORS error** — make sure your frontend URL is in `CORS_ORIGIN` in `.env`, then restart the backend.
- **OTP email not sending** — check Gmail OAuth2 credentials (`CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`, `EMAIL_USER`).
- **AI features returning errors** — the built-in fallback engine works without any API key. For Gemini-powered responses, add your key to `GEMINI_API_KEY` in `.env`.
- **Resume skills not syncing** — only PDF resumes are supported for skill extraction. Cloud storage URLs (Google Drive, Cloudinary) are fetched and parsed automatically.
- **`.env` changes not applied** — restart the backend (nodemon does not reload `.env` automatically).

---

## 👤 Author

**Mohith Annadatha** — [github.com/mohithannadata12390](https://github.com/mohithannadata12390)

---

> Built with the MERN stack + Google Gemini AI. Contributions and suggestions are welcome!
