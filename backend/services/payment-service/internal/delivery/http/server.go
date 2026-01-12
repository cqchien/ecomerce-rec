package http

import (
	"encoding/json"
	"net/http"
)

type Server struct {
	port string
}

// NewServer creates a new HTTP server for health checks
func NewServer(port string) *Server {
	return &Server{port: port}
}

// Start starts the HTTP server
func (s *Server) Start() error {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.healthCheck)
	mux.HandleFunc("/ready", s.readyCheck)

	server := &http.Server{
		Addr:    ":" + s.port,
		Handler: mux,
	}

	return server.ListenAndServe()
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
