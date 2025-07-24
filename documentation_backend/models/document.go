package models

import "time"

type RetriveDocument struct {
	ID            int         `json:"id"`
	Title         string      `json:"title"`
	ContentJSON   string      `json:"content_json"`
	ThumbnailPath string      `json:"thumbnail_path"`
	Keywords      string      `json:"keywords"`
	FollowersOnly bool        `json:"followers_only"`
	Visibility    string      `json:"visibility"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
	Profile       UserProfile `json:"profile"`
}

type UserProfile struct {
	Username       string `json:"username"`
	DisplayName    string `json:"display_name"`
	ProfilePicture string `json:"profile_picture"`
}

type RetriveDocuments struct {
	ID            int       `json:"id"`
	Title         string    `json:"title"`
	ThumbnailPath string    `json:"thumbnail_path"`
	Keywords      string    `json:"keywords"`
	LinkSlug      string    `json:"link_slug"`
	FollowersOnly bool      `json:"followers_only"`
	Visibility    string    `json:"visibility"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreateDocument struct {
	ID            int    `json:"id"`
	UserId        int    `json:"user_id"`
	Title         string `json:"title"`
	ContentJSON   string `json:"content_json"`
	ThumbnailPath string `json:"thumbnail_path"`
	Keywords      string `json:"keywords"`
	LinkSlug      string `json:"link_slug"`
	FollowersOnly bool   `json:"followers_only"`
	Visibility    string `json:"visibility"`
}

type UpdateDocumentPayload struct {
	DocId       int    `json:"doc_id"`
	UserId      int    `json:"user_id"`
	ContentJSON string `json:"content_json"`
}

type RestoreDocumentPayload struct {
	UserId    int `json:"user_id"`
	VersionId int `json:"version_id"`
}

type DocumentVersionPayload struct {
	DocId       int    `json:"doc_id"`
	UserId      int    `json:"user_id"`
	ContentJSON string `json:"content_json"`
}

type ListVersions struct {
	ID            int       `json:"id"`
	VersionNumber int       `json:"version_number"`
	CreatedAt     time.Time `json:"created_at"`
}
