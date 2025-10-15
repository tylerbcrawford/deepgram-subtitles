.PHONY: help build cli web-up web-down web-logs web-restart clean

# Default target
help:
	@echo "Deepgram Subtitle Generator - Available Commands"
	@echo ""
	@echo "CLI Tool (Phase 1):"
	@echo "  make build          Build the Docker images"
	@echo "  make cli            Run CLI tool (process all videos)"
	@echo "  make cli-batch      Run CLI with batch limit (BATCH_SIZE=10)"
	@echo ""
	@echo "Web UI (Phase 2):"
	@echo "  make web-up         Start Web UI services (redis, web, worker)"
	@echo "  make web-down       Stop Web UI services"
	@echo "  make web-logs       View Web UI logs (follow mode)"
	@echo "  make web-restart    Restart Web UI services"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean          Remove all containers and volumes"
	@echo ""

# Build Docker images
build:
	docker compose build

# ============================================================================
# CLI Tool Commands
# ============================================================================

# Run CLI tool to process all videos
cli:
	docker compose run --rm deepgram-subtitles

# Run CLI with batch size limit
cli-batch:
	docker compose run --rm -e BATCH_SIZE=10 deepgram-subtitles

# ============================================================================
# Web UI Commands
# ============================================================================

# Start Web UI services
web-up:
	docker compose up -d redis deepgram-web deepgram-worker
	@echo ""
	@echo "✅ Web UI started!"
	@echo "Configure your reverse proxy to point to http://localhost:5000"
	@echo "View logs: make web-logs"

# Stop Web UI services
web-down:
	docker compose down

# View Web UI logs
web-logs:
	docker compose logs -f deepgram-web deepgram-worker

# Restart Web UI services
web-restart:
	docker compose restart deepgram-web deepgram-worker

# ============================================================================
# Maintenance Commands
# ============================================================================

# Clean up everything
clean:
	docker compose down -v
	@echo "✅ All containers and volumes removed"