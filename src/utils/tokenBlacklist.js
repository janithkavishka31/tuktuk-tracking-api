/**
 * In-memory token blacklist for logout functionality.
 * In production, use Redis or a database for persistence.
 */
const jwt = require('jsonwebtoken');

// Store blacklisted tokens with their expiration times
const blacklist = new Map();

function blacklistToken(token) {
  try {
    // Decode token to get expiration time
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.exp) {
      // If no expiration, set a default 24 hour expiration
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      blacklist.set(token, expiresAt);
      return;
    }

    // Store token with its actual expiration time
    const expiresAt = new Date(decoded.exp * 1000);
    blacklist.set(token, expiresAt);
  } catch (error) {
    // If decode fails, still blacklist with default expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    blacklist.set(token, expiresAt);
  }
}

function isTokenBlacklisted(token) {
  if (!blacklist.has(token)) {
    return false;
  }

  // Check if token has expired from the blacklist
  const expiresAt = blacklist.get(token);
  if (expiresAt < new Date()) {
    // Token has expired, remove it
    blacklist.delete(token);
    return false;
  }

  return true;
}

function clearBlacklist() {
  blacklist.clear();
}

/**
 * Start automatic cleanup of expired tokens
 * Runs every hour to remove tokens past their expiration time
 */
function startCleanupInterval() {
  setInterval(() => {
    const now = new Date();
    let cleanedCount = 0;

    for (const [token, expiresAt] of blacklist.entries()) {
      if (expiresAt < now) {
        blacklist.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[TokenBlacklist] Cleaned up ${cleanedCount} expired tokens. Total in blacklist: ${blacklist.size}`);
    }
  }, 60 * 60 * 1000); // Run every hour
}

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
  clearBlacklist,
  startCleanupInterval,
};
