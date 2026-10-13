import authModel from "../models/authModel.js";

const updateCoins = async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (typeof amount !== "number" || !Number.isInteger(amount)) {
    return res.status(400).json({
      success: false,
      message: "Invalid coin amount.",
    });
  }

  // Clients may only spend coins here; crediting is done server-side
  // (quiz results). Otherwise any user could mint coins for themselves.
  if (amount >= 0) {
    return res.status(400).json({
      success: false,
      message: "Only deductions are allowed.",
    });
  }

  try {
    // Atomic: the balance check and the deduction are one DB operation.
    const user = await authModel.findOneAndUpdate(
      { _id: userId, coins: { $gte: -amount } },
      { $inc: { coins: amount } },
      { new: true }
    );

    if (!user) {
      const exists = await authModel.exists({ _id: userId });
      return res.status(exists ? 400 : 404).json({
        success: false,
        message: exists ? "Insufficient coins." : "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coins deducted successfully.",
      data: {
        coins: user.coins,
      },
    });
  } catch (err) {
    console.error("Error updating coins:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// The 50 welcome coins are the account's starting balance (schema default),
// so this never touches coins. It only flips isFirst, atomically, and reports
// whether THIS call was the first login so the welcome message shows once.
const setFirst = async (req, res) => {
  const userId = req.user.id;

  try {
    const updated = await authModel.findOneAndUpdate(
      { _id: userId, isFirst: true },
      { $set: { isFirst: false } },
      { new: true }
    );

    if (!updated) {
      const exists = await authModel.exists({ _id: userId });
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "User first login flag updated successfully.",
      data: {
        isFirst: false,
        firstLogin: !!updated,
      },
    });
  } catch (err) {
    console.error("Error updating isFirst:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export { updateCoins, setFirst };
