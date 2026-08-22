package api

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/api/handlers"
	"github.com/kunal-1207/OpsForge/services/opsforge-api/internal/service"
)

func SetupRouter(appService *service.ApplicationService) *gin.Engine {
	r := gin.Default()

	r.Use(cors.Default())
	r.Use(otelgin.Middleware("opsforge-api"))

	appHandler := handlers.NewApplicationHandler(appService)

	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", handlers.HealthCheck)
		v1.GET("/ready", handlers.ReadyCheck)

		v1.POST("/applications", appHandler.Create)
		v1.GET("/applications", appHandler.List)
		v1.GET("/applications/:id", appHandler.Get)
		v1.DELETE("/applications/:id", appHandler.Delete)
	}

	return r
}
