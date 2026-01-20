package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/domain"
	"github.com/segmentio/kafka-go"
)

// Publisher implements event publishing using Kafka
type Publisher struct {
	writer *kafka.Writer
}

// NewPublisher creates a new Kafka publisher
func NewPublisher(brokers []string, topic string) *Publisher {
	writer := &kafka.Writer{
		Addr:         kafka.TCP(brokers...),
		Topic:        topic,
		Balancer:     &kafka.LeastBytes{},
		MaxAttempts:  3,
		BatchTimeout: 10 * time.Millisecond,
	}

	return &Publisher{
		writer: writer,
	}
}

// Publish publishes an event to Kafka
func (p *Publisher) Publish(ctx context.Context, event *domain.Event) error {
	// Serialize event to JSON
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Create Kafka message
	msg := kafka.Message{
		Key:   []byte(event.ID),
		Value: payload,
		Headers: []kafka.Header{
			{Key: "event_type", Value: []byte(event.Type)},
			{Key: "aggregate_id", Value: []byte(event.AggregateID)},
		},
		Time: event.CreatedAt,
	}

	// Write message to Kafka
	if err := p.writer.WriteMessages(ctx, msg); err != nil {
		return fmt.Errorf("failed to publish event to Kafka: %w", err)
	}

	return nil
}

// Close closes the Kafka writer
func (p *Publisher) Close() error {
	return p.writer.Close()
}
