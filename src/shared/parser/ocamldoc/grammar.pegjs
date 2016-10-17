sentence
  = data:(_ word)* _
{
  let buffer = "";
  for (const item of data) {
    buffer += item[0];
    buffer += item[1];
  }
  return buffer;
}

code
  = "[" chars:code* "]"
{
  let buffer = "";
  buffer += "[";
  for (const c of chars) buffer += c;
  buffer += "]";
  return buffer;
}
  / chars:[^\[\]]+
{
  let buffer = "";
  for (const c of chars) buffer += c;
  return buffer;
}

item
  = "{-" _ s:sentence _ "}"
{
  return s;
}

word
  = "{{:" _ s0:sentence _ "}" _ s1:sentence _ "}"
{
  let buffer = "";
  buffer += "[";
  buffer += s1;
  buffer += "]";
  buffer += "(";
  buffer += s0;
  buffer += ")";
  return buffer;
}
  / "{^" w0:_ s:sentence w1:_ "}"
{
  let buffer = "";
  buffer += "{^";
  buffer += w0;
  buffer += s;
  buffer += w1;
  buffer += "}";
  return buffer;
}
  / "{_" w0:__ s:sentence w1:_ "}"
{
  let buffer = "";
  buffer += "{_";
  buffer += w0;
  buffer += s;
  buffer += w1;
  buffer += "}";
  return buffer;
}
  / "{" n:[0-9] __ s:sentence _ "}"
{
  let buffer = "";
  let count = Number.parseInt(n);
  while (0 < count) {
    buffer += "#";
    count--;
  }
  buffer += s;
  return buffer;
}
  / "{!" _ s:sentence _ "}"
{
  let buffer = "";
  buffer += "[";
  buffer += s;
  buffer += "]";
  buffer += "(";
  buffer += "http://caml.inria.fr/pub/docs/manual-ocaml/libref/index.html";
  buffer += ")";
  return buffer;
}
  / "{b" __ s:sentence _ "}"
{
  let buffer = "";
  buffer += "**";
  buffer += s;
  buffer += "**";
  return buffer;
}
  / "{e" __ s:sentence _ "}"
{
  let buffer = "";
  buffer += "*";
  buffer += s;
  buffer += "*";
  return buffer;
}
  / "{i" __ s:sentence _ "}"
{
  let buffer = "";
  buffer += "*";
  buffer += s;
  buffer += "*";
  return buffer;
}
  / "{li" __ items:(item _)* "}"
{
  let buffer = "";
  for (let i = 0; i < items.length; i++) {
    buffer += "\n";
    buffer += i;
    buffer += ". ";
    buffer += items[i][0];
  }
  return buffer;
}
  / "{ul" __ items:(item _)* "}"
{
  let buffer = "";
  for (const item of items) {
    buffer += "\n- ";
    buffer += item[0];
  }
  return buffer;
}
  / "{v" w0:__ chars:[^}]* "}"
{
  let buffer = "";
  buffer += w0;
  for (const c of chars) buffer += c;
  return buffer;
}
  / "{[" w0:_ chars:code* _ "]}"
{
  let buffer = "";
  buffer += "\n```ocaml";
  buffer += w0;
  for (const c of chars) buffer += c;
  buffer += "```\n";
  return buffer;
}
  / "[" _ chars:code* _ "]"
{
  let buffer = "";
  buffer += "`";
  for (const c of chars) buffer += c;
  buffer += "`";
  return buffer;
}
  / s:[-+]? d0:[0-9]+ p:"."? d1:[0-9]*
{
  let buffer = "";
  buffer += "`";
  buffer += s || "";
  for (const d of d0) buffer += d;
  buffer += p || "";
  for (const d of d1) buffer += d;
  buffer += "`";
  return buffer;
}
  / chars:[^ \f\n\r\t\v{}\[\]0-9]+
{
  let buffer = "";
  for (const c of chars) buffer += c;
  return buffer;
}

_ "whitespace"
  = chars:[ \f\n\r\t\v]*
{
  let buffer = "";
  for (const c of chars) buffer += c;
  return buffer;
}

__ "whitespace"
  = chars:[ \f\n\r\t\v]+
{
  let buffer = "";
  for (const c of chars) buffer += c;
  return buffer;
}
