package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// EventType represents the type of event
type EventType string

const (
	EventTypeUserCreated      EventType = "USER_CREATED"
	EventTypeUserUpdated      EventType = "USER_UPDATED"
	EventTypeProductCreated   EventType = "PRODUCT_CREATED"
	EventTypeProductUpdated   EventType = "PRODUCT_UPDATED"
	EventTypeOrderCreated     EventType = "ORDER_CREATED"
	EventTypeOrderUpdated     EventType = "ORDER_UPDATED"
	EventTypeOrderCancelled   EventType = "ORDER_CANCELLED"
	EventTypePaymentCompleted EventType = "PAYMENT_COMPLETED"
	EventTypePaymentFailed    EventType = "PAYMENT_FAILED"
	EventTypeInventoryUpdated EventType = "INVENTORY_UPDATED"
	EventTypeCartUpdated      EventType = "CART_UPDATED"
)

// EventStatus represents the processing status of an event
type EventStatus string

const (
	EventStatusPending    EventStatus = "PENDING"
	EventStatusProcessing EventStatus = "PROCESSING"
	EventStatusProcessed  EventStatus = "PROCESSED"
	EventStatusFailed     EventStatus = "FAILED"
)

var (
	ErrEventNotFound         = errors.New("event not found")
	ErrInvalidEventType      = errors.New("invalid event type")
	ErrInvalidEventData      = errors.New("invalid event data")
	ErrEventAlreadyProcessed = errors.New("event already processed")
)

// Event represents a domain event in the system
type Event struct {
	ID           uuid.UUID   `json:"id"`
	Type         EventType   `json:"type"`
	AggregateID  uuid.UUID   `json:"aggregate_id"` // ID of the entity that triggered the event
	Payload      string      `json:"payload"`      // JSON payload of the event
	Status       EventStatus `json:"status"`
	RetryCount   int         `json:"retry_count"`
	ErrorMessage string      `json:"error_message,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
	ProcessedAt  *time.Time  `json:"processed_at,omitempty"`
}

// NewEvent creates a new event
func NewEvent(eventType EventType, aggregateID uuid.UUID, payload string) (*Event, error) {
	if eventType == "" {
		return nil, ErrInvalidEventType
	}
	if payload == "" {
		return nil, ErrInvalidEventData
	}

	now := time.Now()
	return &Event{
		ID:          uuid.New(),
		Type:        eventType,
		AggregateID: aggregateID,
		Payload:     payload,
		Status:      EventStatusPending,
		RetryCount:  0,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// MarkAsProcessing marks the event as being processed
func (e *Event) MarkAsProcessing() error {
	if e.Status == EventStatusProcessed {
		return ErrEventAlreadyProcessed
	}
	e.Status = EventStatusProcessing
	e.UpdatedAt = time.Now()
	return nil
}

// MarkAsProcessed marks the event as successfully processed
func (e *Event) MarkAsProcessed() {
	now := time.Now()
	e.Status = EventStatusProcessed
	e.ProcessedAt = &now
	e.UpdatedAt = now
}

// MarkAsFailed marks the event as failed
func (e *Event) MarkAsFailed(errorMsg string) {
	e.Status = EventStatusFailed
	e.ErrorMessage = errorMsg
	e.RetryCount++
	e.UpdatedAt = time.Now()
}

// CanRetry checks if the event can be retried (max 3 retries)
func (e *Event) CanRetry() bool {
	return e.RetryCount < 3 && e.Status == EventStatusFailed
}

// Retry resets the event status for retry
func (e *Event) Retry() error {
	if !e.CanRetry() {
		return errors.New("maximum retry attempts exceeded")
	}
	e.Status = EventStatusPending
	e.UpdatedAt = time.Now()
	return nil
}
