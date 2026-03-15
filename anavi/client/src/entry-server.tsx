import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import { trpc } from "./lib/trpc";
import App from "./App";

export function render(url: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost/api/trpc",
        transformer: superjson,
      }),
    ],
  });

  const html = renderToString(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <Router ssrPath={url}>
            <App />
          </Router>
        </I18nextProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );

  queryClient.clear();

  return { html };
}
