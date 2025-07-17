import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { 
      prompt, 
      mode = 'clarify', // 'clarify' or 'rewrite'
      model = 'gpt-4.1'
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key is not configured.' }, { status: 500 });
    }

    let instructions = '';
    let input = prompt;

    if (mode === 'clarify') {
      // Instructions for asking clarifying questions
      instructions = `You are talking to a user who is asking for a research task to be conducted. Your job is to gather more information from the user to successfully complete the task.

GUIDELINES:
- Be concise while gathering all necessary information
- Make sure to gather all the information needed to carry out the research task in a concise, well-structured manner.
- Use bullet points or numbered lists if appropriate for clarity.
- Don't ask for unnecessary information, or information that the user has already provided.

IMPORTANT: Do NOT conduct any research yourself, just gather information that will be given to a researcher to conduct the research task.`;
    } else if (mode === 'rewrite') {
      // Instructions for rewriting the prompt
      instructions = `You will be given a research task by a user. Your job is to produce a set of instructions for a researcher that will complete the task. Do NOT complete the task yourself, just provide instructions on how to complete it.

GUIDELINES:
1. **Maximize Specificity and Detail**
- Include all known user preferences and explicitly list key attributes or dimensions to consider.
- It is of utmost importance that all details from the user are included in the instructions.

2. **Fill in Unstated But Necessary Dimensions as Open-Ended**
- If certain attributes are essential for a meaningful output but the user has not provided them, explicitly state that they are open-ended or default to no specific constraint.

3. **Avoid Unwarranted Assumptions**
- If the user has not provided a particular detail, do not invent one.
- Instead, state the lack of specification and guide the researcher to treat it as flexible or accept all possible options.

4. **Use the First Person**
- Phrase the request from the perspective of the user.

5. **Tables**
- If you determine that including a table will help illustrate, organize, or enhance the information in the research output, you must explicitly request that the researcher provide them.

6. **Headers and Formatting**
- You should include the expected output format in the prompt.
- If the user is asking for content that would be best returned in a structured format (e.g. a report, plan, etc.), ask the researcher to format as a report with the appropriate headers and formatting that ensures clarity and structure.

7. **Language**
- If the user input is in a language other than English, tell the researcher to respond in this language, unless the user query explicitly asks for the response in a different language.

8. **Sources**
- If specific sources should be prioritized, specify them in the prompt.
- For product and travel research, prefer linking directly to official or primary websites rather than aggregator sites or SEO-heavy blogs.
- For academic or scientific queries, prefer linking directly to the original paper or official journal publication rather than survey papers or secondary summaries.
- If the query is in a specific language, prioritize sources published in that language.`;
    }

    const requestBody = {
      model,
      input,
      instructions,
      max_output_tokens: 2000
    };

    console.log('Prompt enhancement request:', {
      mode,
      model,
      promptLength: prompt.length
    });

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI prompt enhancement API error:', error);
      return NextResponse.json({ 
        error: `OpenAI prompt enhancement API error: ${response.status} ${response.statusText}`,
        details: error
      }, { status: 500 });
    }

    const data = await response.json();
    
    const outputText = data.output_text || '';
    
    // Log usage information for debugging
    if (data.usage) {
      console.log('Prompt enhancement API usage:', {
        input_tokens: data.usage.input_tokens,
        output_tokens: data.usage.output_tokens,
        total_tokens: data.usage.total_tokens
      });
    }

    return NextResponse.json({
      output_text: outputText,
      usage: data.usage,
      mode,
      enhanced_prompt: outputText
    });

  } catch (error) {
    console.error('Prompt enhancement API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message || 'Internal server error.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'An unexpected error occurred during prompt enhancement.' 
    }, { status: 500 });
  }
} 