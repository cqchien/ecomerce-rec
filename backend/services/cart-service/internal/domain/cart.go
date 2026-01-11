package domain

import "time"

// Cart represents a shopping cart entity
type Cart struct {
	ID          string
	UserID      string
	Items       []CartItem
	Subtotal    int64 // in cents
	Discount    int64 // in cents
	Total       int64 // in cents
	CouponCode  *string
	IsAbandoned bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   *time.Time
}

// CartItem represents an item in the shopping cart
type CartItem struct {
	ID         string
	CartID     string
	ProductID  string
	VariantID  *string
	Name       string
	Image      string
	SKU        string
	Quantity   int32
	UnitPrice  int64 // in cents
	TotalPrice int64 // in cents
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// CalculateTotals calculates and updates cart totals based on items
func (c *Cart) CalculateTotals() {
	var subtotal int64 = 0
	for _, item := range c.Items {
		subtotal += item.TotalPrice
	}
	c.Subtotal = subtotal

	if c.CouponCode == nil {
		c.Discount = 0
	}

	c.Total = c.Subtotal - c.Discount
	if c.Total < 0 {
		c.Total = 0
	}
}

// ApplyDiscount applies a discount amount to the cart
func (c *Cart) ApplyDiscount(discountAmount int64) {
	c.Discount = discountAmount
	c.Total = c.Subtotal - c.Discount
	if c.Total < 0 {
		c.Total = 0
	}
}

// RemoveCoupon removes the coupon and resets discount
func (c *Cart) RemoveCoupon() {
	c.CouponCode = nil
	c.Discount = 0
	c.CalculateTotals()
}

// Reset resets the cart to empty state
func (c *Cart) Reset() {
	c.Items = []CartItem{}
	c.Subtotal = 0
	c.Discount = 0
	c.Total = 0
	c.CouponCode = nil
}

// IsEmpty checks if cart is empty
func (c *Cart) IsEmpty() bool {
	return len(c.Items) == 0
}

// MarkAsAbandoned marks cart as abandoned
func (c *Cart) MarkAsAbandoned() {
	c.IsAbandoned = true
}

// GetItemCount returns total number of items in cart
func (c *Cart) GetItemCount() int32 {
	var count int32 = 0
	for _, item := range c.Items {
		count += item.Quantity
	}
	return count
}

// FindItem finds a cart item by product and variant
func (c *Cart) FindItem(productID string, variantID *string) *CartItem {
	for i := range c.Items {
		item := &c.Items[i]
		if item.ProductID == productID {
			// Both nil
			if item.VariantID == nil && variantID == nil {
				return item
			}
			// Both non-nil and equal
			if item.VariantID != nil && variantID != nil && *item.VariantID == *variantID {
				return item
			}
		}
	}
	return nil
}

// AddOrUpdateItem adds a new item or updates quantity if exists
func (c *Cart) AddOrUpdateItem(item CartItem) {
	existingItem := c.FindItem(item.ProductID, item.VariantID)
	if existingItem != nil {
		existingItem.Quantity += item.Quantity
		existingItem.TotalPrice = existingItem.UnitPrice * int64(existingItem.Quantity)
	} else {
		item.TotalPrice = item.UnitPrice * int64(item.Quantity)
		c.Items = append(c.Items, item)
	}
	c.CalculateTotals()
}

// RemoveItem removes an item from cart
func (c *Cart) RemoveItem(itemID string) {
	for i, item := range c.Items {
		if item.ID == itemID {
			c.Items = append(c.Items[:i], c.Items[i+1:]...)
			break
		}
	}
	c.CalculateTotals()
}

// UpdateItemQuantity updates the quantity of an item
func (c *Cart) UpdateItemQuantity(itemID string, quantity int32) bool {
	for i := range c.Items {
		if c.Items[i].ID == itemID {
			if quantity <= 0 {
				c.RemoveItem(itemID)
			} else {
				c.Items[i].Quantity = quantity
				c.Items[i].TotalPrice = c.Items[i].UnitPrice * int64(quantity)
			}
			c.CalculateTotals()
			return true
		}
	}
	return false
}
