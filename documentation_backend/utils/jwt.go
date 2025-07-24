package utils

import (
	"fmt"
)

func GenerateToken(userID int) string {
	return fmt.Sprintf("testing testing new changes in the test can be listened ? token_for_user_test_%d", userID)
}
