package services

import (
	"context"
	"document_management_api/config"
	"document_management_api/models"
	"document_management_api/queries"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

var ErrFileNotFound = errors.New("file doesn't exist")

func GetUserDocumentBySlugService(slug string) (*models.RetriveDocument, error) {
	// You can use context for future cancellation or timeout handling
	ctx := context.Background()
	row := config.DB.QueryRow(ctx, queries.GetUserDocumentBySlug, slug)

	var doc models.RetriveDocument

	err := row.Scan(
		&doc.ID,
		&doc.ContentJSON,
		&doc.Title,
		&doc.ThumbnailPath,
		&doc.Keywords,
		&doc.FollowersOnly,
		&doc.Visibility,
		&doc.CreatedAt,
		&doc.UpdatedAt,
		&doc.Profile.DisplayName,
		&doc.Profile.Username,
		&doc.Profile.ProfilePicture,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, ErrFileNotFound
		}
		return nil, err
	}

	return &doc, nil
}

func GetUserDocumentByUserIdService(id int) ([]*models.RetriveDocuments, error) {
	ctx := context.Background()
	rows, err := config.DB.Query(ctx, queries.GetUserDocumentByUserID, id)
	if err != nil {
		return nil, fmt.Errorf("error querying documents: %w", err)
	}
	defer rows.Close()

	var docs []*models.RetriveDocuments
	for rows.Next() {
		var doc models.RetriveDocuments
		err := rows.Scan(
			&doc.ID,
			&doc.Title,
			&doc.ThumbnailPath,
			&doc.Keywords,
			&doc.LinkSlug,
			&doc.FollowersOnly,
			&doc.Visibility,
			&doc.CreatedAt,
			&doc.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning document: %w", err)
		}
		docs = append(docs, &doc)
	}

	if len(docs) == 0 {
		return nil, nil
	}

	return docs, nil
}

func ListDocumentVersionByService(id int) ([]*models.ListVersions, error) {
	ctx := context.Background()

	rows, err := config.DB.Query(ctx, queries.ListDocumentVersions, id)
	if err != nil {
		return nil, fmt.Errorf("error querying documents: %w", err)
	}

	defer rows.Close()

	var versions []*models.ListVersions

	for rows.Next() {
		var version models.ListVersions

		err := rows.Scan(
			&version.ID,
			&version.VersionNumber,
			&version.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning document %w", err)
		}

		versions = append(versions, &version)
	}

	if len(versions) == 0 {
		return nil, nil
	}

	return versions, nil
}
