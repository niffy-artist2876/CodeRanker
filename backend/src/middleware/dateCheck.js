export function requireFutureDate(field = "date") {
  return (req, res, next) => {
    const value = req.body && req.body[field];
    if (!value) {
      return res.status(400).json({ success: false, message: `${field} is required` });
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ success: false, message: `${field} is not a valid date` });
    }
    const now = new Date();
    if (d.getTime() < now.getTime()) {
      return res.status(400).json({ success: false, message: `${field} must be now or in the future` });
    }
    next();
  };
}

export default requireFutureDate;
