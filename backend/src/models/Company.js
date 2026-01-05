const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const companySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      unique: true,
      required: true,
      default: () => uuidv4(),
      index: true,
    },
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    logo: {
      type: String,
      default: null,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    billingDetails: {
      contactName: String,
      contactEmail: String,
      contactPhone: String,
      taxId: String,
      billingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true,
    },
    settings: {
      timezone: {
        type: String,
        default: "UTC",
      },
      currency: {
        type: String,
        default: "USD",
      },
      invoiceMultiplier: {
        type: Number,
        default: 8,
        min: 1,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

companySchema.index({ companyId: 1, status: 1 });
companySchema.index({ name: 1, status: 1 });

companySchema.methods.softDelete = function () {
  this.status = "inactive";
  this.deletedAt = new Date();
  return this.save();
};

companySchema.methods.restore = function () {
  this.status = "active";
  this.deletedAt = null;
  return this.save();
};

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
