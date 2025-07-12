# Open ICE API

A FastAPI-based service for processing and serving ICE detention statistics data.

## Features

- FastAPI web service with async database operations
- Background worker for data processing
- Scheduled tasks for automated operations
- Excel data import functionality
- PostgreSQL database with Alembic migrations
- Docker containerization

## Prerequisites

- Docker and Docker Compose
- Python 3.13 (for local development)
- PostgreSQL database

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd open-ice-api
```

### 2. Set up environment variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/openicedb

# Environment
ENVIRONMENT_NAME=development

```

### 3. Start the services

```bash
# Start all services (web, worker, scheduler)
docker-compose up -d

# Or start just the web service
docker-compose up web -d
```

### 4. Run database migrations

```bash
# Create a new migration (if needed)
docker-compose exec web alembic revision --autogenerate -m "<commit message>"

# Apply migrations to the database
docker-compose exec web alembic upgrade head
```

### 5. Import data

```bash
# Access the web container shell
docker exec -it open-ice-api-web-1 sh

# Run the data import script
docker-compose exec web python3.13 -m app.scripts.import_data --file_path app/files/data/FY25_detentionStats07072025.xlsx
```

## Development

### Local Development Setup

**Set up virtual environment:**

```bash
cd api
python3.13 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```



### Database Operations

**Create a new migration:**

```bash
docker-compose exec web alembic revision --autogenerate -m "description of changes"
```

**Apply migrations:**

```bash
docker-compose exec web alembic upgrade head
```

**Rollback migrations:**

```bash
docker-compose exec web alembic downgrade -1
```

### Data Import

The application includes a data import script that processes Excel files containing detention statistics.

**Import data from Excel file:**

```bash
# Access container shell
docker exec -it open-ice-api-web-1 sh

# Run import script
python3.13 -m app.scripts.import_data
```

The import script expects Excel files to be placed in `api/app/files/data/` directory.

### API Endpoints

The API provides the following endpoints:

- `GET /status` - Health check and service status
- `GET /population` - Population statistics endpoints
- `GET /stay` - Stay duration statistics endpoints

### Testing

```bash
# Run tests
cd api
python -m pytest tests/
```

## Docker Commands

**Start services:**

```bash
docker-compose up -d
```

**Stop services:**

```bash
docker-compose down
```

**View logs:**

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs web
docker-compose logs worker
docker-compose logs scheduler
```

**Rebuild containers:**

```bash
docker-compose build --no-cache
```

**Access container shell:**

```bash
docker exec -it open-ice-api-web-1 sh
```

## Project Structure

```
open-ice-api/
├── api/
│   ├── app/
│   │   ├── routers/          # API route handlers
│   │   ├── models.py         # Database models
│   │   ├── db.py            # Database configuration
│   │   ├── main.py          # FastAPI application
│   │   ├── worker.py        # Background worker
│   │   ├── scheduler.py     # Task scheduler
│   │   ├── scripts/         # Data import scripts
│   │   ├── services/        # Business logic services
│   │   ├── loaders/         # Data loaders
│   │   └── utils/           # Utility functions
│   ├── migrations/          # Alembic migrations
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile          # Docker configuration
├── docker-compose.yml      # Docker services configuration
└── README.md              # This file
```

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Verify database exists and is accessible

2. **Migration errors:**
   - Run `alembic current` to check current migration state
   - Use `alembic history` to view migration history
   - Reset database if needed: `alembic downgrade base`

3. **Data import errors:**
   - Ensure Excel file is in the correct location
   - Check file format and sheet names
   - Verify database schema matches expected structure

### Logs

Check container logs for detailed error information:

```bash
docker-compose logs -f web
docker-compose logs -f worker
docker-compose logs -f scheduler
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
