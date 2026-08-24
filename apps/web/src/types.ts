import type { LucideIcon } from "lucide-react";

export type HeaderBarButton = {
  label: string;
  icon: LucideIcon;
  pressed?: boolean;
  onClick?: () => void;
};
