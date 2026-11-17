// Fills the screen with the dark forest photo behind the sign-in screens, darkened so text on top stays readable.

/**
 * CC0 photo "Within Light" from Wikimedia Commons, resized to 1920px. It is a CSS background rather than next/image:
 * Next keeps visited routes mounted but hidden, and a `fill` image inside a hidden route reports a zero height.
 */
export function PhotoBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-background bg-[url('/login-background.jpg')] bg-cover bg-center"
    >
      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/25 to-black/65" />
    </div>
  );
}
