/**
 * Event Publisher Interface (Domain Layer)
 * Abstracts event publishing for dependency inversion
 * Implementation: KafkaJS for inter-service communication
 */
export interface IEventPublisher {
  /**
   * Publish an event to a topic
   * @param topic Kafka topic name
   * @param event Event payload
   */
  publish(topic: string, event: any): Promise<void>;

  /**
   * Publish multiple events in batch
   * @param events Array of topic-event pairs
   */
  publishBatch(events: Array<{ topic: string; event: any }>): Promise<void>;
}
