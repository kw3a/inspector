import { streamText } from "ai";
import { ollama } from "ollama-ai-provider";
import { commands } from "./api.js";
const model = ollama("phi3");

const commandPrompt = `Explica lo que hace el siguiente comando, de forma resumida y en español: `;
const context = `Teniendo de contexto este comando: `;
const errorPrompt = `Explica el siguiente error, de forma resumida y en español: `;

const sseCommands = async (req, res) => {
  sseHeaders(res);
  const id = req.params.id;

  if (!id) {
    res.status(400).send("Id not provided");
    return;
  }

  const command = commands.get(id).command;

  const prompt = commandPrompt + command;
  const {textStream} = await streamText({
    model,
    prompt: prompt,
  });
  for await (const textPart of textStream) {
    let sseEvent = "data: " + textPart + "\n\n";
    res.write(sseEvent);
  }
  sseEnd(res);
}

const sseErrors = async (req, res) => {
  sseHeaders(res);
  const command_id = req.params.id;
  const error_id = req.params.error_id;

  if (!command_id || !error_id) {
    res.status(400).send("Error or id not provided");
    return;
  }

  if (!commands.has(command_id)) {
    res.status(404).send("Command not found");
    return;
  }

  const command = commands.get(command_id);
  const commandValue = command.command;
  const errors = command.errors;
  if (!errors.has(error_id)) {
    res.status(404).send("Error not found");
    return;
  }
  const error = errors.get(error_id);
  const { cmd_error } = error;

  const prompt = context + commandValue + ".\n" + errorPrompt + cmd_error;
  const {textStream} = await streamText({
    model,
    prompt: prompt,
  });
  for await (const textPart of textStream) {
    let event = "data: " + textPart + "\n\n";
    res.write(event);
  }
  sseEnd(res);
};

const sseEnd = (res) => {
  let toWrite = "event: finished\ndata: <p>Stream finished</p>\n\n";
  res.write(toWrite);
  res.end();
};

const sseHeaders = (res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}
export { sseErrors, sseCommands, sseHeaders, sseEnd };
