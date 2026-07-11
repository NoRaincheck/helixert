const DIST = "dist";

await Deno.remove(DIST, { recursive: true }).catch(() => {});

const { code, stderr } = await new Deno.Command("deno", {
  args: [
    "bundle",
    "--outdir",
    DIST,
    "--platform",
    "browser",
    "--minify",
    "index.html",
  ],
}).output();

if (code !== 0) {
  console.error(new TextDecoder().decode(stderr));
  Deno.exit(1);
}
console.log("HTML + JS bundled");

// Remove Deno artifacts
for (const entry of Deno.readDirSync(DIST)) {
  if (entry.name.startsWith("_") && entry.isDirectory) {
    Deno.removeSync(`${DIST}/${entry.name}`, { recursive: true });
  }
}

await Deno.mkdir(`${DIST}/css`, { recursive: true });
await Deno.copyFile("css/main.css", `${DIST}/css/main.css`);
console.log("CSS copied");

console.log("Build complete → dist/");
