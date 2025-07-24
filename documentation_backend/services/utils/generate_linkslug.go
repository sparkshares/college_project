package utils

import (
	"math/rand"
	"time"
)

const slugCharset = "FDfasdf931abcdefghijklmno1323SFGFHSHHGDSFpqrstuvwxyzAB231CDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func GenerateRandomSlug(length int) string {

	rand.Seed(time.Now().UnixNano())
	b := make([]byte, length)

	for i := range b {
		b[i] = slugCharset[rand.Intn(len(slugCharset))]
	}

	return string(b)
}
