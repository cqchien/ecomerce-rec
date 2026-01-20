package grpc

import (
	"context"
	"encoding/json"

	pb "github.com/cqchien/ecomerce-rec/backend/proto"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/event-service/internal/usecase"
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
	// Convert payload map to JSON string
	payloadBytes, err := json.Marshal(req.Payload)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid payload format")
	}

	event, err := h.useCase.CreateEvent(ctx, domain.EventType(req.Type), req.AggregateId, string(payloadBytes))
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.PublishEventResponse{
		Event: h.eventToProto(event),
	}, nil
}

// GetEvent retrieves an event by ID
func (h *EventHandler) GetEvent(ctx context.Context, req *pb.GetEventRequest) (*pb.GetEventResponse, error) {
	event, err := h.useCase.GetEvent(ctx, req.Id)
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

// TrackEvent tracks a user event
func (h *EventHandler) TrackEvent(ctx context.Context, req *pb.TrackEventRequest) (*pb.TrackEventResponse, error) {
	// Create event payload from request
	payload := make(map[string]string)
	payload["user_id"] = req.UserId
	payload["session_id"] = req.SessionId
	payload["event_type"] = req.EventType.String()

	// Add metadata
	for k, v := range req.Metadata {
		payload[k] = v
	}

	// Add event-specific data
	if req.GetProductEvent() != nil {
		pe := req.GetProductEvent()
		payload["product_id"] = pe.ProductId
		payload["variant_id"] = pe.VariantId
		payload["category_id"] = pe.CategoryId
	} else if req.GetSearchEvent() != nil {
		se := req.GetSearchEvent()
		payload["query"] = se.Query
	}

	// Convert to JSON string
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid event data")
	}

	// Create event
	eventType := domain.EventType("USER_EVENT_" + req.EventType.String())
	aggregateID := req.UserId // Use user ID as aggregate ID

	event, err := h.useCase.CreateEvent(ctx, eventType, aggregateID, string(payloadBytes))
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.TrackEventResponse{
		Success: true,
		EventId: event.ID,
	}, nil
}

// BatchTrackEvents tracks multiple user events
func (h *EventHandler) BatchTrackEvents(ctx context.Context, req *pb.BatchTrackEventsRequest) (*pb.BatchTrackEventsResponse, error) {
	processedCount := 0

	for _, event := range req.Events {
		_, err := h.TrackEvent(ctx, event)
		if err == nil {
			processedCount++
		}
	}

	return &pb.BatchTrackEventsResponse{
		Success:        processedCount == len(req.Events),
		ProcessedCount: int32(processedCount),
	}, nil
}

// GetUserEvents retrieves user events for debugging/admin
func (h *EventHandler) GetUserEvents(ctx context.Context, req *pb.GetUserEventsRequest) (*pb.GetUserEventsResponse, error) {
	// For now, return empty - implement based on your needs
	return &pb.GetUserEventsResponse{
		Events: []*pb.UserEvent{},
		Pagination: &pb.PaginationResponse{
			Page:       1,
			Limit:      10,
			Total:      0,
			TotalPages: 0,
		},
	}, nil
}

// Helper function to convert domain event to proto
func (h *EventHandler) eventToProto(event *domain.Event) *pb.Event {
	// Convert JSON string payload to map
	var payload map[string]string
	if err := json.Unmarshal([]byte(event.Payload), &payload); err != nil {
		// If unmarshal fails, return empty map
		payload = make(map[string]string)
	}

	return &pb.Event{
		Id:          event.ID,
		Type:        string(event.Type),
		AggregateId: event.AggregateID,
		Payload:     payload,
		Status:      string(event.Status),
		CreatedAt:   event.CreatedAt.Unix(),
	}
}
