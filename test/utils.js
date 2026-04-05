let normalizeMultilineText = text => text.replace(/\r\n/g, '\n').trim();

module.exports = { normalizeMultilineText };
