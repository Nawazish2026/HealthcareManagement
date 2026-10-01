import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { validateBody, validateQuery } from '../middlewares/validate';
import {
  createBookingSchema,
  listBookingsQuerySchema,
} from '../schemas/booking.schema';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All booking operations require authentication
router.use(authenticate);

router.post('/', validateBody(createBookingSchema), (req, res, next) =>
  bookingController.createBooking(req, res, next)
);

router.get('/', validateQuery(listBookingsQuerySchema), (req, res, next) =>
  bookingController.listBookings(req, res, next)
);

router.get('/:id', (req, res, next) =>
  bookingController.getBookingById(req, res, next)
);

router.post('/:id/cancel', (req, res, next) =>
  bookingController.cancelBooking(req, res, next)
);

export default router;
