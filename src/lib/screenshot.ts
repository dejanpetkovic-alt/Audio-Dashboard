export function screenshotUrl(referenceUrl: string) {
  return `https://image.thum.io/get/width/800/crop/900/maxAge/24/noanimate/?url=${encodeURIComponent(referenceUrl)}`;
}
