import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { type ActiveTimer } from "@time-tracker/core";
import { z } from "zod";
import { InMemoryTimeTrackingStore, type TimeTrackingStore } from "./time-tracking-store.js";

export interface AuthenticatedPrincipal {
  readonly userId: string;
  readonly organizationId: string;
  readonly role: "admin" | "manager" | "member";
}

export interface ApiApplicationOptions {
  readonly authenticate: (request: Request) => AuthenticatedPrincipal | undefined | Promise<AuthenticatedPrincipal | undefined>;
  readonly trackingStore?: TimeTrackingStore;
  readonly allowedOrigins?: readonly string[];
  readonly corsOrigins?: readonly string[];
  readonly registerRoutes?: (app: express.Express) => void;
}

const startActiveTimerSchema = z.object({
  id: z.string().min(1).max(200),
  projectId: z.string().min(1).max(200),
  startAt: z.string().datetime({ offset: true }),
  referenceUrl: z.string().url().max(2_048).optional(),
  pageTitle: z.string().min(1).max(500).optional(),
}).strict();

export function createApiApplication(options: ApiApplicationOptions): express.Express {
  const app = express();
  const trackingStore = options.trackingStore ?? new InMemoryTimeTrackingStore();

  if (options.corsOrigins?.length) {
    app.use((request, response, next) => {
      const origin = request.header("origin");
      if (origin && options.corsOrigins?.includes(origin)) {
        response.vary("Origin");
        response.header("Access-Control-Allow-Origin", origin);
        response.header("Access-Control-Allow-Credentials", "true");
        response.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        response.header("Access-Control-Allow-Headers", "Content-Type");
        if (request.method === "OPTIONS") {
          response.status(204).end();
          return;
        }
      }
      next();
    });
  }
  app.disable("x-powered-by");
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(express.json({ limit: "16kb", strict: true }));
  app.use(rateLimit({ windowMs: 15 * 60_000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));
  if (options.allowedOrigins) {
    app.use("/api", (request, response, next) => {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
        && !options.allowedOrigins?.includes(request.header("origin") ?? "")) {
        response.status(403).json({ error: "invalid origin" });
        return;
      }
      next();
    });
  }

  app.get("/healthz", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.get("/api/v1/active-timer", async (request, response) => {
    const principal = await requirePrincipal(options.authenticate, request, response);
    if (!principal) {
      return;
    }
    const timer = await trackingStore.getActiveTimer(principal);
    response.status(200).json(timer ? serializeActiveTimer(timer) : { timer: null });
  });

  app.post("/api/v1/active-timer", async (request, response) => {
    const principal = await requirePrincipal(options.authenticate, request, response);
    if (!principal) {
      return;
    }
    const input = startActiveTimerSchema.safeParse(request.body);
    if (!input.success) {
      response.status(400).json({ error: "invalid request" });
      return;
    }
    if (input.data.referenceUrl && !isHttpUrl(input.data.referenceUrl)) {
      response.status(400).json({ error: "invalid request" });
      return;
    }
    const timer = await trackingStore.startActiveTimer({
      id: input.data.id,
      userId: principal.userId,
      organizationId: principal.organizationId,
      projectId: input.data.projectId,
      startAt: new Date(input.data.startAt),
      ...(input.data.referenceUrl === undefined ? {} : { referenceUrl: input.data.referenceUrl }),
      ...(input.data.pageTitle === undefined ? {} : { pageTitle: input.data.pageTitle }),
    });
    response.status(201).json(serializeActiveTimer(timer));
  });

  options.registerRoutes?.(app);
  app.use((_request, response) => {
    response.status(404).json({ error: "not found" });
  });
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    console.error("Unhandled API error", { message: error instanceof Error ? error.message : "unknown" });
    response.status(500).json({ error: "internal server error" });
  });
  return app;
}

async function requirePrincipal(
  authenticate: ApiApplicationOptions["authenticate"],
  request: Request,
  response: Response,
): Promise<AuthenticatedPrincipal | undefined> {
  const principal = await authenticate(request);
  if (!principal) {
    response.status(401).json({ error: "unauthenticated" });
  }
  return principal;
}

function serializeActiveTimer(timer: ActiveTimer): object {
  return {
    ...timer,
    startAt: timer.startAt.toISOString(),
  };
}

function isHttpUrl(value: string): boolean {
  const url = new URL(value);
  return url.protocol === "https:" || url.protocol === "http:";
}
