from flask import Flask, request, jsonify
from flask_cors import CORS
import os, uuid, sqlite3, time, requests
from rapidfuzz import fuzz
from sentence_transformers import SentenceTransformer
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv
# from googletrans import Translator
# translator = Translator()
from deep_translator import GoogleTranslator

def translate_text(text, target_lang):
    """Translate text safely using Deep Translator (Google Translate backend)."""
    if not text or target_lang == "en":
        return text
    try:
        translated = GoogleTranslator(source='auto', target=target_lang).translate(text)
        return translated
    except Exception as e:
        print("⚠️ Translation Error:", e)
        return text







# ---------- Load Environment Variables ----------
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("❌ GEMINI_API_KEY not found. Please add it to your .env file.")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# ---------- CONFIG ----------
SIMILARITY_THRESHOLD = 70
DB_PATH = "chat_logs.db"

# ---------- SETUP ----------
app = Flask(__name__)
CORS(app)
sessions = {}
sbert = SentenceTransformer("all-MiniLM-L6-v2")

# ---------- Google Translate helper ----------
def translate_text(text, target_lang):
    """Translate text to target_lang using Google Translate (no API key needed)."""
    if not text or target_lang == "en":
        return text
    try:
        res = requests.get(
            "https://translate.googleapis.com/translate_a/single",
            params={
                "client": "gtx",
                "sl": "auto",
                "tl": target_lang,
                "dt": "t",
                "q": text,
            },
        )
        if res.status_code == 200:
            data = res.json()
            return data[0][0][0]
        else:
            print("⚠️ Google Translate API returned:", res.status_code, res.text)
            return text
    except Exception as e:
        print("⚠️ Translation Error:", e)
        return text


