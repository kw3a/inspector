import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveCommand, saveError, commands } from './api.js';
import { streamCommandStarter, streamErrorStarter, chatView} from './views.js';
import { sseCommands, sseErrors } from './prompts.js';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar el motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());

// Datos de ejemplo para renderizar en la plantilla

app.get('/', (_, res) => {
  res.render('index', { title: 'Command List', commands: commands});
});
app.get('/api/healthz', (_, res) => {
  res.send('ok');
});
app.post('/api/commands/:id', saveCommand);
app.post('/api/commands/:id/:error_id', saveError);

app.get('/singular/:id', chatView);
app.get('/analize/:id', streamCommandStarter);
app.get('/analize/:id/:error_id', streamErrorStarter);
app.get('/stream/:id', sseCommands);
app.get('/stream/:id/:error_id', sseErrors);
/*
app.get('/events', streamEvents);


app.get('/stream-text', streamText);
*/
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
