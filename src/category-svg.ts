export const MAX_CATEGORY_SVG_LENGTH = 32 * 1024;
const svgEncoder = new TextEncoder();
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
const ELEMENT_ATTRIBUTES: Record<string, readonly string[]> = {
  svg: ["viewBox", "width", "height", "x", "y", "preserveAspectRatio", "version"],
  g: [], defs: [], title: [], desc: [],
  path: ["d", "pathLength"],
  rect: ["x", "y", "width", "height", "rx", "ry", "pathLength"],
  circle: ["cx", "cy", "r", "pathLength"],
  ellipse: ["cx", "cy", "rx", "ry", "pathLength"],
  line: ["x1", "y1", "x2", "y2", "pathLength"],
  polyline: ["points", "pathLength"], polygon: ["points", "pathLength"],
  linearGradient: ["x1", "y1", "x2", "y2", "gradientUnits", "gradientTransform", "spreadMethod", "href"],
  radialGradient: ["cx", "cy", "r", "fx", "fy", "fr", "gradientUnits", "gradientTransform", "spreadMethod", "href"],
  stop: ["offset", "stop-color", "stop-opacity"],
  clipPath: ["clipPathUnits"]
};
const PAINT_ATTRIBUTES = new Set([
  "fill", "stroke", "fill-opacity", "stroke-opacity", "opacity", "fill-rule", "clip-rule",
  "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-dasharray",
  "stroke-dashoffset", "clip-path", "vector-effect", "color", "display", "visibility", "stop-color", "stop-opacity"
]);
const NUMBER = "[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?";
const lengthPattern = new RegExp(`^${NUMBER}(?:%|px|em|rem|pt|pc|cm|mm|in)?$`);
const numberListPattern = new RegExp(`^${NUMBER}(?:[\\s,]+${NUMBER})*$`);
const localReferencePattern = /^url\(\s*(['"]?)#([A-Za-z_][\w.:-]*)\1\s*\)$/;
const idPattern = /^[A-Za-z_][\w.:-]*$/;

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function decodeXml(value: string): string | null {
  const entityPattern = /&(?:amp|lt|gt|quot|apos|#\d{1,7}|#x[\da-fA-F]{1,6});/g;
  if (value.replace(entityPattern, "").includes("&")) return null;
  let valid = true;
  const result = value.replace(entityPattern, (entity) => {
    const named: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };
    if (Object.hasOwn(named, entity)) return named[entity];
    const code = entity.startsWith("&#x") ? Number.parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1));
    if (code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
      valid = false;
      return "";
    }
    return String.fromCodePoint(code);
  });
  return valid && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\ufffe\uffff]/.test(result) ? result : null;
}

function isPaint(value: string) {
  return /^[a-zA-Z][a-zA-Z-]*$/.test(value)
    || /^#(?:[\da-fA-F]{3,4}|[\da-fA-F]{6}|[\da-fA-F]{8})$/.test(value)
    || /^(?:rgb|rgba|hsl|hsla)\([\d\s.,%+\-/]+\)$/.test(value)
    || localReferencePattern.test(value);
}

function isAttributeValue(name: string, value: string) {
  if (name === "id") return idPattern.test(value);
  if (name === "href") return value.startsWith("#") && idPattern.test(value.slice(1));
  if (["fill", "stroke", "color", "stop-color"].includes(name)) return isPaint(value);
  if (name === "clip-path") return value === "none" || localReferencePattern.test(value);
  if (name === "d") return /^[MmLlHhVvCcSsQqTtAaZz\d\s.,eE+\-]*$/.test(value);
  if (name === "viewBox") return numberListPattern.test(value) && value.split(/[\s,]+/).length === 4;
  if (name === "points") return numberListPattern.test(value);
  if (name === "stroke-dasharray") return value === "none" || numberListPattern.test(value);
  if (name === "transform" || name === "gradientTransform") {
    return /^(?:\s*(?:matrix|translate|scale|rotate|skewX|skewY)\s*\([\d\s.,eE+\-]+\)\s*)+$/.test(value);
  }
  const enums: Record<string, readonly string[]> = {
    "fill-rule": ["nonzero", "evenodd"], "clip-rule": ["nonzero", "evenodd"],
    "stroke-linecap": ["butt", "round", "square"], "stroke-linejoin": ["miter", "miter-clip", "round", "bevel", "arcs"],
    "vector-effect": ["none", "non-scaling-stroke"], gradientUnits: ["userSpaceOnUse", "objectBoundingBox"],
    clipPathUnits: ["userSpaceOnUse", "objectBoundingBox"], spreadMethod: ["pad", "reflect", "repeat"],
    display: ["none", "inline"], visibility: ["visible", "hidden", "collapse"], version: ["1.0", "1.1", "2.0"]
  };
  if (Object.hasOwn(enums, name)) return enums[name].includes(value);
  if (name === "preserveAspectRatio") return /^(?:none|x(?:Min|Mid|Max)Y(?:Min|Mid|Max)(?:\s+(?:meet|slice))?)$/.test(value);
  return lengthPattern.test(value);
}

function readPaintStyle(value: string): Map<string, string> | null {
  const result = new Map<string, string>();
  for (const declaration of value.split(";")) {
    if (!declaration.trim()) continue;
    const separator = declaration.indexOf(":");
    if (separator < 0) return null;
    const name = declaration.slice(0, separator).trim().toLowerCase();
    const paint = declaration.slice(separator + 1).trim().replace(/\s*!important$/, "");
    if (!PAINT_ATTRIBUTES.has(name) || !isAttributeValue(name, paint)) return null;
    result.set(name, paint);
  }
  return result;
}

