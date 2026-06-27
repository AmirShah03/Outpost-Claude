const loyaltyService = require('../services/loyalty.service');

const getLoyalty = async (req, res, next) => {
  try {
    const points = await loyaltyService.getPoints(req.user.id);
    const history = await loyaltyService.getPointsHistory(req.user.id);
    const pointsValue = loyaltyService.calculatePointsValue(points);

    res.json({
      points,
      pointsValue,
      conversionRate: `${require('../config/env').pointsToDollar} points = $1.00`,
      history,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLoyalty };
