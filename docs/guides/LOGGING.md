# Logging Guide

Allium provides a robust, high-performance logging system built on top of [Pino](https://github.com/pinojs/pino). It offers structured logging by default, which is essential for observability in production environments.

## Default Behavior

Out of the box, Allium logs in **JSON format** to `stdout`. This allows log aggregation tools (like Datadog, Splunk, or CloudWatch) to easily parse and index your logs.

```json
{
  "level": 30,
  "time": 1632233000000,
  "pid": 1234,
  "hostname": "server-1",
  "msg": "Server listening at http://127.0.0.1:3000"
}
```

## Configuration

You can configure the logger when initializing your application via `initAllium`.

### Basic Options

```typescript
import { initAllium } from '@allium/fastify';

await initAllium({
  // ...
  logging: {
    // 'debug', 'info', 'warn', 'error', 'fatal'
    level: 'info',

    // Enable pretty printing (recommended for local dev only)
    pretty: process.env.NODE_ENV !== 'production',

    // Paths to redact sensitive info from
    redact: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.creditCard',
    ],
  },
});
```

### Options Reference

| Option   | Type       | Default                                              | Description                                                               |
| :------- | :--------- | :--------------------------------------------------- | :------------------------------------------------------------------------ |
| `level`  | `string`   | `'info'`                                             | Minimum log level to print.                                               |
| `pretty` | `boolean`  | `false`                                              | Enables `pino-pretty` formatting. Requires `pino-pretty` to be installed. |
| `redact` | `string[]` | `['req.headers.authorization', 'req.body.password']` | Array of object paths to redact (hide) in logs.                           |

## Development Mode (Pretty Printing)

For a better developer experience, you can enable "pretty" logs which adds colors and formats the output for readability.

1. Install `pino-pretty`:

   ```bash
   npm install pino-pretty
   ```

2. Enable in config:
   ```typescript
   logging: {
     pretty: true;
   }
   ```

> [!WARNING]
> Avoid using `pretty: true` in production as it is slower and essentially disables structured logging benefits.

## Custom Logger

If you prefer another logging library (like Winston) or need advanced Pino configuration, you can pass a custom logger instance to the Fastify server options.

### Using Winston

```typescript
import winston from 'winston';
import { initAllium } from '@allium/fastify';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

await initAllium({
  server: {
    logger: logger, // Overrides Allium's default logging config
  },
  // ...
});
```

### Advanced Pino Config

```typescript
import pino from 'pino';

const logger = pino({
  level: 'trace',
  base: { service: 'my-service' }, // Add static fields to all logs
});

await initAllium({
  server: {
    logger: logger,
  },
});
```

## Logging in Request Handlers

The logger is attached to the request object, allowing you to log context-aware messages. This automatically includes the `reqId` to trace requests.

```typescript
fastify.get('/items', async (request, reply) => {
  request.log.info('Fetching items...');

  try {
    const items = await db.findItems();
    request.log.debug({ count: items.length }, 'Items retrieved');
    return items;
  } catch (err) {
    request.log.error(err, 'Failed to fetch items');
    throw err;
  }
});
```

## Performance

Allium uses **asynchronous logging** by default. Logging happens in a separate aspect of the event loop to ensure it has minimal impact on your API's response latency.

To ensure maximum performance in high-throughput scenarios:

1. Keep the log level at `info` or `error` in production.
2. Use redaction carefully (it creates object copies).
3. Ensure your log destination (stdout or file) is fast.
