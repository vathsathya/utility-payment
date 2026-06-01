import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Initialize Gemini API
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Upload Photo for Meter Recognition
  app.post("/api/recognize-meter", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }

      const mimeType = req.file.mimetype;
      const base64Data = req.file.buffer.toString("base64");

      const prompt = `Analyze this image of an electricity meter. Extract the current meter reading value. Only output the numeric value, or "UNKNOWN" if you can't read it.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
        ],
      });

      const readingText = response.text?.trim() || "";
      const number = parseFloat(readingText);

      res.json({
        reading: isNaN(number) ? null : number,
        rawText: readingText
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to recognize meter reading" });
    }
  });

  // Analytics API
  app.post("/api/analyze-consumption", async (req, res) => {
    try {
      const { historicalData, currentMonth } = req.body;
      
      const prompt = `
        You are an expert electricity consumption analyst in Cambodia. 
        Please analyze this consumption data for a house and explain any increases or decreases clearly but concisely, in Khmer language.
        
        Current Month: ${JSON.stringify(currentMonth)}
        Previous Months: ${JSON.stringify(historicalData)}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [prompt],
      });

      res.json({ analysis: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to analyze consumption" });
    }
  });

  app.post("/api/predict-forecast", async (req, res) => {
    try {
      const { historicalData } = req.body;
      
      const prompt = `
        You are an expert electricity consumption analyst. Forecast the next month's consumption based on this historical data.
        Provide a numeric estimate and a short 1-sentence reason (in Khmer language).
        
        Historical Data: ${JSON.stringify(historicalData)}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [prompt]
      });

      res.json({ forecast: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to predict forecast" });
    }
  });

  app.post("/api/generate-report", async (req, res) => {
    try {
      const { readingData } = req.body;
      
      const prompt = `
        Generate a readable monthly electricity bill summary report in Khmer.
        Format it nicely with markdown.
        Data: ${JSON.stringify(readingData)}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [prompt],
      });

      res.json({ report: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // @ts-ignore
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
