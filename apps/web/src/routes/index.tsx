import { createFileRoute } from "@tanstack/react-router";

import RouteComponent from "@/components/app/pages/index/route";

export const Route = createFileRoute("/")({ component: RouteComponent });
