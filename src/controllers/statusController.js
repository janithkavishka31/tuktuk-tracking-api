function getStatus(req, res) {
  return res.json({ message: 'TukTuk Tracking API is running' });
}

module.exports = {
  getStatus,
};
