const { markdown } = require("markdown");
const glob = require("glob");
const fs = require("fs");
const path = require("path");
const hljs = require("highlight.js/lib/highlight");
const sass = require("node-sass");

const unrecognized = [];

const pwd = path.resolve(__dirname, "./md/");
const out = path.resolve(__dirname, "./html/");

fs.mkdirSync(out, { recursive: true });

fs.writeFileSync(
  path.resolve(out, "./index.css"),
  sass.renderSync({
    file: path.resolve(pwd, "./index.scss")
  }).css,
  { encoding: "utf-8" }
);

fs.copyFileSync(
  path.resolve(__dirname, "node_modules/highlight.js/styles/rainbow.css"),
  path.resolve(out, "./code.css")
);

glob.sync(`${pwd}/**/*.md`).forEach(file => {
  const fileContents = fs.readFileSync(file, { encoding: "utf-8" });
  const parsed = markdown.parse(fileContents);
  const converted = convert(parsed, file);
  const navCrumbs = crumbs(file);
  const outContents = [...(navCrumbs ? [navCrumbs] : []), converted].join("");
  if ((fileContents.split("\n")[0] || "").toLowerCase() === "debug") {
    console.log({ file, parsed, converted });
  }
  const outFile = main(outContents);

  const outFilename = path.join(
    path.resolve(out, path.dirname(path.relative(pwd, file))),
    path.basename(file, ".md") + ".html"
  );
  fs.mkdirSync(path.dirname(outFilename), { recursive: true });
  fs.writeFileSync(outFilename, outFile, { encoding: "utf-8" });
});

unrecognized.forEach(_ => {
  console.log("unrecognized", _);
});

function main(contents) {
  return `
<html>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="/index.css" rel="stylesheet">
  <link href="/code.css" rel="stylesheet">
  <body>
    ${contents}
  </body>
</html>
  `;
}

function convert(md, file) {
  if (typeof md === "string") {
    return md
      .replace(/\\(.)/g, "$1")
      .split("\n")
      .filter(l => !!l)
      .join(h("br"));
  }
  const [type, ...opts] = md;
  try {
    switch (type) {
      case "markdown":
        return h(
          "section",
          { class: "md" },
          ...(opts || []).map(_ => convert(_, file)).filter(l => l != null)
        );

      case "header":
        const [{ level }, ...contents] = opts;
        return h(
          "h" + level.toString(),
          {
            class: "md"
          },
          ...contents.map(content => convert(content, file))
        );

      case "para":
        return opts.length
          ? h(
              "div",
              {
                class: [
                  "md",
                  ...(typeof opts[0] === "string" && opts[0].startsWith("⚠️")
                    ? ["warn"]
                    : []),
                  ...(typeof opts[0] === "string" && opts[0].startsWith("ℹ️")
                    ? ["info"]
                    : []),
                  ...(typeof opts[0] === "string" && opts[0].startsWith("❌")
                    ? ["error"]
                    : [])
                ].join(" "),
                ...(typeof opts[0] === "string" ? { tabindex: "0" } : {})
              },
              ...opts.map(content =>
                typeof content === "string"
                  ? h("span", { class: "md" }, convert(content, file))
                  : convert(content, file)
              )
            )
          : "";

      case "inlinecode":
        const lines = opts[0].split("\n").map(l => (l !== "//" ? l : ""));
        if (lines.length < 2) {
          return createCodeInline(lines.join("\n"));
        }
        if (
          fs.existsSync(
            path.resolve(
              __dirname,
              "./node_modules/highlight.js/lib/languages",
              lines[0] + ".js"
            )
          )
        ) {
          const lang = require("highlight.js/lib/languages/" + lines[0]);
          hljs.registerLanguage(lines[0], lang);
          const { value } = hljs.highlight(
            lines[0],
            lines.slice(1).join("\n"),
            false
          );
          return createCodeBlock(value);
        }
        return createCodeBlock(
          (lines[0] === "" ? lines.slice(1) : lines).join(h("br"))
        );

      case "link":
        const [{ href }, title] = opts;
        return title === "#"
          ? createMDAnchor(file, href)
          : h("a", { class: "md", href }, title);

      case "hr":
        return h("hr", { class: "md" });

      case "strong":
        return h(
          "strong",
          { class: "md" },
          ...opts.map(opt => convert(opt, file))
        );

      case "em":
        return h("em", { class: "md" }, ...opts.map(opt => convert(opt, file)));

      default:
        unrecognized.push([type, ...opts]);
        console.log("unrecognized token", type);
        return undefined;
    }
  } catch (e) {
    console.error("Error whilst parsing", [type, ...opts]);
    console.error(e);
    process.exit(1);
  }
}

