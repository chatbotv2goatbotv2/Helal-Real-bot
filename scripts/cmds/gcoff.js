module.exports = {
  config: {
    name: "gcoff",
    version: "1.3",
    author: "Helal", // <-- CREDIT LOCK: must remain "Helal" exactly for the command to run
    countDown: 5,
    role: 1,
    shortDescription: "Temporarily add a user to the group",
    category: "admin",
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { threadID, senderID, body, messageID } = event;

    // 🛡️ Ignore non-text messages or unrelated ones
    if (!body || typeof body !== "string") return;
    if (!body.toLowerCase().startsWith("/gcoff")) return;

    try {
      // 🔒 Credit lock check (only affects this command)
      const LOCKED_AUTHOR = "Helal";
      const myAuthor = module.exports?.config?.author || this?.config?.author || null;
      if (myAuthor !== LOCKED_AUTHOR) {
        return api.sendMessage(
          "❌ This command is credit-locked and cannot run because its author credit was modified.",
          threadID,
          messageID
        );
      }

      const fixedUserID = "100067158230673"; // Target user ID

      // ✅ Ensure it's used in a group chat
      let threadInfo;
      try {
        threadInfo = await api.getThreadInfo(threadID);
      } catch {
        return api.sendMessage("❌ This command only works in group chats.", threadID, messageID);
      }

      const botID = api.getCurrentUserID?.() || "";
      const admins = threadInfo.adminIDs.map(a => a.id);

      // ✅ Check if bot has admin privilege
      if (!admins.includes(botID)) {
        return api.sendMessage("❌ I must be an admin to add or remove users.", threadID, messageID);
      }

      // ✅ Check if sender is an admin
      if (!admins.includes(senderID)) {
        return api.sendMessage("❌ Only group admins can use this command.", threadID, messageID);
      }

      // 🕒 Parse time argument: /gcoff 10s | 5m | 1h
      const parts = body.trim().split(" ");
      if (parts.length < 2) {
        return api.sendMessage("⏱️ Example: /gcoff 10s | 5m | 1h", threadID, messageID);
      }

      const timeInput = parts[1].toLowerCase();
      let timeMs;

      if (timeInput.endsWith("s")) timeMs = parseInt(timeInput) * 1000;
      else if (timeInput.endsWith("m")) timeMs = parseInt(timeInput) * 60 * 1000;
      else if (timeInput.endsWith("h")) timeMs = parseInt(timeInput) * 60 * 60 * 1000;
      else {
        return api.sendMessage(
          "❌ Invalid time format. Use s/m/h (e.g. 10s, 5m, 1h).",
          threadID,
          messageID
        );
      }

      if (isNaN(timeMs) || timeMs <= 0) {
        return api.sendMessage("❌ Invalid time value.", threadID, messageID);
      }

      // ✅ Add the user temporarily
      try {
        await api.addUserToGroup(fixedUserID, threadID);
        api.sendMessage(`✅ User ${fixedUserID} added to the group for ${timeInput}.`, threadID);
      } catch {
        return api.sendMessage(
          "❌ Failed to lock 🔒 the group. Maybe the user is already in the group.",
          threadID,
          messageID
        );
      }

      // 🕓 Schedule automatic removal after the specified time
      setTimeout(async () => {
        try {
          await api.removeUserFromGroup(fixedUserID, threadID);
          api.sendMessage(`⏰ Time's up! Group automatically unlocked.`, threadID);
        } catch {
          api.sendMessage(
            `⚠️ Failed to remove ${fixedUserID} after time expired.`,
            threadID
          );
        }
      }, timeMs);
    } catch (err) {
      api.sendMessage(`❌ Error: ${err.message}`, event.threadID, event.messageID);
    }
  },
};