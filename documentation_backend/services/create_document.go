package services

import (
	"context"
	"document_management_api/config"
	"document_management_api/models"
	"document_management_api/queries"
	"document_management_api/services/utils"
	"errors"
	"fmt"
)

var ErrNoRow = errors.New("Record doesn't exist")

func CreateUserDocumentService(doc *models.CreateDocument) error {
	ctx := context.Background()
	linkSlug := utils.GenerateRandomSlug(7)
	DocumentStatus := "active"

	_, err := config.DB.Exec(
		ctx,
		queries.InsertUserDocument,
		doc.UserId,
		doc.Title,
		doc.ContentJSON,
		doc.ThumbnailPath,
		doc.Keywords,
		DocumentStatus,
		linkSlug,
		doc.FollowersOnly,
		doc.Visibility,
	)
	if err != nil {
		return fmt.Errorf("error inserting document: %w", err)
	}

	return nil
}

func DeleteUserDocumentService(id int) error {
	ctx := context.Background()
	cmd, err := config.DB.Exec(ctx, queries.DeleteDocumentByID, id)
	if err != nil {
		return fmt.Errorf("error deleting document: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return ErrNoRow
	}
	return nil
}

func UpdateUserDocumentService(payload models.UpdateDocumentPayload) (string, error) {
	ctx := context.Background()
	var status string
	err := config.DB.QueryRow(
		ctx,
		queries.UpdateDocumentFunction,
		payload.DocId,
		payload.UserId,
		payload.ContentJSON,
	).Scan(&status)
	if err != nil {
		return "", fmt.Errorf("error updating document: %w", err)
	}
	return status, nil
}

func RestoreUserDocumentService(payload models.RestoreDocumentPayload) (string, error) {
	ctx := context.Background()
	var status string
	err := config.DB.QueryRow(
		ctx,
		queries.RestoreDocumentVersion,
		payload.UserId,
		payload.VersionId,
	).Scan(&status)

	if err != nil {
		return "", fmt.Errorf("error restoring database %w", err)
	}

	return status, nil
}
