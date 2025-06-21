# Movie Tool

AI-powered video creation platform that integrates MiniMax and Segmind APIs for sequenced video creation.

## Project Structure

```
movie-tool/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configuration and utilities
│   │   ├── models/         # SQLAlchemy database models
│   │   └── main.py         # FastAPI application entry point
│   ├── requirements.txt    # Python dependencies
│   └── .env.example       # Environment variables template
├── frontend/               # React frontend application
│   ├── public/            # Static files
│   ├── src/               # React source code
│   └── package.json       # Node.js dependencies
├── storage/               # File storage directories
│   ├── uploads/           # User uploaded files
│   ├── outputs/           # Generated video outputs
│   ├── temp/              # Temporary processing files
│   └── characters/        # Generated character images
├── logs/                  # Application logs
└── docs/                  # Documentation
```

## Features

- **Project Management**: Create and manage video projects
- **Character Creation**: Generate consistent characters using AI
- **Video Clip Generation**: Create video clips with AI-generated content
- **Sequence Assembly**: Combine clips into complete videos
- **Export Management**: Handle video rendering and export

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Primary database
- **OpenCV**: Video processing
- **Requests**: HTTP client for API integrations

### Frontend
- **React**: User interface framework
- **React Router**: Client-side routing
- **Axios**: HTTP client

### External APIs
- **MiniMax API**: Video generation
- **Segmind API**: Image generation

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

- `DATABASE_URL`: PostgreSQL connection string
- `MINIMAX_API_KEY`: MiniMax API key
- `SEGMIND_API_KEY`: Segmind API key
- `SECRET_KEY`: Application secret key
- `UPLOAD_DIR`: File upload directory path

## Development

The project follows a modular architecture with clear separation between frontend and backend. See `ARCHITECTURE.md` for detailed architectural decisions and patterns.

## License

This project is proprietary software.