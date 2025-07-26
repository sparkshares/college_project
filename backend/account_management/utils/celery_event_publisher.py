from celery import Celery
from django.conf import settings
import requests
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Configure Celery
app = Celery('events')
app.config_from_object('django.conf:settings', namespace='CELERY')

@app.task(bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 3, 'countdown': 60})
def send_event_task(self, event_type: str, data: Dict[str, Any], user_id: Optional[int] = None):
    """
    Celery task to send events to Go backend
    This runs asynchronously in a background worker
    """
    go_backend_url = getattr(settings, 'GO_BACKEND_URL', 'http://127.0.0.1:3001')
    timeout = getattr(settings, 'EVENT_TIMEOUT', 10)
    
    event_payload = {
        "event_type": event_type,
        "timestamp": _get_current_timestamp(),
        "source": "django-backend",
        "user_id": user_id,
        "data": data,
        "task_id": self.request.id  # Celery task ID for tracking
    }
    
    url = f"{go_backend_url}/api/events"
    headers = {
        'Content-Type': 'application/json',
        'X-Source': 'django-backend',
        'X-Task-ID': str(self.request.id)
    }
    
    try:
        logger.info(f"Sending event via Celery: {event_type} (Task: {self.request.id})")
        
        response = requests.post(
            url,
            json=event_payload,
            headers=headers,
            timeout=timeout
        )
        
        if response.status_code in [200, 201, 202]:
            logger.info(f"Celery event sent successfully: {event_type}")
            return {
                "status": "success",
                "event_type": event_type,
                "response_status": response.status_code
            }
        else:
            logger.error(f"Celery event failed with status {response.status_code}: {response.text}")
            raise Exception(f"HTTP {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Celery event network error: {str(e)}")
        raise self.retry(countdown=60, exc=e)
    
    except Exception as e:
        logger.error(f"Celery event unexpected error: {str(e)}")
        raise

@app.task
def send_user_registered_event_task(user_data: Dict[str, Any]):
    """Task specifically for user registration events"""
    event_data = {
        "username": user_data.get("username"),
        "email": user_data.get("email"),
        "user_id": user_data.get("user_id"),
        "registration_timestamp": user_data.get("registration_timestamp")
    }
    
    return send_event_task.delay(
        event_type="user.registered",
        data=event_data,
        user_id=user_data.get("user_id")
    )

@app.task
def send_user_login_event_task(user_data: Dict[str, Any]):
    """Task specifically for user login events"""
    event_data = {
        "username": user_data.get("username"),
        "email": user_data.get("email"),
        "user_id": user_data.get("user_id"),
        "login_timestamp": user_data.get("login_timestamp"),
        "ip_address": user_data.get("ip_address")
    }
    
    return send_event_task.delay(
        event_type="user.login",
        data=event_data,
        user_id=user_data.get("user_id")
    )

def _get_current_timestamp() -> str:
    """Get current timestamp in ISO format"""
    from datetime import datetime
    return datetime.utcnow().isoformat() + 'Z'

class CeleryEventPublisher:
    """
    Queue-based event publisher using Celery for reliable event delivery
    """
    
    @staticmethod
    def publish_user_registered_event(user_data: Dict[str, Any]) -> str:
        """
        Publish user registration event via Celery queue
        
        Returns:
            str: Task ID for tracking
        """
        task = send_user_registered_event_task.delay(user_data)
        logger.info(f"Queued user registration event with task ID: {task.id}")
        return task.id
    
    @staticmethod
    def publish_user_login_event(user_data: Dict[str, Any]) -> str:
        """
        Publish user login event via Celery queue
        
        Returns:
            str: Task ID for tracking
        """
        task = send_user_login_event_task.delay(user_data)
        logger.info(f"Queued user login event with task ID: {task.id}")
        return task.id
    
    @staticmethod
    def publish_event(event_type: str, data: Dict[str, Any], user_id: Optional[int] = None) -> str:
        """
        Publish generic event via Celery queue
        
        Returns:
            str: Task ID for tracking
        """
        task = send_event_task.delay(event_type, data, user_id)
        logger.info(f"Queued event {event_type} with task ID: {task.id}")
        return task.id

# Create instance
celery_event_publisher = CeleryEventPublisher()
