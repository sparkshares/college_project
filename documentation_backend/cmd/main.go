package main

import (
	"document_management_api/config"
	"document_management_api/routes"
	"log"

	"github.com/gofiber/fiber/v2"
)

func main() {
	config.InitDB()

	app := fiber.New()

	routes.SetupRoutes(app)
	log.Fatal(app.Listen(":3000"))
}
