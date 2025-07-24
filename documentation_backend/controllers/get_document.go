package controllers

import (
	"document_management_api/services"
	"document_management_api/utils"
	"errors"
	"strconv"

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
	userIdStr := c.Params("id")
	id, err := strconv.Atoi(userIdStr)
	if err != nil {
		return utils.FormatResponse(c, fiber.StatusBadRequest, "error", "Invalid user ID", nil, err.Error())
	}

	docs, err := services.GetUserDocumentByUserIdService(id)
	if err != nil {
		return utils.FormatResponse(c, fiber.StatusInternalServerError, "error", "Failed to retrieve documents", nil, err.Error())
	}

	if docs == nil {
		return utils.FormatResponse(c, fiber.StatusNotFound, "error", "No documents found for this user", nil, nil)
	}

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
