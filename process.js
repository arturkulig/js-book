const { markdown } = require("markdown");
const glob = require("glob");
const fs = require("fs");
const path = require("path");
const hljs = require("highlight.js/lib/highlight");

const unrecognized = [];

const pwd = path.resolve(__dirname, "./md");
const out = path.resolve(__dirname, "./html");

glob.sync(`${pwd}/**/*.md`).forEach(file => {
  console.log("---------");
  console.log(file);
  // console.log("---");
  // console.log(tree);
  // console.log("---");
  // console.log(outContents);

  const fileContents = fs.readFileSync(file, { encoding: "utf-8" });
  const tree = markdown.parse(fileContents);
  const outContents = convert(tree, file);
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
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss/dist/tailwind.min.css" rel="stylesheet">
  <style>
    * {
      margin: 0; padding: 0; box-sizing: border-box;
    }
    html {
      font-family: system-ui;
    }
  </style>
  <style>
    ${fs.readFileSync(
      path.resolve(__dirname, "node_modules/highlight.js/styles/rainbow.css"),
      { encoding: "utf-8" }
    )}
  </style>
  <body class="flex flex-col items-center justify-center bg-yellow-light">
    <div class="flex flex-col items-center max-w-5xl w-full p-8">
      ${contents}
    </div>  
  </body>
</html>
  `;
}

function convert(md, file) {
  if (typeof md === "string") {
    return md.split("\n").join(h("br"));
  }
  const [type, ...opts] = md;
  try {
    switch (type) {
      case "markdown":
        const dirCrumbs = crumbs(file);
        return h(
          "div",
          { class: "w-full max-w-md" },
          ...dirCrumbs,
          ...(opts || []).map(_ => convert(_, file)).filter(l => l != null)
        );

      case "header":
        const [{ level }, contents] = opts;
        return h(
          "h" + level.toString(),
          {
            class: [
              "text-black",
              [
                "(impossible)",
                "mt-8 text-5xl",
                "mt-6 text-4xl",
                "mt-5 text-3xl",
                "mt-4 text-2xl",
                "mt-3 text-xl",
                "mt-2 text-lg"
              ][level]
            ].join(" ")
          },
          convert(contents, file)
        );

      case "para":
        return h(
          "p",
          { class: "mt-4 text-black" },
          ...opts.map(_ => convert(_, file))
        );

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
        return createCodeBlock(lines.join(h("br")));

      case "link":
        const [{ href }, title] = opts;
        return title === "#"
          ? createMDAnchor(file, href)
          : h("a", { class: "text-blue-darkest", href }, title);

      case "hr":
        return h("hr", { class: "h-px bg-yellow-dark w-1/2 mx-auto my-8" });

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
      class: "inline bg-black text-white p-2 rounded shadow-md"
    },
    code.split("\n").join(h("br"))
  );
}

function createCodeBlock(code) {
  return h(
    "pre",
    null,
    h(
      "code",
      {
        class: [
          "block",
          "bg-black",
          "text-white",
          "p-4",
          "mt-4",
          "rounded",
          "shadow-md",
          "overflow-x-auto"
        ].join(" ")
      },
      code.split("\n").join(h("br"))
    )
  );
}

function crumbs(file) {
  let dir = path.dirname(file);
  const result = [];
  while (dir.split(path.sep).length >= pwd.split(path.sep).length) {
    const target = path.resolve(dir, "./index.md");
    if (target !== file) {
      const link = getLink(file, path.relative(path.dirname(file), target));
      if (link) {
        result.push(link);
      }
    }
    dir = path.resolve(dir, "..");
  }
  return result
    .reverse()
    .map((link, i) =>
      h(
        "a",
        { class: "block text-yellow-darkest no-underline", href: link.href },
        ...Array.from(Array(i), () =>
          h("span", { class: "inline-block w-4" }, "")
        ),
        i === 0 ? "🏠" : "↳",
        link.text
      )
    );
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
      class: [
        "outline-none",
        "block",
        "bg-yellow-darkest",
        "hover:bg-blue-darker",
        "focus:bg-blue-darker",
        "text-yellow",
        "hover:text-white",
        "focus:text-white",
        "no-underline",
        "rounded",
        "p-2"
      ].join(" "),
      href: link.href
    },
    link.text
  );
}

function getLink(from, to) {
  const targetPath = path.resolve(path.dirname(from), to);
  try {
    const targetContents = fs.readFileSync(targetPath, {
      encoding: "utf-8"
    });
    const lines = targetContents.split("\n");
    for (const line of lines) {
      if (line[0] === "#") {
        return {
          href: path.join(path.dirname(to), path.basename(to, ".md") + ".html"),
          text: line.match(/^#+(.*)$/)[1]
        };
      }
    }
  } catch (e) {
    console.warn({ target: targetPath, from, to }, "not found");
  }
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
