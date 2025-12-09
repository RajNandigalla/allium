# Analytics & Monitoring

Allium comes with a built-in, lightweight analytics system designed to give you instant visibility into your API's performance and usage.

## Overview

The analytics system works by automatically intercepting every request to your API. It measures the response time (latency), captures the HTTP status code, and logs this information to your database.

**Key Features:**

- **Zero Configuration:** Works out-of-the-box if you have the `ApiMetric` model.
- **Async Logging:** Analytics data is written asynchronously to ensure it **never** slows down your API responses.
- **Privacy Focused:** Does not log request bodies or headers by default.
- **Built-in Dashboard:** Visualized automatically in the Admin Panel.

## Data Model

The system uses a dedicated `ApiMetric` model to store performance data. This model is built-in to the core runtime.

| Field        | Type     | Description                                                                           |
| :----------- | :------- | :------------------------------------------------------------------------------------ |
| `endpoint`   | String   | The request path (e.g., `/api/users`). Query parameters are stripped for aggregation. |
| `method`     | String   | HTTP method (GET, POST, etc.).                                                        |
| `statusCode` | Int      | HTTP status code (200, 404, 500, etc.).                                               |
| `latency`    | Int      | Request duration in milliseconds.                                                     |
| `timestamp`  | DateTime | When the request occurred.                                                            |

## Configuration

### Enabling Analytics

Analytics is **enabled automatically** if your plugin chain includes the `prisma` plugin and the `ApiMetric` model exists in your schema.

To ensure it's active, verify your `prisma/schema.prisma` (if you are generating it manually) or simply use the Allium CLI which handles this for you.

### Excluding Routes

By default, the following routes are **excluded** from analytics to reduce noise:

- `/health`
- `/documentation` (Swagger UI)
- `/favicon.ico`

currently, these exclusions are hardcoded in the default plugin. Custom exclusions can be implemented by creating a custom plugin if needed.

## Accessing Data

### Admin Dashboard

The easiest way to view your analytics is through the auto-generated Admin Panel. It provides:

- **Total Requests**: Traffic volume over time.
- **Error Rate**: Percentage of failed requests.
- **Average Latency**: System performance monitoring.
- **Top Endpoints**: Which routes are most used.
- **Filtering**: Support for preset ranges (24h, 7d, 30d) and **custom date ranges**.

### Direct Access

You can query the `ApiMetric` model directly using Prisma, or use the Admin API endpoints.

**API Endpoints:**

- `GET /_admin/analytics/overview?range=24h`
- `GET /_admin/analytics/chart?from=2023-01-01&to=2023-01-31`

Supported Query Parameters:

- `range`: Preset range (`24h`, `7d`, `30d`). Default is `24h`.
- `from`, `to`: ISO date strings for custom ranges (overrides `range`).

**Prisma Example:**
If you need custom reports via code:

```typescript
const metrics = await prisma.apiMetric.groupBy({
  by: ['endpoint'],
  _avg: {
    latency: true,
  },
  _count: {
    endpoint: true,
  },
});
```

## Performance Considerations

The analytics logger is designed for high performance:

1. **High Resolution Timer**: Uses `process.hrtime()` for nanosecond-precision measurement.
2. **Fire-and-Forget**: The database write operation is not awaited (`await`), meaning the response is sent to the user immediately. The metric is saved in the background.
3. **Fail-Safe**: If the logging fails (e.g., database busy), it fails silently to prevent disrupting the user experience.
