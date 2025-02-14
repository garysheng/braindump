# BrainDump

BrainDump is an open-source voice-to-text application that helps users record and transcribe their thoughts through guided questions, with AI-powered features for generating both questions and content drafts.

![BrainDump Screenshot](public/screenshot.png)

## Features

- 🎙️ **Voice Recording & Transcription**
  - Record responses to questions with real-time audio visualization
  - Automatic transcription using OpenAI's Whisper API
  - Support for multiple responses per question
  - Keyboard shortcuts (spacebar to start/stop, arrow keys for navigation)

- 🤖 **AI Integration**
  - Generate custom questions using OpenAI
  - Create polished drafts from your responses using Claude or Gemini
  - Multiple content formats (academic, blog, personal reflection)
  - Advanced settings for tone, length, and audience

- 📝 **Session Management**
  - Create and manage multiple recording sessions
  - Question templates for common use cases
  - Easy navigation between questions
  - Export responses as text or AI-generated drafts

- 🎨 **Modern UI/UX**
  - Dark mode design with beautiful gradients
  - Real-time audio level visualization
  - Responsive layout for all devices
  - Built with shadcn/ui components

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Firebase (Firestore)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **AI Services**:
  - OpenAI (Whisper API for transcription + question generation)
  - Anthropic Claude (for draft generation)
  - Google Gemini (for draft generation)
- **Audio Processing**: Web Audio API

## Getting Started

### Prerequisites

1. Node.js 18+ and npm
2. Firebase account
3. OpenAI API key (for transcription and question generation)
4. (Optional) Anthropic API key for Claude
5. (Optional) Google AI API key for Gemini

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/braindump.git
   cd braindump
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a Firebase project and enable:
   - Authentication (Google provider)
   - Firestore Database
   - Storage

4. Copy \`.env.example\` to \`.env.local\` and fill in your environment variables:
   \`\`\`
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

   # Firebase Admin
   FIREBASE_PROJECT_ID=
   FIREBASE_CLIENT_EMAIL=
   FIREBASE_PRIVATE_KEY=
   \`\`\`

5. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

### API Keys Setup

The application requires various API keys for its features:

1. **OpenAI API Key**:
   - Required for transcription and question generation
   - Get it from: https://platform.openai.com/api-keys
   - Set up usage limits for safety

2. **Anthropic API Key** (Optional):
   - Used for Claude-powered draft generation
   - Get it from: https://console.anthropic.com/account/keys
   - Set up spending limits

3. **Google AI API Key** (Optional):
   - Used for Gemini-powered draft generation
   - Get it from: https://aistudio.google.com/app/apikey
   - Monitor usage in Google Cloud Console

## Project Structure

\`\`\`
src/
├── app/                    # Next.js app router pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utility functions and services
│   ├── firebase/        # Firebase configuration and services
│   └── ...              # Other services
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── constants/           # Application constants
\`\`\`

## Key Components

- `RecordingInterface`: Handles voice recording, audio visualization, and transcription
- `QuestionSelector`: Manages question selection and AI-powered question generation
- `DraftGenerator`: Handles AI-powered draft generation with multiple models
- `ExportView`: Manages response export and draft generation interface

## Firebase Structure

\`\`\`
users/
└── {userId}/
    ├── sessions/
    │   └── {sessionId}/
    │       ├── questions/
    │       │   └── {questionId}/
    │       │       └── responses/
    │       │           └── {responseId}/
    └── templates/
        └── {templateId}/
\`\`\`

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch: \`git checkout -b feature/amazing-feature\`
3. Commit your changes: \`git commit -m 'Add amazing feature'\`
4. Push to the branch: \`git push origin feature/amazing-feature\`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [OpenAI](https://openai.com/) for Whisper API
- [Anthropic](https://anthropic.com/) for Claude
- [Google](https://ai.google.dev/) for Gemini
- All our contributors and users!
