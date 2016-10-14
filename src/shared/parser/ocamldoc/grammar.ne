@builtin "number.ne"
@builtin "whitespace.ne"

main -> SENTENCE

FORMAT_CODE -> "[" FORMAT_CODE:* "]" {% (data) => `[${data[1].join("")}]` %}
             | [^\[\]]:+ {% (data) => data[0].join("") %}

LIST_ITEM -> "{- " _ SENTENCE _ "}" {% (data) => data[2] %}
           | __ {% () => "" %}

SENTENCE -> WORD:* {% (data) => data[0].join("") %}

SPACE -> wschar

WORD -> "{{:" SENTENCE "}" SENTENCE "}" {% (data) => `[${data[3]}](${data[1]})` %}
      | "{^"            SENTENCE    "}" {% (data) =>  `{^${data[1]}}` %}
      | "{_"            SENTENCE    "}" {% (data) =>  `{_${data[1]}}` %}
      | "{" [0-9] SPACE SENTENCE    "}" {% (data) => `${"#".repeat(Number.parseInt(data[1]))} ${data[3]}` %}
      | "{!"            SENTENCE    "}" {% (data) =>  `[${data[1]}](http://caml.inria.fr/pub/docs/manual-ocaml/libref/index.html)` %}
      | "{b"      SPACE SENTENCE    "}" {% (data) => `**${data[2]}**` %}
      | "{e"      SPACE SENTENCE    "}" {% (data) =>  `*${data[2]}*` %}
      | "{i"      SPACE SENTENCE    "}" {% (data) =>  `*${data[2]}*` %}
      | "{li"     SPACE LIST_ITEM:* "}" {% (data) =>  `${"\n"}${data[2].filter((x) => x !== "").map((x, i) => `${"\n"}${i + 1}. ${x}`).join("")}` %}
      | "{ul"     SPACE LIST_ITEM:* "}" {% (data) =>  `${"\n"}${data[2].filter((x) => x !== "").map((x) => `${"\n"}- ${x}`).join("")}` %}
      | "{v"      SPACE .:*  SPACE "v}" {% (data) =>   `${data[2].join("")}` %}
      |  "[" FORMAT_CODE:*         "]"  {% (data) => `\`${data[1].join("")}\`` %}
      | "{[" FORMAT_CODE:*         "]}" {% (data) => `${"\n"}\`\`\`ocaml${"\n"}${data[1].join("")}${"\n"}\`\`\`${"\n"}` %}
      | __
      | decimal                         {% (data) => `\`${data[0]}\`` %}
      | [^ \f\n\t\v{}\[\]0-9]:+         {% (data) => data[0].join("") %}
