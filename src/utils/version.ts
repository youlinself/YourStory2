import versionData from '../../version.json';

export const APP_VERSION = versionData.version;
export const PRODUCT_NAME = versionData.productName;
export const RELEASE_DATE = versionData.releaseDate;

export function getVersionString(): string {
  return `v${APP_VERSION}`;
}

export function getFullVersionString(): string {
  return `${PRODUCT_NAME} v${APP_VERSION}`;
}
