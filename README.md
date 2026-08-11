# Full Stack Job Portal

A modern, full-featured Job Portal application built using **React (Vite)**, **Node.js (Express)**, and **MongoDB**. The application integrates **Clerk** for secure user authentication and management, and **Sentry** for real-time error tracking and monitoring. It is designed to be easily deployed to **Render** using the included Infrastructure-as-Code configuration.

---

## 🚀 Features

- **User Authentication**: Secure sign-up, sign-in, and profile management for both Job Seekers and Recruiters via Clerk.
- **Job Seeker Features**:
  - Browse and search jobs with filters.
  - Apply to jobs with resume upload (using Multer).
  - Save/unsave jobs for future reference.
  - Track application history and status.
- **Recruiter Features**:
  - Create, update, and delete job listings.
  - Manage company details.
  - View job applications and update application status (Pending, Accepted, Rejected).
- **Monitoring & Logging**: Real-time error reporting and application health tracking via Sentry.
- **Deployment Ready**: Out-of-the-box configuration for zero-config deployments to Render.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Routing**: React Router DOM
- **Authentication**: Clerk React SDK
- **Styling**: Vanilla CSS (Variables, Flexbox, Grid)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Error Tracking**: Sentry React SDK

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: Clerk Node SDK & custom middleware
- **File Uploads**: Multer
- **CORS**: Express CORS middleware
- **Error Tracking**: Sentry Node SDK

---

## 📁 Directory Structure

```text
├── backend/
│   ├── src/
│   │   ├── config/         # Database and Sentry configurations
│   │   ├── controllers/    # Request handlers (auth, job, application, company, admin)
│   │   ├── middleware/     # Authentication, upload, and error middleware
│   │   ├── models/         # Mongoose Schemas (User, Job, Application, Company)
│   │   ├── routes/         # Express API routes
│   │   └── index.js        # Main server entrypoint
│   ├── .env.example        # Reference for environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI elements (Navbar, JobCard, etc.)
│   │   ├── pages/          # Application views (Home, Profile, Dashboard, Jobs)
│   │   ├── styles/         # Global & component-specific CSS stylesheets
│   │   ├── App.jsx         # App routes and layout entrypoint
│   │   └── main.jsx        # React root rendering
│   ├── .env.example        # Reference for environment variables
│   ├── index.html
│   └── package.json
│
└── render.yaml             # Render deployment configuration
```

---

## ⚙️ Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)
- [Clerk Account](https://clerk.com/)

---

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/mishrarishi1135-a11y/JOB_PORTAL.git
cd JOB_PORTAL

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2: Environment Setup

#### Backend Configuration
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/jobportal

# Clerk Authentication Keys (From Clerk Dashboard)
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxx

# Sentry DSN (From Sentry Dashboard)
SENTRY_DSN=https://xxxxxx@o123456.ingest.sentry.io/123456

# CORS Allowed URL
FRONTEND_URL=http://localhost:5173
```

#### Frontend Configuration
Create a `.env` file in the `frontend/` directory:
```env
# Clerk Authentication Publishable Key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxx

# Backend API Base URL
VITE_API_URL=http://localhost:5000

# Sentry DSN
VITE_SENTRY_DSN=https://xxxxxx@o123456.ingest.sentry.io/123456
```

---

### Step 3: Run the Application

#### Start the Backend Server
```bash
cd backend
npm run dev
```
The server will start on [http://localhost:5000](http://localhost:5000).

#### Start the Frontend App
```bash
cd frontend
npm run dev
```
The application will be accessible at [http://localhost:5173](http://localhost:5173).

---

## 🌐 API Endpoints

### Authentication / User (`/api/auth`)
- `GET /profile` - Retrieve the current authenticated user's profile.
- `PUT /profile` - Update user profile information.
- `POST /profile/resume` - Upload a resume (PDF/DOCX format).
- `POST /saved-jobs/:jobId` - Save a job listing.
- `DELETE /saved-jobs/:jobId` - Unsave a job listing.

### Jobs (`/api/jobs`)
- `GET /` - Fetch all job listings (supports pagination/search filters).
- `GET /:id` - Retrieve details of a specific job.
- `GET /recruiter/my-posts` - Get all jobs posted by the logged-in recruiter.
- `POST /` - Post a new job (Recruiter only).
- `PUT /:id` - Edit a job listing (Recruiter only).
- `DELETE /:id` - Delete a job listing (Recruiter only).

### Applications (`/api/applications`)
- `GET /` - Get applications (Recruiter: view incoming applications; Seeker: view sent applications).
- `POST /` - Apply to a job.
- `PUT /:id/status` - Update application status (Accepted/Rejected) (Recruiter only).

### Companies (`/api/companies`)
- `GET /` - Get all companies.
- `POST /` - Register a new company (Recruiter only).

---

## ☁️ Deployment (Render)

This repository includes a `render.yaml` blueprint file for hosting on Render.

1. Create a Render account and connect your GitHub repository.
2. In Render, select **Blueprints** and click **New Blueprint Instance**.
3. Choose this repository.
4. Render will automatically parse `render.yaml` and configure:
   - `job-portal-backend` (Node.js Web Service)
   - `job-portal-frontend` (Static Site hosting the React frontend)
5. Set the required Environment Variables in the Render dashboard during deployment.
