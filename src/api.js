import { EventEmitter } from "events";
const commands = new Map();
const commandChan = new EventEmitter();
const errorChan = new EventEmitter();

const healthz = (_, res) => {
  res.send("ok");
};

const saveCommand = (req, res) => {
  const { command } = req.body;
  const id = req.params.id;

  if (!command || !id) {
    res.status(400).json({ error: "Command or id not provided" });
    return;
  }
  if (commands.has(id)) {
    res.status(409).json({ error: "Command already exists" });
    return;
  }
  const errors = new Map();
  const time = currentTime();
  const newCommand = { id: id, command: command, time: time, finished: false, errors: errors };
  commands.set(id, newCommand);
  commandChan.emit("command", newCommand);
  res.status(201).json({ message: "Command created successfully" });
};

const saveError = (req, res) => {
  const { cmd_err } = req.body;
  const command_id = req.params.id;
  const error_id = req.params.error_id;

  if (!cmd_err || !command_id || !error_id) {
    res.status(400).send("Error or id not provided");
    return;
  }

  if (!commands.has(command_id)) {
    res.status(404).send("Command id not found");
    return;
  }
  const cmdErrors = commands.get(command_id).errors;
  if (cmdErrors.has(error_id)) {
    res.status(409).send("Error already exists");
    return;
  }
  const newError = { error_id, cmd_error: cmd_err, time: currentTime()};
  const evt = { type: "newError", data: newError };
  cmdErrors.set(error_id, newError);
  errorChan.emit(command_id, evt);
  res.status(201).send("Error created successfully");
};

const currentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export { saveCommand, saveError, healthz, commands, commandChan, errorChan};
