package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/models"
	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/repository"
)

type ApplicationService struct {
	repo repository.ApplicationRepository
}

func NewApplicationService(repo repository.ApplicationRepository) *ApplicationService {
	return &ApplicationService{repo: repo}
}

func (s *ApplicationService) CreateApplication(ctx context.Context, req *models.Application) (*models.Application, error) {
	if req.Name == "" || req.Image == "" {
		return nil, errors.New("name and image are required")
	}

	req.ID = fmt.Sprintf("%s-%d", req.Name, time.Now().Unix())
	if req.Replicas == 0 {
		req.Replicas = 1
	}

	err := s.repo.Create(ctx, req)
	if err != nil {
		return nil, err
	}
	return req, nil
}

func (s *ApplicationService) GetApplication(ctx context.Context, id string) (*models.Application, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ApplicationService) ListApplications(ctx context.Context) ([]*models.Application, error) {
	return s.repo.List(ctx)
}

func (s *ApplicationService) DeleteApplication(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
