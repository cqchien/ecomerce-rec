package grpc

import (
	pb "github.com/cqchien/ecomerce-rec/backend/proto"
	"github.com/cqchien/ecomerce-rec/backend/services/order-service/pkg/logger"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// ServiceClients holds all gRPC service clients
type ServiceClients struct {
	ProductClient   pb.ProductServiceClient
	InventoryClient pb.InventoryServiceClient
	PaymentClient   pb.PaymentServiceClient
}

// NewServiceClients creates new gRPC service clients
func NewServiceClients(productAddr, inventoryAddr, paymentAddr string) (*ServiceClients, error) {
	// Product service client
	productConn, err := grpc.Dial(productAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		logger.Errorf("Failed to connect to product service: %v", err)
		return nil, err
	}

	// Inventory service client
	inventoryConn, err := grpc.Dial(inventoryAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		logger.Errorf("Failed to connect to inventory service: %v", err)
		return nil, err
	}

	// Payment service client
	paymentConn, err := grpc.Dial(paymentAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		logger.Errorf("Failed to connect to payment service: %v", err)
		return nil, err
	}

	logger.Info("gRPC service clients established")

	return &ServiceClients{
		ProductClient:   pb.NewProductServiceClient(productConn),
		InventoryClient: pb.NewInventoryServiceClient(inventoryConn),
		PaymentClient:   pb.NewPaymentServiceClient(paymentConn),
	}, nil
}
