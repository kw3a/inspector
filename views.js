import { commands } from "./api.js";
const chatView = (req, res) => {
  const id = req.params.id;
  const command = commands.get(id);

  res.render("singular", { command });
};

const streamCommandStarter = (req, res) => {
  const id = req.params.id;
  if (!commands.has(id)) {
    res.status(404).send("Command not found");
    return;
  }
  let endpoint = "/stream/" + id;
  res.render("text_stream", { endpoint });
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
  let endpoint = "/stream/" + command_id + "/" + error_id;
  res.render("text_stream", { endpoint });
}
export { chatView, streamCommandStarter, streamErrorStarter };
