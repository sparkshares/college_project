package routes

import (
	"document_management_api/controllers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")
	api.Get("/doc/:slug", controllers.GetDocumentBySlugController)
	api.Get("/user-doc", controllers.GetDocumentByUserIdController)
	api.Post("/create-doc", controllers.CreateDocumentController)
	api.Delete("/delete-doc/:id", controllers.DeleteDocumentController)
	api.Put("/update-doc/:id", controllers.UpdateDocumentController)
	api.Get("/list-doc-versions/:id", controllers.ListDocumentVersionsController)
	api.Post("/restore-version/", controllers.RestoreDocumentVersionController)

	// New event handling routes
	api.Post("/events", controllers.EventHandler)
	api.Get("/health", controllers.HealthHandler)

}
