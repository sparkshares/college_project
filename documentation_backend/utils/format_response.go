package utils

import "github.com/gofiber/fiber/v2"

type APIResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Errors  interface{} `json:"errors,omitempty"`
}

func FormatResponse(c *fiber.Ctx, statusCode int, status, message string, data interface{}, errors interface{}) error {
	resp := APIResponse{
		Status:  status,
		Message: message,
		Data:    data,
		Errors:  errors,
	}
	return c.Status(statusCode).JSON(resp)
}
