-- Casho media buyer: opens the admin panel's Analytics Center only.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MEDIA_BUYER';
