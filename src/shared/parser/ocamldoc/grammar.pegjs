sentence
  = data:(_ word)* _
{
  let buffer = "";
  for (let i = 0; i < data.length; i++) {
    buffer += data[i][0];
    buffer += data[i][1];
  }
  return buffer;
}

code
  = "[" chars:code* "]"
{
  let buffer = "";
  buffer += "[";
  for (let i = 0; i < chars.length; i++) buffer += chars[i];
  buffer += "]";
  return buffer;
}
  / chars:[^\[\]]+
{
  let buffer = "";
  for (let i = 0; i < chars.length; i++) buffer += chars[i];
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
  for (let i = 0; i < items.length; i++) {
    buffer += "\n- ";
    buffer += items[i][0];
  }
  return buffer;
}
  / "{v" w0:__ chars:[^}]* "}"
{
  let buffer = "";
  buffer += w0;
  for (let i = 0; i < chars.length; i++) buffer += chars[i];
  return buffer;
}
  / "{[" w0:_ chars:code* _ "]}"
{
  let buffer = "";
  buffer += "\n```ocaml";
  buffer += w0;
  for (let i = 0; i < chars.length; i++) buffer += chars[i];
  buffer += "```\n";
  return buffer;
}
  / "[" _ chars:code* _ "]"
{
  let buffer = "";
  buffer += "`";
  for (let i = 0; i < chars.length; i++) buffer += chars[i];
  buffer += "`";
  return buffer;
}
  / s:[-+]? d0:[0-9]+ p:"."? d1:[0-9]*
{
  let buffer = "";
  buffer += "`";
  buffer += s || "";
  for (let i = 0; i < d0.length; i++) buffer += d0[i];
  buffer += p || "";
  for (let i = 0; i < d1.length; i++) buffer += d1[i];
  buffer += "`";
  return buffer;
}
  / chars:[^ \f\n\r\t\v{}\[\]0-9]+
{
  let buffer = "";
  for (let i = 0; i < chars.length; i++) buffer += chars[i];
  return buffer;
}

_ "whitespace"
  = chars:[ \f\n\r\t\v]*
{
  let buffer = "";
  for (let i = 0; i < chars.length; i++) buffer += chars[i];
  return buffer;
}

__ "whitespace"
  = chars:[ \f\n\r\t\v]+
{
  let buffer = "";
  for (let i = 0; i < chars.length; i ++) buffer += chars[i];
  return buffer;
}
