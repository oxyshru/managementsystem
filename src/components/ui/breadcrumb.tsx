import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode;
  }>(
  ({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} data-id="4qrhvz7uy" data-path="src/components/ui/breadcrumb.tsx" />);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) =>
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props} data-id="ktoqgx828" data-path="src/components/ui/breadcrumb.tsx" />

);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) =>
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props} data-id="vvlec7q0j" data-path="src/components/ui/breadcrumb.tsx" />

);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean;
  }>(
  ({ asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";

    return (
      <Comp
        ref={ref}
        className={cn("transition-colors hover:text-foreground", className)}
        {...props} />);


  });
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) =>
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props} data-id="retheh9id" data-path="src/components/ui/breadcrumb.tsx" />

);
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) =>
<li
  role="presentation"
  aria-hidden="true"
  className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}
  {...props} data-id="e2h8wie06" data-path="src/components/ui/breadcrumb.tsx">

    {children ?? <ChevronRight />}
  </li>;

BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) =>
<span
  role="presentation"
  aria-hidden="true"
  className={cn("flex h-9 w-9 items-center justify-center", className)}
  {...props} data-id="ptvffjoqr" data-path="src/components/ui/breadcrumb.tsx">

    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only" data-id="31m36h7qc" data-path="src/components/ui/breadcrumb.tsx">More</span>
  </span>;

BreadcrumbEllipsis.displayName = "BreadcrumbElipssis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis };