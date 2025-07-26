package utils

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/golang-jwt/jwt/v5"
)

// Custom errors for JWT handling
var (
	ErrUserIDNotFound = errors.New("user ID not found in token")
	ErrExpiredToken   = errors.New("token has expired")
	ErrInvalidToken   = errors.New("invalid token")
	ErrTokenParsing   = errors.New("error parsing token")
)

// JWTClaims represents the JWT claims structure
type JWTClaims struct {
	UserID int `json:"user_id"`
	jwt.RegisteredClaims
}

// getJWTKey retrieves the JWT secret key from environment variables
func getJWTKey() string {
	secretKey := os.Getenv("JWT_SECRET_KEY")
	log.Printf("getJWTKey: JWT_SECRET_KEY from environment: %s", func() string {
		if secretKey == "" {
			return "NOT SET"
		}
		return fmt.Sprintf("SET (length: %d)", len(secretKey))
	}())

	if secretKey == "" {
		// Fallback to a default key (not recommended for production)
		secretKey = "your-default-secret-key"
		log.Printf("getJWTKey: Using fallback secret key")
	}
	return secretKey
}

// DecodeUserIDFromToken decodes a JWT token and extracts the user ID
func DecodeUserIDFromToken(tokenString string) (int, error) {
	log.Printf("DecodeUserIDFromToken: Starting token decode process")
	log.Printf("DecodeUserIDFromToken: Token string length: %d", len(tokenString))

	// Convert bytes to string if needed (Go equivalent of Python's decode)
	if tokenString == "" {
		log.Printf("DecodeUserIDFromToken: Error - empty token string")
		return 0, ErrInvalidToken
	}

	// Log first and last few characters for debugging (don't log full token for security)
	if len(tokenString) > 20 {
		log.Printf("DecodeUserIDFromToken: Token preview: %s...%s", tokenString[:10], tokenString[len(tokenString)-10:])
	} else {
		log.Printf("DecodeUserIDFromToken: Short token: %s", tokenString)
	}

	secretKey := getJWTKey()
	log.Printf("DecodeUserIDFromToken: Using secret key (length: %d)", len(secretKey))

	// Parse the token
	log.Printf("DecodeUserIDFromToken: Attempting to parse JWT token with claims")
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		log.Printf("DecodeUserIDFromToken: Token validation callback - signing method: %v", token.Header["alg"])

		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			log.Printf("DecodeUserIDFromToken: Error - unexpected signing method: %v", token.Header["alg"])
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		log.Printf("DecodeUserIDFromToken: Signing method validation passed")
		return []byte(secretKey), nil
	})

	if err != nil {
		log.Printf("DecodeUserIDFromToken: Token parsing failed with error: %v", err)

		// Handle specific JWT errors
		if errors.Is(err, jwt.ErrTokenExpired) {
			log.Printf("DecodeUserIDFromToken: Token has expired")
			return 0, ErrExpiredToken
		}
		if errors.Is(err, jwt.ErrTokenMalformed) {
			log.Printf("DecodeUserIDFromToken: Token is malformed")
			return 0, ErrInvalidToken
		}
		if errors.Is(err, jwt.ErrTokenSignatureInvalid) {
			log.Printf("DecodeUserIDFromToken: Token signature is invalid")
			return 0, ErrInvalidToken
		}

		log.Printf("DecodeUserIDFromToken: General token parsing error: %v", err)
		return 0, fmt.Errorf("%w: %v", ErrTokenParsing, err)
	}

	log.Printf("DecodeUserIDFromToken: Token parsing successful, extracting claims")
	log.Printf("DecodeUserIDFromToken: Token valid status: %t", token.Valid)

	// Extract claims
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		log.Printf("DecodeUserIDFromToken: Claims extraction successful")
		log.Printf("DecodeUserIDFromToken: Extracted user ID: %d", claims.UserID)

		if claims.UserID == 0 {
			log.Printf("DecodeUserIDFromToken: Error - user ID is 0 or missing")
			return 0, ErrUserIDNotFound
		}

		log.Printf("DecodeUserIDFromToken: Successfully decoded user ID: %d", claims.UserID)
		return claims.UserID, nil
	}

	log.Printf("DecodeUserIDFromToken: Error - failed to extract claims or token invalid")
	return 0, ErrInvalidToken
}

