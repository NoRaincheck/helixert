// Simple static file server for development
const PORT = 3000;

Deno.serve({ port: PORT }, async (req) => {
  const url = new URL(req.url);
  let path = url.pathname === "/" ? "/index.html" : url.pathname;

  // Resolve relative to current directory
  const filePath = `.${path}`;

  try {
    const file = await Deno.readFile(filePath);
    const ext = path.split(".").pop() || "";
    const contentTypes: Record<string, string> = {
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      png: "image/png",
      jpg: "image/jpeg",
      svg: "image/svg+xml",
      ico: "image/x-icon",
    };
    return new Response(file, {
      headers: { "Content-Type": contentTypes[ext] || "text/plain" },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
});

console.log(`Helixert dev server running at http://localhost:${PORT}`);
