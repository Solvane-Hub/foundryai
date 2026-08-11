import { WorkspaceCanvas } from '@/components/ui/workspace-canvas';

/**
 * Settings stays on the warm canvas.
 *
 * Long-form reading and typing does not belong on water — the environment is
 * where the founder is oriented, the canvas is where they work. Applying this
 * as a layout rather than editing the page keeps the route's markup and its
 * global tokens exactly as they were.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceCanvas width="wide">{children}</WorkspaceCanvas>;
}
