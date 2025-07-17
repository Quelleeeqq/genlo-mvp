// Function Handlers for OpenAI Function Calling
// Provides data fetching and action-taking capabilities

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Weather API function
export async function getWeather(location: string, units: 'celsius' | 'fahrenheit' = 'celsius'): Promise<string> {
  try {
    // Use a free weather API (Open-Meteo)
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m&timezone=auto`);
    
    if (!response.ok) {
      return `Unable to fetch weather data for ${location}. Please try again later.`;
    }
    
    const data = await response.json();
    const temp = data.current.temperature_2m;
    const weatherCode = data.current.weather_code;
    
    // Convert weather codes to descriptions
    const weatherDescriptions: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    
    const weatherDesc = weatherDescriptions[weatherCode] || 'Unknown weather';
    const tempF = (temp * 9/5) + 32;
    
    if (units === 'fahrenheit') {
      return `Current weather in ${location}: ${tempF.toFixed(1)}°F, ${weatherDesc}`;
    } else {
      return `Current weather in ${location}: ${temp.toFixed(1)}°C, ${weatherDesc}`;
    }
  } catch (error) {
    console.error('Weather API error:', error);
    return `Sorry, I couldn't fetch the weather for ${location}. Please try again later.`;
  }
}

// Email sending function (mock implementation)
export async function sendEmail(to: string, subject: string, body: string): Promise<string> {
  try {
    // In a real implementation, you would integrate with an email service
    // like SendGrid, AWS SES, or your own SMTP server
    
    console.log('Email would be sent:', { to, subject, body });
    
    // For now, return a success message
    return `Email sent successfully to ${to} with subject: "${subject}"`;
  } catch (error) {
    console.error('Email sending error:', error);
    return `Failed to send email to ${to}. Please try again later.`;
  }
}

// Knowledge base search function
export async function searchKnowledgeBase(query: string, options: {
  num_results: number;
  domain_filter: string | null;
  sort_by: 'relevance' | 'date' | 'popularity' | 'alphabetical' | null;
}): Promise<string> {
  try {
    // Search in Supabase database
    let supabaseQuery = supabase
      .from('knowledge_base')
      .select('title, content, created_at, tags')
      .textSearch('content', query)
      .limit(options.num_results);
    
    if (options.domain_filter) {
      supabaseQuery = supabaseQuery.eq('domain', options.domain_filter);
    }
    
    // Apply sorting
    if (options.sort_by === 'date') {
      supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
    } else if (options.sort_by === 'popularity') {
      supabaseQuery = supabaseQuery.order('view_count', { ascending: false });
    } else if (options.sort_by === 'alphabetical') {
      supabaseQuery = supabaseQuery.order('title', { ascending: true });
    }
    // Default is relevance (handled by textSearch)
    
    const { data, error } = await supabaseQuery;
    
    if (error) {
      console.error('Knowledge base search error:', error);
      return `Sorry, I couldn't search the knowledge base. Please try again later.`;
    }
    
    if (!data || data.length === 0) {
      return `No relevant information found for "${query}" in the knowledge base.`;
    }
    
    // Format results
    const results = data.map((item, index) => 
      `${index + 1}. **${item.title}**\n   ${item.content.substring(0, 200)}...\n   Tags: ${item.tags?.join(', ') || 'None'}`
    ).join('\n\n');
    
    return `Found ${data.length} relevant results for "${query}":\n\n${results}`;
  } catch (error) {
    console.error('Knowledge base search error:', error);
    return `Sorry, I couldn't search the knowledge base. Please try again later.`;
  }
}

// File operations function
export async function fileOperations(operation: 'read' | 'write' | 'delete' | 'list', 
  path: string, 
  content?: string): Promise<string> {
  try {
    switch (operation) {
      case 'read':
        // In a real implementation, you would read from your file system or cloud storage
        return `File content for ${path} would be read here.`;
      
      case 'write':
        if (!content) {
          return 'Content is required for write operations.';
        }
        // In a real implementation, you would write to your file system or cloud storage
        return `Content written to ${path} successfully.`;
      
      case 'delete':
        // In a real implementation, you would delete from your file system or cloud storage
        return `File ${path} deleted successfully.`;
      
      case 'list':
        // In a real implementation, you would list files from your file system or cloud storage
        return `Files in ${path} would be listed here.`;
      
      default:
        return `Unknown operation: ${operation}`;
    }
  } catch (error) {
    console.error('File operation error:', error);
    return `Failed to perform ${operation} operation on ${path}. Please try again later.`;
  }
}

