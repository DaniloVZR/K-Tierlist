import { ReactNode } from "react";
import { X } from "lucide-react";

export function SideDrawer({
  title,
  isOpen,
  onClose,
  children,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="side-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <h3>{title}</h3>
          <button aria-label="Cerrar" className="icon-button" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
