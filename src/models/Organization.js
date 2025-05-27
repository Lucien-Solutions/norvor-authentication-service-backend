// models/Organization.js
const mongoose = require("mongoose");

const ModuleAccessSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: ["crm", "pm", "hr"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    activatedAt: Date,
  },
  { _id: false }
);

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
      unique: true,
      sparse: true, // allows nulls
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    features: [ModuleAccessSchema],

    contactInfo: {
      email: String,
      phone: String,
      address: String,
      country: String,
    },

    meta: {
      industry: String,
      size: String,
      website: String,
      notes: String,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Organization", OrganizationSchema);
