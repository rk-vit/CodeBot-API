import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import env from "dotenv";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
const port = 3000;
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(express.static(__dirname+'/public'))
env.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: { responseMimeType: "application/json" },
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post("/theme/:theme/:content", async (req, res) => {
  const { theme, content } = req.params;

  const prompt = `
    I Have the HTML Theme :- ${theme} and a text of required content :- ${content}, now generate an HTML page with the content shown in the style of the “Theme” using this json schema: 
    { "type":"object",
      "properties":{
        "code":{"type":"string"},
        "explanation_text":{"type":"string"}
      }
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseObject = JSON.parse(result.response.text());
    const code = responseObject.code;

    res.json({ code });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "An error occurred while processing your request." });
  }
});

app.post("/changes/:code/:change", async (req, res) => {
  const { code, change } = req.params;

  const prompt = `I Have some code :- ${code} and a text explaining the changes I want :- ${change}, now generate the code with changes made using this json schema: 
      { "type":"object",
          "properties":{
              "code":{"type":"string"},
              "explanation_text":{"type":"string"}
          }
      }`;

  try {
    const result = await model.generateContent(prompt);
    const responseObject = JSON.parse(result.response.text());
    const responseCode = responseObject.code;
    const responseText = responseObject.explanation_text;
    res.json({ code: responseCode });
  } catch (error) {
    console.error("Error parsing response:", error);
    res.status(500).json({ error: "An error occurred while processing your request." });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
