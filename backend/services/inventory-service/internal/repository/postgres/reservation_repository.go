package postgres

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/domain"
	"github.com/cqchien/ecomerce-rec/backend/services/inventory-service/internal/infrastructure/database/models"
)

type reservationRepository struct {
	db *gorm.DB
}

// NewReservationRepository creates a new reservation repository
func NewReservationRepository(db *gorm.DB) domain.ReservationRepository {
	return &reservationRepository{db: db}
}

// Create creates a new reservation
func (r *reservationRepository) Create(reservation *domain.Reservation) error {
	dbReservation := domainToReservationModel(reservation)
	if dbReservation.ID == "" {
		dbReservation.ID = uuid.New().String()
	}
	dbReservation.CreatedAt = time.Now()
	dbReservation.UpdatedAt = time.Now()

	if err := r.db.Create(dbReservation).Error; err != nil {
		return fmt.Errorf("failed to create reservation: %w", err)
	}

	reservation.ID = dbReservation.ID
	return nil
}

// GetByID retrieves reservation by ID
func (r *reservationRepository) GetByID(id string) (*domain.Reservation, error) {
	var dbReservation models.Reservation
	if err := r.db.First(&dbReservation, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("reservation not found: %s", id)
		}
		return nil, fmt.Errorf("failed to get reservation: %w", err)
	}

	return reservationModelToDomain(&dbReservation), nil
}

// GetByOrderID retrieves all reservations for an order
func (r *reservationRepository) GetByOrderID(orderID string) ([]domain.Reservation, error) {
	var dbReservations []models.Reservation
	if err := r.db.Where("order_id = ?", orderID).Find(&dbReservations).Error; err != nil {
		return nil, fmt.Errorf("failed to get reservations: %w", err)
	}

	reservations := make([]domain.Reservation, len(dbReservations))
	for i, dbReservation := range dbReservations {
		reservations[i] = *reservationModelToDomain(&dbReservation)
	}

	return reservations, nil
}

