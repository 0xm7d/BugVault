import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { VulnerabilityModel } from "../models/Vulnerability.js";

const router = Router();

// Get vulnerability trends with different time ranges
router.get("/trends", requireAuth, async (req, res) => {
  const { range = "month" } = req.query; // today, week, lastWeek, month
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date(now);
  let groupBy = {};
  let labels = [];

  switch (range) {
    case "today":
      // Today - group by hour (0-23)
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      groupBy = { hour: { $hour: "$createdAt" } };
      labels = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`
      }));
      break;
    
    case "week":
      // This week (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6
      startDate.setDate(now.getDate() - daysFromMonday);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      groupBy = { 
        day: { $dayOfMonth: "$createdAt" },
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" }
      };
      labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return {
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          label: date.toLocaleDateString('en-US', { weekday: 'short' })
        };
      });
      break;
    
    case "lastWeek":
      // Last week (Monday to Sunday)
      const lastWeekStart = new Date(now);
      const lastDayOfWeek = now.getDay();
      const lastDaysFromMonday = lastDayOfWeek === 0 ? 6 : lastDayOfWeek - 1;
      lastWeekStart.setDate(now.getDate() - lastDaysFromMonday - 7);
      lastWeekStart.setHours(0, 0, 0, 0);
      startDate = lastWeekStart;
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      lastWeekEnd.setHours(23, 59, 59, 999);
      endDate = lastWeekEnd;
      groupBy = { 
        day: { $dayOfMonth: "$createdAt" },
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" }
      };
      labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return {
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          label: date.toLocaleDateString('en-US', { weekday: 'short' })
        };
      });
      break;
    
    case "month":
    default:
      // Last month - group by day
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate = lastMonth;
      startDate.setHours(0, 0, 0, 0);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      endDate = lastDayOfLastMonth;
      endDate.setHours(23, 59, 59, 999);
      groupBy = { 
        day: { $dayOfMonth: "$createdAt" },
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" }
      };
      const daysInLastMonth = lastDayOfLastMonth.getDate();
      labels = Array.from({ length: daysInLastMonth }, (_, i) => ({
        day: i + 1,
        month: lastMonth.getMonth() + 1,
        year: lastMonth.getFullYear(),
        label: `${i + 1}`
      }));
      break;
  }

  // Get bugs created in the time range, grouped appropriately
  const trends = await VulnerabilityModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 }
      }
    }
  ]);

  // Map trends to labels
  let data = [];
  if (range === "today") {
    data = labels.map(label => {
      const trend = trends.find(t => t._id.hour === label.hour);
      return { label: label.label, value: trend ? trend.count : 0 };
    });
  } else if (range === "week" || range === "lastWeek") {
    data = labels.map(label => {
      const trend = trends.find(t => 
        t._id.day === label.day && 
        t._id.month === label.month && 
        t._id.year === label.year
      );
      return { label: label.label, value: trend ? trend.count : 0 };
    });
  } else {
    // month
    data = labels.map(label => {
      const trend = trends.find(t => 
        t._id.day === label.day && 
        t._id.month === label.month && 
        t._id.year === label.year
      );
      return { label: label.label, value: trend ? trend.count : 0 };
    });
  }

  res.json({ data, range });
});

// Public stats endpoint for landing page (no auth required)
router.get("/public", async (_req, res) => {
  const total = await VulnerabilityModel.countDocuments();

  const byStatus = await VulnerabilityModel.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const openCount = byStatus.find((s) => s._id === "open")?.count || 0;
  const fixedCount = byStatus.find((s) => s._id === "fixed")?.count || 0;
  const closedCount = byStatus.find((s) => s._id === "closed")?.count || 0;
  const resolvedCount = fixedCount + closedCount;

  res.json({
    total,
    openCount,
    resolvedCount,
  });
});

// Authenticated stats endpoint for dashboard
router.get("/", requireAuth, async (_req, res) => {
  const total = await VulnerabilityModel.countDocuments();

  const byStatus = await VulnerabilityModel.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const bySeverity = await VulnerabilityModel.aggregate([
    { $group: { _id: "$severity", count: { $sum: 1 } } },
  ]);

  res.json({
    total,
    byStatus,
    bySeverity,
  });
});

export default router;


