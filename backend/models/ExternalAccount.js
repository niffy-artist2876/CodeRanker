import mongoose from "mongoose";

const externalAccountSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    leetcodeUsername: {
      type: String,
      default: null,
      trim: true,
    },

    codeforcesHandle: {
      type: String,

      default: null,

      trim: true,
    },

    displayName: {
      type: String,
      default: null,
      trim: true,
    },


    leetcodeConnected: {
      type: Boolean,
      default: false,
      index: true,
    },
    codeforcesConnected: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

externalAccountSchema.methods.refreshConnectedFlags =
  function refreshConnectedFlags() {
    const lc =
      typeof this.leetcodeUsername === "string"
        ? this.leetcodeUsername.trim()
        : null;
    const cf =
      typeof this.codeforcesHandle === "string"
        ? this.codeforcesHandle.trim()
        : null;

    this.leetcodeUsername = lc || null;
    this.codeforcesHandle = cf || null;

    this.leetcodeConnected = Boolean(this.leetcodeUsername);
    this.codeforcesConnected = Boolean(this.codeforcesHandle);
  };


externalAccountSchema.pre("save", function preSave(next) {
  try {
    this.refreshConnectedFlags();
    next();
  } catch (err) {
    next(err);
  }
});


externalAccountSchema.statics.normalizeEmail = function normalizeEmail(email) {
  return (email || "").toString().trim().toLowerCase();
};


externalAccountSchema.statics.upsertByEmail = async function upsertByEmail({
  email,
  leetcodeUsername = undefined,
  codeforcesHandle = undefined,
} = {}) {
  const normalized = this.normalizeEmail(email);
  if (!normalized) {
    throw new Error("Email is required");
  }

  const update = {
    $setOnInsert: { email: normalized },
  };

  if (leetcodeUsername !== undefined) {
    update.$set = { ...(update.$set || {}), leetcodeUsername };
  }
  if (codeforcesHandle !== undefined) {
    update.$set = { ...(update.$set || {}), codeforcesHandle };
  }

  const doc = await this.findOneAndUpdate({ email: normalized }, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  }).exec();

  doc.refreshConnectedFlags();
  if (
    doc.isModified("leetcodeUsername") ||
    doc.isModified("codeforcesHandle") ||
    doc.isModified("leetcodeConnected") ||
    doc.isModified("codeforcesConnected")
  ) {
    await doc.save();
  }

  return doc;
};

const ExternalAccount =
  mongoose.models.ExternalAccount ||
  mongoose.model("ExternalAccount", externalAccountSchema);

export default ExternalAccount;
