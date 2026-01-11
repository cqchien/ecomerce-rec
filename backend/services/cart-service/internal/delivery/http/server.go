package http

import (
	"encoding/json"
	"net/http"

	"github.com/cqchien/ecomerce-rec/backend/services/cart-service/pkg/logger"
)

type Server struct {
	logger logger.Logger
}

// NewServer creates a new HTTP server for health checks
func NewServer(port string, logger logger.Logger) *http.Server {
	s := &Server{
		logger: logger,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.healthCheck)
	mux.HandleFunc("/ready", s.readyCheck)

	return &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}
}

func (s *Server) healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
	})
}

func (s *Server) readyCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ready",
	})
}
