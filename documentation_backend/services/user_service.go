package services

import (
    "context"
    "document_management_api/config"
    "document_management_api/queries"
    "fmt"
)

// CreateUserService creates a new user record in the database
func CreateUserService(userID int, username, displayName, email string) error {
    ctx := context.Background()
    
    _, err := config.DB.Exec(
        ctx,
        queries.InsertUser,
        userID,
        username,
        displayName,
        email,
    )
    
    if err != nil {
        return fmt.Errorf("error inserting user: %w", err)
    }
    
    return nil
}