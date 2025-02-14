# BrainDump Product Evolution

## Current State (as of Feb 13, 2025)
BrainDump is a voice-to-text application that helps users record and transcribe their thoughts through guided questions. The current features include:

- Voice recording with automatic transcription
- Question templates and AI-generated questions
- Session management and response organization
- Export functionality for raw transcribed text

## Phase 1: AI-Powered Essay Generation (Feb 2025)

### Overview
Enhancing BrainDump to not just capture thoughts but help users transform their voice responses into coherent written pieces using multiple AI models. Users can generate first drafts of essays, blog posts, or other written content directly from their voice responses.

### New Features

#### Multi-LLM Essay Generation
- Direct integration with multiple LLM providers
- Initial support for:
  - Claude (via Anthropic API)
  - Gemini (via Google AI API)
- User-provided API keys for each service
- Future potential for:
  - Multiple LLM comparison and synthesis
  - AI-powered content refinement
  - Style and tone customization

#### Technical Implementation
1. **API Integration**
   - Direct Anthropic API integration for Claude
   - Direct Google AI API integration for Gemini
   - API key management in localStorage
   - Flexible architecture to support additional LLMs

2. **User Interface**
   - Separate tabs for raw export and draft generation
   - Model selection in the draft generator
   - Format/style selection (academic, blog post, personal reflection, custom)
   - Optional advanced settings (length, tone, audience)
   - API key management for different providers

3. **Content Processing**
   - Context-aware prompt engineering
   - Response aggregation and structuring
   - Format and style customization
   - Firebase storage for generated essays

### Future Considerations

#### Phase 2: Enhanced AI Processing
- Multiple LLM parallel processing
- AI-powered comparison and synthesis
- Best ideas extraction and merging
- Style and tone customization
- Iterative refinement with user feedback

#### Phase 3: Advanced Features
- Custom LLM fine-tuning for writing styles
- Template-based generation for different content types
- Collaborative editing with AI assistance
- Version control and revision history
- Export to various formats (MD, PDF, etc.)

## Technical Architecture Evolution

### Current
- Next.js 15+ frontend
- Firebase backend
- OpenAI for transcription and question generation

### Phase 1 Additions
- Anthropic API integration
- Google AI (Gemini) API integration
- Enhanced prompt engineering system
- Multi-model response handling
- Firebase storage for generated essays
- Extended user preferences and settings

### Future Considerations
- Scalable model management system
- Advanced prompt template system
- Content version control
- Enhanced security for API key management 