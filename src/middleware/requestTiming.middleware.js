export const requestTiming = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const roles = Array.isArray(req.user?.user_type)
      ? req.user.user_type.join(",")
      : req.user?.user_type;

    console.log(
      JSON.stringify({
        type: "request_timing",
        method: req.method,
        path: req.originalUrl?.split("?")[0] || req.path,
        statusCode: res.statusCode,
        responseTimeMs: Number(elapsedMs.toFixed(1)),
        userId: req.user?._id?.toString(),
        role: roles,
      }),
    );
  });

  next();
};
