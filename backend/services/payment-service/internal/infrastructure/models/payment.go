package models

import (
	"time"

	"github.com/cqchien/ecomerce-rec/backend/services/payment-service/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Payment represents the GORM model for payments
type Payment struct {
	ID               uuid.UUID `gorm:"type:uuid;primary_key"`
	OrderID          uuid.UUID `gorm:"type:uuid;not null;uniqueIndex"`
	UserID           uuid.UUID `gorm:"type:uuid;not null;index"`
	Amount           float64   `gorm:"type:decimal(10,2);not null"`
	Currency         string    `gorm:"type:varchar(3);not null"`
	Status           string    `gorm:"type:varchar(50);not null;index"`
	Method           string    `gorm:"type:varchar(50);not null"`
	ProviderID       string    `gorm:"type:varchar(255);index"`
	ProviderResponse string    `gorm:"type:text"`
	FailureReason    string    `gorm:"type:text"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
	DeletedAt        gorm.DeletedAt `gorm:"index"`
}

// TableName specifies the table name for Payment
func (Payment) TableName() string {
	return "payments"
}

// ToDomain converts GORM Payment to domain Payment
func (p *Payment) ToDomain() *domain.Payment {
	return &domain.Payment{
		ID:               p.ID,
		OrderID:          p.OrderID,
		UserID:           p.UserID,
		Amount:           p.Amount,
		Currency:         p.Currency,
		Status:           domain.PaymentStatus(p.Status),
		Method:           domain.PaymentMethod(p.Method),
		ProviderID:       p.ProviderID,
		ProviderResponse: p.ProviderResponse,
		FailureReason:    p.FailureReason,
		CreatedAt:        p.CreatedAt,
		UpdatedAt:        p.UpdatedAt,
	}
}

// FromDomain converts domain Payment to GORM Payment
func (p *Payment) FromDomain(domainPayment *domain.Payment) {
	p.ID = domainPayment.ID
	p.OrderID = domainPayment.OrderID
	p.UserID = domainPayment.UserID
	p.Amount = domainPayment.Amount
	p.Currency = domainPayment.Currency
	p.Status = string(domainPayment.Status)
	p.Method = string(domainPayment.Method)
	p.ProviderID = domainPayment.ProviderID
	p.ProviderResponse = domainPayment.ProviderResponse
	p.FailureReason = domainPayment.FailureReason
	p.CreatedAt = domainPayment.CreatedAt
	p.UpdatedAt = domainPayment.UpdatedAt
}
