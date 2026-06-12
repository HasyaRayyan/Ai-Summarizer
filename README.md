# ✨ AI Text Summarizer

A web application that automatically summarizes long texts or articles into concise, clear, and professional summaries.

## 🤖 AI (Artificial Intelligence) Integration

This application is powered by the **Google Gemini API**, utilizing the `gemini-1.5-flash` model. This model was chosen for its:
- **High Speed:** Extremely fast at processing and returning text summaries.
- **Contextual Understanding:** Capable of understanding the context of long texts and accurately extracting key points.
- **Neat Response Formatting:** Programmed (*prompted*) to return highly readable and well-structured results.

### How the AI Works in This App:
1. The user inputs a long text on the *frontend* (React/Next.js).
2. The text is securely sent to the *backend* (Next.js API Route).
3. The *backend* attaches a specific instruction *prompt* and sends it to the Google Gemini servers.
4. Gemini processes the text, generates a summary, and returns it to the user's screen.

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **AI SDK:** [`@google/generative-ai`](https://www.npmjs.com/package/@google/generative-ai)

## 🛠️ Getting Started (Local Setup)

Follow these steps to run this project on your local machine:

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd <your-folder-name>
