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
  let currentText = "";

  const prompt = commandPrompt + command;
  const {textStream} = await streamText({
    model,
    prompt: prompt,
  });
  for await (const textPart of textStream) {
    currentText += textPart;
    let currentTextHTML = '<pre id="streaming-text">' + currentText + '</pre>';
    let event = "data: " + currentTextHTML + "\n\n";
    res.write(event);
  }
  end(res);
}

const sseErrors = async (req, res) => {
  sseHeaders(res);
  const command_id = req.params.id;
  const error_id = req.params.error_id;

  if (!command_id || !error_id) {
    res.status(400).send("Error or id not provided");
    return;
  }

  const command = commands.get(command_id).command;
  const error = command.errors.get(error_id);
  let currentText = "";

  const prompt = context + command + ".\n" + errorPrompt + error;
  const {textStream} = await streamText({
    model,
    prompt: prompt,
  });
  for await (const textPart of textStream) {
    currentText += textPart;
    let currentTextHTML = '<pre id="streaming-text">' + currentText + '</pre>';
    let event = "data: " + currentTextHTML + "\n\n";
    res.write(event);
  }
  end(res);
};

const end = (res) => {
  let toWrite = "event: finished\ndata: <p>Stream finished</p>\n\n";
  res.write(toWrite);
  res.end();
};

const sseHeaders = (res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
}
export { sseErrors, sseCommands};
