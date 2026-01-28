import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = process.cwd();

let nodeProcess = null;

function restartNode() {
  if (nodeProcess) {
    nodeProcess.kill("SIGTERM");
  }

  nodeProcess = spawn("node", ["dist/index.js"], {
    stdio: "inherit",
    env: process.env,
  });
}

const ctx = await esbuild.context({
  entryPoints: [path.resolve(__dirname, "src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outdir: path.resolve(__dirname, "dist"),
  sourcemap: true,
  tsconfig: path.resolve(__dirname, "tsconfig.json"),
  external: [
    "express",
    "axios",
    "mysql2",
    "sequelize",
    "joi",
    "bcryptjs",
    "redis",
    "resend",
    "nodemailer",
    "cors",
    "jsonwebtoken",
    "cookie-parser",
    "socket.io",
    "http",
  ],
  plugins: [
    {
      name: "run-on-build",
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length === 0) {
            console.log("🔁 Перезапуск сервиса...");
            restartNode();
          } else {
            console.log("❌ Билд с ошибками, перезапуск пропущен");
          }
        });
      },
    },
  ],
});

if (process.argv.includes("--watch")) {
  await ctx.watch();
  console.log("dev режим");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log(`✅ Билд ${process.env.nameService ?? ""} готов`);
}
