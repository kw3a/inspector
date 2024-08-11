import { commands } from "./api.js";
import { sseEnd, sseHeaders } from "./prompts.js";
import ejs from "ejs";
import { commandChan, errorChan } from "./api.js";
import path from "path";
import { fileURLToPath } from "url";

const reversedMap = (map) => {
  const reversedEntries = Array.from(map.entries()).reverse();

  const reversedMap = new Map();
  reversedEntries.forEach(([key, value]) => {
    reversedMap.set(key, value);
  });
  return reversedMap;
};
const home = (_, res) => {
  const reversedCommands = reversedMap(commands);
  res.render("index", { title: "Command List", commands: reversedCommands});
};

const commandChat = (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send("Id not provided");
    return;
  }
  if (!commands.has(id)) {
    res.status(404).send("Command not found");
    return;
  }
  const command = commands.get(id);
  const reversedErrors = reversedMap(command.errors);
  res.render("workspace", { command, errors: reversedErrors});
};

const errorChat = (req, res) => {
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
  if (!command.errors.has(error_id)) {
    res.status(404).send("Error not found");
    return;
  }
  const error = command.errors.get(error_id);
  res.render("error_chat", { command, error });
};

const newCommands = async (req, res) => {
  sseHeaders(res);
  const sendPing = () => {
    res.write(": keep-alive\n\n");
  };
  const pingInterval = setInterval(sendPing, 15000);

  const listener = async (event) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const tmpl = path.join(__dirname, "..", "views", "command_card.ejs");
    const htmlData = await ejs.renderFile(tmpl, { command: event });
    const formattedData = htmlData.replace(/\n/g, "");
    const sseEvent = `data: ${formattedData}\n\n`;

    res.write(sseEvent);
  };

  commandChan.on("command", listener);

  req.on("close", () => {
    clearInterval(pingInterval);
    commandChan.removeListener("command", listener);
    sseEnd(res);
  });
};

const newErrors = async (req, res) => {
  sseHeaders(res);
  const command_id = req.params.id;
  if (!command_id) {
    res.status(400).send("Id not provided");
    return;
  }
  if (!commands.has(command_id)) {
    res.status(404).send("Command not found");
    return;
  }
  const command = commands.get(command_id);

  const sendPing = () => {
    res.write(": keep-alive\n\n");
  };
  const pingInterval = setInterval(sendPing, 15000);

  const listener = async (event) => {
    const { type, data } = event;
    if (type !== "newError") {
      errorChan.removeListener(command_id, listener);
      sseEnd(res);
      return;
    }
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const tmpl = path.join(__dirname, "..", "views", "error_card.ejs");
    const htmlData = await ejs.renderFile(tmpl, { command, error: data });
    const formattedData = htmlData.replace(/\n/g, "");
    const sseEvent = `data: ${formattedData}\n\n`;

    res.write(sseEvent);
  };

  errorChan.on(command_id, listener);

  req.on("close", () => {
    clearInterval(pingInterval);
    errorChan.removeListener(command_id, listener);
    sseEnd(res);
  });
};

const streamCommandStarter = (req, res) => {
  const id = req.params.id;
  if (!commands.has(id)) {
    res.status(404).send("Command not found");
    return;
  }
  const command = commands.get(id);
  res.render("command_stream", { command });
};

const streamErrorStarter = (req, res) => {
  const command_id = req.params.id;
  const error_id = req.params.error_id;
  if (!commands.has(command_id)) {
    res.status(404).send("Command not found");
    return;
  }
  if (!commands.get(command_id).errors.has(error_id)) {
    res.status(404).send("Error not found");
    return;
  }
  const command = commands.get(command_id);
  const error = command.errors.get(error_id);
  res.render("error_stream", { command, error});
};

export {
  commandChat,
  errorChat,
  streamCommandStarter,
  streamErrorStarter,
  newCommands,
  newErrors,
  home,
};
