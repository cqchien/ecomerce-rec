package grpc

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	pb "github.com/cqchien/ecomerce-rec/backend/proto/inventory"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/infrastructure/database/models"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/usecase"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/pkg/logger"
)

type inventoryServer struct {
	pb.UnimplementedInventoryServiceServer
	inventoryUC *usecase.InventoryUseCase
	logger      logger.Logger
}

// NewServer creates a new gRPC server
func NewServer(inventoryUC *usecase.InventoryUseCase, logger logger.Logger) *grpc.Server {
	grpcServer := grpc.NewServer()

	inventorySvc := &inventoryServer{
		inventoryUC: inventoryUC,
		logger:      logger,
	}

	pb.RegisterInventoryServiceServer(grpcServer, inventorySvc)

	return grpcServer
}

// CheckStock checks if stock is available
func (s *inventoryServer) CheckStock(ctx context.Context, req *pb.CheckStockRequest) (*pb.CheckStockResponse, error) {
	s.logger.Info("CheckStock called", "product_id", req.ProductId, "variant_id", req.VariantId, "quantity", req.Quantity)

	if req.ProductId == "" {
		return nil, status.Error(codes.InvalidArgument, "product_id is required")
	}

	if req.Quantity <= 0 {
		return nil, status.Error(codes.InvalidArgument, "quantity must be greater than 0")
	}

	available, availableQty, err := s.inventoryUC.CheckStock(ctx, req.ProductId, req.VariantId, int(req.Quantity))
	if err != nil {
		s.logger.Error("Failed to check stock", "error", err)
		return nil, status.Error(codes.Internal, "failed to check stock availability")
	}

	return &pb.CheckStockResponse{
		Available:         available,
		AvailableQuantity: int32(availableQty),
	}, nil
}

// ReserveStock reserves stock for an order
func (s *inventoryServer) ReserveStock(ctx context.Context, req *pb.ReserveStockRequest) (*pb.ReserveStockResponse, error) {
	s.logger.Info("ReserveStock called", "order_id", req.OrderId, "items_count", len(req.Items))

	if req.OrderId == "" {
		return nil, status.Error(codes.InvalidArgument, "order_id is required")
	}

	if len(req.Items) == 0 {
		return nil, status.Error(codes.InvalidArgument, "items are required")
	}

	// Convert proto items to domain items
	items := make([]domain.ReservationItem, len(req.Items))
	for i, item := range req.Items {
		if item.ProductId == "" {
			return nil, status.Error(codes.InvalidArgument, "product_id is required for all items")
		}
		if item.Quantity <= 0 {
			return nil, status.Error(codes.InvalidArgument, "quantity must be greater than 0 for all items")
		}

		items[i] = domain.ReservationItem{
			ProductID: item.ProductId,
			VariantID: item.VariantId,
			Quantity:  int(item.Quantity),
		}
	}

	// Set default TTL if not provided
	ttl := req.TtlSeconds
	if ttl <= 0 {
		ttl = int32(models.DefaultReservationTTL.Seconds())
	}

	reservationID, results, err := s.inventoryUC.ReserveStock(ctx, req.OrderId, items, int(ttl))
	if err != nil {
		s.logger.Error("Failed to reserve stock", "error", err)

		// Convert results to proto
		protoResults := make([]*pb.ReservationResult, len(results))
		for i, result := range results {
			protoResults[i] = &pb.ReservationResult{
				ProductId:         result.ProductID,
				VariantId:         result.VariantID,
				Reserved:          result.Reserved,
				AvailableQuantity: int32(result.AvailableQuantity),
				Error:             result.Error,
			}
		}

		return &pb.ReserveStockResponse{
			ReservationId: "",
			Success:       false,
			Results:       protoResults,
		}, nil
	}

	// Convert results to proto
	protoResults := make([]*pb.ReservationResult, len(results))
	for i, result := range results {
		protoResults[i] = &pb.ReservationResult{
			ProductId:         result.ProductID,
			VariantId:         result.VariantID,
			Reserved:          result.Reserved,
			AvailableQuantity: int32(result.AvailableQuantity),
			Error:             result.Error,
		}
	}

	return &pb.ReserveStockResponse{
		ReservationId: reservationID,
		Success:       true,
		Results:       protoResults,
	}, nil
}

// ReleaseReservation releases a stock reservation
func (s *inventoryServer) ReleaseReservation(ctx context.Context, req *pb.ReleaseReservationRequest) (*pb.ReleaseReservationResponse, error) {
	s.logger.Info("ReleaseReservation called", "reservation_id", req.ReservationId, "order_id", req.OrderId)

	if req.ReservationId == "" && req.OrderId == "" {
		return nil, status.Error(codes.InvalidArgument, "reservation_id or order_id is required")
	}

	if err := s.inventoryUC.ReleaseReservation(ctx, req.ReservationId, req.OrderId); err != nil {
		s.logger.Error("Failed to release reservation", "error", err)
		return &pb.ReleaseReservationResponse{Success: false}, nil
	}

	return &pb.ReleaseReservationResponse{Success: true}, nil
}

