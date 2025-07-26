package controllers

import (
	"document_management_api/services"
	"document_management_api/utils"
	"errors"
	"log"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func GetDocumentBySlugController(c *fiber.Ctx) error {
	// Logic to fetch documents from the database
	slug := c.Params("slug")
	if slug == "" {
		return utils.FormatResponse(c, fiber.StatusBadRequest, "error", "Invalid document id", nil, "slug parameter is missing")
	}

	doc, err := services.GetUserDocumentBySlugService(slug)
	if err != nil {
		if errors.Is(err, services.ErrFileNotFound) {
			return utils.FormatResponse(c, fiber.StatusNotFound, "error", "File doesn't exist", nil, nil)
		}
		return utils.FormatResponse(c, fiber.StatusInternalServerError, "error", "Something went wrong", nil, err.Error())
	}
	return utils.FormatResponse(c, fiber.StatusOK, "success", "Document retrieved successfully", doc, nil)
}

func GetDocumentByUserIdController(c *fiber.Ctx) error {
	log.Printf("GetDocumentByUserIdController: Starting request processing")

	// Extract token from Authorization header
	authHeader := c.Get("Authorization")
	log.Printf("GetDocumentByUserIdController: Authorization header received: %s", authHeader)

	if authHeader == "" {
		log.Printf("GetDocumentByUserIdController: Error - Authorization header is missing")
		return utils.FormatResponse(c, fiber.StatusUnauthorized, "error", "Authorization header is missing", nil, nil)
	}

	// Remove "Bearer " prefix from token
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == authHeader {
		// No "Bearer " prefix found
		log.Printf("GetDocumentByUserIdController: Error - Invalid authorization format, no 'Bearer ' prefix found")
		return utils.FormatResponse(c, fiber.StatusUnauthorized, "error", "Invalid authorization format. Use 'Bearer <token>'", nil, nil)
	}

	log.Printf("GetDocumentByUserIdController: Token extracted (length: %d): %s...", len(tokenString), tokenString[:min(len(tokenString), 20)])

	// Decode user ID from JWT token
	log.Printf("GetDocumentByUserIdController: Attempting to decode JWT token")
	userID, err := utils.DecodeUserIDFromToken(tokenString)
	if err != nil {
		log.Printf("GetDocumentByUserIdController: JWT decode error: %v", err)
		switch {
		case errors.Is(err, utils.ErrExpiredToken):
			log.Printf("GetDocumentByUserIdController: Token has expired")
			return utils.FormatResponse(c, fiber.StatusUnauthorized, "error", "Token has expired", nil, nil)
		case errors.Is(err, utils.ErrInvalidToken):
			log.Printf("GetDocumentByUserIdController: Invalid token error: %v", err)
			return utils.FormatResponse(c, fiber.StatusUnauthorized, "error", "Invalid token", nil, nil)
		case errors.Is(err, utils.ErrUserIDNotFound):
			log.Printf("GetDocumentByUserIdController: User ID not found in token")
			return utils.FormatResponse(c, fiber.StatusUnauthorized, "error", "User ID not found in token", nil, nil)
		default:
			log.Printf("GetDocumentByUserIdController: Token validation failed with error: %v", err)
			return utils.FormatResponse(c, fiber.StatusUnauthorized, "error", "Token validation failed", nil, err.Error())
		}
	}

	log.Printf("GetDocumentByUserIdController: Successfully decoded user ID: %d", userID)

	// Get documents for the authenticated user
	log.Printf("GetDocumentByUserIdController: Fetching documents for user ID: %d", userID)
	docs, err := services.GetUserDocumentByUserIdService(userID)
	if err != nil {
		log.Printf("GetDocumentByUserIdController: Error fetching documents for user %d: %v", userID, err)
		return utils.FormatResponse(c, fiber.StatusInternalServerError, "error", "Failed to retrieve documents", nil, err.Error())
	}

	if docs == nil {
		log.Printf("GetDocumentByUserIdController: No documents found for user ID: %d", userID)
		return utils.FormatResponse(c, fiber.StatusAccepted, "success", "No documents found for this user", nil, nil)
	}

	log.Printf("GetDocumentByUserIdController: Successfully retrieved %d documents for user ID: %d", len(docs), userID)
	return utils.FormatResponse(c, fiber.StatusOK, "success", "Documents retrieved successfully", docs, nil)
}

func ListDocumentVersionsController(c *fiber.Ctx) error {
	docIdStr := c.Params("id")
	id, err := strconv.Atoi(docIdStr)

	if err != nil {
		return utils.FormatResponse(c, fiber.StatusBadRequest, "error", "Invalid user ID", nil, err.Error())
	}

	versions, err := services.ListDocumentVersionByService(id)

	if err != nil {
		return utils.FormatResponse(c, fiber.StatusInternalServerError, "error", "Failed to retrive documents", nil, err.Error())
	}

	if versions == nil {
		return utils.FormatResponse(c, fiber.StatusNotFound, "error", "No version found for this id", nil, nil)
	}

	return utils.FormatResponse(c, fiber.StatusOK, "success", "Versions retrived successfully", versions, nil)
}
