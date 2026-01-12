module github.com/cqchien/ecomerce-rec/backend/services/recommendation-service

go 1.24.0

require (
	github.com/go-redis/redis/v8 v8.11.5
	google.golang.org/grpc v1.78.0
	gorm.io/driver/postgres v1.5.5
	gorm.io/gorm v1.25.12
)

require google.golang.org/protobuf v1.36.10 // indirect

require (
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/cqchien/ecomerce-rec/backend/proto v0.0.0
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/pgx/v5 v5.5.1 // indirect
	github.com/jackc/puddle/v2 v2.2.1 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	golang.org/x/crypto v0.44.0 // indirect
	golang.org/x/net v0.47.0 // indirect
	golang.org/x/sync v0.18.0 // indirect
	golang.org/x/sys v0.38.0 // indirect
	golang.org/x/text v0.31.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20251029180050-ab9386a59fda // indirect
)

replace github.com/cqchien/ecomerce-rec/backend/proto => ../../proto