// CommitReservation commits a reservation (finalizes the purchase)
func (s *inventoryServer) CommitReservation(ctx context.Context, req *pb.CommitReservationRequest) (*pb.CommitReservationResponse, error) {
	s.logger.Info("CommitReservation called", "reservation_id", req.ReservationId, "order_id", req.OrderId)

	if req.ReservationId == "" && req.OrderId == "" {
		return nil, status.Error(codes.InvalidArgument, "reservation_id or order_id is required")
	}

	if err := s.inventoryUC.CommitReservation(ctx, req.ReservationId, req.OrderId); err != nil {
		s.logger.Error("Failed to commit reservation", "error", err)
		return &pb.CommitReservationResponse{Success: false}, nil
	}

	return &pb.CommitReservationResponse{Success: true}, nil
}

// UpdateStock updates stock levels (admin operation)
func (s *inventoryServer) UpdateStock(ctx context.Context, req *pb.UpdateStockRequest) (*pb.UpdateStockResponse, error) {
	s.logger.Info("UpdateStock called", "product_id", req.ProductId, "variant_id", req.VariantId, "quantity", req.Quantity, "operation", req.Operation)

	if req.ProductId == "" {
		return nil, status.Error(codes.InvalidArgument, "product_id is required")
	}

	// Map proto operation to domain operation
	operation := ""
	switch req.Operation {
	case pb.StockOperation_ADD:
		operation = models.StockOperationAdd
	case pb.StockOperation_SUBTRACT:
		operation = models.StockOperationSubtract
	case pb.StockOperation_SET:
		operation = models.StockOperationSet
	default:
		return nil, status.Error(codes.InvalidArgument, "invalid operation")
	}

	stock, err := s.inventoryUC.UpdateStock(ctx, req.ProductId, req.VariantId, int(req.Quantity), operation, req.Reason)
	if err != nil {
		s.logger.Error("Failed to update stock", "error", err)
		return nil, status.Error(codes.Internal, "failed to update stock")
	}

	return &pb.UpdateStockResponse{
		Stock: &pb.Stock{
			ProductId:   stock.ProductID,
			VariantId:   stock.VariantID,
			Available:   int32(stock.Available),
			Reserved:    int32(stock.Reserved),
			Total:       int32(stock.Total),
			WarehouseId: stock.WarehouseID,
			UpdatedAt:   timestamppb.New(stock.UpdatedAt),
		},
	}, nil
}

// GetStock retrieves stock information
func (s *inventoryServer) GetStock(ctx context.Context, req *pb.GetStockRequest) (*pb.GetStockResponse, error) {
	s.logger.Info("GetStock called", "product_id", req.ProductId, "variant_id", req.VariantId)

	if req.ProductId == "" {
		return nil, status.Error(codes.InvalidArgument, "product_id is required")
	}

	stock, err := s.inventoryUC.GetStock(ctx, req.ProductId, req.VariantId)
	if err != nil {
		s.logger.Error("Failed to get stock", "error", err)
		return nil, status.Error(codes.NotFound, "stock not found")
	}

	return &pb.GetStockResponse{
		Stock: &pb.Stock{
			ProductId:   stock.ProductID,
			VariantId:   stock.VariantID,
			Available:   int32(stock.Available),
			Reserved:    int32(stock.Reserved),
			Total:       int32(stock.Total),
			WarehouseId: stock.WarehouseID,
			UpdatedAt:   timestamppb.New(stock.UpdatedAt),
		},
	}, nil
}

// BulkCheckStock checks availability for multiple items
func (s *inventoryServer) BulkCheckStock(ctx context.Context, req *pb.BulkCheckStockRequest) (*pb.BulkCheckStockResponse, error) {
	s.logger.Info("BulkCheckStock called", "items_count", len(req.Items))

	if len(req.Items) == 0 {
		return nil, status.Error(codes.InvalidArgument, "items are required")
	}

	// Convert proto items to domain items
	items := make([]domain.ReservationItem, len(req.Items))
	for i, item := range req.Items {
		if item.ProductId == "" {
			return nil, status.Error(codes.InvalidArgument, "product_id is required for all items")
		}
		if item.Quantity <= 0 {
			return nil, status.Error(codes.InvalidArgument, "quantity must be greater than 0 for all items")
		}

		items[i] = domain.ReservationItem{
			ProductID: item.ProductId,
			VariantID: item.VariantId,
			Quantity:  int(item.Quantity),
		}
	}

	results, err := s.inventoryUC.BulkCheckStock(ctx, items)
	if err != nil {
		s.logger.Error("Failed to bulk check stock", "error", err)
		return nil, status.Error(codes.Internal, "failed to check stock availability")
	}

	// Convert results to proto
	protoResults := make([]*pb.BulkStockResult, len(items))
	for i, item := range items {
		key := item.ProductID + ":" + item.VariantID
		available := results[key]

		// Get available quantity
		_, availableQty, _ := s.inventoryUC.CheckStock(ctx, item.ProductID, item.VariantID, item.Quantity)

		protoResults[i] = &pb.BulkStockResult{
			ProductId:         item.ProductID,
			VariantId:         item.VariantID,
			Available:         available,
			AvailableQuantity: int32(availableQty),
		}
	}

	return &pb.BulkCheckStockResponse{
		Results: protoResults,
	}, nil
}
