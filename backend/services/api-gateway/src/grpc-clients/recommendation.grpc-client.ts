import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { GrpcClient } from './grpc.config';
import { GRPC_SERVICES } from './grpc.config';

@Injectable()
export class RecommendationGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(RecommendationGrpcClient.name);
  private client: any;

  async onModuleInit() {
    const grpcClient = new GrpcClient({
      protoPath: 'recommendation.proto',
      packageName: 'recommendation',
      serviceName: 'RecommendationService',
      url: GRPC_SERVICES.RECOMMENDATION_SERVICE,
    });

    this.client = grpcClient.getClient();
    this.logger.log(`Connected to Recommendation Service at ${GRPC_SERVICES.RECOMMENDATION_SERVICE}`);
  }

  /**
   * Record a user interaction with a product
   */
  async recordInteraction(
    userId: string,
    productId: string,
    interactionType: string,
    metadata?: Record<string, string>,
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      this.client.RecordInteraction(
        {
          user_id: userId,
          product_id: productId,
          interaction_type: interactionType,
          metadata: metadata || {},
        },
        (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }

  /**
   * Get personalized recommendations for a user
   */
  async getUserRecommendations(
    userId: string,
    limit: number = 10,
    algorithm: string = 'hybrid',
  ): Promise<{ product_ids: string[]; algorithm: string }> {
    return new Promise((resolve, reject) => {
      this.client.GetUserRecommendations(
        {
          user_id: userId,
          limit,
          algorithm,
        },
        (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              product_ids: response.product_ids || response.productIds || [],
              algorithm: response.algorithm || algorithm,
            });
          }
        },
      );
    });
  }

  /**
   * Get products similar to a given product
   */
  async getProductRecommendations(
    productId: string,
    limit: number = 10,
  ): Promise<{ product_ids: string[] }> {
    return new Promise((resolve, reject) => {
      this.client.GetProductRecommendations(
        {
          product_id: productId,
          limit,
        },
        (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              product_ids: response.product_ids || response.productIds || [],
            });
          }
        },
      );
    });
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(
    limit: number = 10,
  ): Promise<{ product_ids: string[] }> {
    return new Promise((resolve, reject) => {
      this.client.GetTrendingProducts(
        {
          limit,
        },
        (error: any, response: any) => {
          if (error) {
            console.error('Error getting trending products:', error);
            // Return empty array on error
            resolve({ product_ids: [] });
          } else {
            resolve({
              product_ids: response.product_ids || response.productIds || [],
            });
          }
        },
      );
    });
  }

  /**
   * Calculate product similarities (admin operation)
   */
  async calculateSimilarities(): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      this.client.CalculateSimilarities({}, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Calculate trending scores (admin operation)
   */
  async calculateTrendingScores(): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      this.client.CalculateTrendingScores({}, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}
