package service

import (
	"context"
	"testing"

	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/models"
	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/repository/testrepo"
	"github.com/stretchr/testify/assert"
)

func TestCreateApplication(t *testing.T) {
	repo := testrepo.NewInMemoryApplicationRepository()
	svc := NewApplicationService(repo)

	app := &models.Application{
		Name:  "test-app",
		Image: "test-image:latest",
	}

	created, err := svc.CreateApplication(context.Background(), app)

	assert.NoError(t, err)
	assert.NotNil(t, created)
	assert.NotEmpty(t, created.ID)
	assert.Equal(t, "test-app", created.Name)
	assert.Equal(t, 1, created.Replicas) // Should default to 1

	// Retrieve to verify
	fetched, err := svc.GetApplication(context.Background(), created.ID)
	assert.NoError(t, err)
	assert.Equal(t, created.ID, fetched.ID)
}

func TestCreateApplicationValidation(t *testing.T) {
	repo := testrepo.NewInMemoryApplicationRepository()
	svc := NewApplicationService(repo)

	app := &models.Application{
		Name: "", // Missing name
	}

	_, err := svc.CreateApplication(context.Background(), app)
	assert.Error(t, err)
	assert.Equal(t, "name and image are required", err.Error())
}
