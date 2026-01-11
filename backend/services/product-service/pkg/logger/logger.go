package logger

import (
	"fmt"
	"io"
	"os"
	"time"

	"github.com/rs/zerolog"
)

// Logger defines the interface for logging
type Logger interface {
	Debug(msg string, keysAndValues ...interface{})
	Info(msg string, keysAndValues ...interface{})
	Warn(msg string, keysAndValues ...interface{})
	Error(msg string, keysAndValues ...interface{})
	Fatal(msg string, keysAndValues ...interface{})
}

type zerologLogger struct {
	logger zerolog.Logger
}

// New creates a new logger
func New(serviceName, level string) Logger {
	var logLevel zerolog.Level
	switch level {
	case "debug":
		logLevel = zerolog.DebugLevel
	case "info":
		logLevel = zerolog.InfoLevel
	case "warn":
		logLevel = zerolog.WarnLevel
	case "error":
		logLevel = zerolog.ErrorLevel
	default:
		logLevel = zerolog.InfoLevel
	}

	output := zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: time.RFC3339,
		NoColor:    false,
	}

	logger := zerolog.New(output).
		Level(logLevel).
		With().
		Timestamp().
		Str("service", serviceName).
		Logger()

	return &zerologLogger{logger: logger}
}

// NewWithWriter creates a new logger with custom writer
func NewWithWriter(serviceName string, level string, writer io.Writer) Logger {
	var logLevel zerolog.Level
	switch level {
	case "debug":
		logLevel = zerolog.DebugLevel
	case "info":
		logLevel = zerolog.InfoLevel
	case "warn":
		logLevel = zerolog.WarnLevel
	case "error":
		logLevel = zerolog.ErrorLevel
	default:
		logLevel = zerolog.InfoLevel
	}

	logger := zerolog.New(writer).
		Level(logLevel).
		With().
		Timestamp().
		Str("service", serviceName).
		Logger()

	return &zerologLogger{logger: logger}
}

func (l *zerologLogger) Debug(msg string, keysAndValues ...interface{}) {
	event := l.logger.Debug()
	l.addFields(event, keysAndValues...)
	event.Msg(msg)
}

func (l *zerologLogger) Info(msg string, keysAndValues ...interface{}) {
	event := l.logger.Info()
	l.addFields(event, keysAndValues...)
	event.Msg(msg)
}

func (l *zerologLogger) Warn(msg string, keysAndValues ...interface{}) {
	event := l.logger.Warn()
	l.addFields(event, keysAndValues...)
	event.Msg(msg)
}

func (l *zerologLogger) Error(msg string, keysAndValues ...interface{}) {
	event := l.logger.Error()
	l.addFields(event, keysAndValues...)
	event.Msg(msg)
}

func (l *zerologLogger) Fatal(msg string, keysAndValues ...interface{}) {
	event := l.logger.Fatal()
	l.addFields(event, keysAndValues...)
	event.Msg(msg)
}

func (l *zerologLogger) addFields(event *zerolog.Event, keysAndValues ...interface{}) {
	for i := 0; i < len(keysAndValues); i += 2 {
		if i+1 < len(keysAndValues) {
			key := fmt.Sprintf("%v", keysAndValues[i])
			value := keysAndValues[i+1]
			event.Interface(key, value)
		}
	}
}
