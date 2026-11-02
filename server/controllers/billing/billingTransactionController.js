// Paginated billing transaction history (admin sees all, users see their own). Split from routes/BillingRoutes.js; handler bodies unchanged.

const BillingTransaction = require("../../models/BillingTransaction");

const getBillingTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // For admin users, get all transactions
    // For other users, get only their transactions
    const query = req.user.role === "admin" ? {} : { userId: req.user.id };

    const transactions = await BillingTransaction.find(query)
      .populate("userId", "name email role")
      .populate("relatedCourse", "title")
      .populate("relatedPayment", "amount method")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalTransactions = await BillingTransaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / limit);

    res.status(200).json({
      success: true,
      message: "Billing transactions retrieved successfully",
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalTransactions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error getting billing transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve billing transactions",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Data retrieval failed",
    });
  }
};

module.exports = {
  getBillingTransactions
};
