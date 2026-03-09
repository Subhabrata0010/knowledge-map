/**
 * Pipeline state management
 */

export enum PipelineStage {
  INITIALIZED = 'initialized',
  SEARCHING = 'searching',
  SCRAPING = 'scraping',
  EXTRACTING_ENTITIES = 'extracting_entities',
  BUILDING_RELATIONSHIPS = 'building_relationships',
  BUILDING_GRAPH = 'building_graph',
  STORING = 'storing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface PipelineState {
  topic: string;
  stage: PipelineStage;
  progress: number;
  startTime: number;
  error?: string;
  data?: {
    searchResults?: number;
    scrapedPages?: number;
    entities?: number;
    relationships?: number;
  };
}

export class PipelineStateManager {
  private state: PipelineState;

  constructor(topic: string) {
    this.state = {
      topic,
      stage: PipelineStage.INITIALIZED,
      progress: 0,
      startTime: Date.now(),
      data: {},
    };
  }

  updateStage(stage: PipelineStage, progress: number): void {
    this.state.stage = stage;
    this.state.progress = progress;
  }

  updateData(data: Partial<PipelineState['data']>): void {
    this.state.data = { ...this.state.data, ...data };
  }

  setError(error: string): void {
    this.state.stage = PipelineStage.FAILED;
    this.state.error = error;
  }

  getState(): PipelineState {
    return { ...this.state };
  }

  getElapsedTime(): number {
    return Date.now() - this.state.startTime;
  }
}
