import { Controller, All, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from '../services/proxy.service';
import { ROUTE_PREFIXES } from '../common/constants';

@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Products routes
   */
  @All(`${ROUTE_PREFIXES.PRODUCTS}*`)
  async proxyProducts(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.path.replace('/api', '');
      const result = await this.proxyService.forwardToProductService(
        path,
        req.method,
        req.body,
        req.headers,
        req.query,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * Inventory routes
   */
  @All(`${ROUTE_PREFIXES.INVENTORY}*`)
  async proxyInventory(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.path.replace('/api', '');
      const result = await this.proxyService.forwardToInventoryService(
        path,
        req.method,
        req.body,
        req.headers,
        req.query,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * Users routes
   */
  @All(`${ROUTE_PREFIXES.USERS}*`)
  async proxyUsers(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.path.replace('/api', '');
      const result = await this.proxyService.forwardToUserService(
        path,
        req.method,
        req.body,
        req.headers,
        req.query,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * Cart routes
   */
  @All(`${ROUTE_PREFIXES.CART}*`)
  async proxyCart(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.path.replace('/api', '');
      const result = await this.proxyService.forwardToCartService(
        path,
        req.method,
        req.body,
        req.headers,
        req.query,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * Orders routes
   */
  @All(`${ROUTE_PREFIXES.ORDERS}*`)
  async proxyOrders(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.path.replace('/api', '');
      const result = await this.proxyService.forwardToOrderService(
        path,
        req.method,
        req.body,
        req.headers,
        req.query,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  /**
   * Payments routes
   */
  @All(`${ROUTE_PREFIXES.PAYMENTS}*`)
  async proxyPayments(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.path.replace('/api', '');
      const result = await this.proxyService.forwardToPaymentService(
        path,
        req.method,
        req.body,
        req.headers,
        req.query,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return this.handleError(error, res);
    }
  }

  private handleError(error: any, res: Response) {
    const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal server error';
    const response = error.response || { success: false, message };

    return res.status(status).json(response);
  }
}
