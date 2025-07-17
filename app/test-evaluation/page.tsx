'use client';

import { useState, useEffect } from 'react';
import { EvalService } from '@/lib/ai/evaluation/eval-service';

interface EvalRun {
  id: string;
  name: string;
  description: string;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageScore: number;
    averageProcessingTime: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

export default function TestEvaluationPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedDataset, setSelectedDataset] = useState('GENERAL_CHAT');
  const [customTestItems, setCustomTestItems] = useState('');
  const [useCustomTests, setUseCustomTests] = useState(false);
  const [evalRuns, setEvalRuns] = useState<EvalRun[]>([]);

  const predefinedDatasets = {
    GENERAL_CHAT: 'General Chat (AI Actor Questions)',
    CREATIVE_PROJECTS: 'Creative Projects (Character Development)',
    TECHNICAL_SUPPORT: 'Technical Support (Troubleshooting)'
  };

  const runEvaluation = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const requestBody = {
        name: `Evaluation Run - ${new Date().toLocaleString()}`,
        description: `Testing model performance with ${selectedDataset} dataset`,
        usePredefinedDataset: !useCustomTests,
        predefinedDatasetName: useCustomTests ? undefined : selectedDataset,
        testItems: useCustomTests ? JSON.parse(customTestItems) : undefined,
        model: 'claude-3-5-sonnet-20241022'
      };

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/evaluation/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data);
        // Refresh eval runs list
        loadEvalRuns();
      } else {
        setResults({ error: data.error });
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      setResults({ error: 'Failed to run evaluation' });
    } finally {
      setIsRunning(false);
    }
  };

  const loadEvalRuns = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/evaluation/run`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        setEvalRuns(data.evalRuns || []);
      }
    } catch (error) {
      console.error('Failed to load eval runs:', error);
    }
  };

  const deleteEvalRun = async (runId: string) => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/evaluation/run?runId=${runId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        loadEvalRuns();
      }
    } catch (error) {
      console.error('Failed to delete eval run:', error);
    }
  };

  // Load eval runs on component mount
  useEffect(() => {
    loadEvalRuns();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🤖 Model Evaluation Testing
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Configuration</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Dataset
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!useCustomTests}
                      onChange={() => setUseCustomTests(false)}
                      className="mr-2"
                    />
                    Use Predefined Dataset
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={useCustomTests}
                      onChange={() => setUseCustomTests(true)}
                      className="mr-2"
                    />
                    Use Custom Test Items
                  </label>
                </div>
              </div>

              {!useCustomTests && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Dataset
                  </label>
                  <select
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(predefinedDatasets).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {useCustomTests && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Test Items (JSON)
                  </label>
                  <textarea
                    value={customTestItems}
                    onChange={(e) => setCustomTestItems(e.target.value)}
                    placeholder={`[
  {
    "id": "test_1",
    "input": {
      "prompt": "What is the best way to become an AI actor?",
      "systemPrompt": "You are Quelle AI, a helpful assistant for AI actors."
    },
    "expectedOutput": {
      "content": "Should provide practical advice about becoming an AI actor",
      "criteria": ["Response Quality", "Tone Consistency", "Response Length"]
    }
  }
]`}
                    className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              )}

              <button
                onClick={runEvaluation}
                disabled={isRunning}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isRunning ? 'Running Evaluation...' : 'Run Evaluation'}
              </button>
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Results</h2>
              
              {isRunning && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    <span className="text-blue-800">Running evaluation...</span>
                  </div>
                </div>
              )}

              {results && !results.error && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      ✅ Evaluation Completed
                    </h3>
                    <p className="text-green-700">{results.message}</p>
                  </div>

                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Tests:</span>
                        <span className="ml-2 font-medium">{results.evalRun.summary.totalTests}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Passed:</span>
                        <span className="ml-2 font-medium text-green-600">{results.evalRun.summary.passedTests}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Failed:</span>
                        <span className="ml-2 font-medium text-red-600">{results.evalRun.summary.failedTests}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="ml-2 font-medium">
                          {((results.evalRun.summary.passedTests / results.evalRun.summary.totalTests) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Score:</span>
                        <span className="ml-2 font-medium">
                          {(results.evalRun.summary.averageScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Avg Time:</span>
                        <span className="ml-2 font-medium">
                          {results.evalRun.summary.averageProcessingTime.toFixed(0)}ms
                        </span>
                      </div>
                    </div>
                  </div>

                  <details className="bg-gray-50 rounded-md p-4">
                    <summary className="cursor-pointer font-semibold text-gray-800">
                      View Detailed Report
                    </summary>
                    <pre className="mt-4 text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-96">
                      {results.report}
                    </pre>
                  </details>
                </div>
              )}

              {results && results.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    ❌ Evaluation Failed
                  </h3>
                  <p className="text-red-700">{results.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Previous Evaluation Runs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Previous Evaluation Runs
          </h2>
          
          {evalRuns.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No evaluation runs found.</p>
          ) : (
            <div className="space-y-4">
              {evalRuns.map((run) => (
                <div key={run.id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{run.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{run.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Created: {new Date(run.createdAt).toLocaleString()}</span>
                        {run.completedAt && (
                          <span>Completed: {new Date(run.completedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">{run.summary.passedTests}</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-700">{run.summary.totalTests}</span>
                        <span className="text-gray-500 ml-1">passed</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {((run.summary.passedTests / run.summary.totalTests) * 100).toFixed(1)}% success
                      </div>
                      <button
                        onClick={() => deleteEvalRun(run.id)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 