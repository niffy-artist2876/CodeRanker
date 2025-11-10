import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  srn: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    default: "student"
  },
  profile: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } 
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  revoked: {
    type: Boolean,
    default: false,
    index: true
  },
  revokedAt: {
    type: Date,
    default: null
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
});

tokenSchema.index({ userId: 1, revoked: 1 });
tokenSchema.index({ token: 1, revoked: 1 });

tokenSchema.methods.revoke = async function() {
  this.revoked = true;
  this.revokedAt = new Date();
  return this.save();
};


tokenSchema.statics.findValidToken = async function(token) {
  const tokenDoc = await this.findOne({
    token,
    revoked: false,
    expiresAt: { $gt: new Date() }
  });

  if (tokenDoc) {
    tokenDoc.lastUsed = new Date();
    await tokenDoc.save();
  }

  return tokenDoc;
};

tokenSchema.statics.revokeAllUserTokens = async function(userId) {
  return this.updateMany(
    { userId, revoked: false },
    { 
      $set: { 
        revoked: true, 
        revokedAt: new Date() 
      } 
    }
  );
};

tokenSchema.statics.cleanupExpired = async function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

const Token = mongoose.model("Token", tokenSchema);

export default Token;

