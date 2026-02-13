import { HttpsError } from 'firebase-functions/v2/https'
import { InstrumentalPart } from "../types";

const validInstruments: InstrumentalPart[] = ['vo', 'gt', 'ba', 'dr', 'kb', 'oth']

export function validateInstrument(instrument: string): asserts instrument is InstrumentalPart {
  if (!validInstruments.includes(instrument as InstrumentalPart)) {
    throw new HttpsError('invalid-argument', 'Invalid instrument')
  }
}
