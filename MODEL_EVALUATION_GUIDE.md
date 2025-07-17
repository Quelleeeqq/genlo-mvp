# 🤖 Model Evaluation Guide - Testing & Improving AI Outputs

This guide covers the comprehensive model evaluation system implemented in your Quelle AI application for testing and improving AI outputs.

## 📋 Overview

The evaluation system allows you to systematically test your AI models against predefined criteria to ensure they meet quality standards and provide consistent, helpful responses. This is essential for:

- **Quality Assurance**: Ensuring responses meet your standards
- **Performance Monitoring**: Tracking model performance over time
- **Prompt Optimization**: Iterating on prompts to improve results
- **Model Comparison**: Testing different models and configurations
- **Regression Detection**: Catching performance degradations

## 🏗️ Architecture

### Core Components

1. **`lib/ai/evaluation/eval-service.ts`** - Main evaluation service
2. **`app/api/evaluation/run/route.ts`** - API endpoints for running evaluations
3. **`app/test-evaluation/page.tsx`** - Web interface for running tests
4. **Predefined Test Datasets** - Ready-to-use test scenarios
5. **Evaluation Criteria** - Configurable quality metrics

### Evaluation Types

#### 1. Response Quality
- **Purpose**: Ensures responses are helpful, accurate, and well-structured
- **Metrics**: Length requirements, concrete information, actionable advice
- **Config**: Min/max length, require concrete info, require actionable advice

#### 2. Tone Consistency
- **Purpose**: Maintains expected tone (helpful, professional, friendly)
- **Metrics**: Forbidden words, required tone elements
- **Config**: Expected tone, forbidden words, required elements

#### 3. Response Length
- **Purpose**: Ensures responses are appropriately sized
- **Metrics**: Word count, target length optimization
- **Config**: Min/max words, target word count

#### 4. Content Accuracy
- **Purpose**: Verifies specific content requirements are met
- **Metrics**: Required keywords, forbidden keywords, exact matches
- **Config**: Keywords lists, exact match requirements

## 🚀 Getting Started

### 1. Using the Web Interface

Navigate to `/test-evaluation` to use the web interface:

```bash
# Start your development server
npm run dev

# Visit the evaluation page
http://localhost:3000/test-evaluation
```

### 2. Running via API

```bash
# Run a basic evaluation
curl -X POST http://localhost:3000/api/evaluation/run \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Evaluation",
    "description": "Testing model performance",
    "usePredefinedDataset": true,
    "predefinedDatasetName": "GENERAL_CHAT",
    "model": "claude-3-5-sonnet-20241022"
  }'
```

### 3. Using Predefined Datasets

The system includes three predefined test datasets:

#### General Chat Dataset
```typescript
GENERAL_CHAT: [
  {
    id: 'general_1',
    input: {
      prompt: 'What is the best way to become an AI actor?',
      systemPrompt: 'You are Quelle AI, a helpful assistant for AI actors.'
    },
    expectedOutput: {
      content: 'Should provide practical advice about becoming an AI actor',
      criteria: ['Response Quality', 'Tone Consistency', 'Response Length']
    }
  },
  {
    id: 'general_2',
    input: {
      prompt: 'How much can I earn as an AI actor?',
      systemPrompt: 'You are Quelle AI, a helpful assistant for AI actors.'
    },
    expectedOutput: {
      content: 'Should provide realistic earning expectations',
      criteria: ['Response Quality', 'Tone Consistency', 'Response Length']
    }
  }
]
```

#### Creative Projects Dataset
```typescript
CREATIVE_PROJECTS: [
  {
    id: 'creative_1',
    input: {
      prompt: 'I want to create a sci-fi character for AI acting. Can you help me develop the concept?',
      systemPrompt: 'You are Quelle AI, a creative partner for AI actors.'
    },
    expectedOutput: {
      content: 'Should provide creative guidance and specific suggestions',
      criteria: ['Response Quality', 'Tone Consistency', 'Response Length']
    }
  }
]
```

#### Technical Support Dataset
```typescript
TECHNICAL_SUPPORT: [
  {
    id: 'technical_1',
    input: {
      prompt: 'My AI avatar is not generating properly. What should I check?',
      systemPrompt: 'You are Quelle AI, a technical support specialist.'
    },
    expectedOutput: {
      content: 'Should provide specific troubleshooting steps',
      criteria: ['Response Quality', 'Tone Consistency', 'Response Length']
    }
  }
]
```

## 🔧 Custom Evaluations

### 1. Creating Custom Test Items

```typescript
const customTestItems = [
  {
    id: 'custom_1',
    input: {
      prompt: 'Your custom prompt here',
      systemPrompt: 'Your custom system prompt'
    },
    expectedOutput: {
      content: 'Description of expected output',
      criteria: ['Response Quality', 'Tone Consistency'],
      metadata: { category: 'custom', difficulty: 'medium' }
    }
  }
];
```

