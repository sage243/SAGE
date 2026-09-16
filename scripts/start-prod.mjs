#!/usr/bin/env node
/** Production start — bind to Render's PORT (default 10000) or local 3847. */
const { spawn } = require("child_process");

const port = process.env.PORT || "3847";
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(
  process.execPath,
  [nextBin, "start", "--hostname", "0.0.0.0", "--port", String(port)],
  { stdio: "inherit", env: process.env },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
