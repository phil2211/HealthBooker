module.exports = {
  ...require('./models/Therapist'),
  ...require('./models/Booking'),
  ...require('./database/connection')
};
