import { createFileRoute } from "@tanstack/react-router";

import RouteComponent from "@/components/app/pages/sessions/route";

export const Route = createFileRoute("/$session")({ component: RouteComponent });
