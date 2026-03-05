import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import viteConfig from "../../vite.config";

const SSR_ENTRY = path.resolve(
  import.meta.dirname,
  "../..",
  "client",
  "src",
  "entry-server.tsx"
);

const CLIENT_TEMPLATE = path.resolve(
  import.meta.dirname,
  "../..",
  "client",
  "index.html"
);

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      let template = await fs.promises.readFile(CLIENT_TEMPLATE, "utf-8");
      template = await vite.transformIndexHtml(url, template);

      const { render } = (await vite.ssrLoadModule(SSR_ENTRY)) as {
        render: (url: string) => { html: string };
      };

      const { html: appHtml } = render(url);
      const html = template.replace("<!--app-html-->", appHtml);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");

  const ssrManifestPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(
          import.meta.dirname,
          "../..",
          "dist",
          "server",
          "entry-server.js"
        )
      : path.resolve(import.meta.dirname, "server", "entry-server.js");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  let templateHtml = "";
  const indexPath = path.resolve(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    templateHtml = fs.readFileSync(indexPath, "utf-8");
  }

  let ssrRender: ((url: string) => { html: string }) | null = null;

  app.use(express.static(distPath, { index: false }));

  app.use("*", async (_req, res) => {
    try {
      if (!ssrRender) {
        const mod = await import(ssrManifestPath);
        ssrRender = mod.render;
      }

      if (ssrRender && templateHtml) {
        const { html: appHtml } = ssrRender(_req.originalUrl);
        const html = templateHtml.replace("<!--app-html-->", appHtml);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } else {
        res.sendFile(indexPath);
      }
    } catch (e) {
      console.error("SSR render error:", e);
      res.sendFile(indexPath);
    }
  });
}
