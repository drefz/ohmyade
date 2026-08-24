import { createFileRoute } from "@tanstack/react-router";

import RouteComponent from "@/components/app/pages/settings/route";

export const Route = createFileRoute("/settings")({ component: RouteComponent });
