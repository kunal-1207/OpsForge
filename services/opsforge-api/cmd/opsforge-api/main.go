package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/api"
	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/config"
	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/repository"
	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/repository/postgres"
	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/repository/testrepo"
	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/service"
	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/telemetry"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"
)

func main() {
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.Info("Starting OpsForge API...")

	tp, err := telemetry.InitTracer("opsforge-api")
	if err != nil {
		logrus.Fatalf("Failed to initialize tracer: %v", err)
	}
	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			logrus.Errorf("Error shutting down tracer provider: %v", err)
		}
	}()

	cfg := config.LoadConfig()

	var repo repository.ApplicationRepository

	if cfg.DatabaseURL != "" {
		pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
		if err != nil {
			logrus.Fatalf("Failed to connect to database: %v", err)
		}
		defer pool.Close()
		repo = postgres.NewPostgresApplicationRepository(pool)
		logrus.Info("Using PostgreSQL repository")
	} else {
		repo = testrepo.NewInMemoryApplicationRepository()
		logrus.Info("Using InMemory repository")
	}

	appService := service.NewApplicationService(repo)

	router := api.SetupRouter(appService)

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Port),
		Handler: router,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.Fatalf("Failed to start server: %v", err)
		}
	}()
	logrus.Infof("Server running on port %s", cfg.Port)

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logrus.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logrus.Fatalf("Server forced to shutdown: %v", err)
	}

	logrus.Info("Server exiting")
}
