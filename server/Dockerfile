FROM ghcr.io/astral-sh/uv:0.8.4-python3.13-bookworm

# Set working directory
WORKDIR /code

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

# Install the project's dependencies using the lockfile and settings
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project --no-dev

# Copy the rest of the application code
COPY config ./config
COPY app ./app

# Reset the entrypoint, don't invoke `uv`
ENTRYPOINT []

# Start the FastAPI server
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
