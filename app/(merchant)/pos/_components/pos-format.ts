// POS works in piasters end-to-end; these only format for display.
const egpFormat = new Intl.NumberFormat("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** "٤٥٠" — number only, for tight spots next to a "ج.م" label. */
export const egpNumber = (piasters: number) => egpFormat.format(piasters / 100);

/** "٤٥٠ ج.م" */
export const egp = (piasters: number) => `${egpFormat.format(piasters / 100)} ج.م`;
