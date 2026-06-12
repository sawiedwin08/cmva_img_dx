# Stage 1: Build React frontend
FROM node:20-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# Stage 2: Python runtime
FROM python:3.11-slim
WORKDIR /app/cmva_app
COPY cmva_app/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY cmva_app/ ./
COPY --from=frontend-builder /frontend/dist /app/frontend/dist

EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
