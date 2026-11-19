# Infrastructure — Docker

Root `docker-compose.yml` defines local dependencies:

| Service    | Host port | Notes                                      |
|------------|-----------|--------------------------------------------|
| PostgreSQL | 5432      | user/db `tarweej`, password in `.env.example` |
| Redis      | 6379      | AOF enabled                                |
| MinIO      | 9000/9001 | S3 API + console (`bitnamilegacy/minio`)   |

```bash
docker compose up -d
docker compose ps
docker compose down
```
