export function publicStoragePath(
  imageUrl: string | null | undefined,
  bucket: string,
) {
  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = url.pathname.indexOf(marker);

    return markerIndex >= 0
      ? decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
      : null;
  } catch {
    return null;
  }
}
