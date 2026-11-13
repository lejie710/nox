// Model text with identifiers in it.
import { Fragment, type ReactNode } from "react";

/** A model's sentence as JSX: text between backticks is an identifier (`_PTS`, `SLP_EN`) and is set in the mono face. */
export const rich = (s: string): ReactNode =>
  s.split(/`([^`]+)`/).map((p, k) => (k % 2 ? <code key={k}>{p}</code> : <Fragment key={k}>{p}</Fragment>));

/** A label's text as JSX: text between asterisks (`*C0* · executing`) is the part to set bold. */
export const strong = (s: string): ReactNode =>
  s.split(/\*([^*]+)\*/).map((p, k) => (k % 2 ? <b key={k}>{p}</b> : <Fragment key={k}>{p}</Fragment>));