### 2. Custom Evaluation Criteria

```typescript
const customCriteria = [
  {
    name: 'Custom Quality Check',
    type: 'content_quality',
    description: 'Custom quality evaluation',
    config: {
      minLength: 100,
      maxLength: 1000,
      requireConcreteInfo: true,
      requireActionableAdvice: true
    }
  },
  {
    name: 'Brand Voice Check',
    type: 'tone_check',
    description: 'Ensures brand voice consistency',
    config: {
      expectedTone: 'professional',
      forbiddenWords: ['sorry', 'unfortunately'],
      requiredElements: ['enthusiasm', 'encouragement']
    }
  }
];
```

### 3. Running Custom Evaluations

```typescript
// Via API
const response = await fetch('/api/evaluation/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Custom Evaluation',
    description: 'Testing custom criteria',
    testItems: customTestItems,
    criteria: customCriteria,
    model: 'claude-3-5-sonnet-20241022'
  })
});

// Via Service
const evalService = EvalService.getInstance();
const result = await evalService.runEvaluation(
  'Custom Evaluation',
  'Testing custom criteria',
  customTestItems,
  customCriteria,
  chatService,
  'claude-3-5-sonnet-20241022'
);
```

## 📊 Understanding Results

### Evaluation Run Structure

```typescript
interface EvalRun {
  id: string;
  name: string;
  description: string;
  testItems: EvalTestItem[];
  criteria: EvalCriteria[];
  results: EvalResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageScore: number;
    averageProcessingTime: number;
    modelPerformance: {
      [model: string]: {
        totalTests: number;
        passedTests: number;
        averageScore: number;
        averageProcessingTime: number;
      };
    };
  };
  createdAt: Date;
  completedAt?: Date;
}
```

### Individual Test Results

```typescript
interface EvalResult {
  testItemId: string;
  actualOutput: string;
  criteriaResults: {
    [criteriaName: string]: {
      passed: boolean;
      score: number;
      details: string;
    };
  };
  processingTime: number;
  model: string;
  provider: string;
  metadata: APIRequestMetadata;
}
```

### Sample Results

```json
{
  "evalRun": {
    "id": "eval_1703123456789_abc123def",
    "name": "General Chat Evaluation",
    "summary": {
      "totalTests": 2,
      "passedTests": 2,
      "failedTests": 0,
      "averageScore": 0.95,
      "averageProcessingTime": 1250
    }
  },
  "results": [
    {
      "testItemId": "general_1",
      "actualOutput": "Becoming an AI actor is an exciting opportunity...",
      "criteriaResults": {
        "Response Quality": {
          "passed": true,
          "score": 0.95,
          "details": "Content quality criteria met"
        },
        "Tone Consistency": {
          "passed": true,
          "score": 1.0,
          "details": "Tone criteria met"
        }
      },
      "processingTime": 1200
    }
  ]
}
```

## 📈 Performance Monitoring

### 1. Success Rate Tracking

Monitor your model's performance over time:

```typescript
// Track success rates
const successRate = (passedTests / totalTests) * 100;

// Alert on performance drops
if (successRate < 80) {
  console.warn(`Performance alert: Success rate dropped to ${successRate}%`);
}
```

### 2. Processing Time Monitoring

Track response times to identify performance issues:

```typescript
// Monitor average processing time
const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;

// Alert on slow responses
if (avgProcessingTime > 5000) {
  console.warn(`Performance alert: Average processing time is ${avgProcessingTime}ms`);
}
```

### 3. Model Comparison

Compare different models or configurations:

```typescript
// Run evaluations with different models
const models = ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'];
const results = {};

for (const model of models) {
  const result = await evalService.runEvaluation(
    `Model Comparison - ${model}`,
    'Comparing model performance',
    testItems,
    criteria,
    chatService,
    model
  );
  results[model] = result.summary;
}
```

## 🔍 Advanced Features

### 1. Regression Detection

Set up automated regression testing:

```typescript
// Compare current run with baseline
const baseline = await evalService.getEvalRun('baseline_run_id');
const current = await evalService.runEvaluation(/* ... */);

const regression = baseline.summary.averageScore - current.summary.averageScore;
if (regression > 0.1) {
  console.error(`Regression detected: Score dropped by ${(regression * 100).toFixed(1)}%`);
}
```

### 2. Bulk Model Testing

Test multiple models simultaneously:

```typescript
const models = [
  'claude-3-5-sonnet-20241022',
  'claude-3-haiku-20240307',
  'claude-3-opus-20240229'
];

const results = await Promise.all(
  models.map(model => 
    evalService.runEvaluation(
      `Bulk Test - ${model}`,
      'Bulk model comparison',
      testItems,
      criteria,
      chatService,
      model
    )
  )
);
```

