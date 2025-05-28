#!/bin/bash

# Start PostgreSQL for local testing
set -e

echo "🐘 Starting PostgreSQL for DCA Bot testing..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if container already exists
if docker ps -a --format "table {{.Names}}" | grep -q "dca-postgres"; then
    echo "📦 PostgreSQL container already exists. Starting..."
    docker start dca-postgres
else
    echo "🆕 Creating new PostgreSQL container..."
    docker run -d \
        --name dca-postgres \
        -e POSTGRES_DB=dca_bot \
        -e POSTGRES_USER=dca_user \
        -e POSTGRES_PASSWORD=dca_password \
        -p 5432:5432 \
        -v dca_postgres_data:/var/lib/postgresql/data \
        postgres:15-alpine
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker exec dca-postgres pg_isready -U dca_user -d dca_bot > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo "Waiting... ($elapsed/$timeout seconds)"
done

if [ $elapsed -ge $timeout ]; then
    echo "❌ PostgreSQL failed to start within $timeout seconds."
    docker logs dca-postgres --tail=20
    exit 1
fi

echo "🔗 PostgreSQL connection details:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: dca_bot"
echo "  Username: dca_user"
echo "  Password: dca_password"
echo ""
echo "📋 Useful commands:"
echo "  Connect: docker exec -it dca-postgres psql -U dca_user -d dca_bot"
echo "  Stop: docker stop dca-postgres"
echo "  Logs: docker logs dca-postgres"
echo "  Remove: docker rm -f dca-postgres"
echo ""
echo "🚀 Ready to start DCA Bot with PostgreSQL!"
echo "   Use: cp .env.postgresql .env"
echo "   Then: npm run dev"