package grpc

import (
	"context"

	pb "github.com/cqchien/ecomerce-rec/backend/proto/cart"
	commonpb "github.com/cqchien/ecomerce-rec/backend/proto/common"
	"github.com/cqchien/ecomerce-rec/backend/services/cart-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/cart-service/internal/usecase"
	"github.com/cqchien/ecomerce-rec/backend/services/cart-service/pkg/logger"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type cartServer struct {
	pb.UnimplementedCartServiceServer
	cartUC *usecase.CartUseCase
	logger logger.Logger
}

// NewServer creates a new gRPC server
func NewServer(cartUC *usecase.CartUseCase, logger logger.Logger) *grpc.Server {
	grpcServer := grpc.NewServer()

	cartSvc := &cartServer{
		cartUC: cartUC,
		logger: logger,
	}

	pb.RegisterCartServiceServer(grpcServer, cartSvc)

	return grpcServer
}

// GetCart retrieves user's cart
func (s *cartServer) GetCart(ctx context.Context, req *pb.GetCartRequest) (*pb.GetCartResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	cart, err := s.cartUC.GetCart(ctx, req.UserId)
	if err != nil {
		s.logger.Error("Failed to get cart", "userID", req.UserId, "error", err)
		return nil, status.Error(codes.Internal, "failed to get cart")
	}

	return &pb.GetCartResponse{
		Cart: s.domainToProto(cart),
	}, nil
}

// AddToCart adds an item to the cart
func (s *cartServer) AddToCart(ctx context.Context, req *pb.AddToCartRequest) (*pb.AddToCartResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.ProductId == "" {
		return nil, status.Error(codes.InvalidArgument, "product_id is required")
	}
	if req.Quantity <= 0 {
		return nil, status.Error(codes.InvalidArgument, "quantity must be greater than 0")
	}

	var variantID *string
	if req.VariantId != "" {
		variantID = &req.VariantId
	}

	unitPrice := int64(0)
	if req.UnitPrice != nil {
		unitPrice = req.UnitPrice.AmountCents
	}

	cart, err := s.cartUC.AddToCart(
		ctx,
		req.UserId,
		req.ProductId,
		variantID,
		req.Name,
		req.Image,
		req.Sku,
		req.Quantity,
		unitPrice,
	)
	if err != nil {
		s.logger.Error("Failed to add to cart", "userID", req.UserId, "error", err)
		return nil, status.Error(codes.Internal, "failed to add to cart")
	}

	return &pb.AddToCartResponse{
		Cart: s.domainToProto(cart),
	}, nil
}

// UpdateItemQuantity updates the quantity of a cart item
func (s *cartServer) UpdateItemQuantity(ctx context.Context, req *pb.UpdateItemQuantityRequest) (*pb.UpdateItemQuantityResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.ItemId == "" {
		return nil, status.Error(codes.InvalidArgument, "item_id is required")
	}
	if req.Quantity < 0 {
		return nil, status.Error(codes.InvalidArgument, "quantity must be non-negative")
	}

	cart, err := s.cartUC.UpdateItemQuantity(ctx, req.UserId, req.ItemId, req.Quantity)
	if err != nil {
		s.logger.Error("Failed to update item quantity", "userID", req.UserId, "error", err)
		return nil, status.Error(codes.Internal, "failed to update item quantity")
	}

	return &pb.UpdateItemQuantityResponse{
		Cart: s.domainToProto(cart),
	}, nil
}

// RemoveItem removes an item from the cart
func (s *cartServer) RemoveItem(ctx context.Context, req *pb.RemoveItemRequest) (*pb.RemoveItemResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.ItemId == "" {
		return nil, status.Error(codes.InvalidArgument, "item_id is required")
	}

	cart, err := s.cartUC.RemoveItem(ctx, req.UserId, req.ItemId)
	if err != nil {
		s.logger.Error("Failed to remove item", "userID", req.UserId, "error", err)
		return nil, status.Error(codes.Internal, "failed to remove item")
	}

	return &pb.RemoveItemResponse{
		Cart: s.domainToProto(cart),
	}, nil
}

// ClearCart clears all items from the cart
func (s *cartServer) ClearCart(ctx context.Context, req *pb.ClearCartRequest) (*pb.ClearCartResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	if err := s.cartUC.ClearCart(ctx, req.UserId); err != nil {
		s.logger.Error("Failed to clear cart", "userID", req.UserId, "error", err)
		return nil, status.Error(codes.Internal, "failed to clear cart")
	}

	return &pb.ClearCartResponse{
		Response: &commonpb.Response{
			Success: true,
			Message: "Cart cleared successfully",
		},
	}, nil
}

// ApplyCoupon applies a coupon code to the cart
func (s *cartServer) ApplyCoupon(ctx context.Context, req *pb.ApplyCouponRequest) (*pb.ApplyCouponResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.CouponCode == "" {
		return nil, status.Error(codes.InvalidArgument, "coupon_code is required")
	}

	discountAmount := int64(0)
	if req.DiscountAmount != nil {
		discountAmount = req.DiscountAmount.AmountCents
	}

	cart, err := s.cartUC.ApplyCoupon(ctx, req.UserId, req.CouponCode, discountAmount)
	if err != nil {
		s.logger.Error("Failed to apply coupon", "userID", req.UserId, "error", err)
		return nil, status.Error(codes.Internal, "failed to apply coupon")
	}

	return &pb.ApplyCouponResponse{
		Cart: s.domainToProto(cart),
	}, nil
}

// RemoveCoupon removes the coupon from the cart
func (s *cartServer) RemoveCoupon(ctx context.Context, req *pb.RemoveCouponRequest) (*pb.RemoveCouponResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	cart, err := s.cartUC.RemoveCoupon(ctx, req.UserId)
	if err != nil {
		s.logger.Error("Failed to remove coupon", "userID", req.UserId, "error", err)
		return nil, status.Error(codes.Internal, "failed to remove coupon")
	}

	return &pb.RemoveCouponResponse{
		Cart: s.domainToProto(cart),
	}, nil
}

// Helper methods

func (s *cartServer) domainToProto(cart *domain.Cart) *pb.Cart {
	pbCart := &pb.Cart{
		Id:     cart.ID,
		UserId: cart.UserID,
		Subtotal: &commonpb.Money{
			AmountCents: cart.Subtotal,
			Currency:    "USD",
		},
		Discount: &commonpb.Money{
			AmountCents: cart.Discount,
			Currency:    "USD",
		},
		Total: &commonpb.Money{
			AmountCents: cart.Total,
			Currency:    "USD",
		},
		IsAbandoned: cart.IsAbandoned,
		CreatedAt: &commonpb.Timestamp{
			Seconds: cart.CreatedAt.Unix(),
			Nanos:   int32(cart.CreatedAt.Nanosecond()),
		},
		UpdatedAt: &commonpb.Timestamp{
			Seconds: cart.UpdatedAt.Unix(),
			Nanos:   int32(cart.UpdatedAt.Nanosecond()),
		},
	}

	if cart.CouponCode != nil {
		pbCart.CouponCode = *cart.CouponCode
	}

	items := make([]*pb.CartItem, len(cart.Items))
	for i, item := range cart.Items {
		pbItem := &pb.CartItem{
			Id:        item.ID,
			CartId:    item.CartID,
			ProductId: item.ProductID,
			Name:      item.Name,
			Image:     item.Image,
			Sku:       item.SKU,
			Quantity:  item.Quantity,
			UnitPrice: &commonpb.Money{
				AmountCents: item.UnitPrice,
				Currency:    "USD",
			},
			TotalPrice: &commonpb.Money{
				AmountCents: item.TotalPrice,
				Currency:    "USD",
			},
		}
		if item.VariantID != nil {
			pbItem.VariantId = *item.VariantID
		}
		items[i] = pbItem
	}
	pbCart.Items = items

	return pbCart
}
