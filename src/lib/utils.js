import { v4 as uuidv4 } from 'uuid';

export function generateQrId() {
  return `AG-${uuidv4().slice(0, 8).toUpperCase()}`;
}
