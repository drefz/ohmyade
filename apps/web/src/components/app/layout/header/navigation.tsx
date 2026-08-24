import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import HeaderButtonGroup from "@/components/app/layout/header/button-group";
import type { HeaderBarButton } from "@/types";

export function HeaderNavigation() {
  const router = useRouter();
  const buttons = [
    {
      label: "Go back",
      icon: ArrowLeft,
      onClick: () => router.history.back()
    },
    {
      label: "Go forward",
      icon: ArrowRight,
      onClick: () => router.history.forward()
    }
  ] satisfies HeaderBarButton[];

  return <HeaderButtonGroup buttons={buttons} />;
}