/** 仅接受静态图标子集，不是通用 SVG/XML 净化器；输出仍须通过 img 隔离渲染。 */
export function normalizeCategorySvg(input: string): string | null {
  if (input.length > MAX_CATEGORY_SVG_LENGTH || svgEncoder.encode(input).byteLength > MAX_CATEGORY_SVG_LENGTH
    || /[\ud800-\udfff]/u.test(input)) return null;
  let source = input.trim();
  const fenced = /^```(?:svg|xml)?\s*\r?\n([\s\S]*?)\r?\n```$/i.exec(source);
  if (fenced) source = fenced[1].trim();
  source = source.replace(/\\(?=[<>])/g, "").replace(
    /xmlns=(['"])\[http:\/\/www\.w3\.org\/2000\/svg\]\(http:\/\/www\.w3\.org\/2000\/svg\)\1/g,
    `xmlns="${SVG_NAMESPACE}"`
  );
  if (!source || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\ufffe\uffff]/.test(source)) return null;
  let cursor = 0;
  let roots = 0;
  let nodes = 0;
  const stack: string[] = [];
  const output: string[] = [];
  const readName = () => {
    const name = /^[A-Za-z_][A-Za-z0-9_.:-]*/.exec(source.slice(cursor))?.[0] ?? "";
    cursor += name.length;
    return name;
  };
  const skipWhitespace = () => {
    while (/[\t\r\n ]/.test(source[cursor] ?? "")) cursor += 1;
  };

  while (cursor < source.length) {
    if (source[cursor] !== "<") {
      const end = source.indexOf("<", cursor);
      const text = source.slice(cursor, end < 0 ? source.length : end);
      cursor = end < 0 ? source.length : end;
      if (text.trim()) {
        if (!["title", "desc"].includes(stack.at(-1) ?? "")) return null;
        const decoded = decodeXml(text);
        if (decoded === null) return null;
        output.push(escapeXml(decoded));
      }
      continue;
    }
    if (source.startsWith("<!--", cursor)) {
      const end = source.indexOf("-->", cursor + 4);
      if (end < 0 || source.slice(cursor + 4, end).includes("--")) return null;
      cursor = end + 3;
      continue;
    }
    if (source.startsWith("<!", cursor) || source.startsWith("<?", cursor)) return null;
    const closing = source.startsWith("</", cursor);
    cursor += closing ? 2 : 1;
    const tag = readName();
    if (!Object.hasOwn(ELEMENT_ATTRIBUTES, tag)) return null;
    if (closing) {
      skipWhitespace();
      if (source[cursor++] !== ">" || stack.pop() !== tag) return null;
      output.push(`</${tag}>`);
      continue;
    }
    if ((!stack.length && (tag !== "svg" || roots++ > 0)) || (stack.length && tag === "svg")) return null;
    if (["title", "desc"].includes(stack.at(-1) ?? "")) return null;
    // ponytail: 图标最多 256 个节点、16 层；复杂插画应使用图片地址。
    if (++nodes > 256 || stack.length >= 16) return null;
    const attributes = new Map<string, string>();
    const seen = new Set<string>();
    let styles: Map<string, string> | null = null;
    let selfClosing = false;
    while (cursor < source.length) {
      const beforeWhitespace = cursor;
      skipWhitespace();
      if (source.startsWith("/>", cursor)) {
        cursor += 2;
        selfClosing = true;
        break;
      }
      if (source[cursor] === ">") { cursor += 1; break; }
      if (cursor === beforeWhitespace) return null;
      const originalName = readName();
      if (!originalName || seen.has(originalName) || /^on/i.test(originalName)) return null;
      seen.add(originalName);
      skipWhitespace();
      if (source[cursor++] !== "=") return null;
      skipWhitespace();
      const quote = source[cursor++];
      if (quote !== '"' && quote !== "'") return null;
      const end = source.indexOf(quote, cursor);
      if (end < 0) return null;
      const rawValue = source.slice(cursor, end);
      if (rawValue.includes("<")) return null;
      const decoded = decodeXml(rawValue);
      if (decoded === null) return null;
      const value = decoded.trim();
      cursor = end + 1;
      if (originalName === "xmlns" || originalName === "xmlns:xlink") {
        if (tag !== "svg" || value !== (originalName === "xmlns" ? SVG_NAMESPACE : XLINK_NAMESPACE)) return null;
        continue;
      }
      if (["class", "t", "p-id", "role", "focusable"].includes(originalName) || /^(?:aria-|data-)[\w-]+$/.test(originalName)) continue;
      if (originalName === "style") {
        styles = readPaintStyle(value);
        if (styles === null) return null;
        continue;
      }
      const name = originalName === "xlink:href" ? "href" : originalName;
      if (attributes.has(name) || !(name === "id" || name === "transform" || PAINT_ATTRIBUTES.has(name) || ELEMENT_ATTRIBUTES[tag].includes(name))) return null;
      if (!isAttributeValue(name, value)) return null;
      attributes.set(name, value);
    }
    if (source[cursor - 1] !== ">") return null;
    for (const [name, value] of styles ?? []) attributes.set(name, value);
    if (tag === "svg") attributes.set("xmlns", SVG_NAMESPACE);
    output.push(`<${tag}${Array.from(attributes, ([name, value]) => ` ${name}="${escapeXml(value)}"`).join("")}${selfClosing ? "/>" : ">"}`);
    if (!selfClosing) stack.push(tag);
  }
  const normalized = output.join("");
  return roots === 1 && stack.length === 0 && svgEncoder.encode(normalized).byteLength <= MAX_CATEGORY_SVG_LENGTH ? normalized : null;
}