// Alternative function for tokens with user_id as string (if needed)
func DecodeUserIDFromTokenString(tokenString string) (int, error) {
	log.Printf("DecodeUserIDFromTokenString: Starting alternative token decode process")
	log.Printf("DecodeUserIDFromTokenString: Token string length: %d", len(tokenString))

	secretKey := getJWTKey()
	log.Printf("DecodeUserIDFromTokenString: Using secret key (length: %d)", len(secretKey))

	// Parse the token with generic claims
	log.Printf("DecodeUserIDFromTokenString: Parsing token with generic claims")
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		log.Printf("DecodeUserIDFromTokenString: Token validation callback - signing method: %v", token.Header["alg"])

		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			log.Printf("DecodeUserIDFromTokenString: Error - unexpected signing method: %v", token.Header["alg"])
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		log.Printf("DecodeUserIDFromTokenString: Token parsing failed: %v", err)

		if errors.Is(err, jwt.ErrTokenExpired) {
			log.Printf("DecodeUserIDFromTokenString: Token has expired")
			return 0, ErrExpiredToken
		}
		if errors.Is(err, jwt.ErrTokenMalformed) || errors.Is(err, jwt.ErrTokenSignatureInvalid) {
			log.Printf("DecodeUserIDFromTokenString: Token is malformed or has invalid signature")
			return 0, ErrInvalidToken
		}
		return 0, fmt.Errorf("%w: %v", ErrTokenParsing, err)
	}

	log.Printf("DecodeUserIDFromTokenString: Token parsing successful, extracting claims")
	log.Printf("DecodeUserIDFromTokenString: Token valid status: %t", token.Valid)

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		log.Printf("DecodeUserIDFromTokenString: Claims extracted successfully")
		log.Printf("DecodeUserIDFromTokenString: All claims: %+v", claims)

		// Try to get user_id as different types
		if userIDInterface, exists := claims["user_id"]; exists {
			log.Printf("DecodeUserIDFromTokenString: Found user_id claim: %v (type: %T)", userIDInterface, userIDInterface)

			switch userID := userIDInterface.(type) {
			case float64:
				log.Printf("DecodeUserIDFromTokenString: Converting float64 user_id: %f to int: %d", userID, int(userID))
				return int(userID), nil
			case int:
				log.Printf("DecodeUserIDFromTokenString: User_id is already int: %d", userID)
				return userID, nil
			case string:
				log.Printf("DecodeUserIDFromTokenString: Converting string user_id: %s to int", userID)
				id, err := strconv.Atoi(userID)
				if err != nil {
					log.Printf("DecodeUserIDFromTokenString: Error converting string to int: %v", err)
					return 0, fmt.Errorf("invalid user_id format: %v", userID)
				}
				log.Printf("DecodeUserIDFromTokenString: Successfully converted string to int: %d", id)
				return id, nil
			default:
				log.Printf("DecodeUserIDFromTokenString: Error - user_id has unexpected type: %T, value: %v", userID, userID)
				return 0, fmt.Errorf("user_id has unexpected type: %T", userID)
			}
		}

		log.Printf("DecodeUserIDFromTokenString: Error - user_id claim not found in token")
		return 0, ErrUserIDNotFound
	}

	log.Printf("DecodeUserIDFromTokenString: Error - failed to extract claims or token invalid")
	return 0, ErrInvalidToken
}

// ValidateToken validates a JWT token without extracting claims
func ValidateToken(tokenString string) bool {
	log.Printf("ValidateToken: Validating token (length: %d)", len(tokenString))

	_, err := DecodeUserIDFromToken(tokenString)
	isValid := err == nil

	log.Printf("ValidateToken: Token validation result: %t", isValid)
	if !isValid {
		log.Printf("ValidateToken: Validation failed with error: %v", err)
	}

	return isValid
}
