import express, { Request, Response } from "express";
import prescriptionsRouter from "./routes/prescriptions";
import pharmacistRouter from "./routes/pharmacist";
import ordersRouter from "./routes/orders";
import webhooksRouter from "./routes/webhooks";

const app = express();
const PORT = process.env.PORT || 4000;

// Standard Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Register Application Routes
app.use("/api/prescriptions", prescriptionsRouter);
app.use("/api/pharmacist", pharmacistRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/webhooks", webhooksRouter);

// Global 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Endpoint not found." });
});

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Dawakhana Pharmacy Backend Service listening on port ${PORT}`);
  });
}

export default app;
