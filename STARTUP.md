# Movie Tool - Startup Guide

## Overview

The Movie Tool is a full-stack application that integrates MiniMax and Segmind APIs for sequenced video creation. It consists of:
- **Backend**: FastAPI server (Python) running on port 8000
- **Frontend**: React/Vite application running on port 5173 (default)

## Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.8+** (for backend)
- **Node.js 16+** and **npm** (for frontend)
- **Git** (for version control)

## Initial Setup

### 1. Clone and Navigate to Project

```bash
git clone <repository-url>
cd movie-tool
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `backend/.env` and configure the following **REQUIRED** API keys:

```env
# API Keys (REQUIRED - Get these from respective providers)
MINIMAX_API_KEY=your_minimax_api_key_here
SEGMIND_API_KEY=your_segmind_api_key_here

# Database Configuration
DATABASE_URL=sqlite:///./movie_tool.db

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Application Settings
APP_NAME=Movie Tool API
APP_VERSION=1.0.0
DEBUG=True
LOG_LEVEL=INFO

# Security (Change in production)
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Storage Paths
UPLOAD_DIR=./storage/uploads
OUTPUT_DIR=./storage/outputs
TEMP_DIR=./storage/temp
CHARACTER_DIR=./storage/characters

# External API Settings
MINIMAX_BASE_URL=https://api.minimax.chat
SEGMIND_BASE_URL=https://api.segmind.com

# Processing Settings
MAX_CONCURRENT_GENERATIONS=3
MAX_FILE_SIZE_MB=100
SUPPORTED_VIDEO_FORMATS=mp4,mov,avi
SUPPORTED_IMAGE_FORMATS=jpg,jpeg,png,webp

# Export Settings
DEFAULT_EXPORT_FORMAT=mp4
DEFAULT_EXPORT_QUALITY=high
DEFAULT_EXPORT_RESOLUTION=1920x1080
```

**Important**: Replace `your_minimax_api_key_here` and `your_segmind_api_key_here` with your actual API keys.

#### API Key Setup Instructions

**MiniMax API Key:**
1. Visit [MiniMax API Console](https://api.minimax.chat)
2. Sign up/login to your account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key to your `.env` file

**Segmind API Key:**
1. Visit [Segmind API Console](https://api.segmind.com)
2. Sign up/login to your account
3. Go to your dashboard/API section
4. Generate or copy your API key
5. Add it to your `.env` file

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd ../frontend
npm install
```

#### Configure Frontend Environment

The frontend environment is already configured in `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

This tells the frontend to connect to the backend server on port 8000.

## Starting the Application

### Option 1: Start Services Individually

#### Terminal 1 - Backend Server
```bash
cd backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend Server
```bash
cd frontend
npm run dev
```

### Option 2: Use Root Package Scripts

From the project root directory:

#### Start Backend Only
```bash
npm run backend
```

#### Start Frontend Only
```bash
npm run frontend
```

### Option 3: Single Command Setup (Optional)

You can set up a single command to start both servers using the existing `concurrently` package:

1. Edit the root `package.json` and add this script:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run backend\" \"npm run frontend\"",
    "frontend": "npm run dev --workspace=frontend",
    "backend": "cd backend && python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000",
    "start": "npm run frontend"
  }
}
```

2. Then start both servers with:
```bash
npm run dev
```

## Access URLs

Once both servers are running:

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative API Docs**: http://localhost:8000/redoc
- **API Health Check**: http://localhost:8000/health

## Verification Steps

### 1. Backend Verification

Check if the backend is running properly:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T21:11:00Z",
  "version": "1.0.0"
}
```

### 2. Frontend Verification

1. Open http://localhost:5173 in your browser
2. You should see the Movie Tool interface
3. Check browser console for any connection errors

### 3. API Connection Test

1. Open the frontend application
2. Try creating a new project or accessing any feature
3. Check that API calls are successful (no 500/connection errors)

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Backend (Port 8000):**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

**Frontend (Port 5173):**
```bash
# Find process using port 5173
lsof -i :5173

# Kill the process
kill -9 <PID>
```

#### 2. Frontend Cannot Connect to Backend

**Symptoms:**
- Frontend loads but API calls fail
- Console errors about connection refused
- 500 or network errors

**Solutions:**

1. **Check Backend is Running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Verify Port Configuration:**
   - Backend should be on port 8000
   - Frontend `.env` should have `VITE_API_URL=http://localhost:8000`

3. **Check for Port Mismatch:**
   - If backend is running on a different port, update `frontend/.env`
   - Restart frontend after changing environment variables

#### 3. Missing API Keys

**Symptoms:**
- Backend starts but API calls to MiniMax/Segmind fail
- 401 Unauthorized errors in logs

**Solution:**
1. Ensure API keys are properly set in `backend/.env`
2. Restart the backend server after adding keys
3. Verify keys are valid by testing with the provider's API

#### 4. Database Issues

**Symptoms:**
- Backend fails to start
- Database connection errors

**Solution:**
1. Ensure the `backend/storage/` directories exist
2. Check file permissions for the database file
3. Delete `backend/movie_tool.db` to reset database (will lose data)

#### 5. Python Module Not Found

**Symptoms:**
- `ModuleNotFoundError` when starting backend

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

#### 6. Node Modules Issues

**Symptoms:**
- Frontend fails to start
- Missing dependency errors

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Environment-Specific Issues

#### macOS
- Use `python3` instead of `python`
- Ensure Xcode command line tools are installed: `xcode-select --install`

#### Windows
- Use `python` instead of `python3` (if Python 3 is default)
- Consider using Windows Subsystem for Linux (WSL)

#### Linux
- Ensure Python 3 and pip are installed: `sudo apt-get install python3 python3-pip`
- May need to install additional system dependencies for video processing

## Development Tips

### Hot Reloading

Both servers support hot reloading:
- **Backend**: Automatically reloads when Python files change (due to `--reload` flag)
- **Frontend**: Automatically reloads when React files change (Vite default behavior)

### Logs and Debugging

**Backend Logs:**
- Console output shows request logs and errors
- Detailed logs in `backend/logs/app.log` and `backend/logs/error.log`

**Frontend Logs:**
- Browser console shows React errors and API call results
- Network tab shows API request/response details

### API Documentation

When the backend is running in debug mode, you can access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These provide interactive API documentation and testing capabilities.

## Production Deployment

For production deployment:

1. Set `DEBUG=False` in `backend/.env`
2. Change `SECRET_KEY` to a secure random value
3. Use a production database (PostgreSQL recommended)
4. Set up proper CORS origins
5. Use a production WSGI server (gunicorn)
6. Build frontend for production: `npm run build`

## Support

If you encounter issues not covered in this guide:

1. Check the application logs for detailed error messages
2. Verify all prerequisites are installed and up to date
3. Ensure API keys are valid and have sufficient credits/permissions
4. Try restarting both servers
5. Check for any firewall or network restrictions

## Quick Start Checklist

- [ ] Python 3.8+ installed
- [ ] Node.js 16+ and npm installed
- [ ] Project cloned and dependencies installed
- [ ] API keys configured in `backend/.env`
- [ ] Backend server started on port 8000
- [ ] Frontend server started on port 5173
- [ ] Both services accessible via browser
- [ ] API health check returns successful response
- [ ] Frontend can communicate with backend API

Once all items are checked, your Movie Tool application should be fully operational!