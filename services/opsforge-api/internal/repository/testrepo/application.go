package testrepo

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/models"
)

type InMemoryApplicationRepository struct {
	mu   sync.RWMutex
	data map[string]*models.Application
}

func NewInMemoryApplicationRepository() *InMemoryApplicationRepository {
	return &InMemoryApplicationRepository{
		data: make(map[string]*models.Application),
	}
}

func (r *InMemoryApplicationRepository) Create(ctx context.Context, app *models.Application) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	app.CreatedAt = time.Now()
	app.UpdatedAt = time.Now()
	r.data[app.ID] = app
	return nil
}

func (r *InMemoryApplicationRepository) GetByID(ctx context.Context, id string) (*models.Application, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	app, exists := r.data[id]
	if !exists {
		return nil, errors.New("application not found")
	}
	return app, nil
}

func (r *InMemoryApplicationRepository) List(ctx context.Context) ([]*models.Application, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	apps := make([]*models.Application, 0, len(r.data))
	for _, app := range r.data {
		apps = append(apps, app)
	}
	return apps, nil
}

func (r *InMemoryApplicationRepository) Delete(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.data[id]; !exists {
		return errors.New("application not found")
	}
	delete(r.data, id)
	return nil
}
