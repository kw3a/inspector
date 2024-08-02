const commands = new Map();

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
  const newCommand = { id: id, command: command, errors: errors };
  commands.set(id, newCommand);
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
  const errors = commands.get(command_id).errors;
  if (errors.has(error_id)) {
    res.status(409).send("Error already exists");
    return;
  }
  errors.set(error_id, cmd_err);
  res.status(201).send("Error created successfully");
};

export { saveCommand, saveError, commands };
