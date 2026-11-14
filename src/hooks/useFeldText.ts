import { useState } from 'react';
import { parseZahl } from '@/lib/zahlen';

/**
 * Text eines Zahlenfelds, der dem Wert im Store folgt, ohne beim Tippen dazwischenzufunken:
 * Ändert sich der Store-Wert von außen (Import, Autosave, Vorbelegung), wird der Text neu formatiert.
 * Entspricht der Text schon dem Wert ("46," beim Tippen von 46,5), bleibt er stehen.
 */
export function useFeldText(
  wert: number,
  format: (n: number) => string,
  opt: { start?: string; nurPositiv?: boolean; key?: string } = {}
): [string, (text: string) => void] {
  const uebernehmen = !opt.nurPositiv || wert > 0;
  const [text, setText] = useState(() => (uebernehmen ? format(wert) : opt.start ?? ''));
  const stand = `${wert}|${opt.key ?? ''}`;
  const [letzter, setLetzter] = useState(stand);
  if (letzter !== stand) {
    setLetzter(stand);
    if (uebernehmen && (opt.key !== undefined || (parseZahl(text) ?? 0) !== wert)) setText(format(wert));
  }
  return [text, setText];
}
