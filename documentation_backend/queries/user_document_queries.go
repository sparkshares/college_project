package queries

const InsertUserDocument = `
INSERT INTO "UserDocument" (
	user_id,
	title,
	content_json,
	thumbnail_path,
	keywords,
	document_status,
	link_slug,
	followers_only,
	visibility,
	created_at,
	updated_at
) VALUES (
	$1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
);
`

const InsertUser = `
INSERT INTO "UserRelatedData" (user_id, username, display_name, profile_picture, email)
	VALUES ($1,$2,$3, NULL,$4)

`

const UpdateUserDocument = `
UPDATE "UserDocument" SET
    content_json = $1,
    thumbnail_path = $2,
    keywords = $3,
    document_status = $4,
    link_slug = $5,
    followers_only = $6,
    visibility = $7,
    updated_at = NOW()
WHERE id = $8;
`

const DeleteDocumentByID = `
UPDATE "UserDocument" SET document_status='deleted' WHERE id=$1 and document_status='active';
`

const GetUserDocumentBySlug = `
SELECT 
	ud.id,ud.content_json, ud.title, ud.thumbnail_path, ud.keywords, 
	ud.followers_only, ud.visibility, ud.created_at, ud.updated_at,urd.display_name, urd.username,urd.profile_picture
FROM "UserDocument" ud INNER JOIN "UserRelatedData" urd ON ud.user_id = urd.user_id
 WHERE link_slug = $1 AND document_status='active';
`

const GetUserDocumentByUserID = `
SELECT 
	id, title, thumbnail_path, keywords, 
	link_slug, followers_only, visibility, created_at, updated_at
FROM "UserDocument"
WHERE user_id = $1 AND document_status ='active'
ORDER BY created_at DESC;
`

const SaveDocumentVersion = `
INSERT INTO "DocumentVersion" (
document_id,edited_by_user_id,version_number,content_json
) VALUES ($1,$2,$3,$4)
`

// format like : doc_id , editor_user_id, new_content json,
// This returns error_not_found , error_unauthorized, error_inactive, success
const UpdateDocumentFunction = `
SELECT update_document_content($1, $2, $3::jsonb)
`

const ListDocumentVersions = `
SELECT id,version_number,created_at FROM "DocumentVersion" WHERE document_id = $1 
`

// it has user_id , version_id
const RestoreDocumentVersion = `
SELECT restore_document_version($1,$2)
`
