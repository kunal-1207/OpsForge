package postgres

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/models"
)

type PostgresApplicationRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresApplicationRepository(pool *pgxpool.Pool) *PostgresApplicationRepository {
	return &PostgresApplicationRepository{pool: pool}
}

func (r *PostgresApplicationRepository) Create(ctx context.Context, app *models.Application) error {
	query := `
		INSERT INTO applications (id, name, image, replicas, environment, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.pool.Exec(ctx, query, app.ID, app.Name, app.Image, app.Replicas, app.Environment, app.CreatedAt, app.UpdatedAt)
	return err
}

func (r *PostgresApplicationRepository) GetByID(ctx context.Context, id string) (*models.Application, error) {
	query := `
		SELECT id, name, image, replicas, environment, created_at, updated_at
		FROM applications
		WHERE id = $1
	`
	app := &models.Application{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&app.ID, &app.Name, &app.Image, &app.Replicas, &app.Environment, &app.CreatedAt, &app.UpdatedAt,
	)
	if err != nil {
		return nil, errors.New("application not found")
	}
	return app, nil
}

func (r *PostgresApplicationRepository) List(ctx context.Context) ([]*models.Application, error) {
	query := `
		SELECT id, name, image, replicas, environment, created_at, updated_at
		FROM applications
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []*models.Application
	for rows.Next() {
		app := &models.Application{}
		err := rows.Scan(
			&app.ID, &app.Name, &app.Image, &app.Replicas, &app.Environment, &app.CreatedAt, &app.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		apps = append(apps, app)
	}
	return apps, nil
}

func (r *PostgresApplicationRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM applications WHERE id = $1`
	tag, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errors.New("application not found")
	}
	return nil
}
