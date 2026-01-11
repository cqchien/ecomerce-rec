#!/bin/bash

# Generate protobuf files for all services
cd "$(dirname "$0")"

# Remove old generated files
rm -f *.pb.go *_grpc.pb.go

# Generate for all proto files
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    *.proto

echo "Proto files regenerated successfully!"