# ---------- DATABASE ----------
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS chats(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            user_message TEXT,
            bot_reply TEXT,
            intent TEXT,
            timestamp REAL
        )
    """)
    conn.commit()
    conn.close()

def log_chat(session_id, user, bot, intent_name):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "INSERT INTO chats(session_id, user_message, bot_reply, intent, timestamp) VALUES(?,?,?,?,?)",
        (session_id, user, bot, intent_name, time.time())
    )
    conn.commit()
    conn.close()

INTENTS = [
    {
        "name": "greeting",
        "phrases": ["hi", "hello", "hey", "good morning", "good evening"],
        "response": {
            "en": "Hello! 👋 I’m your FinSmart Assistant. How can I help you today?",
            "hi": "नमस्ते! 👋 मैं आपका FinSmart सहायक हूँ। मैं आज आपकी कैसे मदद कर सकता हूँ?",
            "kn": "ನಮಸ್ಕಾರ! 👋 ನಾನು ನಿಮ್ಮ FinSmart ಸಹಾಯಕ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
        },
        "chips": ["Check Balance", "Loan Status", "Open Account"]
    },
    {
        "name": "open_account",
        "phrases": ["open account", "create account", "new account"],
        "response": {
            "en": "Sure! Please choose the type of account you want to open 🏦.",
            "hi": "ज़रूर! कृपया वह खाता प्रकार चुनें जिसे आप खोलना चाहते हैं 🏦.",
            "kn": "ಖಂಡಿತ! ದಯವಿಟ್ಟು ನೀವು ತೆರೆಯಲು ಬಯಸುವ ಖಾತೆಯ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ 🏦.",
        },
        "chips": ["Savings Account", "Current Account", "Demat Account"]
    },
    {
        "name": "savings_account",
        "phrases": ["savings account", "open savings account"],
        "response": {
            "en": "To open a Savings Account, you’ll need your PAN, Aadhaar, and address proof. Minimum balance is ₹5,000. Would you like me to guide you through the process?",
            "hi": "सेविंग अकाउंट खोलने के लिए आपको पैन, आधार और पता प्रमाण की आवश्यकता होगी। न्यूनतम बैलेंस ₹5,000 है। क्या मैं आपको प्रक्रिया में मार्गदर्शन करूँ?",
            "kn": "ಉಳಿತಾಯ ಖಾತೆ ತೆರೆಯಲು, ನಿಮ್ಮ ಪ್ಯಾನ್, ಆಧಾರ್ ಮತ್ತು ವಿಳಾಸ ಪುರಾವೆ ಅಗತ್ಯವಿದೆ. ಕನಿಷ್ಠ ಬ್ಯಾಲೆನ್ಸ್ ₹5,000. ನಾನು ನಿಮಗೆ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿ ಮಾರ್ಗದರ್ಶನ ಮಾಡಬಹುದೇ?",
        },
        "chips": ["Yes, guide me", "Required Documents", "Talk to Agent"]
    },
    {
        "name": "current_account",
        "phrases": ["current account", "open current account"],
        "response": {
            "en": "A Current Account is perfect for businesses or professionals. You'll need your GST certificate, business proof, and PAN card. Want to view available business plans?",
            "hi": "करंट अकाउंट व्यवसायों या प्रोफेशनल्स के लिए उपयुक्त है। आपको जीएसटी सर्टिफिकेट, बिजनेस प्रूफ और पैन कार्ड की आवश्यकता होगी। क्या आप उपलब्ध योजनाएं देखना चाहेंगे?",
            "kn": "ಪ್ರಸ್ತುತ ಖಾತೆ ವ್ಯವಹಾರಗಳು ಅಥವಾ ವೃತ್ತಿಪರರಿಗೆ ಸೂಕ್ತವಾಗಿದೆ. ನಿಮಗೆ GST ಪ್ರಮಾಣಪತ್ರ, ವ್ಯವಹಾರ ಪುರಾವೆ ಮತ್ತು ಪ್ಯಾನ್ ಕಾರ್ಡ್ ಅಗತ್ಯವಿದೆ. ಲಭ್ಯವಿರುವ ಯೋಜನೆಗಳನ್ನು ನೋಡಲು ಬಯಸುವಿರಾ?",
        },
        "chips": ["Show Plans", "Required Documents", "Talk to Agent"]
    },
    {
        "name": "demat_account",
        "phrases": ["demat account", "open demat account"],
        "response": {
            "en": "To open a Demat Account, keep PAN, Aadhaar, and bank details ready. Once verified, you can start trading immediately!",
            "hi": "डिमैट अकाउंट खोलने के लिए पैन, आधार और बैंक विवरण तैयार रखें। सत्यापन के बाद आप तुरंत ट्रेडिंग शुरू कर सकते हैं!",
            "kn": "ಡಿಮ್ಯಾಟ್ ಖಾತೆ ತೆರೆಯಲು, ಪ್ಯಾನ್, ಆಧಾರ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ವಿವರಗಳನ್ನು ಸಿದ್ಧವಾಗಿಡಿ. ಪರಿಶೀಲನೆಯ ನಂತರ, ನೀವು ತಕ್ಷಣ ವಹಿವಾಟು ಪ್ರಾರಂಭಿಸಬಹುದು!",
        },
        "chips": ["Start Now", "Learn More", "Talk to Agent"]
    },
    {
        "name": "check_balance",
        "phrases": ["balance", "check my account balance", "show my balance", "balance inquiry", "account balance"],
        "response": {
            "en": "Sure — please authenticate to view your balance. (Mock) Your current balance is ₹25,480.20.",
            "hi": "ठीक है — कृपया सत्यापन करें ताकि मैं आपका बैलेंस दिखा सकूँ। (उदाहरण) आपका वर्तमान बैलेंस ₹25,480.20 है।",
            "kn": "ಖಂಡಿತ — ದಯವಿಟ್ಟು ದೃಢೀಕರಿಸಿ ನಿಮ್ಮ ಬ್ಯಾಲೆನ್ಸ್ ನೋಡಲು. (ಉದಾಹರಣೆ) ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಬ್ಯಾಲೆನ್ಸ್ ₹25,480.20.",
        },
        "chips": ["Mini statement", "Recent transactions", "Talk to Agent"]
    },
    {
        "name": "loan_status",
        "phrases": ["loan status", "check my loan", "loan application status", "loan application"],
        "response": {
            "en": "Your loan application is under review. Would you like to check eligibility or required documents?",
            "hi": "आपका ऋण आवेदन समीक्षा के अधीन है। क्या आप पात्रता या आवश्यक दस्तावेज़ देखना चाहेंगे?",
            "kn": "ನಿಮ್ಮ ಸಾಲದ ಅರ್ಜಿ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ. ನೀವು ಅರ್ಹತೆ ಅಥವಾ ಅಗತ್ಯ ದಾಖಲೆಗಳನ್ನು ನೋಡಲು ಬಯಸುವಿರಾ?",
        },
        "chips": ["Check eligibility", "Documents required", "Talk to Agent"]
    },
    {
        "name": "talk_to_agent",
        "phrases": ["talk to agent", "contact human", "connect to agent", "talk to human", "speak to agent"],
        "response": {
            "en": "Certainly — connecting you to a human agent now. Please wait a moment while we place you in the queue.",
            "hi": "निश्चित रूप से — हम आपको एक मानव एजेंट से जोड़ रहे हैं। कृपया कुछ क्षण प्रतीक्षा करें।",
            "kn": "ಖಚಿತವಾಗಿ — ನಾವು ನಿಮಗೆ ಮಾನವ ಏಜೆಂಟ್ ಅನ್ನು ಸಂಪರ್ಕಿಸುತ್ತಿದ್ದೇವೆ. ದಯವಿಟ್ಟು ಕ್ಷಣಕಾಲ ಕಾಯಿರಿ.",
        },
        "chips": ["Connect to Human Agent"]
    },
    {
        "name": "mini_statement",
        "phrases": ["mini statement", "show mini statement", "account mini statement"],
        "response": {
            "en": "Here’s your last 5 transactions:\n1️⃣ ₹500 - Grocery Store\n2️⃣ ₹1200 - Online Shopping\n3️⃣ ₹2000 - Electricity Bill\n4️⃣ ₹700 - Movie Tickets\n5️⃣ ₹1500 - Salary Credit.",
            "hi": "यह आपके पिछले 5 लेन-देन हैं:\n1️⃣ ₹500 - किराना दुकान\n2️⃣ ₹1200 - ऑनलाइन शॉपिंग\n3️⃣ ₹2000 - बिजली बिल\n4️⃣ ₹700 - मूवी टिकट\n5️⃣ ₹1500 - वेतन जमा।",
            "kn": "ಇವು ನಿಮ್ಮ ಕೊನೆಯ 5 ವಹಿವಾಟುಗಳು:\n1️⃣ ₹500 - ಗ್ರಾಸರಿ ಸ್ಟೋರ್\n2️⃣ ₹1200 - ಆನ್‌ಲೈನ್ ಶಾಪಿಂಗ್\n3️⃣ ₹2000 - ವಿದ್ಯುತ್ ಬಿಲ್\n4️⃣ ₹700 - ಚಿತ್ರ ಟಿಕೆಟ್‌ಗಳು\n5️⃣ ₹1500 - ವೇತನ ಕ್ರೆಡಿಟ್.",
        },
        "chips": ["Recent transactions", "Talk to Agent"]
    },
    {
        "name": "recent_transactions",
        "phrases": ["recent transactions", "last transactions", "transaction history", "recent activity"],
        "response": {
            "en": "Your last 3 transactions are:\n1️⃣ ₹2500 - Amazon Purchase\n2️⃣ ₹800 - Fuel Payment\n3️⃣ ₹12000 - Rent Transfer.",
            "hi": "आपके पिछले 3 लेन-देन:\n1️⃣ ₹2500 - अमेज़न खरीद\n2️⃣ ₹800 - ईंधन भुगतान\n3️⃣ ₹12000 - किराया स्थानांतरण।",
            "kn": "ನಿಮ್ಮ ಕೊನೆಯ 3 ವಹಿವಾಟುಗಳು:\n1️⃣ ₹2500 - ಅಮೆಜಾನ್ ಖರೀದಿ\n2️⃣ ₹800 - ಇಂಧನ ಪಾವತಿ\n3️⃣ ₹12000 - ಬಾಡಿಗೆ ವರ್ಗಾವಣೆ.",
        },
        "chips": ["Mini statement", "Talk to Agent"]
    },
    {
        "name": "yes_guide_me",
        "phrases": ["yes, guide me", "guide me", "help me", "show me process"],
        "response": {
            "en": "Sure! To open your account, please visit our nearest branch or complete the online application form on the FinSmart website.",
            "hi": "ज़रूर! खाता खोलने के लिए हमारी निकटतम शाखा पर जाएँ या ऑनलाइन आवेदन फ़ॉर्म भरें।",
            "kn": "ಖಂಡಿತ! ನಿಮ್ಮ ಖಾತೆ ತೆರೆಯಲು ಹತ್ತಿರದ ಶಾಖೆಗೆ ಭೇಟಿ ನೀಡಿ ಅಥವಾ FinSmart ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಭರ್ತಿ ಮಾಡಿ.",
        },
        "chips": ["Talk to Agent", "Required Documents"]
    },
    {
        "name": "fallback",
        "phrases": [],
        "response": {
            "en": "Let me think 🤖... I'll fetch the best answer for you!",
            "hi": "सोचने दो 🤖... मैं आपके लिए सबसे अच्छा उत्तर ढूंढता हूँ!",
            "kn": "ನಾನು ಯೋಚಿಸುತ್ತೇನೆ 🤖... ನಿಮಗಾಗಿ ಉತ್ತಮ ಉತ್ತರವನ್ನು ತರುತ್ತೇನೆ!",
        },
        "chips": ["Talk to Agent"]
    }
]


# ---------- INTENT MATCHING ----------
intent_phrases = [" ||| ".join(it["phrases"]) for it in INTENTS]
intent_map = [it for it in INTENTS]
intent_embeddings = sbert.encode(intent_phrases)

def match_intent(user_text):
    user_text_lower = user_text.lower().strip()
    for it in INTENTS:
        for phrase in it["phrases"]:
            if user_text_lower == phrase.lower():
                return it
    for it in INTENTS:
        for phrase in it["phrases"]:
            if phrase.lower() in user_text_lower:
                return it
    best, best_score = None, 0
    for it in INTENTS:
        for phrase in it["phrases"]:
            score = fuzz.token_set_ratio(user_text_lower, phrase.lower())
            if score > best_score:
                best, best_score = it, score
    if best_score >= SIMILARITY_THRESHOLD:
        return best
    u_emb = sbert.encode([user_text])[0]
    sims = np.dot(intent_embeddings, u_emb) / (
        np.linalg.norm(intent_embeddings, axis=1) * (np.linalg.norm(u_emb) + 1e-8)
    )
    idx = int(np.argmax(sims))
    if sims[idx] > 0.55:
        return intent_map[idx]
    return next(it for it in INTENTS if it["name"] == "fallback")

# ---------- ROUTES ----------
@app.route("/")
def home():
    return "🤖 FinSmart AI Assistant is Live! Use POST /chat to talk."

# @app.route("/chat", methods=["POST"])
# def chat():
#     data = request.json or {}
#     user_text = data.get("message", "").strip()
#     session_id = data.get("session_id") or str(uuid.uuid4())
#     language = (data.get("language") or "en").strip().lower()   # ✅ FIXED

#     if not user_text:
#         return jsonify({"error": "Empty message"}), 400

#     if session_id not in sessions:
#         sessions[session_id] = {"history": [], "last_intent": None}

#     intent = match_intent(user_text)
#     intent_name = intent["name"]

#     resp_data = intent["response"]
#     if isinstance(resp_data, dict):
#         bot_reply = resp_data.get(language, resp_data.get("en"))
#     else:
#         bot_reply = resp_data

#     chips = intent.get("chips", [])

#     # Fallback translation
#     try:
#         if language != "en":
#             bot_reply = translate_text(bot_reply, language)
#             translated_chips = [translate_text(c, language) for c in chips]
#         else:
#             translated_chips = chips
#     except Exception as e:
#         print("Translation error:", e)
#         translated_chips = chips

#     sessions[session_id]["history"].append({"user": user_text, "bot": bot_reply})
#     sessions[session_id]["last_intent"] = intent_name
#     log_chat(session_id, user_text, bot_reply, intent_name)

#     return jsonify({
#         "session_id": session_id,
#         "reply": bot_reply,
#         "intent": intent_name,
#         "chips": translated_chips,
#     })





@app.route("/chat", methods=["POST"])
def chat():
    data = request.json or {}
    user_text = data.get("message", "").strip()
    session_id = data.get("session_id") or str(uuid.uuid4())
    language = data.get("language", "en")  # from frontend

    if not user_text:
        return jsonify({"error": "Empty message"}), 400

    if session_id not in sessions:
        sessions[session_id] = {"history": [], "last_intent": None}

    # ✅ 1️⃣ Translate user text to English before intent matching
    user_text_en = user_text
    if language != "en":
        try:
            user_text_en = translate_text(user_text, "en")
            print(f"🔤 Translated user_text → {user_text_en}")
        except Exception as e:
            print("⚠️ Failed to translate user message to English:", e)

    # ✅ 2️⃣ Detect intent (using English text)
    intent = match_intent(user_text_en)
    intent_name = intent["name"]

    # ✅ 3️⃣ Get response (support dict language)
    resp_data = intent["response"]
    if isinstance(resp_data, dict):
        bot_reply = resp_data.get(language, resp_data.get("en"))
    else:
        bot_reply = resp_data

    chips = intent.get("chips", [])

    # ✅ 4️⃣ Special case: talk_to_agent
    if intent_name == "talk_to_agent":
        try:
            bot_reply = translate_text(bot_reply, language)
            translated_chips = [translate_text(chip, language) for chip in chips]
        except Exception:
            translated_chips = chips

        sessions[session_id]["history"].append({"user": user_text, "bot": bot_reply})
        sessions[session_id]["last_intent"] = intent_name
        log_chat(session_id, user_text, bot_reply, intent_name)

        return jsonify({
            "session_id": session_id,
            "reply": bot_reply,
            "intent": intent_name,
            "chips": translated_chips
        })

    # ✅ 5️⃣ Fallback → use Gemini
    if intent_name == "fallback":
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            chat_history = "\n".join([
                f"User: {m['user']}\nBot: {m['bot']}"
                for m in sessions[session_id]["history"][-4:]
            ])
            prompt = f"""
            You are FinSmart AI Assistant, a professional banking chatbot.
            Answer only in {language}.
            Keep answers concise and clear. If the question is unrelated to banking, say 'I'm not sure'.
            Chat history:
            {chat_history}

            User: {user_text_en}
            Assistant:
            """
            response = model.generate_content(prompt)
            ai_reply = response.text.strip() if hasattr(response, "text") else ""
            if ai_reply and "i'm not sure" not in ai_reply.lower():
                bot_reply = ai_reply
            else:
                bot_reply = (
                    "🤖 Sorry, I couldn't find the right answer. "
                    "Would you like to connect with a human agent for personalized help?"
                )
                chips = ["Connect to Human Agent"]
                intent_name = "human_handoff"
        except Exception as e:
            print("Gemini API Error:", e)
            bot_reply = "⚠️ Sorry, something went wrong. Please try again later."
            chips = []


    # ✅ 6️⃣ Translate bot reply and chips (for all other intents)
    translated_chips = []
    try:
        if language != "en":
            # translate bot reply
            bot_reply = translate_text(bot_reply, language)

            # translate chips properly
            for c in chips:
                try:
                    t = translate_text(c, language)
                    translated_chips.append({"label": t, "value": c})
                except Exception as e:
                    print(f"⚠️ Chip translation failed for {c}: {e}")
                    translated_chips.append({"label": c, "value": c})
        else:
            # English — no translation
            translated_chips = [{"label": c, "value": c} for c in chips]

    except Exception as e:
        print("⚠️ Translation failed:", e)
        translated_chips = [{"label": c, "value": c} for c in chips]

    # ✅ 7️⃣ Save chat history
    sessions[session_id]["history"].append({"user": user_text, "bot": bot_reply})
    sessions[session_id]["last_intent"] = intent_name
    log_chat(session_id, user_text, bot_reply, intent_name)

    # ✅ 8️⃣ Return final structured response
    return jsonify({
        "session_id": session_id,
        "reply": bot_reply,
        "intent": intent_name,
        "chips": translated_chips,  # 👈 now has label + value
    })


@app.route("/translate", methods=["POST"])
def translate_text_route():
    from flask import request, jsonify
    import requests

    data = request.json
    text = data.get("text", "")
    lang = data.get("language", "en")

    if not text or lang == "en":
        return jsonify({"translated": text})

    try:
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": "auto",
            "tl": lang,
            "dt": "t",
            "q": text,
        }

        response = requests.get(url, params=params)
        result = response.json()
        translated_text = result[0][0][0]
        print(f"🌐 Translated ({lang}): {text} → {translated_text}")
        return jsonify({"translated": translated_text})
    except Exception as e:
        print("⚠️ Translation error:", e)
        return jsonify({"translated": text})






# ---------- START SERVER ----------
# if __name__ == "__main__":
#     init_db()
#     CORS(app, resources={r"/*": {"origins": "*"}})  # ✅ Fix CORS issue
#     app.run(host="0.0.0.0", port=5000, debug=True)
# if __name__ == "__main__":
#     import os
#     port = int(os.environ.get("PORT", 5000))  # ✅ use Render-assigned port
#     init_db()
#     CORS(app, resources={r"/*": {"origins": "*"}})
#     app.run(host="0.0.0.0", port=port, debug=False)

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))  # ✅ use Render-assigned port
    init_db()
    CORS(app, resources={r"/*": {"origins": ["https://cognitive-chatbot.vercel.app"]}})
    app.run(host="0.0.0.0", port=port, debug=False)

