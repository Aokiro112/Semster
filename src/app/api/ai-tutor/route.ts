import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Check Ollama server availability
    let ollamaOnline = false;
    let availableModels: string[] = [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch("http://localhost:11434/api/tags", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        ollamaOnline = true;
        availableModels = (data.models || []).map((m: any) => m.name);
      }
    } catch {
      ollamaOnline = false;
    }

    // 2. Fetch past conversations from DB
    let conversations = await prisma.aIConversation.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 15,
    });

    // If no conversations yet, create default conversations matching the screenshot
    if (conversations.length === 0) {
      const defaultConv = await prisma.aIConversation.create({
        data: {
          title: "Derivatives Explanation",
          model: "llama3.1",
          messages: {
            create: [
              {
                role: "user",
                content: "Explain chain rule of differentiation with an example.",
              },
              {
                role: "assistant",
                content: `### Chain Rule
If $y = f(g(x))$, then:
$$\\frac{dy}{dx} = f'(g(x)) \\cdot g'(x)$$

It means that if a function is a composition of two functions, you multiply the derivative of the outer function with the derivative of the inner function.

### Example
Let $y = \\sin(x^2)$.
Here, $f(u) = \\sin u$ and $g(x) = u = x^2$.

1. Differentiate outer function with respect to inner:
$$\\frac{df}{du} = \\cos u = \\cos(x^2)$$

2. Differentiate inner function with respect to $x$:
$$\\frac{du}{dx} = 2x$$

3. Multiply together:
$$\\frac{dy}{dx} = \\cos(x^2) \\cdot 2x = 2x \\cos(x^2)$$`,
              },
            ],
          },
        },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      // Also create dummy chat titles for sidebar history
      await prisma.aIConversation.create({
        data: { title: "Matrix Questions", model: "llama3.1" },
      });
      await prisma.aIConversation.create({
        data: { title: "Physics Numericals", model: "llama3.1" },
      });
      await prisma.aIConversation.create({
        data: { title: "Lab Viva Questions", model: "llama3.1" },
      });

      conversations = await prisma.aIConversation.findMany({
        include: { messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { updatedAt: "desc" },
      });
    }

    return NextResponse.json({
      ollamaOnline,
      availableModels: availableModels.length > 0 ? availableModels : ["llama3.1:latest", "qwen2.5:latest"],
      conversations,
    });
  } catch (error) {
    console.error("AI Tutor GET error:", error);
    return NextResponse.json({ error: "Failed to initialize AI Tutor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversationId, userMessage, model = "llama3.1:latest" } = body;

    if (!userMessage) {
      return NextResponse.json({ error: "Prompt cannot be empty" }, { status: 400 });
    }

    // Find or create conversation
    let activeConvId = conversationId;
    if (!activeConvId) {
      const title = userMessage.slice(0, 30) + (userMessage.length > 30 ? "..." : "");
      const newConv = await prisma.aIConversation.create({
        data: { title, model },
      });
      activeConvId = newConv.id;
    }

    // Save user message
    await prisma.aIMessage.create({
      data: {
        conversationId: activeConvId,
        role: "user",
        content: userMessage,
      },
    });

    let assistantResponse = "";

    // Check Ollama connection
    let connectedToOllama = false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const ollamaRes = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: `You are SemesterOS Academic AI Tutor. Assist the engineering student with their academic query. Format all mathematical equations in KaTeX LaTeX ($...$ inline or $$...$$ block). Be concise, clear, and rigorous.\n\nStudent Query: ${userMessage}`,
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (ollamaRes.ok) {
        const ollamaData = await ollamaRes.json();
        assistantResponse = ollamaData.response;
        connectedToOllama = true;
      }
    } catch {
      connectedToOllama = false;
    }

    // Fallback if Ollama is not active
    if (!connectedToOllama || !assistantResponse) {
      const q = userMessage.toLowerCase();
      if (q.includes("matrix") || q.includes("eigen")) {
        assistantResponse = `### Eigenvalues & Eigenvectors
For a square matrix $A \\in \\mathbb{R}^{n \\times n}$, a non-zero vector $v$ and scalar $\\lambda$ are an eigenvector and eigenvalue if:
$$A v = \\lambda v$$

To solve for eigenvalues:
$$\\det(A - \\lambda I) = 0$$

### Cayley-Hamilton Theorem
Every square matrix satisfies its own characteristic equation:
$$p(A) = 0$$
This is useful for quickly computing inverse matrices $A^{-1}$ and powers $A^k$.`;
      } else if (q.includes("viva") || q.includes("newton")) {
        assistantResponse = `### Viva Voce Q&A: Newton's Rings Experiment
**Q1: Why is the center of Newton's rings dark in reflected light?**
*Answer:* At the point of contact, the air film thickness $t \\approx 0$. When light reflects from the denser flat glass plate, it undergoes a phase shift of $\\pi$ (equivalent to a path difference of $\\frac{\\lambda}{2}$). The optical path difference becomes:
$$\\Delta = 2\\mu t \\cos r + \\frac{\\lambda}{2} = \\frac{\\lambda}{2}$$
Since the path difference is $\\frac{\\lambda}{2}$, destructive interference occurs and the central spot is dark.

**Q2: What is the diameter formula for dark rings?**
$$D_n^2 = 4n \\lambda R$$`;
      } else {
        assistantResponse = `### Concept Breakdown
Here is an academic explanation for: **${userMessage}**

In engineering analysis, we decompose complex systems into fundamental governing equations:
$$\\mathcal{L}\\{f(t)\\} = F(s) = \\int_{0}^{\\infty} e^{-st} f(t) dt$$

1. **First Principles**: Identify state variables, boundary conditions, and material properties.
2. **Mathematical Formulation**: Set up differential or algebraic equations.
3. **Verification**: Check dimensional consistency and limiting cases.

*(Note: Local Ollama server is currently offline or model is downloading; SemesterOS simulated academic tutor is active)*`;
      }
    }

    // Save assistant message
    const savedAssistantMsg = await prisma.aIMessage.create({
      data: {
        conversationId: activeConvId,
        role: "assistant",
        content: assistantResponse,
      },
    });

    return NextResponse.json({
      conversationId: activeConvId,
      message: savedAssistantMsg,
      connectedToOllama,
    });
  } catch (error) {
    console.error("AI Tutor POST error:", error);
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
  }
}
