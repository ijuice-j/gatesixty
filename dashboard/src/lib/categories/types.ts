/** A name you gave one of Google's eleven event colours. */
export type EventCategory = {
  id: string;
  /** Google colorId, "1".."11". Stored as smallint; carried as a string because that
   *  is what `GcalEvent.colorId` is, and one representation avoids a cast per compare. */
  colorId: string;
  name: string;
};
