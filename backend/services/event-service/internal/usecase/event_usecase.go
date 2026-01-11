package usecase

import (
	"context"

	"github.com/cqchien/ecomerce_rec/backend/services/event-service/internal/domain"
	"github.com/google/uuid"
)

// EventRepository defines the interface for event data access
type EventRepository interface {
	Create(ctx context.Context, event *domain.Event) error
	FindByID(ctx context.Context, id uuid.UUID) (*domain.Event, error)
	FindByType(ctx context.Context, eventType domain.EventType, limit, offset int) ([]domain.Event, error)
	FindPending(ctx context.Context, limit int) ([]domain.Event, error)
	FindFailed(ctx context.Context, limit int) ([]domain.Event, error)
	Update(ctx context.Context, event *domain.Event) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// EventPublisher defines the interface for publishing events to message broker
type EventPublisher interface {
	Publish(ctx context.Context, event *domain.Event) error
}

// EventUseCase handles event business logic
type EventUseCase struct {
	repo      EventRepository
	publisher EventPublisher
}

// NewEventUseCase creates a new event use case
func NewEventUseCase(repo EventRepository, publisher EventPublisher) *EventUseCase {
	return &EventUseCase{
		repo:      repo,
		publisher: publisher,
	}
}

// CreateEvent creates and publishes a new event
func (uc *EventUseCase) CreateEvent(ctx context.Context, eventType domain.EventType, aggregateID uuid.UUID, payload string) (*domain.Event, error) {
	event, err := domain.NewEvent(eventType, aggregateID, payload)
	if err != nil {
		return nil, err
	}

	// Save to database
	if err := uc.repo.Create(ctx, event); err != nil {
		return nil, err
	}

	// Publish to Kafka
	if err := uc.publisher.Publish(ctx, event); err != nil {
		event.MarkAsFailed(err.Error())
		_ = uc.repo.Update(ctx, event)
		return event, err
	}

	// Mark as processed
	event.MarkAsProcessed()
	if err := uc.repo.Update(ctx, event); err != nil {
		return event, err
	}

	return event, nil
}

// GetEvent retrieves an event by ID
func (uc *EventUseCase) GetEvent(ctx context.Context, id uuid.UUID) (*domain.Event, error) {
	return uc.repo.FindByID(ctx, id)
}

// GetEventsByType retrieves events by type
func (uc *EventUseCase) GetEventsByType(ctx context.Context, eventType domain.EventType, limit, offset int) ([]domain.Event, error) {
	return uc.repo.FindByType(ctx, eventType, limit, offset)
}

// ProcessPendingEvents processes all pending events
func (uc *EventUseCase) ProcessPendingEvents(ctx context.Context, limit int) error {
	events, err := uc.repo.FindPending(ctx, limit)
	if err != nil {
		return err
	}

	for _, event := range events {
		if err := event.MarkAsProcessing(); err != nil {
			continue
		}
		_ = uc.repo.Update(ctx, &event)

		if err := uc.publisher.Publish(ctx, &event); err != nil {
			event.MarkAsFailed(err.Error())
			_ = uc.repo.Update(ctx, &event)
			continue
		}

		event.MarkAsProcessed()
		_ = uc.repo.Update(ctx, &event)
	}

	return nil
}

// RetryFailedEvents retries failed events
func (uc *EventUseCase) RetryFailedEvents(ctx context.Context, limit int) error {
	events, err := uc.repo.FindFailed(ctx, limit)
	if err != nil {
		return err
	}

	for _, event := range events {
		if !event.CanRetry() {
			continue
		}

		if err := event.Retry(); err != nil {
			continue
		}
		_ = uc.repo.Update(ctx, &event)

		if err := uc.publisher.Publish(ctx, &event); err != nil {
			event.MarkAsFailed(err.Error())
			_ = uc.repo.Update(ctx, &event)
			continue
		}

		event.MarkAsProcessed()
		_ = uc.repo.Update(ctx, &event)
	}

	return nil
}