### 3. Custom Graders

Create custom evaluation logic:

```typescript
// Custom grader for specific use case
const customGrader = {
  name: 'Brand Safety Check',
  type: 'custom',
  description: 'Ensures responses are brand-safe',
  config: {
    forbiddenTopics: ['politics', 'religion', 'controversy'],
    requiredTone: 'professional'
  }
};

// Implement custom evaluation logic
private evaluateCustomGrader(criterion: EvalCriteria, actualOutput: string): EvaluationResult {
  // Custom evaluation logic here
  const hasForbiddenTopics = criterion.config.forbiddenTopics.some(topic => 
    actualOutput.toLowerCase().includes(topic)
  );
  
  return {
    passed: !hasForbiddenTopics,
    score: hasForbiddenTopics ? 0.3 : 1.0,
    details: hasForbiddenTopics ? 'Contains forbidden topics' : 'Brand-safe content'
  };
}
```

## 🛠️ Production Deployment

### 1. Automated Testing

Set up automated evaluation runs:

```typescript
// Scheduled evaluation runs
const schedule = require('node-cron');

// Run evaluations daily at 2 AM
schedule.schedule('0 2 * * *', async () => {
  console.log('Running daily evaluation...');
  
  const evalService = EvalService.getInstance();
  const result = await evalService.runEvaluation(
    `Daily Evaluation - ${new Date().toISOString().split('T')[0]}`,
    'Daily automated evaluation',
    EvalService.TEST_DATASETS.GENERAL_CHAT,
    [EvalService.CRITERIA.RESPONSE_QUALITY, EvalService.CRITERIA.TONE_CONSISTENCY],
    chatService
  );
  
  // Send results to monitoring system
  await sendToMonitoring(result);
});
```

### 2. Integration with Monitoring

```typescript
// Send evaluation results to monitoring systems
const sendToMonitoring = async (evalRun: EvalRun) => {
  // Send to DataDog, New Relic, etc.
  const metrics = {
    'eval.success_rate': (evalRun.summary.passedTests / evalRun.summary.totalTests) * 100,
    'eval.average_score': evalRun.summary.averageScore * 100,
    'eval.average_processing_time': evalRun.summary.averageProcessingTime,
    'eval.total_tests': evalRun.summary.totalTests
  };
  
  await monitoringService.sendMetrics(metrics);
};
```

### 3. Alerting

```typescript
// Set up alerts for performance issues
const checkPerformance = (evalRun: EvalRun) => {
  const successRate = (evalRun.summary.passedTests / evalRun.summary.totalTests) * 100;
  
  if (successRate < 80) {
    alertService.send('EVAL_SUCCESS_RATE_LOW', {
      successRate,
      evalRunId: evalRun.id,
      timestamp: new Date().toISOString()
    });
  }
  
  if (evalRun.summary.averageProcessingTime > 5000) {
    alertService.send('EVAL_PROCESSING_TIME_HIGH', {
      avgTime: evalRun.summary.averageProcessingTime,
      evalRunId: evalRun.id,
      timestamp: new Date().toISOString()
    });
  }
};
```

## 📚 Best Practices

### 1. Test Data Management

- **Diversify test cases**: Include various scenarios and difficulty levels
- **Regular updates**: Keep test data current with your use cases
- **Edge cases**: Include boundary conditions and error scenarios
- **Real-world examples**: Use actual user queries when possible

### 2. Evaluation Criteria

- **Start simple**: Begin with basic quality checks
- **Iterate gradually**: Add complexity as you understand your needs
- **Balance metrics**: Don't optimize for one metric at the expense of others
- **Context matters**: Adjust criteria based on use case

### 3. Performance Monitoring

- **Set baselines**: Establish performance benchmarks
- **Monitor trends**: Track performance over time
- **Alert appropriately**: Set up alerts for significant changes
- **Document changes**: Keep records of model updates and their impact

### 4. Continuous Improvement

- **Regular evaluations**: Run tests frequently
- **A/B testing**: Compare different prompts and models
- **User feedback**: Incorporate user satisfaction metrics
- **Iterative refinement**: Continuously improve based on results

## 🔄 Future Enhancements

- **Human-in-the-loop evaluation**: Incorporate human feedback
- **Multi-modal evaluation**: Support for image, audio, and video
- **Real-time evaluation**: Evaluate responses in production
- **Advanced metrics**: Sentiment analysis, toxicity detection
- **Integration with LLM providers**: Direct integration with OpenAI, Anthropic APIs

This evaluation system provides comprehensive testing capabilities to ensure your AI models consistently deliver high-quality, helpful responses that meet your standards and user expectations. 