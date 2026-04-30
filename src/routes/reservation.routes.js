const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation.controller');

router.get('/', reservationController.getReservations);
router.get('/user/:userId', reservationController.getReservationsByUser);
router.get('/:id', reservationController.getReservation);
router.post('/', reservationController.createReservation);
router.put('/:id', reservationController.updateReservation);
router.delete('/:id', reservationController.deleteReservation);

module.exports = router;