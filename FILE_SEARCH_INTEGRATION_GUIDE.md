# File Search Integration Guide

## Overview

This guide documents the integration of OpenAI's file search tool into the Quelle AI system. The implementation allows the AI to search through uploaded files and knowledge bases for relevant information before generating responses, making it much more capable for document analysis and knowledge retrieval.

### Key Features

- **Automatic Detection**: Automatically detects when file search is needed based on keywords
- **Vector Store Management**: Complete vector store creation and file management
- **File Citation Support**: Displays file citations with source information
- **Semantic Search**: Advanced semantic search across uploaded documents
- **Multiple File Support**: Upload and search across multiple files
- **Metadata Filtering**: Filter search results based on file metadata
- **Comprehensive API**: Full REST API for vector store management

## Architecture

### File Search Tool

The system uses OpenAI's `file_search` tool, which provides:

- **Semantic Search**: Advanced semantic search across uploaded files
- **File Citations**: Automatic citation generation with file information
- **Vector Store Integration**: Search across multiple vector stores
- **Metadata Filtering**: Filter results based on file attributes
- **Configurable Results**: Adjustable number of search results

### Integration Points

1. **MessageClassifier**: Detects when file search is needed
2. **OpenAIHandler**: Manages file search API calls and response processing
3. **ChatFlowController**: Orchestrates file search requests
4. **VectorStoreService**: Manages vector stores and file uploads
5. **DashboardChat**: Displays search results and file citations
6. **API Routes**: Handle file search options and vector store management

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional - File search is enabled by default
ENABLE_FILE_SEARCH=true
VECTOR_STORE_IDS=vs_abc123,vs_def456
```

### File Search Options

```typescript
interface FileSearchOptions {
  maxNumResults?: number;        // Limit number of search results
  includeResults?: boolean;      // Include raw search results in response
  filters?: {
    type: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
    key: string;
    value: string | number | boolean;
  };
}
```

### Supported File Formats

| File Format | MIME Type | Description |
|-------------|-----------|-------------|
| .pdf | application/pdf | PDF documents |
| .doc | application/msword | Microsoft Word documents |
| .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document | Modern Word documents |
| .txt | text/plain | Plain text files |
| .md | text/markdown | Markdown files |
| .json | application/json | JSON files |
| .html | text/html | HTML files |
| .py | text/x-python | Python files |
| .js | text/javascript | JavaScript files |
| .ts | application/typescript | TypeScript files |
| .cpp | text/x-c++ | C++ files |
| .java | text/x-java | Java files |
| .go | text/x-golang | Go files |
| .rb | text/x-ruby | Ruby files |
| .php | text/x-php | PHP files |
| .sh | application/x-sh | Shell scripts |
| .tex | text/x-tex | LaTeX files |

## Features

### 1. Automatic File Search Detection

The system automatically detects when file search is needed based on keywords:

```typescript
// Keywords that trigger file search
const fileSearchKeywords = [
  'file', 'document', 'pdf', 'search', 'find', 'look up',
  'knowledge base', 'database', 'repository', 'archive',
  'documentation', 'manual', 'guide', 'tutorial', 'reference',
  'report', 'analysis', 'data', 'information', 'content',
  'read', 'analyze', 'examine', 'review', 'study',
  'what does the document say', 'what is in the file',
  'search the files', 'find in documents', 'look through',
  'check the documentation', 'refer to the manual',
  'what does it say about', 'find information about'
];
```

### 2. Vector Store Management

Complete vector store lifecycle management:

```typescript
// Create vector store
const vectorStoreId = await vectorStoreService.createVectorStore({
  name: 'my_knowledge_base',
  description: 'Company documentation and guides'
});

// Upload file
const fileId = await vectorStoreService.uploadFile('path/to/document.pdf');

// Add file to vector store
await vectorStoreService.addFileToVectorStore(vectorStoreId, fileId);

