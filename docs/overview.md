# Hệ thống xử lý dữ liệu Streaming gợi ý sản phẩm theo thời gian thực

---

## 1. Project Scope

### 1.1 Business
Hệ thống được xây dựng nhằm **gợi ý sản phẩm theo thời gian thực (real-time recommendation)** cho website thương mại điện tử, dựa trên **luồng hành vi người dùng (streaming user events)** như view, click, add-to-cart.

Trọng tâm của đồ án:
- Phản ứng nhanh theo **hành vi gần nhất của người dùng**
- Xử lý dữ liệu dạng **streaming** thay vì batch
- Đảm bảo **độ trễ thấp (low latency)** khi phục vụ gợi ý

**Trong phạm vi (In-scope):**
- Session-based recommendation  
- Real-time update recommendation  
- Cold-start handling bằng popularity-based recommendation  
- Low-latency serving (< 100ms)

**Ngoài phạm vi (Out-of-scope):**
- Thanh toán, checkout, quản lý đơn hàng  
- Xác thực và phân quyền người dùng  
- CRM, marketing automation  
- Huấn luyện deep learning online  
---

### 1.2 Data
**Nguồn dữ liệu**
- RetailRocket e-commerce dataset

**Loại sự kiện**
- View  
- Click  
- Add-to-cart (tuỳ chọn)  
- Purchase (chủ yếu phục vụ evaluation)

**Đặc điểm dữ liệu**
- Event-time based  
- Có thể có out-of-order events  
- Tần suất cao, read-heavy

---

### 1.3 Streaming & Processing 

**Ingestion**
- Replay dữ liệu lịch sử để mô phỏng real-time
- Kafka làm message broker trung tâm

**Stream Processing**
- Apache Flink
- Stateful processing
- Event-time + watermark
- Sliding window & session window

**Các feature được tính**
- Item popularity theo sliding window  
- Item-to-item co-occurrence  
- User session history (last-K items)  
- Candidate recommendation sets  

---

### 1.4 Recommendation Scope

**Chiến lược gợi ý**
1. Popularity-based recommendation (baseline)  
2. Session-based recommendation  
3. Item co-occurrence recommendation  
4. Hybrid recommendation  

**Ranking signals**
- Popularity score  
- Co-occurrence score  
- Recency boost  
- Session relevance  

**Cold-start handling**
- User mới → popularity-based  
- Item mới → popularity / category propagation  

---

### 1.5 Storage & Serving Scope

**Serving layer**
- Redis làm in-memory data store

**Dữ liệu lưu trữ**
- Popular items  
- Co-occurrence lists  
- User session summary  
- Precomputed recommendations  

**Yêu cầu**
- Read-optimized  
- TTL-based expiration  
- API layer stateless  

---

### 1.6 API Scope

**API chính**
- `GET /recommendations/{user_id}`
- Tham số: `limit`, `context` (tuỳ chọn)

**API nội bộ**
- Health check  
- Metrics  
- Feedback ingestion  

**Non-functional requirements**
- Low latency  
- Horizontal scalability  
- Idempotent read  

---

### 1.7 Frontend
- Giao diện demo đơn giản
- Hiển thị danh sách sản phẩm gợi ý
- Auto-refresh để thể hiện tính real-time

---

### 1.8 Deployment Scope

**Local**
- Docker Compose

**Production-like**
- Kubernetes (tuỳ chọn)

**Observability**
- Metrics (latency, throughput, lag)
- Logging
- Alert cơ bản (tuỳ chọn)

---

### 1.9 Evaluation Scope

**Offline evaluation**
- Recall@K  
- Hit Rate  
- MRR / NDCG  

**Online-like metrics**
- Recommendation freshness  
- API latency  
- Throughput  

**So sánh**
- Popularity-only vs Hybrid  

---

## 2. Main System Flow

### Bước 1: Event Generation
Dữ liệu hành vi người dùng (view, click, add-to-cart) được tạo bằng cách replay RetailRocket dataset theo timestamp.

**Mỗi event bao gồm:**
- `user_id`
- `item_id`
- `event_type`
- `timestamp`
- `session_id`

Các event được publish vào Kafka topic `user-events`.

---

### Bước 2: Kafka
Kafka đóng vai trò:
- Durable event log  
- Buffer cho traffic lớn  
- Tách rời producer và consumer  

Event được partition theo `user_id` và có thể replay.

---

### Bước 3: Xử lý Streaming (Apache Flink)
Apache Flink consume dữ liệu từ Kafka và xử lý real-time.

**Các tác vụ chính**
- Assign event-time & watermark  
- Update user session state  
- Compute popularity (sliding window)  
- Update item co-occurrence  
- Generate recommendation candidates  

---

### Bước 4: Recommendation Computation
Với mỗi event:
1. Xác định session hiện tại của user  
2. Lấy last-K items trong session  
3. Truy xuất item co-occurring  
4. Kết hợp với popular items  
5. Áp dụng ranking logic → top-K  

Kết quả được ghi vào Redis.

---

### Bước 5: Redis
Redis lưu:
- Recommendation theo user  
- Popular items  
- Dữ liệu hỗ trợ khác  

Dữ liệu:
- Cập nhật liên tục  
- Có TTL  
- Tối ưu cho read latency thấp  

---

### Bước 6: API Serving
Frontend gọi API recommendation.

API:
- Đọc dữ liệu từ Redis  
- Áp dụng fallback logic  
- Trả về JSON  

Không xử lý nặng tại request time.

---

### Bước 7: Frontend
Frontend:
- Gọi API  
- Hiển thị sản phẩm gợi ý  
- Refresh định kỳ để quan sát realtime  

(Optional) Feedback có thể gửi ngược lại Kafka.