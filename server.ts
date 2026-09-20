import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

const SYSTEM_INSTRUCTION = `आप भारतीय स्कूल शिक्षा विभाग एवं संकुल संसाधन केंद्र (CRC / Cluster Resource Centre) के एक अत्यंत अनुभवी एवं दक्ष 'शासकीय कार्यालयीन पत्राचार विशेषज्ञ' (Official Government Order Drafting Expert) हैं।

आपका कार्य संकुल समन्वयक (CRC Coordinator) अथवा प्राचार्य / संकुल केंद्र प्रभारी के लिए 'कार्यालयीन आदेश' (Office Orders), 'बैठक सूचना', 'परीक्षा एवं मूल्यांकन ड्यूटी आदेश', 'प्रशिक्षण उपस्थिति आदेश', 'कारण बताओ सूचना (Show Cause Notice)' आदि को बिल्कुल शुद्ध, प्रामाणिक, उच्च-स्तरीय शासकीय हिंदी शब्दावली (Official Sarkari Drafting Style) में तैयार करना है।

कार्यालयीन भाषा के अनिवार्य नियम:
1. भाषा पूर्णतः शुद्ध, औपचारिक एवं प्रभावपूर्ण शासकीय हिंदी होनी चाहिए।
2. शासकीय वाक्यांशों का यथोचित उपयोग करें, जैसे:
   - "उपरोक्तानुसार विषयान्तर्गत संदर्भित पत्र के तारतम्य में लेख है कि..."
   - "एतद्द्वारा सर्वसंबंधित को निर्देशित किया जाता है कि..."
   - "उक्त आदेश का कड़ाई से पालन सुनिश्चित किया जावे।"
   - "अनुपस्थिति की दशा में संपूर्ण दायित्व संबंधित शिक्षक/कर्मचारी का होगा तथा नियमानुसार अनुशासनात्मक कार्यवाही प्रस्तावित की जावेगी।"
   - "तत्काल प्रभावशील होगा।"
3. संदर्भ (Reference): यदि उपयोगकर्ता ने कोई विशेष पत्र क्रमांक या वर्ष दिया है तो उसका उल्लेख करें, अन्यथा मानक शासकीय संदर्भ यथा "कार्यालय विकासखंड शिक्षा अधिकारी / जिला शिक्षा अधिकारी का संदर्भित पत्र क्र..." का प्रारूप दें।
4. आदेश की सामग्री (content) पैराग्राफ या क्रमबद्ध बिंदुओं (1, 2, 3...) में सुस्पष्ट होनी चाहिए।
5. शिक्षकों का चयन एवं प्रतिनियुक्ति (Teacher Selection & School Deputation): संकुल के अंतर्गत उपलब्ध शिक्षकों को उनकी मूल शाला (schoolName) से चयनित करें। यदि परीक्षा ड्यूटी, मूल्यांकन, खेलकूद या अन्य किसी आवश्यकता हेतु दूसरे विद्यालय में ड्यूटी लगानी हो, तो 'includeDeputedSchool' को true रखें और शिक्षकों को आवश्यकतानुसार संकुल के विद्यालयों की सूची (schools) में से प्रतिनियुक्त शाला (deputedSchool) तथा दायित्व (assignedDutyRole: वीक्षक / केंद्राध्यक्ष / मूल्यांकनकर्ता आदि) आवंटित करें।`;

