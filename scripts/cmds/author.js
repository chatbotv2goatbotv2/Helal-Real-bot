module.exports = {
  config: {
    name: "author",
    version: "2.2",
    author: "Helal", // <-- CREDIT LOCK: must remain "Helal" exactly for the command to run
    countDown: 3,
    role: 0,
    shortDescription: "List commands by author or show all authors",
    category: "system",
    guide: "{pn} <author name> | {pn} all"
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const { body, threadID, messageID } = event;
    // Only trigger if message starts with /author
    if (!body || !body.toLowerCase().startsWith("/author")) return;

    try {
      // ✅ Credit-Lock only affects THIS command
      const LOCKED_AUTHOR = "Helal";
      const myAuthor = module.exports?.config?.author || null;
      if (myAuthor !== LOCKED_AUTHOR) {
        return api.sendMessage(
          "❌ This command is credit-locked and cannot run because its author credit was modified.",
          threadID,
          messageID
        );
      }

      const args = body.trim().split(/\s+/).slice(1);
      const registry = global.GoatBot?.commands || global.commands;
      if (!registry)
        return api.sendMessage("⚠️ Command registry not found.", threadID, messageID);

      const all = [];
      const add = (name, cmd) => {
        const author = cmd?.config?.author || "Unknown";
        all.push({ name, author });
      };
      if (registry instanceof Map)
        for (const [n, c] of registry) add(n, c);
      else for (const n in registry) add(n, registry[n]);

      if (args.length === 1 && args[0].toLowerCase() === "all") {
        const grouped = {};
        for (const c of all) grouped[c.author] = (grouped[c.author] || 0) + 1;
        const list = Object.entries(grouped)
          .sort((a, b) => b[1] - a[1])
          .map(([n, c], i) => `${i + 1}. ${n} - ${c}`)
          .join("\n");
        return api.sendMessage(
          `🌟 All Authors & Command Counts\n────────────────────────────\n${list}\n────────────────────────────\nTotal Authors: ${Object.keys(grouped).length}\n\n🔒 Credit: ${LOCKED_AUTHOR}`,
          threadID,
          messageID
        );
      }

      if (!args.length)
        return api.sendMessage("Usage:\n/author <author name>\n/author all", threadID, messageID);

      const q = args.join(" ").toLowerCase();
      const found = all.filter(c => c.author.toLowerCase().includes(q));
      if (!found.length)
        return api.sendMessage(`❌ No commands found for author: "${args.join(" ")}"`, threadID, messageID);

      const list = found.map((c, i) => `│ ${i + 1}. ${c.name}`).join("\n");
      return api.sendMessage(
        `🎯 Commands by "${args.join(" ")}"\n┌──────────────────────────┐\n${list}\n└──────────────────────────┘\nTotal Commands: ${found.length}\n\n🔒 Credit: ${LOCKED_AUTHOR}`,
        threadID,
        messageID
      );
    } catch (err) {
      api.sendMessage(`❌ Error: ${err.message}`, event.threadID, event.messageID);
    }
  }
};