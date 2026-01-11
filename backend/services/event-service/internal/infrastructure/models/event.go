package models

import (
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Event represents the GORM model for events
type Event struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key"`
	Type         string    `gorm:"type:varchar(100);not null;index"`
	AggregateID  uuid.UUID `gorm:"type:uuid;not null;index"`
	Payload      string    `gorm:"type:text;not null"`
	Status       string    `gorm:"type:varchar(50);not null;index"`
	RetryCount   int       `gorm:"default:0"`
	ErrorMessage string    `gorm:"type:text"`
	CreatedAt    time.Time `gorm:"index"`
	UpdatedAt    time.Time
	ProcessedAt  *time.Time
	DeletedAt    gorm.DeletedAt `gorm:"index"`
}

// TableName specifies the table name for Event
func (Event) TableName() string {
	return "events"
}

// ToDomain converts GORM Event to domain Event
func (e *Event) ToDomain() *domain.Event {
	return &domain.Event{
		ID:           e.ID,
		Type:         domain.EventType(e.Type),
		AggregateID:  e.AggregateID,
		Payload:      e.Payload,
		Status:       domain.EventStatus(e.Status),
		RetryCount:   e.RetryCount,
		ErrorMessage: e.ErrorMessage,
		CreatedAt:    e.CreatedAt,
		UpdatedAt:    e.UpdatedAt,
		ProcessedAt:  e.ProcessedAt,
	}
}

// FromDomain converts domain Event to GORM Event
func (e *Event) FromDomain(domainEvent *domain.Event) {
	e.ID = domainEvent.ID
	e.Type = string(domainEvent.Type)
	e.AggregateID = domainEvent.AggregateID
	e.Payload = domainEvent.Payload
	e.Status = string(domainEvent.Status)
	e.RetryCount = domainEvent.RetryCount
	e.ErrorMessage = domainEvent.ErrorMessage
	e.CreatedAt = domainEvent.CreatedAt
	e.UpdatedAt = domainEvent.UpdatedAt
	e.ProcessedAt = domainEvent.ProcessedAt
}
