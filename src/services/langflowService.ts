import axios from 'axios';

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000/api';

export async function runLangflowAgent(inputValue: string, context?: any): Promise<string> {
  try {
    const backendAgentUrl = `${BACKEND_BASE_URL}/agent/chat`;
    
    // Timeout ko 4s se badha kar 30s karein taaki LangFlow LLM complete answer generate kar sake
    const backendRes = await axios.post(
  backendAgentUrl,
  { message: inputValue },
  { timeout: 30000 }
);

    if (backendRes.data) {
      const reply =
        backendRes.data.reply ||
        backendRes.data.response ||
        backendRes.data.message;

      if (reply && typeof reply === 'string') {
        return reply;
      }
    }
    return "Agent se response receive nahi ho paya.";
  } catch (backendErr: any) {
    console.error('FastAPI Agent Error:', backendErr.response?.data || backendErr.message);
    return `⚠️ Agent Connection Error: ${
      backendErr.response?.data?.detail || 'Langflow server running nahi hai ya timeout ho gaya.'
    }`;
  }
}