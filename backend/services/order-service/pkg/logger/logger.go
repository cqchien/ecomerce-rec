package logger

import (
	"log"
	"os"
)

type Logger struct {
	infoLogger  *log.Logger
	errorLogger *log.Logger
}

var defaultLogger *Logger

func init() {
	defaultLogger = &Logger{
		infoLogger:  log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile),
		errorLogger: log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile),
	}
}

func Info(v ...interface{}) {
	defaultLogger.infoLogger.Println(v...)
}

func Infof(format string, v ...interface{}) {
	defaultLogger.infoLogger.Printf(format, v...)
}

func Error(v ...interface{}) {
	defaultLogger.errorLogger.Println(v...)
}

func Errorf(format string, v ...interface{}) {
	defaultLogger.errorLogger.Printf(format, v...)
}

func Fatal(v ...interface{}) {
	defaultLogger.errorLogger.Fatal(v...)
}

func Fatalf(format string, v ...interface{}) {
	defaultLogger.errorLogger.Fatalf(format, v...)
}
