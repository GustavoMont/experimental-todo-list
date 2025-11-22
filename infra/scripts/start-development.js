import { spawn } from "node:child_process";

const nextProcess = spawn("next", ["dev"], {
  stdio: "inherit",
  shell: true,
});

function handleExit() {
  nextProcess.kill("SIGINT");
}

process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);

nextProcess.on("close", (code) => {
  spawn("npm", ["run", "services:stop"], {
    stdio: "inherit",
  });
  if (code !== 0 && !nextProcess.killed) {
    console.log(`Servidor Next.js fechou com código ${code}.`);
  }
});
