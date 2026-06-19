const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

console.log(
    "API Key Loaded:",
    !!process.env.GEMINI_API_KEY
);

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// IMPORTANT: This line tells your server to look in the 'public' folder for your HTML/CSS/JS
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

app.post("/chat", async (req, res) => {
    try {
        // Now accepting both message and image from frontend
        const { message, image } = req.body; 

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite", // or your current model
            systemInstruction: "You are the PRABHADRI chatbot, an advanced AI assistant. Your sole creator and developer is Adithyan S. If anyone asks who you are, you must answer that you are PRABHADRI. If anyone asks who made you or who your creator is, you must explicitly state that you were created by Adithyan S."
        });
        
        // Structure the prompt as an array. If an image exists, add it to the array.
        let promptParts = [message];

        if (image) {
            promptParts.push({
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType
                }
            });
        }
        
        // Pass the array to the model
        const result = await model.generateContent(promptParts);
        const response = result.response.text();

        res.json({
            reply: response
        });

    } catch(error){
        console.error("API Error:", error);

        if (error.status === 429) {
            return res.status(429).json({
                reply: "I'm getting a little overwhelmed with messages! Please give me a minute to catch my breath."
            });
        }

        res.status(500).json({
            reply: "Error generating response."
        });
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});