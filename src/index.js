import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { saveCommand, saveError, healthz } from "./api.js";
import {
  commandChat,
  errorChat,
  newCommands,
  home,
  newErrors,
  streamCommandStarter,
  streamErrorStarter,
} from "./views.js";
import { sseCommands, sseErrors } from "./prompts.js";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "styles")));
app.get("/", home);

app.get("/api/healthz", healthz);
app.post("/api/commands/:id", saveCommand);
app.post("/api/commands/:id/:error_id", saveError);

app.get("/commandchat/:id", commandChat);
app.get("/errorchat/:id/:error_id", errorChat); 
app.get("/newcommands", newCommands);
app.get("/newerrors/:id", newErrors);
app.get("/analize/:id", streamCommandStarter);
app.get("/analize/:id/:error_id", streamErrorStarter);
app.get("/stream/:id", sseCommands);
app.get("/stream/:id/:error_id", sseErrors);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
