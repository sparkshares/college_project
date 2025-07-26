package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

// Event represents an event from the Django backend
type Event struct {
	EventType string                 `json:"event_type"`
	Timestamp string                 `json:"timestamp"`
	Source    string                 `json:"source"`
	UserID    *int                   `json:"user_id,omitempty"`
	Data      map[string]interface{} `json:"data"`
}

// UserRegistrationData represents user registration event data
type UserRegistrationData struct {
	UserID                int    `json:"user_id"`
	Username              string `json:"username"`
	Email                 string `json:"email"`
	RegistrationTimestamp string `json:"registration_timestamp"`
}

// UserLoginData represents user login event data
type UserLoginData struct {
	UserID         int    `json:"user_id"`
	Username       string `json:"username"`
	Email          string `json:"email"`
	LoginTimestamp string `json:"login_timestamp"`
	IPAddress      string `json:"ip_address"`
}

// EventHandler handles incoming events from Django
func EventHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var event Event
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		log.Printf("Error decoding event: %v", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	log.Printf("Received event: %s from %s", event.EventType, event.Source)

	// Process event based on type
	switch event.EventType {
	case "user.registered":
		handleUserRegistration(event)
	case "user.login":
		handleUserLogin(event)
	default:
		log.Printf("Unknown event type: %s", event.EventType)
	}

	// Respond with success
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "Event processed successfully",
	})
}

// handleUserRegistration processes user registration events
func handleUserRegistration(event Event) {
	log.Printf("Processing user registration event for user ID: %v", event.UserID)

	// Extract user data
	dataBytes, _ := json.Marshal(event.Data)
	var userData UserRegistrationData
	if err := json.Unmarshal(dataBytes, &userData); err != nil {
		log.Printf("Error parsing user registration data: %v", err)
		return
	}

	// Here you can implement your business logic:
	// - Send welcome email
	// - Create user profile in Go database
	// - Send notification to admin
	// - Update analytics
	// - etc.

	log.Printf("User registered: %s (%s) at %s",
		userData.Username,
		userData.Email,
		userData.RegistrationTimestamp)

	// Example: Send welcome email (implement your email service)
	// sendWelcomeEmail(userData.Email, userData.Username)

	// Example: Store in database (implement your database logic)
	// storeUserInDatabase(userData)

	// Example: Update analytics (implement your analytics service)
	// updateUserRegistrationAnalytics(userData)
}

// handleUserLogin processes user login events
func handleUserLogin(event Event) {
	log.Printf("Processing user login event for user ID: %v", event.UserID)

	// Extract login data
	dataBytes, _ := json.Marshal(event.Data)
	var loginData UserLoginData
	if err := json.Unmarshal(dataBytes, &loginData); err != nil {
		log.Printf("Error parsing user login data: %v", err)
		return
	}

	// Here you can implement your business logic:
	// - Update last login timestamp
	// - Log security events
	// - Update analytics
	// - Check for suspicious activity
	// - etc.

	log.Printf("User logged in: %s (%s) from IP %s at %s",
		loginData.Username,
		loginData.Email,
		loginData.IPAddress,
		loginData.LoginTimestamp)

	// Example: Update user activity (implement your database logic)
	// updateUserActivity(loginData)

	// Example: Security monitoring (implement your security service)
	// checkSuspiciousActivity(loginData)
}

// HealthHandler provides a health check endpoint
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
		"service":   "go-event-processor",
	})
}

func main() {
	// Set up HTTP routes using standard library
	http.HandleFunc("/api/events", EventHandler)
	http.HandleFunc("/health", HealthHandler)

	port := ":8080"
	log.Printf("Go Event Processor starting on port %s", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
