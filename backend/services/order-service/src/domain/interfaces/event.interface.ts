export interface IEventPublisher {
  publish(topic: string, event: any): Promise<void>;
  publishBatch(topic: string, events: any[]): Promise<void>;
}

export interface IEventSubscriber {
  subscribe(topic: string, handler: (event: any) => Promise<void>): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
}
