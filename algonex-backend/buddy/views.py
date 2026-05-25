"""
Buddy Chat View — LangChain ReAct agent with Gemini + platform tools.

POST /api/v1/buddy/chat/
Body:
  {
    "messages": [
      {"role": "user", "content": "What beginner courses do you have?"},
      {"role": "assistant", "content": "..."},  // optional history
      ...
    ]
  }

Response:
  {
    "message": "Here are our beginner courses...",
    "cards": [
      {"type": "course", "id": 1, "name": "Python for Beginners", ...},
      ...
    ]
  }
"""

import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langgraph.prebuilt import create_react_agent

from .llm import get_llm
from .tools import BUDDY_TOOLS


SYSTEM_PROMPT = """You are Buddy, a friendly and helpful AI assistant for Algonex Academy — a premier online learning platform.

Your primary role is to help students by:
1. Answering questions about courses, events, careers, internships, and programs.
2. Using your available tools to fetch LIVE, real-time data from the platform.
3. Giving honest, accurate, and enthusiastic recommendations.

Guidelines:
- ALWAYS use your tools to fetch live data before answering questions about specific courses, events, or jobs.
- Be warm, encouraging, and student-friendly in your tone.
- When listing multiple items, be concise — the UI will render beautiful cards automatically.
- If asked about pricing, always mention any discounts available.
- If a student seems unsure, ask clarifying questions to guide them better.
- Never make up data. If a tool returns no results, say so honestly.
- Keep responses focused and concise. The frontend renders the card data visually.

The platform offers: Courses, Events (workshops, webinars, hackathons), Job Listings, Internship Programs, and Fellowships."""


class BuddyChatRateThrottle(AnonRateThrottle):
    rate = "20/minute"


class BuddyChatView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [BuddyChatRateThrottle, UserRateThrottle]

    def post(self, request):
        messages_input = request.data.get("messages", [])
        if not messages_input:
            return Response(
                {"error": "messages list is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Build LangChain message history ---
        lc_messages = [SystemMessage(content=SYSTEM_PROMPT)]
        for msg in messages_input:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                lc_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))

        if not any(isinstance(m, HumanMessage) for m in lc_messages):
            return Response(
                {"error": "At least one user message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            llm = get_llm()
            agent = create_react_agent(llm, BUDDY_TOOLS)
            result = agent.invoke({"messages": lc_messages})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"AI service error: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # --- Extract final text response ---
        final_message = result["messages"][-1]
        content = final_message.content
        
        if isinstance(content, list):
            # Extract text from content blocks (e.g. [{'type': 'text', 'text': '...'}] )
            reply_text = "".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content])
        elif isinstance(content, str):
            reply_text = content
        else:
            reply_text = str(content)

        # --- Extract card data from any tool results in the agent trace ---
        cards = []
        for msg in result["messages"]:
            if isinstance(msg, ToolMessage):
                try:
                    tool_data = json.loads(msg.content)
                    # Flatten: courses, events, jobs, programs are lists under their key
                    for key in ("courses", "events", "jobs", "programs"):
                        if key in tool_data:
                            cards.extend(tool_data[key])
                    # FAQs: include as a special card block
                    if "faqs" in tool_data:
                        cards.append({
                            "type": "faq_block",
                            "course": tool_data.get("course", ""),
                            "faqs": tool_data["faqs"],
                        })
                except (json.JSONDecodeError, TypeError):
                    pass

        return Response({
            "message": reply_text,
            "cards": cards,
        })