// Wait for processing
await vectorStoreService.waitForFileProcessing(vectorStoreId);
```

### 3. File Citation and Source Display

File search results include detailed citations:

```typescript
// Citation format
{
  type: 'file_citation',
  index: 992,
  file_id: 'file-2dtbBZdjtDKS8eqWxqbgDi',
  filename: 'document.pdf'
}
```

### 4. Metadata Filtering

Filter search results based on file attributes:

```typescript
const fileSearchOptions = {
  filters: {
    type: 'eq',
    key: 'category',
    value: 'technical'
  }
};
```

## API Integration

### Chat Flow API

```typescript
POST /api/ai-chat-flow
{
  "message": "What does the documentation say about API authentication?",
  "fileSearchOptions": {
    "maxNumResults": 5,
    "includeResults": true,
    "filters": {
      "type": "eq",
      "key": "type",
      "value": "documentation"
    }
  }
}
```

### Vector Store Management API

#### Create Vector Store
```typescript
POST /api/vector-store
{
  "action": "create",
  "name": "company_docs",
  "description": "Company documentation and guides"
}
```

#### Upload File
```typescript
POST /api/vector-store
{
  "action": "upload_file",
  "filePath": "https://example.com/document.pdf",
  "purpose": "assistants",
  "metadata": {
    "category": "technical",
    "department": "engineering"
  }
}
```

#### Setup Knowledge Base
```typescript
POST /api/vector-store
{
  "action": "setup_knowledge_base",
  "vectorStoreConfig": {
    "name": "product_docs",
    "description": "Product documentation"
  },
  "filePath": "https://example.com/product_guide.pdf",
  "fileOptions": {
    "purpose": "assistants",
    "metadata": {
      "category": "product",
      "version": "2.0"
    }
  }
}
```

#### List Vector Stores
```typescript
GET /api/vector-store?action=list_stores
```

#### List Files in Store
```typescript
GET /api/vector-store?action=list_files&vectorStoreId=vs_abc123
```

### Response Format

```typescript
{
  "success": true,
  "type": "text",
  "content": "According to the documentation, API authentication requires...",
  "fileSearchCalls": [
    {
      "id": "fs_67c09ccea8c48191ade9367e3ba71515",
      "status": "completed",
      "queries": ["API authentication"],
      "searchResults": [...]
    }
  ],
  "structuredData": {
    "content": "According to the documentation...",
    "confidence": 0.9,
    "suggestions": [
      "Would you like me to search for more specific information in the files?",
      "I can help you find related documents or sections."
    ],
    "metadata": {
      "reasoning": "Information retrieved from uploaded files and knowledge base.",
      "file_sources": [
        {
          "fileId": "file-2dtbBZdjtDKS8eqWxqbgDi",
          "filename": "api_documentation.pdf",
          "index": 992
        }
      ],
      "file_search_used": true,
      "search_calls": [...]
    }
  }
}
```

## UI Components

### DashboardChat Updates

The DashboardChat component now displays:

1. **File Search Calls**: Shows search queries and results count
2. **File Citations**: File names and IDs with source information
3. **Search Metadata**: Information about search actions and results
4. **File Search Hints**: Suggestions for file search queries

### File Search Display

```typescript
// File search calls display
{message.fileSearchCalls && message.fileSearchCalls.length > 0 && (
  <div className="mt-2 space-y-1">
    <div className="text-xs opacity-70">
      <strong>📁 File Search:</strong>
    </div>
    {message.fileSearchCalls.map((fs, index) => (
      <div key={index} className="text-xs opacity-70 ml-2">
        <div className="font-medium">
          Status: {fs.status}
        </div>
        {fs.queries && fs.queries.length > 0 && (
          <div className="text-xs opacity-60 mt-1">
            <strong>Queries:</strong> {fs.queries.join(', ')}
          </div>
        )}
        {fs.searchResults && fs.searchResults.length > 0 && (
          <div className="text-xs opacity-60 mt-1">
            <strong>Results:</strong> {fs.searchResults.length} found
          </div>
        )}
      </div>
    ))}
  </div>
)}

// File sources display
{message.structuredData?.metadata?.file_sources && message.structuredData.metadata.file_sources.length > 0 && (
  <div className="mt-2 space-y-1">
    <div className="text-xs opacity-70">
      <strong>📄 File Sources:</strong>
    </div>
    {message.structuredData.metadata.file_sources.map((source: any, index: number) => (
      <div key={index} className="text-xs opacity-70 ml-2">
        <div className="font-medium">
          {source.filename}
        </div>
        <div className="text-xs opacity-60">
          File ID: {source.fileId}
        </div>
        {source.index && (
          <div className="text-xs opacity-50">
            Index: {source.index}
          </div>
        )}
      </div>
    ))}
  </div>
)}
```

## Usage Examples

### Basic File Search

```typescript
// Automatic detection
const result = await chatFlowController.processMessage(
  "What does the documentation say about user authentication?"
);
```

### Limited Results Search

```typescript
const result = await chatFlowController.processMessage(
  "Find information about API endpoints",
  undefined, // no reference image
  undefined, // no web search options
  {
    maxNumResults: 3
  }
);
```

### Filtered Search

```typescript
const result = await chatFlowController.processMessage(
  "Search for technical documentation",
  undefined,
  undefined,
  {
    filters: {
      type: 'eq',
      key: 'category',
      value: 'technical'
    }
  }
);
```

### Document Analysis

```typescript
// Analyze specific documents
const result = await chatFlowController.processMessage(
  "What are the main features described in the product manual?"
);

