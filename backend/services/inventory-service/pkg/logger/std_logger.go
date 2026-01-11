package logger

import (
	"log"
	"os"
)

type stdLogger struct {
	logger *log.Logger
}

// NewLogger creates a new standard logger
func NewLogger() Logger {
	return &stdLogger{
		logger: log.New(os.Stdout, "[INVENTORY-SERVICE] ", log.LstdFlags|log.Lshortfile),
	}
}

func (l *stdLogger) Debug(msg string, keysAndValues ...interface{}) {
	l.logger.Printf("[DEBUG] %s %v", msg, keysAndValues)
}

func (l *stdLogger) Info(msg string, keysAndValues ...interface{}) {
	l.logger.Printf("[INFO] %s %v", msg, keysAndValues)
}

func (l *stdLogger) Warn(msg string, keysAndValues ...interface{}) {
	l.logger.Printf("[WARN] %s %v", msg, keysAndValues)
}

func (l *stdLogger) Error(msg string, keysAndValues ...interface{}) {
	l.logger.Printf("[ERROR] %s %v", msg, keysAndValues)
}

func (l *stdLogger) Fatal(msg string, keysAndValues ...interface{}) {
	l.logger.Fatalf("[FATAL] %s %v", msg, keysAndValues)
}
