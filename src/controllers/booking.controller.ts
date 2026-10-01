import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { bookingService } from '../services/booking.service';

export class BookingController {
  async createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const booking = await bookingService.createBooking(req.user!, req.body);
      res.status(201).json({
        success: true,
        message: 'Diagnostic test booked successfully',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async listBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const bookings = await bookingService.listBookings(req.user!, req.query as any);
      res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const booking = await bookingService.getBookingById(req.user!, id);
      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const booking = await bookingService.cancelBooking(req.user!, id);
      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
