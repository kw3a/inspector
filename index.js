import { spawn } from "child_process";
import { streamText } from "ai";
import { ollama } from "ollama-ai-provider";
const model = ollama("phi3");

async function doSomething(data) {
  let prompt = "Explica el siguiente error, de la forma más resumida posible y en español: " + data.toString();
  const { textStream } = await streamText({
    model,
    prompt: prompt,
  });

  process.stdout.write('\x1b[32m');
  console.log("INSPECTOR: ");
  for await (const textPart of textStream) {
    process.stdout.write(textPart);
  }
  process.stdout.write('\x1b[0m');
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Please provide a command");
    process.exit(1);
  }

  const command = args.join(" ");

  const cmd = spawn("bash", ["-c", command], {
    stdio: ["inherit", "pipe", "pipe"],
  });

  cmd.stdout.on("data", (data) => {
    process.stdout.write(data);
  });

  cmd.stderr.on("data", (data) => {
    process.stderr.write(data);
    doSomething(data);
  });

  cmd.on("close", (code) => {
    console.log(`Child process exited with code ${code}`);
  });

  cmd.on("error", (err) => {
    console.error("Failed to start command:", err);
  });
}
main();
