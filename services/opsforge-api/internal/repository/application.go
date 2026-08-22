package repository

import (
	"context"

	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/models"
)

type ApplicationRepository interface {
	Create(ctx context.Context, app *models.Application) error
	GetByID(ctx context.Context, id string) (*models.Application, error)
	List(ctx context.Context) ([]*models.Application, error)
	Delete(ctx context.Context, id string) error
}
