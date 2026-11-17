-- Analytics Center: normalised traffic source per session (additive).
ALTER TABLE "AnalyticsSession" ADD COLUMN "source" TEXT NOT NULL DEFAULT '(direct)';
