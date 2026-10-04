-- Only the classic ("default") theme remains. Move stores on removed themes to it.
UPDATE "StoreSettings" SET "themeId" = 'default' WHERE "themeId" <> 'default';

UPDATE "StoreSettings"
SET "themeConfig" = jsonb_set("themeConfig", '{presetId}', '"default"')
WHERE "themeConfig" IS NOT NULL
  AND jsonb_typeof("themeConfig") = 'object'
  AND "themeConfig"->>'presetId' IS DISTINCT FROM 'default'
  AND "themeConfig" ? 'presetId';

UPDATE "StoreSettings"
SET "draftThemeConfig" = jsonb_set("draftThemeConfig", '{presetId}', '"default"')
WHERE "draftThemeConfig" IS NOT NULL
  AND jsonb_typeof("draftThemeConfig") = 'object'
  AND "draftThemeConfig"->>'presetId' IS DISTINCT FROM 'default'
  AND "draftThemeConfig" ? 'presetId';