// Compare documents
const result = await chatFlowController.processMessage(
  "How do the API documentation and user guide differ?"
);

// Extract information
const result = await chatFlowController.processMessage(
  "What are the system requirements mentioned in the documentation?"
);
```

## Vector Store Management

### Setting Up a Knowledge Base

```typescript
// Complete setup workflow
const { vectorStoreId, fileId } = await vectorStoreService.setupKnowledgeBase(
  {
    name: 'company_docs',
    description: 'Company documentation and guides'
  },
  'https://example.com/company_handbook.pdf',
  {
    purpose: 'assistants',
    metadata: {
      category: 'company',
      department: 'hr'
    }
  }
);
```

### Uploading Multiple Files

```typescript
const fileIds = await vectorStoreService.uploadMultipleFiles(
  vectorStoreId,
  [
    'https://example.com/api_docs.pdf',
    'https://example.com/user_guide.pdf',
    'https://example.com/troubleshooting.pdf'
  ],
  {
    purpose: 'assistants',
    metadata: {
      category: 'documentation',
      version: '2.0'
    }
  }
);
```

### Monitoring File Processing

```typescript
// Check file status
const files = await vectorStoreService.getVectorStoreFiles(vectorStoreId);
const processingFiles = files.filter(file => file.status === 'in_progress');