function createCodeInline(code) {
  return h(
    "code",
    {
      class: "code-inline"
    },
    code.split("\n").join(h("br"))
  );
}

function createCodeBlock(code) {
  return h(
    "code",
    {
      class: "code-block",
      tabindex: "0"
    },
    code.split("\n").join(h("br"))
  );
}

function crumbs(file) {
  let dir = path.dirname(file);
  const parents = [];
  while (dir.split(path.sep).length >= pwd.split(path.sep).length) {
    const target = path.resolve(dir, "./index.md");
    if (target !== file) {
      const link = getLink(file, path.relative(path.dirname(file), target));
      if (link) {
        parents.push(link);
      }
    }
    dir = path.resolve(dir, "..");
  }
  if (parents.length > 1) {
    const parentsFromTopMost = parents.slice(0).reverse();
    return h(
      "details",
      { class: "crumbs" },
      h(
        "summary",
        { class: "crumbs__short" },
        ...parentsFromTopMost
          .slice(-1)
          .map(link => h("span", { class: "crumbs__short__parent" }, link.text))
      ),
      ...parentsFromTopMost.map(link =>
        h(
          "a",
          {
            class: `crumbs__item`,
            href: link.href
          },
          h("span", { class: "crumbs__item__label" }, link.text)
        )
      )
    );
  }
  if (parents.length === 1) {
    return h(
      "details",
      { class: "crumbs", open: "" },
      h("summary", { class: "crumbs__short crumbs__short--empty" }, ""),
      h(
        "a",
        {
          class: `crumbs__item`,
          href: parents[0].href
        },
        parents[0].text
      )
    );
  }
  return "";
}

function createMDAnchor(from, to) {
  const link = getLink(from, to);
  if (!link) {
    return h(
      "div",
      { class: "block bg-red text-white p-2" },
      `${to} not found`
    );
  }
  return h(
    "a",
    {
      class: "seeother",
      href: link.href
    },
    h("span", { class: "seeother__label" }, convert(link.text, from))
  );
}

function getLink(from, to) {
  const targetPath = path.resolve(path.dirname(from), to);
  // try {
  const targetContents = markdown
    .parse(
      fs.readFileSync(targetPath, {
        encoding: "utf-8"
      })
    )
    .slice(1);
  const header = targetContents.find(([type, ...opts]) => {
    return type === "header" && opts[0].level === 1;
  });
  if (header) {
    return {
      href: path.join(path.dirname(to), path.basename(to, ".md") + ".html"),
      text: header
        .slice(2)
        .map(_ => convert(_, from))
        .join("")
    };
  }
  // } catch (e) {
  // console.warn({ target: targetPath, from, to }, "not found");
  // }
  return null;
}

function h(tagName, props, ...children) {
  const propsString =
    props == null
      ? ""
      : Object.keys(props)
          .map(name => `${name}="${props[name]}"`)
          .join(" ");
  const openingTag = [tagName, propsString].filter(_ => !!_).join(" ");
  if (children.length == 0) {
    return `<${openingTag} />`;
  }
  return `<${openingTag}>${children.join("\n\n")}</${tagName}>`;
}
