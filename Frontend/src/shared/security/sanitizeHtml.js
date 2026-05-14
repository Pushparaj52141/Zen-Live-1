import DOMPurify from "dompurify";

// Centralized HTML sanitization for user-generated rich text.
// The goal is to preserve basic formatting used by the Quill/contentEditable editors
// while blocking scripts, event handlers, and dangerous URLs.
const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "ul",
    "ol",
    "li",
    "span",
    "div",
    "h1",
    "h2",
    "h3",
    "blockquote",
    "code",
    "pre",
  ],
  ALLOWED_ATTR: ["data-reply-text"],
};

export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml || typeof dirtyHtml !== "string") return "";
  return DOMPurify.sanitize(dirtyHtml, SANITIZE_OPTIONS);
}

