package grpc

import (
	"context"

	pb "github.com/cqchien/ecomerce-rec/backend/proto"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/usecase"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// EventHandler handles gRPC requests for events
type EventHandler struct {
	pb.UnimplementedEventServiceServer
	useCase *usecase.EventUseCase
}

// NewEventHandler creates a new event gRPC handler
func NewEventHandler(useCase *usecase.EventUseCase) *EventHandler {
	return &EventHandler{
		useCase: useCase,
	}
}

// PublishEvent publishes a new event
func (h *EventHandler) PublishEvent(ctx context.Context, req *pb.PublishEventRequest) (*pb.PublishEventResponse, error) {
	aggregateID, err := uuid.Parse(req.AggregateId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid aggregate ID")
	}

	event, err := h.useCase.CreateEvent(ctx, domain.EventType(req.Type), aggregateID, req.Payload)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.PublishEventResponse{
		Event: h.eventToProto(event),
	}, nil
}

// GetEvent retrieves an event by ID
func (h *EventHandler) GetEvent(ctx context.Context, req *pb.GetEventRequest) (*pb.GetEventResponse, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid event ID")
	}

	event, err := h.useCase.GetEvent(ctx, id)
	if err != nil {
		if err == domain.ErrEventNotFound {
			return nil, status.Error(codes.NotFound, "event not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.GetEventResponse{
		Event: h.eventToProto(event),
	}, nil
}

// Helper function to convert domain event to proto
func (h *EventHandler) eventToProto(event *domain.Event) *pb.Event {
	return &pb.Event{
		Id:          event.ID.String(),
		Type:        string(event.Type),
		AggregateId: event.AggregateID.String(),
		Payload:     event.Payload,
		Status:      string(event.Status),
		CreatedAt:   event.CreatedAt.Unix(),
	}
}