// Database query function
export async function queryDatabase(table: string, query: string, limit: number = 10): Promise<string> {
  try {
    // This is a simplified database query function
    // In a real implementation, you would have proper SQL parsing and validation
    
    let supabaseQuery = supabase
      .from(table)
      .select('*')
      .limit(limit);
    
    // Simple query parsing (in production, use proper SQL parser)
    if (query.toLowerCase().includes('where')) {
      // Extract WHERE clause (simplified)
      const whereMatch = query.match(/where\s+(.+)/i);
      if (whereMatch) {
        // This is a very basic implementation - in production, use proper SQL parsing
        console.log('WHERE clause detected:', whereMatch[1]);
      }
    }
    
    const { data, error } = await supabaseQuery;
    
    if (error) {
      console.error('Database query error:', error);
      return `Database query failed: ${error.message}`;
    }
    
    if (!data || data.length === 0) {
      return `No data found in table ${table} for the given query.`;
    }
    
    return `Found ${data.length} records in ${table}:\n\n${JSON.stringify(data, null, 2)}`;
  } catch (error) {
    console.error('Database query error:', error);
    return `Failed to query database. Please try again later.`;
  }
}

// News search function
export async function searchNews(query: string, category: string | null = null, limit: number = 5): Promise<string> {
  try {
    // In a real implementation, you would use a news API like NewsAPI, GNews, etc.
    // For now, return mock data
    
    const mockNews = [
      {
        title: 'AI Breakthrough in Natural Language Processing',
        description: 'Researchers develop new model that significantly improves text understanding.',
        source: 'Tech News',
        publishedAt: '2024-01-15'
      },
      {
        title: 'Sustainable Energy Solutions Gain Momentum',
        description: 'Global adoption of renewable energy sources reaches new milestones.',
        source: 'Environmental Weekly',
        publishedAt: '2024-01-14'
      }
    ];
    
    const filteredNews = category 
      ? mockNews.filter(news => news.title.toLowerCase().includes(category.toLowerCase()))
      : mockNews;
    
    if (filteredNews.length === 0) {
      return `No news found for "${query}"${category ? ` in category "${category}"` : ''}.`;
    }
    
    const results = filteredNews.slice(0, limit).map((news, index) => 
      `${index + 1}. **${news.title}**\n   ${news.description}\n   Source: ${news.source} | Date: ${news.publishedAt}`
    ).join('\n\n');
    
    return `Latest news for "${query}":\n\n${results}`;
  } catch (error) {
    console.error('News search error:', error);
    return `Sorry, I couldn't fetch news for "${query}". Please try again later.`;
  }
}

// Calculator function
export function calculate(expression: string): string {
  try {
    // Basic mathematical expression evaluation
    // In production, use a proper math expression parser for security
    
    // Remove any potentially dangerous characters
    const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    // Use Function constructor for evaluation (be careful with this in production)
    const result = Function(`'use strict'; return (${sanitizedExpression})`)();
    
    if (isNaN(result) || !isFinite(result)) {
      return 'Invalid mathematical expression.';
    }
    
    return `Result: ${result}`;
  } catch (error) {
    console.error('Calculation error:', error);
    return 'Unable to calculate the expression. Please check your input.';
  }
}

