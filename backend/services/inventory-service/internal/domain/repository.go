package domain

import "time"

// Stock represents inventory stock in the domain layer
type Stock struct {
	ID          string
	ProductID   string
	VariantID   string
	Available   int
	Reserved    int
	Total       int
	WarehouseID string
	UpdatedAt   time.Time
}

// Reservation represents a stock reservation in the domain layer
type Reservation struct {
	ID        string
	OrderID   string
	ProductID string
	VariantID string
	Quantity  int
	Status    string
	ExpiresAt time.Time
	CreatedAt time.Time
}

// ReservationItem represents an item to be reserved
type ReservationItem struct {
	ProductID string
	VariantID string
	Quantity  int
}

// ReservationResult represents the result of a reservation attempt
type ReservationResult struct {
	ProductID         string
	VariantID         string
	Reserved          bool
	AvailableQuantity int
	Error             string
}

// StockMovement represents a stock change audit record
type StockMovement struct {
	ID          string
	ProductID   string
	VariantID   string
	WarehouseID string
	Quantity    int
	Operation   string
	Reason      string
	PreviousQty int
	NewQty      int
	CreatedBy   string
	CreatedAt   time.Time
}

// StockRepository defines the interface for stock data access
type StockRepository interface {
	// Basic CRUD
	Create(stock *Stock) error
	GetByID(id string) (*Stock, error)
	GetByProductAndVariant(productID, variantID string) (*Stock, error)
	Update(stock *Stock) error
	Delete(id string) error

	// Stock operations
	UpdateQuantity(productID, variantID string, quantity int, operation string) (*Stock, error)
	CheckAvailability(productID, variantID string, quantity int) (bool, int, error)
	BulkCheckAvailability(items []ReservationItem) (map[string]bool, error)

	// Audit
	CreateMovement(movement *StockMovement) error
	GetMovements(productID, variantID string, limit int) ([]StockMovement, error)
}

// ReservationRepository defines the interface for reservation data access
type ReservationRepository interface {
	// Basic CRUD
	Create(reservation *Reservation) error
	GetByID(id string) (*Reservation, error)
	GetByOrderID(orderID string) ([]Reservation, error)
	Update(reservation *Reservation) error
	Delete(id string) error

	// Reservation operations
	ReserveStock(orderID string, items []ReservationItem, ttlSeconds int) (string, []ReservationResult, error)
	ReleaseReservation(reservationID string) error
	CommitReservation(reservationID string) error
	ExpireReservations() error

	// Queries
	GetExpiredReservations() ([]Reservation, error)
	GetPendingReservations(orderID string) ([]Reservation, error)
}
