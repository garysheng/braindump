export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ProcessingError {
  code: string;
  message: string;
}

export interface IntraDayRecordingWithPluginProcessingStatusBackend {
  userId: string;
  recordingId: string;
  status: ProcessingStatus;
  error?: ProcessingError;
  createdAt: Date;
  updatedAt: Date;
} 