// Wait for completion
const processedFiles = await vectorStoreService.waitForFileProcessing(vectorStoreId);
```

## Error Handling

### Common Error Scenarios

1. **Vector Store Not Found**
   ```typescript
   if (error.message.includes('vector store')) {
     return { error: 'Vector store not found. Please check your configuration.' };
   }
   ```

2. **File Processing Failed**
   ```typescript
   if (error.message.includes('file processing')) {
     return { error: 'File processing failed. Please try uploading again.' };
   }
   ```

3. **Unsupported File Format**
   ```typescript
   if (error.message.includes('unsupported')) {
     return { error: 'File format not supported. Please use a supported format.' };
   }
   ```

4. **File Size Limits**
   ```typescript
   if (error.message.includes('size')) {
     return { error: 'File too large. Please use a smaller file.' };
   }
   ```

### Fallback Mechanisms

- **Graceful Degradation**: Falls back to regular responses if file search fails
- **Partial Results**: Shows available information even if some searches fail
- **Error Recovery**: Automatic retry for transient failures
- **File Validation**: Pre-upload validation of file formats and sizes

## Best Practices

### File Organization

1. **Use Descriptive Names**: "api_documentation_v2.pdf" vs "doc.pdf"
2. **Organize by Category**: Use metadata to categorize files
3. **Version Control**: Include version information in file names or metadata
4. **Regular Updates**: Keep knowledge base current with latest documents

### Search Optimization

1. **Use Specific Keywords**: "API authentication" vs "authentication"
2. **Include Context**: "What does the user guide say about..."
3. **Be Specific**: "Find troubleshooting steps for error 404"
4. **Use Filters**: Filter by document type or category

### Performance Tips

1. **Limit Results**: Use maxNumResults for faster responses
2. **Batch Uploads**: Upload multiple files together
3. **Monitor Processing**: Check file processing status
4. **Cache Results**: Avoid repeated searches for the same information

### Content Guidelines

1. **Citation Requirements**: Always display file citations
2. **Source Transparency**: Clearly indicate when information comes from files
3. **Accuracy Verification**: Cross-reference information from multiple documents
4. **Documentation Quality**: Ensure uploaded documents are well-structured

## Limitations

### Model Support

- **Supported Models**: All models that support the Responses API
- **File Size Limits**: Maximum file size varies by format
- **Processing Time**: Large files may take time to process
- **Concurrent Limits**: Rate limits apply to file operations

### Search Limitations

- **Content Policy**: All files must comply with OpenAI's content policy
- **Language Support**: Primarily optimized for English content
- **File Format Restrictions**: Only supported formats can be processed
- **Processing Delays**: Files require processing before search is available

### Data Handling

- **Privacy**: File content is processed according to OpenAI's data policy
- **Retention**: File retention follows OpenAI's guidelines
- **Residency**: Data residency depends on your OpenAI organization settings
- **Security**: Files are encrypted and stored securely

## Testing

### Unit Tests

```typescript
describe('File Search', () => {
  test('should detect file search keywords', () => {
    expect(MessageClassifier.needsFileSearch('search the documents')).toBe(true);
    expect(MessageClassifier.needsFileSearch('hello world')).toBe(false);
  });

  test('should process file search response', async () => {
    const result = await openaiHandler.generateTextResponse(
      'What does the documentation say?',
      false, // no function calling
      undefined, // no enhanced prompt
      undefined, // no system instructions
      false, // no web search
      undefined, // no web search options
      true // enable file search
    );
    
    expect(result.fileSearchCalls).toBeDefined();
    expect(result.structuredData.metadata.file_search_used).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('File Search API', () => {
  test('should return file search results', async () => {
    const response = await fetch('/api/ai-chat-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'What does the documentation say about authentication?',
        fileSearchOptions: { maxNumResults: 3 }
      })
    });
    
    const data = await response.json();
    expect(data.fileSearchCalls).toBeDefined();
    expect(data.structuredData.metadata.file_search_used).toBe(true);
  });
});
```

### Vector Store Tests

```typescript
describe('Vector Store Management', () => {
  test('should create vector store', async () => {
    const response = await fetch('/api/vector-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        name: 'test_store',
        description: 'Test vector store'
      })
    });
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.vectorStoreId).toBeDefined();
  });
});
```

## Troubleshooting

### Common Issues

1. **No Search Results**
   - Check if vector store IDs are configured
   - Verify files are uploaded and processed
   - Check if the query contains file search keywords
   - Ensure vector store contains relevant files

2. **File Upload Failures**
   - Verify file format is supported
   - Check file size limits
   - Ensure file is accessible (for URLs)
   - Check API key permissions

3. **Processing Delays**
   - Large files take longer to process
   - Check file processing status
   - Wait for completion before searching
   - Monitor processing logs

4. **Search Quality Issues**
   - Use more specific search terms
   - Ensure documents are well-structured
   - Check file content quality
   - Use appropriate filters

### Debug Information

Enable debug logging to troubleshoot issues:

```typescript
console.log('File search detection:', MessageClassifier.needsFileSearch(userMessage));
console.log('Vector store IDs:', config.vectorStoreIds);
console.log('File search options:', fileSearchOptions);
console.log('File search response:', data);
console.log('File search calls:', data.fileSearchCalls);
console.log('File sources:', data.structuredData?.metadata?.file_sources);
```

## Future Enhancements

### Planned Features

1. **Advanced Search Filters**: Date ranges, content types, file sizes
2. **Search History**: Track and reuse previous searches
3. **Custom Indexing**: Custom document indexing strategies
4. **Search Analytics**: Track search performance and user behavior
5. **Multi-Language Support**: Search in different languages
6. **Document Comparison**: Compare content across multiple documents

### Performance Improvements

1. **Search Caching**: Intelligent caching of search results
2. **Parallel Processing**: Multiple concurrent file operations
3. **Search Optimization**: AI-optimized search queries
4. **Result Ranking**: Better ranking of search results
5. **Search Personalization**: User-specific search preferences

### Integration Enhancements

1. **Document Management**: Full document lifecycle management
2. **Version Control**: Document version tracking and comparison
3. **Collaborative Features**: Multi-user document collaboration
4. **Workflow Integration**: Integration with document workflows
5. **API Extensions**: Extended API for advanced use cases

## Conclusion

The file search integration provides Quelle AI with powerful document analysis capabilities, making it much more capable for knowledge retrieval and document-based conversations. The implementation includes comprehensive vector store management, semantic search, and robust file citation support.

The system automatically detects when file search is needed and provides users with detailed file citations to verify information sources. This ensures transparency and allows users to explore topics further through the original documents.

The vector store management API provides complete control over knowledge base setup and maintenance, making it easy to keep the system up-to-date with the latest documentation and information.

For more information, refer to the [OpenAI File Search Documentation](https://platform.openai.com/docs/guides/file-search). 