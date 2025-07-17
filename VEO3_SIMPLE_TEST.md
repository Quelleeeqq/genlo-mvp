# Veo 3 Simple Test

This is a simplified implementation of Replicate's Veo 3 video generation that matches the code snippet you shared.

## Files Created

1. **`app/api/veo3/simple-test/route.ts`** - Simple API endpoint for Veo 3 generation
2. **`app/veo3-simple-test/page.tsx`** - Test page with UI for testing the functionality

## How to Use

### 1. Set up Environment Variables

Add your Replicate API token to your `.env.local` file:

```bash
# Option 1: Use REPLICATE_API_TOKEN (recommended)
REPLICATE_API_TOKEN=your_replicate_api_token_here

# Option 2: Use VEO3_API_KEY (alternative)
VEO3_API_KEY=your_replicate_api_token_here
```

### 2. Test the API

Visit `/veo3-simple-test` in your browser to use the test interface, or make a POST request to `/api/veo3/simple-test`:

```bash
curl -X POST http://localhost:3000/api/veo3/simple-test \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A breaking news ident, followed by a TV news presenter excitedly telling us: We interrupt this programme to bring you some breaking news... Veo 3 is now live on Replicate. Then she shouts: Let'\''s go!\n\nThe TV presenter is an epic and cool punk with pink and green hair and a t-shirt that says \"Veo 3 on Replicate\"",
    "seed": 12345,
    "enhance_prompt": true,
    "negative_prompt": "blurry, low quality, distorted"
  }'
```

#### API Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | ✅ | Text prompt for video generation |
| `seed` | number | ❌ | Random seed for reproducible results |
| `enhance_prompt` | boolean | ❌ | Use Gemini to enhance prompts (default: true) |
| `negative_prompt` | string | ❌ | Description of what to discourage in the video |

#### Response Format

The API returns a JSON response with the following structure:

```json
{
  "success": true,
  "prompt": "Your video prompt",
  "videoUrl": "https://replicate.delivery/pbxt/...",
  "videoUri": "https://replicate.delivery/pbxt/...",
  "message": "Video generated successfully with Replicate Veo 3!",
  "outputFormat": "uri",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Output Format**: The model returns a URI string (HTTP URL) pointing to the generated video file.

### 3. Code Comparison

**Your Original Code:**
```javascript
import { writeFile } from "fs/promises";
import Replicate from "replicate";
const replicate = new Replicate();

const input = {
    prompt: "A breaking news ident, followed by a TV news presenter excitedly telling us: We interrupt this programme to bring you some breaking news... Veo 3 is now live on Replicate. Then she shouts: Let's go!\n\nThe TV presenter is an epic and cool punk with pink and green hair and a t-shirt that says \"Veo 3 on Replicate\""
};

const output = await replicate.run("google/veo-3", { input });
await writeFile("output.mp4", output);
```

**Our Implementation:**
```typescript
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

const input = {
  prompt: body.prompt,
  seed: body.seed,
  enhance_prompt: body.enhance_prompt ?? true,
  negative_prompt: body.negative_prompt
};

const output = await replicate.run("google/veo-3", { input });

// Validate output format (should be a URI string)
if (typeof output !== 'string') {
  throw new Error(`Invalid output format from Replicate. Expected URI string, got: ${typeof output}`);
}

const videoUrl = output as string;
if (!videoUrl.startsWith('http')) {
  throw new Error(`Invalid URI format from Replicate. Expected HTTP URL, got: ${videoUrl}`);
}

// Returns video URI string as specified by the model
```

## Key Differences

1. **Environment Setup**: Uses environment variables for API authentication
2. **Web API**: Returns JSON response with video URI instead of writing to file
3. **Output Format**: Returns URI string format as specified by Replicate Veo 3 model
4. **Error Handling**: Includes comprehensive error handling and output validation
5. **TypeScript**: Fully typed for better development experience
6. **Web Interface**: Includes a test page with video player and download functionality

## Integration with Existing System

This simple test is separate from your existing comprehensive Veo 3 implementation in `app/api/veo3/generate/route.ts`. The existing system includes:

- Subscription validation
- Multiple provider support
- AI-powered prompt optimization
- Scene parsing and merging
- Advanced configuration options

The simple test provides a minimal implementation for quick testing and development.

## Next Steps

1. Get your Replicate API token from [replicate.com](https://replicate.com)
2. Add it to your `.env.local` file
3. Start your development server: `npm run dev`
4. Visit `/veo3-simple-test` to test the functionality 