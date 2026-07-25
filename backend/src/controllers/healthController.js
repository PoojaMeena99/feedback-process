export function getHealth(_req, res) {
  res.status(200).json({
    ok: true,
    message: "Feedback Process API is running",
  });
}
