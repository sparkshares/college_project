# Microservice Event-Driven Architecture Setup

This document explains how to implement event-driven communication between your Django backend and Go backend server.

## Architecture Overview

```
Django Backend -> Event Publisher -> Go Backend Server
```

## Available Approaches

### 1. HTTP-based Event Publishing (Simple & Reliable)
**File**: `account_management/utils/event_publisher.py`

**Pros**:
- Simple to implement and debug
- Synchronous operation (you know immediately if it fails)
- No additional infrastructure required
- Good for low-volume events

**Cons**:
- Blocks the request until event is sent
- No retry mechanism if Go server is down

**Usage**:
```python
from .utils.event_publisher import event_publisher

# In your view
event_publisher.publish_user_registered_event(user_data)
```

### 2. Asynchronous HTTP Event Publishing
**File**: `account_management/utils/async_event_publisher.py`

**Pros**:
- Non-blocking (doesn't slow down user requests)
- Better performance for high-traffic applications
- Built-in retry mechanism

**Cons**:
- More complex to debug
- Requires aiohttp dependency
- Events might be lost if server crashes

**Usage**:
```python
from .utils.async_event_publisher import async_event_publisher

# In your view
async_event_publisher.publish_user_registered_event_async(user_data)
```

### 3. Queue-based with Celery (Production Ready)
**File**: `account_management/utils/celery_event_publisher.py`

**Pros**:
- Most reliable (events are queued and retried)
- Handles high volumes efficiently
- Automatic retry with exponential backoff
- Can monitor and track event delivery
- Events persist across server restarts

**Cons**:
- Requires Redis/RabbitMQ infrastructure
- More complex setup
- Additional moving parts

**Usage**:
```python
from .utils.celery_event_publisher import celery_event_publisher

# In your view
task_id = celery_event_publisher.publish_user_registered_event(user_data)
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
GO_BACKEND_URL=http://localhost:8080
EVENT_TIMEOUT=10
EVENT_RETRY_ATTEMPTS=3
CELERY_BROKER_URL=redis://localhost:6379/0
```

### 3. For Celery Setup (Option 3)

Install and start Redis:
```bash
# macOS
brew install redis
brew services start redis

# Or using Docker
docker run -d -p 6379:6379 redis:alpine
```

Start Celery worker:
```bash
celery -A project_main worker --loglevel=info
```

### 4. Go Backend Server Setup

Use the provided `go_event_server_example.go`:

```bash
cd /path/to/your/go/project
go mod init go-event-processor
go run go_event_server_example.go
```

The Go server will listen on `http://localhost:8080`

## Event Types

### User Registration Event
```json
{
  "event_type": "user.registered",
  "timestamp": "2025-01-20T10:30:00Z",
  "source": "django-backend",
  "user_id": 123,
  "data": {
    "user_id": 123,
    "username": "john_doe",
    "email": "john@example.com",
    "registration_timestamp": "2025-01-20T10:30:00Z"
  }
}
```

### User Login Event
```json
{
  "event_type": "user.login",
  "timestamp": "2025-01-20T10:30:00Z",
  "source": "django-backend",
  "user_id": 123,
  "data": {
    "user_id": 123,
    "username": "john_doe",
    "email": "john@example.com",
    "login_timestamp": "2025-01-20T10:30:00Z",
    "ip_address": "192.168.1.100"
  }
}
```

## Current Implementation

The signup and login endpoints in `api.py` currently use the HTTP-based approach (Option 1). You can easily switch to other approaches by changing the import and method calls.

## Switching Between Approaches

### To use Async HTTP (Option 2):
```python
# In api.py, replace:
from .utils.event_publisher import event_publisher

# With:
from .utils.async_event_publisher import async_event_publisher

# And change method calls:
async_event_publisher.publish_user_registered_event_async(user_data)
```

### To use Celery (Option 3):
```python
# In api.py, replace:
from .utils.event_publisher import event_publisher

# With:
from .utils.celery_event_publisher import celery_event_publisher

# And change method calls:
task_id = celery_event_publisher.publish_user_registered_event(user_data)
```

## Testing

### Test the HTTP approach:
1. Start your Django server: `python manage.py runserver`
2. Start the Go server: `go run go_event_server_example.go`
3. Register a new user via your API
4. Check the Go server logs for received events

### Test the Celery approach:
1. Start Redis: `brew services start redis`
2. Start Celery worker: `celery -A project_main worker --loglevel=info`
3. Start Django server: `python manage.py runserver`
4. Start Go server: `go run go_event_server_example.go`
5. Register a new user
6. Check Celery worker logs and Go server logs

## Production Considerations

1. **Error Handling**: All approaches include proper error handling
2. **Logging**: Events are logged for debugging and monitoring
3. **Security**: Add authentication/authorization for the Go endpoint
4. **Monitoring**: Use tools like Flower for Celery monitoring
5. **Scaling**: Celery approach scales best for high-volume applications

## Recommended Approach

- **Development/Low traffic**: Use HTTP-based approach (Option 1)
- **Production/High traffic**: Use Celery-based approach (Option 3)
- **Medium traffic**: Use Async HTTP approach (Option 2)

Choose the approach that best fits your infrastructure and requirements!
