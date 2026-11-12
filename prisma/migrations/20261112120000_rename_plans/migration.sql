-- Plans are renamed Starter / Growth / Scale (display name + URL slug).
-- The keys stay SILVER / GOLD / PLATINUM: they are internal identifiers wired
-- into the trial plan, sales commissions and plan checkout, and never shown.
UPDATE "Plan" SET "name" = 'Starter', "slug" = 'starter' WHERE "key" = 'SILVER';
UPDATE "Plan" SET "name" = 'Growth', "slug" = 'growth' WHERE "key" = 'GOLD';
UPDATE "Plan" SET "name" = 'Scale', "slug" = 'scale' WHERE "key" = 'PLATINUM';
