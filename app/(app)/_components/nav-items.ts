/**
 * Primary navigation.
 *
 * Routes for phases not yet built are listed with `available: false` and render
 * as visibly disabled. Hiding them would leave the founder unable to see where
 * the product is going; linking them would lead to a dead end. Showing them as
 * "coming in a later phase" is the honest option.
 */
export interface NavItem {
  href: string;
  label: string;
  available: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', available: true },
  { href: '/intake', label: 'Business intake', available: true },
  { href: '/timeline', label: 'Timeline', available: false },
  { href: '/compliance', label: 'Compliance', available: false },
  { href: '/funding', label: 'Funding', available: false },
  { href: '/documents', label: 'Documents', available: false },
  { href: '/assistant', label: 'Nova', available: false },
  { href: '/settings', label: 'Settings', available: true },
] as const;
