export interface IEventPublisher {
  publish(topic: string, event: any): Promise<void>;
  publishBatch(topic: string, events: any[]): Promise<void>;
}