// Main function router
export async function executeFunction(name: string, args: any): Promise<string> {
  try {
    switch (name) {
      case 'get_weather':
        return await getWeather(args.location, args.units);
      
      case 'send_email':
        return await sendEmail(args.to, args.subject, args.body);
      
      case 'search_knowledge_base':
        return await searchKnowledgeBase(args.query, args.options);
      
      case 'file_operations':
        return await fileOperations(args.operation, args.path, args.content);
      
      case 'query_database':
        return await queryDatabase(args.table, args.query, args.limit);
      
      case 'search_news':
        return await searchNews(args.query, args.category, args.limit);
      
      case 'calculate':
        return calculate(args.expression);
      
      case 'web_search':
        const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_KEY;
        const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX;
        const query = encodeURIComponent(args.query);
        const num = args.numResults || 3;
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=${num}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) return "No results found.";
        return data.items.map((item: any) => `${item.title}\n${item.link}\n${item.snippet}\n`).join('\n');
      
      default:
        return `Unknown function: ${name}`;
    }
  } catch (error) {
    console.error(`Function execution error for ${name}:`, error);
    return `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Function definitions for OpenAI
export const functionDefinitions = [
  {
    type: "function",
    name: "get_weather",
    description: "Get current weather information for a specific location.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City and country e.g. Paris, France or New York, USA"
        },
        units: {
          type: ["string", "null"],
          enum: ["celsius", "fahrenheit"],
          description: "Temperature units. Defaults to celsius if not specified."
        }
      },
      required: ["location", "units"],
      additionalProperties: false
    },
    metadata: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of the reasoning process"
        },
        sources: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Any sources or references used"
        },
        functions_used: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of functions that were called during processing"
        }
      },
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "send_email",
    description: "Send an email to a specified recipient with subject and message.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "The recipient's email address"
        },
        subject: {
          type: "string",
          description: "The subject line of the email"
        },
        body: {
          type: "string",
          description: "The body content of the email message"
        }
      },
      required: ["to", "subject", "body"],
      additionalProperties: false
    },
    metadata: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of the reasoning process"
        },
        sources: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Any sources or references used"
        },
        functions_used: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of functions that were called during processing"
        }
      },
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "search_knowledge_base",
    description: "Search the knowledge base for relevant information on a topic.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query or question to look up"
        },
        options: {
          type: "object",
          properties: {
            num_results: {
              type: "number",
              description: "Number of results to return (1-10)",
              minimum: 1,
              maximum: 10
            },
            domain_filter: {
              type: ["string", "null"],
              description: "Optional domain to filter results (e.g. 'tech', 'finance', 'health')"
            },
            sort_by: {
              type: ["string", "null"],
              enum: ["relevance", "date", "popularity", "alphabetical"],
              description: "How to sort the results"
            }
          },
          required: ["num_results", "domain_filter", "sort_by"],
          additionalProperties: false
        }
      },
      required: ["query", "options"],
      additionalProperties: false
    },
    metadata: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of the reasoning process"
        },
        sources: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Any sources or references used"
        },
        functions_used: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of functions that were called during processing"
        }
      },
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "file_operations",
    description: "Perform file operations like read, write, delete, or list files.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["read", "write", "delete", "list"],
          description: "The file operation to perform"
        },
        path: {
          type: "string",
          description: "The file path or directory path"
        },
        content: {
          type: ["string", "null"],
          description: "Content to write (required for write operations)"
        }
      },
      required: ["operation", "path"],
      additionalProperties: false
    },
    metadata: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of the reasoning process"
        },
        sources: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Any sources or references used"
        },
        functions_used: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of functions that were called during processing"
        }
      },
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "query_database",
    description: "Query the database for information from specified tables.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        table: {
          type: "string",
          description: "The database table to query"
        },
        query: {
          type: "string",
          description: "The query to execute (simplified SQL-like syntax)"
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
          minimum: 1,
          maximum: 100
        }
      },
      required: ["table", "query"],
      additionalProperties: false
    },
    metadata: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of the reasoning process"
        },
        sources: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Any sources or references used"
        },
        functions_used: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of functions that were called during processing"
        }
      },
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "search_news",
    description: "Search for recent news articles on a specific topic.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The news search query or topic"
        },
        category: {
          type: ["string", "null"],
          description: "Optional news category filter (e.g. 'technology', 'business', 'sports')"
        },
        limit: {
          type: "number",
          description: "Number of news articles to return",
          minimum: 1,
          maximum: 10
        }
      },
      required: ["query"],
      additionalProperties: false
    },
    metadata: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of the reasoning process"
        },
        sources: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Any sources or references used"
        },
        functions_used: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of functions that were called during processing"
        }
      },
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "calculate",
    description: "Perform mathematical calculations and solve equations.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "The mathematical expression to evaluate (e.g. '2 + 2', 'sqrt(16)', '5 * (3 + 2)')"
        }
      },
      required: ["expression"],
      additionalProperties: false
    },
    metadata: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of the reasoning process"
        },
        sources: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Any sources or references used"
        },
        functions_used: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of functions that were called during processing"
        }
      },
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "web_search",
    description: "Search the web for up-to-date information using Google Custom Search.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
        numResults: { type: "number", description: "Number of results to return", default: 3 }
      },
      required: ["query"]
    },
    metadata: {
      type: "object",
      properties: {
        reasoning: {
          type: "string",
          description: "Brief explanation of the reasoning process"
        },
        sources: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Any sources or references used"
        },
        functions_used: {
          type: "array",
          items: {
            type: "string"
          },
          description: "List of functions that were called during processing"
        }
      },
      additionalProperties: false
    }
  }
]; 