// Shorten a Windows-style or UPN account name to the bare user portion
// for display:
//   DOMAIN\\m.kovac    → m.kovac
//   m.kovac@plant.lan  → m.kovac
//   m.kovac            → m.kovac
// The original (with domain) should be passed to a `title=` tooltip so
// the operator can still see the full identity on hover.
export function displayUserName(fullName?: string | null): string {
    if (!fullName) return '';
    const trimmed = fullName.trim();
    const backslash = trimmed.lastIndexOf('\\');
    if (backslash >= 0) return trimmed.slice(backslash + 1).trim();
    const at = trimmed.indexOf('@');
    if (at > 0) return trimmed.slice(0, at).trim();
    return trimmed;
}

// Two-letter initials for avatar squares. Splits on the common name
// separators (space, dot, underscore, dash) so both `Marek Kovac` and
// `m.kovac` collapse to `MK`. Falls back to `U` when nothing is available.
export function userInitials(fullName?: string | null): string {
    const display = displayUserName(fullName);
    if (!display) return 'U';
    const parts = display.split(/[.\s_-]+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
}
