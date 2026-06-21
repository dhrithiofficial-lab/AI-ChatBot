const fs = require('fs');
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

// Serves the HTML/CSS/JS frontend from the public directory
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/chat", async (req, res) => {
    try {
        // 1. Accept text message and optional image data from frontend
        const { message, image } = req.body; 

        if (!message) {
            return res.status(400).json({ reply: "Message content is required." });
        }

        // 2. Read the live student profile data locally
        const rawData = fs.readFileSync('student_profile.json');
        const studentProfile = JSON.parse(rawData);

        // 3. Synthesize your branding requirements with the Hackathon Academic constraints
        const comprehensiveSystemInstruction = `You are PRABHADRI, an advanced AI chatbot and adaptive academic tutor. 
        
        IDENTITY & BRANDING RULES:
        - Your developer and creator is Adithyan S.
        - Do NOT announce your creator's name or your name in every single message unless asked. Keep standard greetings natural.
        
        TEXT FORMATTING MANDATE:
        - NEVER use LaTeX math notation or dollar signs (e.g., do NOT use 300 K, T_A, or Delta U).
        - Use clean, standard, readable text formatting.
        
        ACADEMIC CONTEXT:
        - Target Exam: ${studentProfile.target_exam}
        - Current Weak Points: ${studentProfile.weak_points.join(', ')}
        
        INSTRUCTION MANDATE:
        Guide the student through their weak concepts using automated learning discovery. 
        
        *** CRITICAL SYSTEM DIAGNOSTIC TRIGGER ***
        If the user asks a question about a completely NEW topic they don't understand, or demonstrates a fundamental failure in a new subject, you MUST append this exact diagnostic tag to the very end of your response:
        [NEW_WEAKNESS: Topic Name]
        
        Example: If they show they don't understand cellular respiration, end your reply with: [NEW_WEAKNESS: Cellular Respiration]
        Keep the topic name under 3 words.`;
        
        // 4. Initialize the generative model with combined instructions
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite", 
            systemInstruction: comprehensiveSystemInstruction
        });
        
        // 5. Structure payload for multimodal capabilities (Text + Vision)
        let promptParts = [message];

        if (image && image.data && image.mimeType) {
            promptParts.push({
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType
                }
            });
        }
        
        // 6. Generate the content from Gemini API
        const result = await model.generateContent(promptParts);
        const responseText = result.response.text();

        // 7. Double-key json payload prevents breaking changes if your frontend checks for either 'reply' or 'response'
        res.json({
            reply: responseText,
            response: responseText
        });

    } catch (error) {
        console.error("API Error:", error);

        // Handle high traffic rate limits during grading or demonstrations
        if (error.status === 429) {
            return res.status(429).json({
                reply: "I'm getting a little overwhelmed with messages! Please give me a minute to catch my breath.",
                response: "I'm getting a little overwhelmed with messages! Please give me a minute to catch my breath."
            });
        }

        res.status(500).json({
            reply: "Error generating academic response.",
            response: "Error generating academic response."
        });
    }
});

// ==========================================
// PHASE 2: DYNAMIC PROFILE UPDATING
// ==========================================
app.post("/update-profile", (req, res) => {
    try {
        const { new_weakness, mastered_topic, new_target } = req.body; 
        
        // 1. Read the current profile
        const rawData = fs.readFileSync('student_profile.json');
        let studentProfile = JSON.parse(rawData);

        // 2. Add a new weakness if the frontend sends one
        if (new_weakness) {
            if (!studentProfile.weak_points.includes(new_weakness)) {
                studentProfile.weak_points.push(new_weakness);
            }
        }

        // 3. Remove a mastered topic if the student learned it
        if (mastered_topic) {
            studentProfile.weak_points = studentProfile.weak_points.filter(
                topic => topic !== mastered_topic
            );
        }

        // --- THE FIX: Update Target & Wipe Weak Points ---
        if (new_target && new_target !== studentProfile.target_exam) {
            studentProfile.target_exam = new_target;
            studentProfile.weak_points = []; // Start fresh for the new subject!
        }
        // -------------------------------------------------

        // 4. Time-Period / Memory Limit
        if (studentProfile.weak_points.length > 5) {
            studentProfile.weak_points.shift(); 
        }

        // 5. Save the updated profile back to the hard drive
        fs.writeFileSync('student_profile.json', JSON.stringify(studentProfile, null, 2));

        res.json({ success: true, message: "Profile updated successfully!", current_profile: studentProfile });

    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ error: "Failed to update student profile." });
    }
});
// ==========================================
// PHASE 2.5: SEND PROFILE TO FRONTEND
// ==========================================
app.get("/profile", (req, res) => {
    try {
        const rawData = fs.readFileSync('student_profile.json');
        res.json(JSON.parse(rawData));
    } catch (error) {
        console.error("Error reading profile:", error);
        res.status(500).json({ error: "Failed to read profile" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running smoothly on port ${PORT}`);
});
