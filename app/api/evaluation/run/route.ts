import { NextRequest, NextResponse } from 'next/server';
import { EvalService } from '@/lib/ai/evaluation/eval-service';
import { chatService } from '@/lib/ai/services/chat-service';
import { createAPIResponse } from '@/lib/utils/api-response-headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      name,
      description,
      testItems,
      criteria,
      model = 'claude-3-5-sonnet-20241022',
      usePredefinedDataset,
      predefinedDatasetName
    } = body;

    // Validate required fields
    if (!name) {
      return createAPIResponse({ 
        error: 'Evaluation name is required' 
      }, 400);
    }

    if (!description) {
      return createAPIResponse({ 
        error: 'Evaluation description is required' 
      }, 400);
    }

    const evalService = EvalService.getInstance();
    let finalTestItems = testItems;
    let finalCriteria = criteria;

    // Use predefined dataset if requested
    if (usePredefinedDataset && predefinedDatasetName) {
      const predefinedDatasets = EvalService.TEST_DATASETS as any;
      if (predefinedDatasets[predefinedDatasetName]) {
        finalTestItems = predefinedDatasets[predefinedDatasetName];
        console.log(`Using predefined dataset: ${predefinedDatasetName} with ${finalTestItems.length} test items`);
      } else {
        return createAPIResponse({ 
          error: `Predefined dataset '${predefinedDatasetName}' not found. Available datasets: ${Object.keys(predefinedDatasets).join(', ')}` 
        }, 400);
      }
    }

    // Use predefined criteria if not provided
    if (!finalCriteria) {
      finalCriteria = [
        EvalService.CRITERIA.RESPONSE_QUALITY,
        EvalService.CRITERIA.TONE_CONSISTENCY,
        EvalService.CRITERIA.RESPONSE_LENGTH
      ];
      console.log('Using predefined evaluation criteria');
    }

    // Validate test items
    if (!finalTestItems || finalTestItems.length === 0) {
      return createAPIResponse({ 
        error: 'Test items are required' 
      }, 400);
    }

    console.log(`Starting evaluation: ${name} with ${finalTestItems.length} test items`);

    // Run the evaluation
    const evalRun = await evalService.runEvaluation(
      name,
      description,
      finalTestItems,
      finalCriteria,
      chatService,
      model
    );

    // Generate report
    const report = evalService.generateReport(evalRun);

    const responseData = {
      evalRun,
      report,
      success: true,
      message: `Evaluation completed: ${evalRun.summary.passedTests}/${evalRun.summary.totalTests} tests passed`
    };

    // Add custom headers
    const customHeaders = {
      'x-quelle-eval-id': evalRun.id,
      'x-quelle-eval-tests': evalRun.summary.totalTests.toString(),
      'x-quelle-eval-passed': evalRun.summary.passedTests.toString(),
      'x-quelle-eval-success-rate': `${((evalRun.summary.passedTests / evalRun.summary.totalTests) * 100).toFixed(1)}%`
    };

    return createAPIResponse(responseData, 200, customHeaders);

  } catch (error) {
    console.error('Evaluation API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    
    return createAPIResponse({ 
      error: errorMessage || 'An error occurred while running the evaluation.' 
    }, 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');
    
    const evalService = EvalService.getInstance();

    if (runId) {
      // Get specific evaluation run
      const evalRun = evalService.getEvalRun(runId);
      if (!evalRun) {
        return createAPIResponse({ 
          error: `Evaluation run with ID '${runId}' not found` 
        }, 404);
      }

      const report = evalService.generateReport(evalRun);
      
      return createAPIResponse({
        evalRun,
        report,
        success: true
      });
    } else {
      // Get all evaluation runs
      const allRuns = evalService.getAllEvalRuns();
      
      return createAPIResponse({
        evalRuns: allRuns,
        totalRuns: allRuns.length,
        success: true
      });
    }

  } catch (error) {
    console.error('Evaluation API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    
    return createAPIResponse({ 
      error: errorMessage || 'An error occurred while retrieving evaluation data.' 
    }, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');
    
    if (!runId) {
      return createAPIResponse({ 
        error: 'Evaluation run ID is required for deletion' 
      }, 400);
    }

    const evalService = EvalService.getInstance();
    const deleted = evalService.deleteEvalRun(runId);
    
    if (!deleted) {
      return createAPIResponse({ 
        error: `Evaluation run with ID '${runId}' not found` 
      }, 404);
    }

    return createAPIResponse({
      success: true,
      message: `Evaluation run '${runId}' deleted successfully`
    });

  } catch (error) {
    console.error('Evaluation API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    
    return createAPIResponse({ 
      error: errorMessage || 'An error occurred while deleting the evaluation run.' 
    }, 500);
  }
} 