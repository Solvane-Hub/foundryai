import { WorkspaceCanvas } from '@/components/ui/workspace-canvas';

/** Business creation is a form. Forms stay on the warm canvas. */
export default function BusinessesLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceCanvas>{children}</WorkspaceCanvas>;
}
