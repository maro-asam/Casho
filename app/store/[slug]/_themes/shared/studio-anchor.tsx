/**
 * Invisible marker before a storefront region (a home section, the header…).
 * The Studio canvas uses it to outline the region on hover and open its
 * settings on click; a `<template>` renders nothing and never affects layout.
 * Ids starting with "__" only end the previous region.
 */
export function StudioAnchor({ id }: { id: string }) {
  return <template data-studio-anchor={id} />;
}
