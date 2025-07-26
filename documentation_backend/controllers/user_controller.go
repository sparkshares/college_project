package controllers

import (
	"document_management_api/services"
	"document_management_api/utils"
	"encoding/json"
	"log"

	"github.com/gofiber/fiber/v2"
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

// EventHandler handles incoming events from Django using Fiber
func EventHandler(c *fiber.Ctx) error {
	var event Event
	if err := c.BodyParser(&event); err != nil {
		log.Printf("Error decoding event: %v", err)
		return utils.FormatResponse(c, fiber.StatusBadRequest, "error", "Invalid JSON", nil, err.Error())
	}

	log.Printf("Received event: %s from %s", event.EventType, event.Source)

	// Process event based on type
	switch event.EventType {
	case "user.registered":
		err := handleUserRegistration(event)
		if err != nil {
			return utils.FormatResponse(c, fiber.StatusInternalServerError, "error", "Failed to process user registration", nil, err.Error())
		}
	case "user.login":
		err := handleUserLogin(event)
		if err != nil {
			return utils.FormatResponse(c, fiber.StatusInternalServerError, "error", "Failed to process user login", nil, err.Error())
		}
	default:
		log.Printf("Unknown event type: %s", event.EventType)
		return utils.FormatResponse(c, fiber.StatusBadRequest, "error", "Unknown event type", nil, nil)
	}

	return utils.FormatResponse(c, fiber.StatusOK, "success", "Event processed successfully", nil, nil)
}

// handleUserRegistration processes user registration events
func handleUserRegistration(event Event) error {
	log.Printf("Processing user registration event for user ID: %v", event.UserID)

	// Extract user data
	dataBytes, _ := json.Marshal(event.Data)
	var userData UserRegistrationData
	if err := json.Unmarshal(dataBytes, &userData); err != nil {
		log.Printf("Error parsing user registration data: %v", err)
		return err
	}

	log.Printf("User registered: %s (%s) at %s",
		userData.Username,
		userData.Email,
		userData.RegistrationTimestamp)

	// Create user record in database
	err := services.CreateUserService(userData.UserID, userData.Username, userData.Username, userData.Email)
	if err != nil {
		log.Printf("Error creating user in database: %v", err)
		return err
	}

	log.Printf("User record created successfully for: %s", userData.Username)
	return nil
}

// handleUserLogin processes user login events
func handleUserLogin(event Event) error {
	log.Printf("Processing user login event for user ID: %v", event.UserID)

	// Extract login data
	dataBytes, _ := json.Marshal(event.Data)
	var loginData UserLoginData
	if err := json.Unmarshal(dataBytes, &loginData); err != nil {
		log.Printf("Error parsing user login data: %v", err)
		return err
	}

	log.Printf("User logged in: %s (%s) from IP %s at %s",
		loginData.Username,
		loginData.Email,
		loginData.IPAddress,
		loginData.LoginTimestamp)

	// Here you can add login-specific logic
	// For now, just logging the event
	return nil
}

// HealthHandler provides a health check endpoint
func HealthHandler(c *fiber.Ctx) error {
	return utils.FormatResponse(c, fiber.StatusOK, "success", "Service is healthy", map[string]string{
		"service":   "documentation-backend",
		"timestamp": c.Context().Time().Format("2006-01-02T15:04:05Z07:00"),
	}, nil)
}
