/** Optical layout shared by the deterministic demo QR renderer and its tests. */
export const QR_MODULES = 25;
export const QR_QUIET_ZONE = 4;
export const QR_DARK = '#0C2D26';
export const QR_WHITE = '#FFFFFF';
export const QR_VIEWBOX = `${-QR_QUIET_ZONE} ${-QR_QUIET_ZONE} ${QR_MODULES + 2 * QR_QUIET_ZONE} ${QR_MODULES + 2 * QR_QUIET_ZONE}`;
