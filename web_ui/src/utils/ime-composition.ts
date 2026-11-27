// Tells whether an Enter keydown only confirms text an input method (Vietnamese Telex/VNI, CJK) is still composing.

/** Key code browsers report while an input method handles the key, even when `key` already reads "Enter". */
const IME_PROCESS_KEY_CODE = 229;

export interface ComposingKeyEvent {
  isComposing: boolean;
  keyCode: number;
}

/**
 * True while the keystroke belongs to the input method. `isComposing` alone misses Safari, which resets it before the
 * confirming Enter reaches script; the 229 key code catches that case.
 */
export function isImeComposing(event: ComposingKeyEvent): boolean {
  return event.isComposing || event.keyCode === IME_PROCESS_KEY_CODE;
}
