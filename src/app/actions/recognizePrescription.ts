"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";

// Initialize APIs
const geminiApiKey = process.env.GEMINI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

console.log("API Keys Check:", {
    hasGemini: !!geminiApiKey,
    hasGroq: !!groqApiKey,
    hasDeepseek: !!deepseekApiKey,
    geminiKeyStart: geminiApiKey ? geminiApiKey.substring(0, 4) : 'none'
});

const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

// DeepSeek uses OpenAI-compatible API
const deepseek = deepseekApiKey ? new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: deepseekApiKey,
}) : null;

export async function recognizePrescription(formData: FormData) {
    const file = formData.get("file") as File;
    const textInput = formData.get("text") as string;

    if (!file && !textInput) {
        return { error: "No prescription provided" };
    }

    // Prompt for IMAGE analysis (strict - only extract what's written)
    const imagePrompt = `
You are an expert pharmacist analyzing a medical prescription image from India.
Extract ONLY the medicine/drug names written in the prescription.

RULES:
✓ Include pharmaceutical brand names and generic drug names
✓ Include dosage if visible (e.g., "Paracetamol 500mg")
✗ DO NOT include doctor/patient names, dates, "Rx", directions

Return JSON: {"medicines": ["Medicine1", "Medicine2"]}
If unclear, return: {"medicines": []}
    `.trim();

    // Prompt for TEXT analysis (lenient - understand natural language and suggest)
    const textPrompt = `
You are a helpful pharmacy assistant in India. The user will describe their needs - this could be:
1. A list of medicine names they need
2. Symptoms they're experiencing (headache, fever, cold, etc.)
3. A description of their health issue

YOUR TASK:
- If they mention specific medicine names → return those medicines
- If they describe symptoms → SUGGEST appropriate common Indian medicines for those symptoms

EXAMPLES:
- "I have headache and fever" → suggest: Dolo 650, Crocin, Paracetamol
- "cold and cough" → suggest: Cetirizine, Benadryl, Sinarest
- "acidity problem" → suggest: Pan-D, Omeprazole, Rantac, Gelusil
- "need Dolo and Crocin" → return: Dolo, Crocin
- "pain relief" → suggest: Combiflam, Brufen, Voveran

Return ONLY valid JSON with medicine suggestions:
{"medicines": ["Medicine1", "Medicine2", "Medicine3"]}

Be helpful! Suggest 2-5 commonly available medicines that would help.
If the input is completely irrelevant, return: {"medicines": []}
    `.trim();

    try {
        // For image input: Use strict extraction
        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            const dataUrl = `data:${file.type};base64,${base64}`;

            // Try DeepSeek Vision first
            if (deepseek) {
                try {
                    console.log("Trying DeepSeek vision model...");
                    const response = await deepseek.chat.completions.create({
                        model: "deepseek-chat",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: imagePrompt },
                                    { type: "image_url", image_url: { url: dataUrl } }
                                ]
                            }
                        ],
                        temperature: 0,
                    });

                    const content = response.choices[0]?.message?.content;
                    if (content) {
                        return parseResponse(content);
                    }
                } catch (deepseekError: any) {
                    console.log("DeepSeek failed, trying Gemini...", deepseekError?.message);
                }
            }

            // Fallback to Gemini
            if (genAI) {
                const imageData = {
                    inlineData: {
                        mimeType: file.type,
                        data: base64,
                    },
                };

                const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];

                for (const modelName of modelsToTry) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modelName });
                        const result = await model.generateContent([imagePrompt, imageData]);
                        const responseText = result.response.text();
                        return parseResponse(responseText);
                    } catch (modelError: any) {
                        if (modelError?.status === 429 || modelError?.message?.includes("429")) {
                            console.log(`Quota exceeded for ${modelName}, trying next...`);
                            continue;
                        }
                        throw modelError;
                    }
                }
            }

            return { error: "No vision API available. Please configure DEEPSEEK_API_KEY or GEMINI_API_KEY." };

        } else {
            // Text input: Use Groq with lenient prompt (natural language support)
            // Text input: Use Groq with lenient prompt, fallback to Gemini
            if (groq) {
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: textPrompt + "\n\nUser Input:\n" + textInput
                        }
                    ],
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.3,
                    response_format: { type: "json_object" },
                });

                const content = completion.choices[0]?.message?.content;
                if (!content) return { medicines: [] };
                return parseResponse(content);
            }

            // Fallback to Gemini for text
            if (genAI) {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const result = await model.generateContent(textPrompt + "\n\nUser Input:\n" + textInput);
                const responseText = result.response.text();
                return parseResponse(responseText);
            }

            return { error: "No AI API configured. Please add GROQ_API_KEY or GEMINI_API_KEY to .env.local" };
        }

    } catch (error: any) {
        console.error("API error:", error);
        return { error: `Failed to recognize prescription: ${error?.message || "Unknown error"}` };
    }
}

function parseResponse(content: string): { medicines: string[] } | { error: string } {
    try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.medicines && Array.isArray(parsed.medicines)) {
                return { medicines: validateMedicines(parsed.medicines) };
            }
        }

        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            return { medicines: validateMedicines(JSON.parse(arrayMatch[0])) };
        }

        return { medicines: [] };
    } catch (e) {
        console.error("JSON parse error", e);
        return { medicines: [] };
    }
}

// Filter out obviously invalid entries
function validateMedicines(medicines: string[]): string[] {
    const invalidPatterns = [
        /^(dr|doctor|patient|name|address|date|rx|sig|hospital|clinic|pharmacy)/i,
        /^(od|bd|tds|qid|sos|prn|hs|ac|pc|stat|before|after|food|meal|morning|night|daily|weekly)/i,
        /^(tablet|tablets|capsule|syrup|injection|drops|cream|ointment|gel|lotion)$/i,
        /^\d+$/,
        /^[a-z]$/i,
        /^(the|and|or|for|with|take|use|apply|give|as|per|needed|required)$/i,
    ];

    return medicines.filter(med => {
        if (!med || typeof med !== 'string') return false;
        const cleaned = med.trim();
        if (cleaned.length < 2 || cleaned.length > 50) return false;
        for (const pattern of invalidPatterns) {
            if (pattern.test(cleaned)) return false;
        }
        if (!/[a-zA-Z]/.test(cleaned)) return false;
        return true;
    });
}
