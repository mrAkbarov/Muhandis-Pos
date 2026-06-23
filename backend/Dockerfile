FROM ghcr.io/astral-sh/uv:alpine

RUN apk add --no-cache tzdata cups-client
ENV TZ=Asia/Tashkent

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

COPY . .
RUN chmod +x docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]
