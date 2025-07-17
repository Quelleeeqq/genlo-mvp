import { ChatMessage } from '../types/chat';
import { APIResponseHeaderManager, APIRequestMetadata } from '@/lib/utils/api-response-headers';

export interface EvalCriteria {
  name: string;
  type: 'string_check' | 'content_quality' | 'response_length' | 'tone_check' | 'custom';
  description: string;
  config: any;
}

export interface EvalTestItem {
  id: string;
  input: {
    prompt: string;
    systemPrompt?: string;
    context?: any;
  };
  expectedOutput: {
    content: string;
    criteria: string[];
    metadata?: any;
  };
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface EvalResult {
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

export interface EvalRun {
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

export class EvalService {
  private static instance: EvalService;
  private evalRuns: Map<string, EvalRun> = new Map();

  static getInstance(): EvalService {
    if (!EvalService.instance) {
      EvalService.instance = new EvalService();
    }
    return EvalService.instance;
  }

  // Predefined evaluation criteria
  static readonly CRITERIA = {
    RESPONSE_QUALITY: {
      name: 'Response Quality',
      type: 'content_quality' as const,
      description: 'Evaluates if the response is helpful, accurate, and well-structured',
      config: {
        minLength: 50,
        maxLength: 2000,
        requireConcreteInfo: true,
        requireActionableAdvice: false
      }
    },
    TONE_CONSISTENCY: {
      name: 'Tone Consistency',
      type: 'tone_check' as const,
      description: 'Checks if the response maintains the expected tone (helpful, professional, friendly)',
      config: {
        expectedTone: 'helpful',
        forbiddenWords: ['sorry', 'unfortunately', 'cannot'],
        requiredElements: ['enthusiasm', 'encouragement']
      }
    },
    RESPONSE_LENGTH: {
      name: 'Response Length',
      type: 'response_length' as const,
      description: 'Ensures responses are appropriately sized',
      config: {
        minWords: 20,
        maxWords: 500,
        targetWords: 100
      }
    },
    CONTENT_ACCURACY: {
      name: 'Content Accuracy',
      type: 'string_check' as const,
      description: 'Verifies specific content requirements are met',
      config: {
        requiredKeywords: [],
        forbiddenKeywords: [],
        exactMatches: []
      }
    }
  };

  // Predefined test datasets
  static readonly TEST_DATASETS = {
    GENERAL_CHAT: [
      {
        id: 'general_1',
        input: {
          prompt: 'What is the best way to become an AI actor?',
          systemPrompt: 'You are GenLo, a helpful assistant for AI actors.'
        },
        expectedOutput: {
          content: 'Should provide practical advice about becoming an AI actor',
          criteria: ['Response Quality', 'Tone Consistency', 'Response Length'],
          metadata: { category: 'career_advice', difficulty: 'medium' }
        }
      },
      {
        id: 'general_2',
        input: {
          prompt: 'How much can I earn as an AI actor?',
          systemPrompt: 'You are GenLo, a helpful assistant for AI actors.'
        },
        expectedOutput: {
          content: 'Should provide realistic earning expectations',
          criteria: ['Response Quality', 'Tone Consistency', 'Response Length'],
          metadata: { category: 'earnings', difficulty: 'easy' }
        }
      }
    ],
    CREATIVE_PROJECTS: [
      {
        id: 'creative_1',
        input: {
          prompt: 'I want to create a sci-fi character for AI acting. Can you help me develop the concept?',
          systemPrompt: 'You are GenLo, a creative partner for AI actors.'
        },
        expectedOutput: {
          content: 'Should provide creative guidance and specific suggestions',
          criteria: ['Response Quality', 'Tone Consistency', 'Response Length'],
          metadata: { category: 'creative_development', difficulty: 'hard' }
        }
      }
    ],
    TECHNICAL_SUPPORT: [
      {
        id: 'technical_1',
        input: {
          prompt: 'My AI avatar is not generating properly. What should I check?',
          systemPrompt: 'You are GenLo, a technical support specialist.'
        },
        expectedOutput: {
          content: 'Should provide specific troubleshooting steps',
          criteria: ['Response Quality', 'Tone Consistency', 'Response Length'],
          metadata: { category: 'technical_support', difficulty: 'medium' }
        }
      }
    ]
  };

  async runEvaluation(
    name: string,
    description: string,
    testItems: EvalTestItem[],
    criteria: EvalCriteria[],
    chatService: any,
    model: string = 'claude-3-5-sonnet-20241022'
  ): Promise<EvalRun> {
    const runId = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const run: EvalRun = {
      id: runId,
      name,
      description,
      testItems,
      criteria,
      results: [],
      summary: {
        totalTests: testItems.length,
        passedTests: 0,
        failedTests: 0,
        averageScore: 0,
        averageProcessingTime: 0,
        modelPerformance: {}
      },
      createdAt: new Date()
    };

    console.log(`Starting evaluation run: ${name} with ${testItems.length} test items`);

    // Run tests sequentially
    for (const testItem of testItems) {
      try {
        const result = await this.runSingleTest(testItem, criteria, chatService, model);
        run.results.push(result);
        
        // Update summary
        const passedCriteria = Object.values(result.criteriaResults).filter(r => r.passed).length;
        const totalCriteria = Object.keys(result.criteriaResults).length;
        const score = totalCriteria > 0 ? passedCriteria / totalCriteria : 0;
        
        if (score >= 0.8) {
          run.summary.passedTests++;
        } else {
          run.summary.failedTests++;
        }
        
        console.log(`Test ${testItem.id}: ${score >= 0.8 ? 'PASSED' : 'FAILED'} (${(score * 100).toFixed(1)}%)`);
      } catch (error) {
        console.error(`Error running test ${testItem.id}:`, error);
        // Add failed result
        const failedResult: EvalResult = {
          testItemId: testItem.id,
          actualOutput: 'ERROR: Failed to generate response',
          criteriaResults: {},
          processingTime: 0,
          model,
          provider: 'anthropic',
          metadata: APIResponseHeaderManager.createRequestMetadata(model, 'anthropic')
        };
        run.results.push(failedResult);
        run.summary.failedTests++;
      }
    }

    // Calculate final summary
    this.calculateRunSummary(run);
    run.completedAt = new Date();

    // Store the run
    this.evalRuns.set(runId, run);

    console.log(`Evaluation run completed: ${run.summary.passedTests}/${run.summary.totalTests} tests passed`);
    return run;
  }

  private async runSingleTest(
    testItem: EvalTestItem,
    criteria: EvalCriteria[],
    chatService: any,
    model: string
  ): Promise<EvalResult> {
    const metadata = APIResponseHeaderManager.createRequestMetadata(model, 'anthropic');
    const startTime = Date.now();

    // Generate response using chat service
    const response = await chatService.chat({
      messages: [{ role: 'user', content: testItem.input.prompt }],
      systemPrompt: testItem.input.systemPrompt,
      model
    });

    const processingTime = Date.now() - startTime;
    const actualOutput = response.message.content;

    // Evaluate against criteria
    const criteriaResults: EvalResult['criteriaResults'] = {};
    
    for (const criterion of criteria) {
      const result = await this.evaluateCriterion(criterion, actualOutput, testItem);
      criteriaResults[criterion.name] = result;
    }

    return {
      testItemId: testItem.id,
      actualOutput,
      criteriaResults,
      processingTime,
      model,
      provider: 'anthropic',
      metadata
    };
  }

  private async evaluateCriterion(
    criterion: EvalCriteria,
    actualOutput: string,
    testItem: EvalTestItem
  ): Promise<{ passed: boolean; score: number; details: string }> {
    switch (criterion.type) {
      case 'string_check':
        return this.evaluateStringCheck(criterion, actualOutput, testItem);
      case 'content_quality':
        return this.evaluateContentQuality(criterion, actualOutput, testItem);
      case 'response_length':
        return this.evaluateResponseLength(criterion, actualOutput, testItem);
      case 'tone_check':
        return this.evaluateToneCheck(criterion, actualOutput, testItem);
      default:
        return { passed: false, score: 0, details: 'Unknown criterion type' };
    }
  }

  private evaluateStringCheck(
    criterion: EvalCriteria,
    actualOutput: string,
    testItem: EvalTestItem
  ): { passed: boolean; score: number; details: string } {
    const config = criterion.config;
    let score = 1.0;
    let details = '';

    // Check required keywords
    if (config.requiredKeywords && config.requiredKeywords.length > 0) {
      const foundKeywords = config.requiredKeywords.filter((keyword: string) => 
        actualOutput.toLowerCase().includes(keyword.toLowerCase())
      );
      const keywordScore = foundKeywords.length / config.requiredKeywords.length;
      score *= keywordScore;
      details += `Found ${foundKeywords.length}/${config.requiredKeywords.length} required keywords. `;
    }

    // Check forbidden keywords
    if (config.forbiddenKeywords && config.forbiddenKeywords.length > 0) {
      const foundForbidden = config.forbiddenKeywords.filter((keyword: string) => 
        actualOutput.toLowerCase().includes(keyword.toLowerCase())
      );
      if (foundForbidden.length > 0) {
        score *= 0.5;
        details += `Found forbidden keywords: ${foundForbidden.join(', ')}. `;
      }
    }

    // Check exact matches
    if (config.exactMatches && config.exactMatches.length > 0) {
      const hasExactMatch = config.exactMatches.some((match: string) => 
        actualOutput.toLowerCase().includes(match.toLowerCase())
      );
      if (!hasExactMatch) {
        score *= 0.3;
        details += 'No exact matches found. ';
      }
    }

    return {
      passed: score >= 0.8,
      score,
      details: details || 'All string check criteria met'
    };
  }

  private evaluateContentQuality(
    criterion: EvalCriteria,
    actualOutput: string,
    testItem: EvalTestItem
  ): { passed: boolean; score: number; details: string } {
    const config = criterion.config;
    let score = 1.0;
    let details = '';

    // Check length requirements
    if (config.minLength && actualOutput.length < config.minLength) {
      score *= 0.7;
      details += `Response too short (${actualOutput.length} chars, min ${config.minLength}). `;
    }
    if (config.maxLength && actualOutput.length > config.maxLength) {
      score *= 0.8;
      details += `Response too long (${actualOutput.length} chars, max ${config.maxLength}). `;
    }

    // Check for concrete information
    if (config.requireConcreteInfo) {
      const hasConcreteInfo = /[0-9]/.test(actualOutput) || 
        /\b(specific|concrete|example|step|process)\b/i.test(actualOutput);
      if (!hasConcreteInfo) {
        score *= 0.6;
        details += 'Missing concrete information. ';
      }
    }

    // Check for actionable advice
    if (config.requireActionableAdvice) {
      const hasActionableAdvice = /\b(can|should|will|try|start|begin|use|apply)\b/i.test(actualOutput);
      if (!hasActionableAdvice) {
        score *= 0.7;
        details += 'Missing actionable advice. ';
      }
    }

    return {
      passed: score >= 0.8,
      score,
      details: details || 'Content quality criteria met'
    };
  }

  private evaluateResponseLength(
    criterion: EvalCriteria,
    actualOutput: string,
    testItem: EvalTestItem
  ): { passed: boolean; score: number; details: string } {
    const config = criterion.config;
    const wordCount = actualOutput.split(/\s+/).length;
    let score = 1.0;
    let details = '';

    if (config.minWords && wordCount < config.minWords) {
      score *= 0.6;
      details += `Too few words (${wordCount}, min ${config.minWords}). `;
    }
    if (config.maxWords && wordCount > config.maxWords) {
      score *= 0.7;
      details += `Too many words (${wordCount}, max ${config.maxWords}). `;
    }

    // Bonus for target length
    if (config.targetWords) {
      const targetDiff = Math.abs(wordCount - config.targetWords);
      const targetScore = Math.max(0.8, 1 - (targetDiff / config.targetWords) * 0.2);
      score *= targetScore;
      details += `Target length: ${config.targetWords} words, actual: ${wordCount}. `;
    }

    return {
      passed: score >= 0.8,
      score,
      details: details || `Response length appropriate (${wordCount} words)`
    };
  }

  private evaluateToneCheck(
    criterion: EvalCriteria,
    actualOutput: string,
    testItem: EvalTestItem
  ): { passed: boolean; score: number; details: string } {
    const config = criterion.config;
    let score = 1.0;
    let details = '';

    // Check for forbidden words
    if (config.forbiddenWords && config.forbiddenWords.length > 0) {
      const foundForbidden = config.forbiddenWords.filter((word: string) => 
        actualOutput.toLowerCase().includes(word.toLowerCase())
      );
      if (foundForbidden.length > 0) {
        score *= 0.5;
        details += `Found forbidden words: ${foundForbidden.join(', ')}. `;
      }
    }

    // Check for required tone elements
    if (config.requiredElements && config.requiredElements.length > 0) {
      const foundElements = config.requiredElements.filter((element: string) => {
        switch (element) {
          case 'enthusiasm':
            return /\b(great|excellent|amazing|fantastic|wonderful|exciting)\b/i.test(actualOutput);
          case 'encouragement':
            return /\b(can|will|able|capable|successful|achieve)\b/i.test(actualOutput);
          default:
            return false;
        }
      });
      const elementScore = foundElements.length / config.requiredElements.length;
      score *= elementScore;
      details += `Found ${foundElements.length}/${config.requiredElements.length} tone elements. `;
    }

    return {
      passed: score >= 0.8,
      score,
      details: details || 'Tone criteria met'
    };
  }

  private calculateRunSummary(run: EvalRun): void {
    const totalTests = run.results.length;
    let totalScore = 0;
    let totalProcessingTime = 0;
    const modelStats: { [model: string]: any } = {};

    for (const result of run.results) {
      const criteriaScores = Object.values(result.criteriaResults).map(r => r.score);
      const averageScore = criteriaScores.length > 0 ? 
        criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length : 0;
      
      totalScore += averageScore;
      totalProcessingTime += result.processingTime;

      // Track model-specific stats
      if (!modelStats[result.model]) {
        modelStats[result.model] = {
          totalTests: 0,
          passedTests: 0,
          totalScore: 0,
          totalProcessingTime: 0
        };
      }
      
      modelStats[result.model].totalTests++;
      modelStats[result.model].totalScore += averageScore;
      modelStats[result.model].totalProcessingTime += result.processingTime;
      
      if (averageScore >= 0.8) {
        modelStats[result.model].passedTests++;
      }
    }

    run.summary.averageScore = totalTests > 0 ? totalScore / totalTests : 0;
    run.summary.averageProcessingTime = totalTests > 0 ? totalProcessingTime / totalTests : 0;

    // Calculate model performance
    for (const [model, stats] of Object.entries(modelStats)) {
      run.summary.modelPerformance[model] = {
        totalTests: stats.totalTests,
        passedTests: stats.passedTests,
        averageScore: stats.totalTests > 0 ? stats.totalScore / stats.totalTests : 0,
        averageProcessingTime: stats.totalTests > 0 ? stats.totalProcessingTime / stats.totalTests : 0
      };
    }
  }

  getEvalRun(runId: string): EvalRun | undefined {
    return this.evalRuns.get(runId);
  }

  getAllEvalRuns(): EvalRun[] {
    return Array.from(this.evalRuns.values());
  }

  deleteEvalRun(runId: string): boolean {
    return this.evalRuns.delete(runId);
  }

  // Generate evaluation report
  generateReport(run: EvalRun): string {
    const report = [
      `# Evaluation Report: ${run.name}`,
      `**Description:** ${run.description}`,
      `**Date:** ${run.createdAt.toISOString()}`,
      `**Duration:** ${run.completedAt ? 
        Math.round((run.completedAt.getTime() - run.createdAt.getTime()) / 1000) : 0}s`,
      '',
      `## Summary`,
      `- **Total Tests:** ${run.summary.totalTests}`,
      `- **Passed:** ${run.summary.passedTests}`,
      `- **Failed:** ${run.summary.failedTests}`,
      `- **Success Rate:** ${((run.summary.passedTests / run.summary.totalTests) * 100).toFixed(1)}%`,
      `- **Average Score:** ${(run.summary.averageScore * 100).toFixed(1)}%`,
      `- **Average Processing Time:** ${run.summary.averageProcessingTime.toFixed(0)}ms`,
      '',
      `## Model Performance`,
      ...Object.entries(run.summary.modelPerformance).map(([model, stats]) => [
        `### ${model}`,
        `- **Tests:** ${stats.totalTests}`,
        `- **Passed:** ${stats.passedTests}`,
        `- **Success Rate:** ${((stats.passedTests / stats.totalTests) * 100).toFixed(1)}%`,
        `- **Average Score:** ${(stats.averageScore * 100).toFixed(1)}%`,
        `- **Average Processing Time:** ${stats.averageProcessingTime.toFixed(0)}ms`,
        ''
      ].join('\n')),
      `## Detailed Results`,
      ...run.results.map(result => [
        `### Test: ${result.testItemId}`,
        `- **Model:** ${result.model}`,
        `- **Processing Time:** ${result.processingTime}ms`,
        `- **Output:** ${result.actualOutput.substring(0, 200)}${result.actualOutput.length > 200 ? '...' : ''}`,
        `- **Criteria Results:**`,
        ...Object.entries(result.criteriaResults).map(([name, criteria]) => 
          `  - ${name}: ${criteria.passed ? '✅' : '❌'} (${(criteria.score * 100).toFixed(1)}%) - ${criteria.details}`
        ),
        ''
      ].join('\n'))
    ];

    return report.join('\n');
  }
} 