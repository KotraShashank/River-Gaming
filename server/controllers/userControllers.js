import authModel from "../models/authModel.js";

const updateCoins = async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (typeof amount !== "number") {
    return res.status(400).json({
      success: false,
      message: "Invalid coin amount.",
    });
  }

  try {
    const user = await authModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.coins += amount;

    // Ensure coins never drop below 0
    if (user.coins < 0) {
      return res.status(400).json({
        success: false,
        message: "Insufficient coins.",
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Coins ${amount >= 0 ? "added" : "deducted"} successfully.`,
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

const setFirst = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await authModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isFirst = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User first login flag updated successfully.",
      data: {
        isFirst: user.isFirst,
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