// Update updates reservation
func (r *reservationRepository) Update(reservation *domain.Reservation) error {
	dbReservation := domainToReservationModel(reservation)
	dbReservation.UpdatedAt = time.Now()

	result := r.db.Model(&models.Reservation{}).
		Where("id = ?", reservation.ID).
		Updates(map[string]interface{}{
			"status":     dbReservation.Status,
			"expires_at": dbReservation.ExpiresAt,
			"updated_at": dbReservation.UpdatedAt,
		})

	if result.Error != nil {
		return fmt.Errorf("failed to update reservation: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("reservation not found: %s", reservation.ID)
	}

	return nil
}

// Delete soft deletes reservation
func (r *reservationRepository) Delete(id string) error {
	result := r.db.Delete(&models.Reservation{}, "id = ?", id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete reservation: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("reservation not found: %s", id)
	}

	return nil
}

// ReserveStock reserves stock for multiple items
func (r *reservationRepository) ReserveStock(orderID string, items []domain.ReservationItem, ttlSeconds int) (string, []domain.ReservationResult, error) {
	// Start transaction
	tx := r.db.Begin()
	if tx.Error != nil {
		return "", nil, fmt.Errorf("failed to start transaction: %w", tx.Error)
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	reservationID := uuid.New().String()
	results := make([]domain.ReservationResult, 0, len(items))
	expiresAt := time.Now().Add(time.Duration(ttlSeconds) * time.Second)

	// Try to reserve each item
	for _, item := range items {
		// Lock stock row for update
		var stock models.Stock
		query := tx.Clauses().Where("product_id = ?", item.ProductID)
		if item.VariantID != "" {
			query = query.Where("variant_id = ?", item.VariantID)
		} else {
			query = query.Where("variant_id IS NULL OR variant_id = ''")
		}

		if err := query.First(&stock).Error; err != nil {
			tx.Rollback()
			if err == gorm.ErrRecordNotFound {
				results = append(results, domain.ReservationResult{
					ProductID:         item.ProductID,
					VariantID:         item.VariantID,
					Reserved:          false,
					AvailableQuantity: 0,
					Error:             "stock not found",
				})
				return "", results, fmt.Errorf("stock not found for product: %s", item.ProductID)
			}
			return "", nil, fmt.Errorf("failed to get stock: %w", err)
		}

		// Check availability
		if stock.Available < item.Quantity {
			tx.Rollback()
			results = append(results, domain.ReservationResult{
				ProductID:         item.ProductID,
				VariantID:         item.VariantID,
				Reserved:          false,
				AvailableQuantity: stock.Available,
				Error:             fmt.Sprintf("insufficient stock: available=%d, requested=%d", stock.Available, item.Quantity),
			})
			return "", results, fmt.Errorf("insufficient stock for product: %s", item.ProductID)
		}

		// Update stock quantities
		stock.Available -= item.Quantity
		stock.Reserved += item.Quantity
		stock.UpdatedAt = time.Now()

		if err := tx.Save(&stock).Error; err != nil {
			tx.Rollback()
			return "", nil, fmt.Errorf("failed to update stock: %w", err)
		}

		// Create reservation record
		reservation := &models.Reservation{
			ID:        uuid.New().String(),
			OrderID:   orderID,
			ProductID: item.ProductID,
			VariantID: item.VariantID,
			Quantity:  item.Quantity,
			Status:    models.ReservationStatusPending,
			ExpiresAt: expiresAt,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := tx.Create(reservation).Error; err != nil {
			tx.Rollback()
			return "", nil, fmt.Errorf("failed to create reservation: %w", err)
		}

		results = append(results, domain.ReservationResult{
			ProductID:         item.ProductID,
			VariantID:         item.VariantID,
			Reserved:          true,
			AvailableQuantity: stock.Available,
			Error:             "",
		})
	}

	if err := tx.Commit().Error; err != nil {
		return "", nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return reservationID, results, nil
}

// ReleaseReservation releases a reservation and returns stock
func (r *reservationRepository) ReleaseReservation(reservationID string) error {
	// Start transaction
	tx := r.db.Begin()
	if tx.Error != nil {
		return fmt.Errorf("failed to start transaction: %w", tx.Error)
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get all reservations with this ID or order ID
	var reservations []models.Reservation
	if err := tx.Where("id = ? OR order_id = ?", reservationID, reservationID).
		Where("status = ?", models.ReservationStatusPending).
		Find(&reservations).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to get reservations: %w", err)
	}

	if len(reservations) == 0 {
		tx.Rollback()
		return fmt.Errorf("no pending reservations found for: %s", reservationID)
	}

	// Release stock for each reservation
	for _, reservation := range reservations {
		// Get and lock stock
		var stock models.Stock
		query := tx.Clauses().Where("product_id = ?", reservation.ProductID)
		if reservation.VariantID != "" {
			query = query.Where("variant_id = ?", reservation.VariantID)
		} else {
			query = query.Where("variant_id IS NULL OR variant_id = ''")
		}

		if err := query.First(&stock).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to get stock: %w", err)
		}

		// Return reserved stock to available
		stock.Available += reservation.Quantity
		stock.Reserved -= reservation.Quantity
		stock.UpdatedAt = time.Now()

		if err := tx.Save(&stock).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to update stock: %w", err)
		}

		// Update reservation status
		reservation.Status = models.ReservationStatusReleased
		reservation.UpdatedAt = time.Now()

		if err := tx.Save(&reservation).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to update reservation: %w", err)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// CommitReservation commits a reservation (converts reserved to sold)
func (r *reservationRepository) CommitReservation(reservationID string) error {
	// Start transaction
	tx := r.db.Begin()
	if tx.Error != nil {
		return fmt.Errorf("failed to start transaction: %w", tx.Error)
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get all reservations
	var reservations []models.Reservation
	if err := tx.Where("id = ? OR order_id = ?", reservationID, reservationID).
		Where("status = ?", models.ReservationStatusPending).
		Find(&reservations).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to get reservations: %w", err)
	}

	if len(reservations) == 0 {
		tx.Rollback()
		return fmt.Errorf("no pending reservations found for: %s", reservationID)
	}

	// Commit each reservation
	for _, reservation := range reservations {
		// Get and lock stock
		var stock models.Stock
		query := tx.Clauses().Where("product_id = ?", reservation.ProductID)
		if reservation.VariantID != "" {
			query = query.Where("variant_id = ?", reservation.VariantID)
		} else {
			query = query.Where("variant_id IS NULL OR variant_id = ''")
		}

		if err := query.First(&stock).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to get stock: %w", err)
		}

		// Deduct from reserved (already deducted from total)
		stock.Reserved -= reservation.Quantity
		stock.UpdatedAt = time.Now()

		if err := tx.Save(&stock).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to update stock: %w", err)
		}

		// Update reservation status
		reservation.Status = models.ReservationStatusCommitted
		reservation.UpdatedAt = time.Now()

		if err := tx.Save(&reservation).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to update reservation: %w", err)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// ExpireReservations finds and expires old reservations
func (r *reservationRepository) ExpireReservations() error {
	// Start transaction
	tx := r.db.Begin()
	if tx.Error != nil {
		return fmt.Errorf("failed to start transaction: %w", tx.Error)
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Find expired pending reservations
	var reservations []models.Reservation
	if err := tx.Where("status = ? AND expires_at < ?", models.ReservationStatusPending, time.Now()).
		Find(&reservations).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to get expired reservations: %w", err)
	}

	// Expire each reservation and return stock
	for _, reservation := range reservations {
		// Get and lock stock
		var stock models.Stock
		query := tx.Clauses().Where("product_id = ?", reservation.ProductID)
		if reservation.VariantID != "" {
			query = query.Where("variant_id = ?", reservation.VariantID)
		} else {
			query = query.Where("variant_id IS NULL OR variant_id = ''")
		}

		if err := query.First(&stock).Error; err != nil {
			// Skip if stock not found (might have been deleted)
			continue
		}

		// Return reserved stock to available
		stock.Available += reservation.Quantity
		stock.Reserved -= reservation.Quantity
		stock.UpdatedAt = time.Now()

		if err := tx.Save(&stock).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to update stock: %w", err)
		}

		// Update reservation status
		reservation.Status = models.ReservationStatusExpired
		reservation.UpdatedAt = time.Now()

		if err := tx.Save(&reservation).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to update reservation: %w", err)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetExpiredReservations retrieves all expired reservations
func (r *reservationRepository) GetExpiredReservations() ([]domain.Reservation, error) {
	var dbReservations []models.Reservation
	if err := r.db.Where("status = ? AND expires_at < ?", models.ReservationStatusPending, time.Now()).
		Find(&dbReservations).Error; err != nil {
		return nil, fmt.Errorf("failed to get expired reservations: %w", err)
	}

	reservations := make([]domain.Reservation, len(dbReservations))
	for i, dbReservation := range dbReservations {
		reservations[i] = *reservationModelToDomain(&dbReservation)
	}

	return reservations, nil
}

// GetPendingReservations retrieves all pending reservations for an order
func (r *reservationRepository) GetPendingReservations(orderID string) ([]domain.Reservation, error) {
	var dbReservations []models.Reservation
	if err := r.db.Where("order_id = ? AND status = ?", orderID, models.ReservationStatusPending).
		Find(&dbReservations).Error; err != nil {
		return nil, fmt.Errorf("failed to get pending reservations: %w", err)
	}

	reservations := make([]domain.Reservation, len(dbReservations))
	for i, dbReservation := range dbReservations {
		reservations[i] = *reservationModelToDomain(&dbReservation)
	}

	return reservations, nil
}

// Helper functions

func domainToReservationModel(reservation *domain.Reservation) *models.Reservation {
	return &models.Reservation{
		ID:        reservation.ID,
		OrderID:   reservation.OrderID,
		ProductID: reservation.ProductID,
		VariantID: reservation.VariantID,
		Quantity:  reservation.Quantity,
		Status:    reservation.Status,
		ExpiresAt: reservation.ExpiresAt,
		CreatedAt: reservation.CreatedAt,
	}
}

func reservationModelToDomain(reservation *models.Reservation) *domain.Reservation {
	return &domain.Reservation{
		ID:        reservation.ID,
		OrderID:   reservation.OrderID,
		ProductID: reservation.ProductID,
		VariantID: reservation.VariantID,
		Quantity:  reservation.Quantity,
		Status:    reservation.Status,
		ExpiresAt: reservation.ExpiresAt,
		CreatedAt: reservation.CreatedAt,
	}
}
