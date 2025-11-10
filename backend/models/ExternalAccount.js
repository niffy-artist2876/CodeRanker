import mongoose from "mongoose";

/**
 * ExternalAccount model
 * - Stores external platform handles keyed by a user's PESU profile email.
 * - Designed to be looked up strictly by email (unique).
 */
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

    // External platform identifiers (nullable)
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

    // PESU Auth display name (cached for quick leaderboard display)
    displayName: {
      type: String,
      default: null,
      trim: true,
    },

    // Convenience flags indicating whether a handle is connected

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

/**
 * Instance method: refresh connected flags based on current handle values.
 */
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

    // Normalize empty strings to null for consistency
    this.leetcodeUsername = lc || null;
    this.codeforcesHandle = cf || null;

    this.leetcodeConnected = Boolean(this.leetcodeUsername);
    this.codeforcesConnected = Boolean(this.codeforcesHandle);
  };

/**
 * Pre-save: Ensure flags are always consistent.
 */
externalAccountSchema.pre("save", function preSave(next) {
  try {
    this.refreshConnectedFlags();
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Static helper: Normalize/defensively lower-case-trim an email.
 */
externalAccountSchema.statics.normalizeEmail = function normalizeEmail(email) {
  return (email || "").toString().trim().toLowerCase();
};

/**
 * Static helper: Upsert (create if not exists) a document by email.
 * Returns the existing or newly created document.
 */
externalAccountSchema.statics.upsertByEmail = async function upsertByEmail({
  email,
  leetcodeUsername = undefined,
  codeforcesHandle = undefined,
} = {}) {
  const normalized = this.normalizeEmail(email);
  if (!normalized) {
    throw new Error("Email is required");
  }

  // Build an update that sets values only when provided
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

  // Ensure flags are correct even after findOneAndUpdate (no save hook fired)
  doc.refreshConnectedFlags();
  // Only save if the flags changed or normalization modified fields
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