// API endpoint for AI drafting and chatting
app.post("/api/gemini/draft-order", async (req, res) => {
  try {
    const { 
      message, 
      conversationHistory = [], 
      teachers = [], 
      profile = {},
      schools = [] 
    } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "संदेश (message) अनिवार्य है।" });
      return;
    }

    const ai = getGeminiClient();

    // Context information to provide model
    const teachersContext = teachers.map((t: any) => ({
      id: t.id,
      name: t.name,
      designation: t.designation,
      schoolName: t.schoolName,
    }));

    const profileContext = {
      clusterName: profile.clusterName || "संकुल संसाधन केंद्र",
      headSchoolName: profile.headSchoolName || "शासकीय उच्चतर माध्यमिक विद्यालय संकुल केंद्र",
      district: profile.district || "जिला",
      state: profile.state || "छत्तीसगढ़",
      headName: profile.headName || "संकुल समन्वयक",
      headDesignation: profile.headDesignation || "संकुल समन्वयक / प्राचार्य",
    };

    const promptText = `उपयोगकर्ता का अनुरोध: "${message}"

[संकुल जानकारी]
- संकुल: ${profileContext.clusterName} (${profileContext.headSchoolName})
- जिला/राज्य: ${profileContext.district}, ${profileContext.state}
- संकुल प्रभारी: ${profileContext.headName} (${profileContext.headDesignation})

[संकुल में उपलब्ध शिक्षक सूची (आवश्यकतानुसार इनमें से चुनें या उपयोगकर्ता के निर्देशानुसार जोड़ें)]:
${JSON.stringify(teachersContext, null, 2)}

[संकुल के अधीनस्थ विद्यालय]:
${JSON.stringify(schools.map((s: any) => s.name || s), null, 2)}

[पूर्व बातचीत संदर्भ]:
${JSON.stringify(conversationHistory.slice(-4), null, 2)}

कृपया उपयोगकर्ता की आवश्यकतानुसार एक आदर्श शासकीय कार्यालयीन आदेश / पत्र तैयार करें और निम्नलिखित JSON स्कीमा में उत्तर प्रदान करें।`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: promptText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assistantReply: {
              type: Type.STRING,
              description: "उपयोगकर्ता के लिए संक्षेप में बातचीत उत्तर (हिंदी में), जिसमें बताया गया हो कि क्या आदेश तैयार किया गया है।",
            },
            orderDraft: {
              type: Type.OBJECT,
              description: "तैयार किया गया शुद्ध शासकीय कार्यालयीन आदेश",
              properties: {
                subject: {
                  type: Type.STRING,
                  description: "कार्यालयीन आदेश का विषय (जैसे: 'संकुल स्तरीय त्रैमासिक परीक्षा वीक्षक ड्यूटी बाबत')",
                },
                reference: {
                  type: Type.STRING,
                  description: "कार्यालयीन संदर्भ (जैसे: 'कार्यालय जिला शिक्षा अधिकारी का पत्र क्र./गोपनीय/2026/...')"
                },
                orderType: {
                  type: Type.STRING,
                  description: "आदेश का प्रकार: 'duty' | 'meeting' | 'training' | 'general' | 'notice'",
                },
                content: {
                  type: Type.STRING,
                  description: "आदेश का पूर्ण मुख्य विवरण एवं निर्देश (शुद्ध शासकीय हिंदी में)।",
                },
                includeDeputedSchool: {
                  type: Type.BOOLEAN,
                  description: "क्या यह परीक्षा या अन्य शाला प्रतिनियुक्ति आदेश है जिसमें प्रतिनियुक्त विद्यालय कॉलम होना चाहिए",
                },
                selectedTeachers: {
                  type: Type.ARRAY,
                  description: "आदेश में शामिल किए गए शिक्षक (उपलब्ध शिक्षकों में से मेल खाते हुए या नए)",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      designation: { type: Type.STRING },
                      schoolName: { type: Type.STRING },
                      deputedSchool: { type: Type.STRING, description: "यदि परीक्षा/प्रतिनियुक्ति है तो आवंटित शाला" },
                      assignedDutyRole: { type: Type.STRING, description: "आवंटित दायित्व (उदा. वीक्षक / केंद्राध्यक्ष)" },
                    },
                    required: ["name", "designation", "schoolName"],
                  },
                },
                meetingDate: { type: Type.STRING, description: "यदि बैठक/परीक्षा है तो दिनांक (उदा. 2026-03-25)" },
                meetingTime: { type: Type.STRING, description: "समय (उदा. प्रातः 10:30 बजे)" },
                meetingVenue: { type: Type.STRING, description: "स्थान (उदा. संकुल सभागार)" },
              },
              required: ["subject", "orderType", "content", "selectedTeachers"],
            },
          },
          required: ["assistantReply", "orderDraft"],
        },
      },
    });

    const responseText = response.text || "{}";
    const resultJson = JSON.parse(responseText);

    res.json(resultJson);
  } catch (error: any) {
    console.error("Gemini API Order Draft Error:", error);
    res.status(500).json({ 
      error: error?.message || "आदेश तैयार करते समय तकनीकी समस्या आई। कृपया पुनः प्रयास करें।" 
    });
  }
});

// Health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CRC Order Generator Server running on http://localhost:${PORT}`);
  });
}

startServer();
