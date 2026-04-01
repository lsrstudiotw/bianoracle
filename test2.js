import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyAC5ry79UclPrBPqo-_OIP3EJqhOUAxZmQ";

async function test() {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        systemInstruction: "You are a tarot reader.",
      });

      const response = await model.generateContentStream("Hello");
      for await (const chunk of response.stream) {
        process.stdout.write(chunk.text());
      }
      console.log("\nDone");
    } catch (e) {
      console.error("DEBUG_ERROR:", e);
      console.error("Message:", e.message);
      if (e.status) console.error("Status:", e.status);
    }
}
test();
