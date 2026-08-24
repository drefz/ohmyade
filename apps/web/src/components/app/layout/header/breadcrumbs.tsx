import { Link, useMatchRoute, useParams } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/shadcn/ui/breadcrumb";

export default function HeaderBreadcrumbs() {
  const matchRoute = useMatchRoute();
  const { session } = useParams({ strict: false });
  const isIndexRoute = matchRoute({ to: "/", fuzzy: false });
  const pageName = matchRoute({ to: "/settings", fuzzy: false }) ? "Settings" : session;

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          {isIndexRoute ? (
            <BreadcrumbPage className="font-semibold">Oh My ADE</BreadcrumbPage>
          ) : (
            <BreadcrumbLink className="font-semibold" render={<Link to="/" />}>
              Oh My ADE
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {pageName && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="max-w-48 truncate">{pageName}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
