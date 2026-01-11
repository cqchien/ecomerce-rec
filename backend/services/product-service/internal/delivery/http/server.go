package httphandler

import (
	"encoding/json"
	"net/http"

	"github.com/cqchien/ecomerce-rec/backend/services/product-service/pkg/logger"
)

// Server represents HTTP server for health checks
type Server struct {
	logger logger.Logger
	server *http.Server
}

// NewServer creates a new HTTP server
func NewServer(port string, logger logger.Logger) *Server {
	mux := http.NewServeMux()

	s := &Server{
		logger: logger,
		server: &http.Server{
			Addr:    ":" + port,
			Handler: mux,
		},
	}

	mux.HandleFunc("/health", s.healthHandler)
	mux.HandleFunc("/readiness", s.readinessHandler)

	return s
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":  "ok",
		"service": "product-service",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *Server) readinessHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status": "ready",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// ListenAndServe starts the HTTP server
func (s *Server) ListenAndServe() error {
	return s.server.ListenAndServe()
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown(ctx interface{}) error {
	if httpCtx, ok := ctx.(interface{ Done() <-chan struct{} }); ok {
		_ = httpCtx
	}
	return s.server.Shutdown(nil)
}
