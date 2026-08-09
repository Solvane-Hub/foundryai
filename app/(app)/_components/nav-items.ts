import {
  Banknote,
  FileText,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

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
  icon: LucideIcon;
}

export interface NavGroup {
  /** Omitted for the first group — a lone heading above "Dashboard" is noise. */
  label?: string;
  items: readonly NavItem[];
}

/**
 * Grouped so the unfinished routes sit together under one honest heading
 * instead of being scattered through the list, each individually greyed out.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', available: true, icon: LayoutDashboard },
      { href: '/intake', label: 'Business intake', available: true, icon: ListChecks },
    ],
  },
  {
    label: 'Coming soon',
    items: [
      { href: '/timeline', label: 'Timeline', available: false, icon: ListChecks },
      { href: '/compliance', label: 'Compliance', available: false, icon: ShieldCheck },
      { href: '/funding', label: 'Funding', available: false, icon: Banknote },
      { href: '/documents', label: 'Documents', available: false, icon: FileText },
      { href: '/assistant', label: 'Nova', available: false, icon: Sparkles },
    ],
  },
  {
    items: [{ href: '/settings', label: 'Settings', available: true, icon: Settings }],
  },
] as const;

/** Flat list retained for any caller that needs every route. */
export const NAV_ITEMS: readonly NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
