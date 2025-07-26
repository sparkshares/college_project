package controllers

import (
	"document_management_api/models"
	"document_management_api/services"
	"document_management_api/utils"
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func CreateDocumentController(c *fiber.Ctx) error {
	// Extract token from Authorization header
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return utils.FormatResponse(c, fiber.StatusUnauthorized, "error", "Authorization header is missing", nil, nil)
	}

	// Remove "Bearer " prefix from token
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == authHeader {
		return utils.FormatResponse(c, fiber.StatusUnauthorized, "error", "Invalid authorization format. Use 'Bearer <token>'", nil, nil)
	}

	// Decode user ID from JWT token
	userID, err := utils.DecodeUserIDFromToken(tokenString)
	if err != nil {
		switch {
		case errors.Is(err, utils.ErrExpiredToken):
			return utils.FormatResponse(c, fiber.StatusUnauthorized, "error", "Token has expired", nil, nil)
		case errors.Is(err, utils.ErrInvalidToken):
			return utils.FormatResponse(c, fiber.StatusUnauthorized, "error", "Invalid token", nil, nil)
		case errors.Is(err, utils.ErrUserIDNotFound):
			return utils.FormatResponse(c, fiber.StatusUnauthorized, "error", "User ID not found in token", nil, nil)
		default:
			return utils.FormatResponse(c, fiber.StatusUnauthorized, "error", "Token validation failed", nil, err.Error())
		}
	}

	var doc models.CreateDocument
	if err := c.BodyParser(&doc); err != nil {
		return utils.FormatResponse(c, fiber.StatusBadRequest, "error", "Invalid request payload", nil, err.Error())
	}

	// Set the user ID from the JWT token
	doc.UserId = userID

	if doc.ContentJSON == "" {
		return utils.FormatResponse(c, fiber.StatusBadRequest, "error", "Missing required fields", nil, nil)
	}

	err = services.CreateUserDocumentService(&doc)
	if err != nil {
		return utils.FormatResponse(c, fiber.StatusInternalServerError, "error", "Failed to create document", nil, err.Error())
	}

	return utils.FormatResponse(
		c,
		fiber.StatusCreated,
		"success",
		"Document created successfully",
		nil,
		nil,
	)
}
func UpdateDocumentController(c *fiber.Ctx) error {
	var payload models.UpdateDocumentPayload

	if err := c.BodyParser(&payload); err != nil {
		return utils.FormatResponse(c, fiber.StatusBadRequest, "error", "Invalid payload", nil, err.Error())
	}

	status, err := services.UpdateUserDocumentService(payload)
	if err != nil {
		return utils.FormatResponse(c, fiber.StatusInternalServerError, "error", "Failed to update document", nil, err.Error())
	}

	switch status {
	case "success":
		return utils.FormatResponse(c, fiber.StatusOK, "success", "Document updated successfully", nil, nil)
	case "error_not_found":
		return utils.FormatResponse(c, fiber.StatusNotFound, "error", "Document not found", nil, nil)
	case "error_unauthorized":
		return utils.FormatResponse(c, fiber.StatusForbidden, "error", "Unauthorized to update this document", nil, nil)
	case "error_inactive":
		return utils.FormatResponse(c, fiber.StatusBadRequest, "error", "Document is inactive", nil, nil)
	default:
		return utils.FormatResponse(c, fiber.StatusInternalServerError, "error", "Something went wrong", nil, nil)
	}
}

func RestoreDocumentVersionController(c *fiber.Ctx) error {
	var payload models.RestoreDocumentPayload

	if err := c.BodyParser(&payload); err != nil {
		return utils.FormatResponse(c, fiber.StatusBadRequest, "error", "Invalid payload", nil, err.Error())
	}

	status, err := services.RestoreUserDocumentService(payload)

	if err != nil {
		return utils.FormatResponse(c, fiber.StatusOK, "error", "Failed to restore the document", nil, err.Error())
	}

	switch status {
	case "success":
		return utils.FormatResponse(c, fiber.StatusOK, "success", "Document Restored successfully", nil, nil)
	case "error_restore_failed":
		return utils.FormatResponse(c, fiber.StatusNotFound, "error", "Restored failed", nil, nil)
	case "error_document_inactive":
		return utils.FormatResponse(c, fiber.StatusForbidden, "error", "Document is inactive", nil, nil)
	case "error_unauthorized":
		return utils.FormatResponse(c, fiber.StatusBadGateway, "error", "Unauthorized to update this document", nil, nil)
	case "error_version_not_found":
		return utils.FormatResponse(c, fiber.StatusInternalServerError, "error", "Document is inactive", nil, nil)
	default:
		return utils.FormatResponse(c, fiber.StatusInternalServerError, "error", "Something went wrong", nil, nil)
	}
}

func DeleteDocumentController(c *fiber.Ctx) error {

	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)

	if err != nil {
		return utils.FormatResponse(c, fiber.StatusBadGateway, "error", "Invalid document Id", nil, err.Error)
	}

	err = services.DeleteUserDocumentService(id)

	if err != nil {
		if errors.Is(err, services.ErrNoRow) {

			return utils.FormatResponse(c, fiber.StatusNotFound, "error", "File doesn't exist", nil, nil)
		}
		return utils.FormatResponse(c, fiber.StatusOK, "error", "Something went wrong", nil, err.Error())
	}

	return utils.FormatResponse(c, fiber.StatusOK, "success", "Document Deleted Successfully", nil, nil)

}
