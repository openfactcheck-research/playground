/**
 * Secret types — user-scoped API credentials stored server-side.
 *
 * The value is never returned by the API; only a short trailing `hint` comes
 * back so the user can recognize which key is stored.
 */

export type Secret = {
  name: string
  hint: string
  createdAt: string
  updatedAt: string
}
