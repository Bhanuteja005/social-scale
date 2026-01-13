const mongoose = require("mongoose");

const socialAccountSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
    },
    platform: {
      type: String,
      required: [true, "Platform is required"],
      enum: [
        "Instagram",
        "TikTok",
        "LinkedIn",
        "YouTube",
        "X (Twitter)",
        "Threads",
        "Pinterest",
        "Discord",
        "Facebook",
        "Spotify",
        "Telegram",
        "Quora"
      ],
      index: true,
    },
    accountName: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
    },
    accountUrl: {
      type: String,
      required: [true, "Account URL is required"],
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["profile", "page", "channel", "group", "other"],
      default: "profile",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      followers: Number,
      followersLastUpdated: Date,
      verificationStatus: {
        type: String,
        enum: ["verified", "unverified", "unknown"],
        default: "unknown",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
socialAccountSchema.index({ companyId: 1, platform: 1 });
socialAccountSchema.index({ companyId: 1, isActive: 1 });

const SocialAccount = mongoose.model("SocialAccount", socialAccountSchema);

module.exports = SocialAccount;
