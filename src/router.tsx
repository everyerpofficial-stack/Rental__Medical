import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Each sidebar page (Customers, Equipment, Owners, ...) is a separate
    // code-split JS chunk. Without preloading, that chunk is only fetched
    // *after* the click, so navigating anywhere feels like a ~1-2s stall.
    // "intent" prefetches the chunk on hover/focus/touchstart, so by the
    // time the click lands the chunk is usually already downloaded.
    defaultPreload: "intent",
  });

  return router;
};
