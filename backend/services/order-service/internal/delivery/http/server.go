package http

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/cqchien/ecomerce-rec/backend/services/order-service/pkg/logger"
)

// Server handles HTTP requests
type Server struct {
	port string
}

// NewServer creates a new HTTP server
func NewServer(port string) *Server {
	return &Server{
		port: port,
	}
}

// Start starts the HTTP server
func (s *Server) Start() error {
	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/health", s.healthCheck)
	mux.HandleFunc("/ready", s.readinessCheck)

	addr := fmt.Sprintf(":%s", s.port)
	logger.Infof("HTTP server listening on %s", addr)

	return http.ListenAndServe(addr, s.corsMiddleware(mux))
}

// healthCheck returns the health status of the service
func (s *Server) healthCheck(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":  "healthy",
		"service": "order-service",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// readinessCheck returns the readiness status of the service
func (s *Server) readinessCheck(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":  "ready",
		"service": "order-service",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// corsMiddleware adds CORS headers to responses
func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
