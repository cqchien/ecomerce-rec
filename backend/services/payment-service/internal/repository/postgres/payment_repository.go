package postgres

import (
	"context"

	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/infrastructure/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PaymentRepository implements the payment repository using PostgreSQL
type PaymentRepository struct {
	db *gorm.DB
}

// NewPaymentRepository creates a new PostgreSQL payment repository
func NewPaymentRepository(db *gorm.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

// Create creates a new payment
func (r *PaymentRepository) Create(ctx context.Context, payment *domain.Payment) error {
	model := &models.Payment{}
	model.FromDomain(payment)
	return r.db.WithContext(ctx).Create(model).Error
}

// FindByID finds a payment by ID
func (r *PaymentRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Payment, error) {
	var model models.Payment
	if err := r.db.WithContext(ctx).First(&model, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrPaymentNotFound
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

// FindByOrderID finds a payment by order ID
func (r *PaymentRepository) FindByOrderID(ctx context.Context, orderID uuid.UUID) (*domain.Payment, error) {
	var model models.Payment
	if err := r.db.WithContext(ctx).First(&model, "order_id = ?", orderID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrPaymentNotFound
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

// FindByUserID finds all payments for a user
func (r *PaymentRepository) FindByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Payment, error) {
	var modelList []models.Payment
	query := r.db.WithContext(ctx).Where("user_id = ?", userID)

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	if err := query.Order("created_at DESC").Find(&modelList).Error; err != nil {
		return nil, err
	}

	payments := make([]domain.Payment, len(modelList))
	for i, model := range modelList {
		payments[i] = *model.ToDomain()
	}
	return payments, nil
}

// Update updates a payment
func (r *PaymentRepository) Update(ctx context.Context, payment *domain.Payment) error {
	model := &models.Payment{}
	model.FromDomain(payment)
	return r.db.WithContext(ctx).Save(model).Error
}
