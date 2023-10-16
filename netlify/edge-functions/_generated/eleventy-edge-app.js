import { EleventyEdge } from "https://cdn.11ty.dev/edge@2.0.2/eleventy-edge.js";

const precompiledAppData = { "eleventy": { "compatibility": ">=2" },
"buildTimeData": {},
"nunjucksPrecompiled": {
  "EleventyEdgeNunjucksPrecompile:352c5eea71c1776d8603d2dee5d1df47e229a2efc403dca19e0b4c297d41445e": (function() {function root(env, context, frame, runtime, cb) {
var lineno = 0;
var colno = 0;
var output = "";
try {
var parentTemplate = null;
output += "\n\t<h1>123</h1>\n\t";
output += runtime.suppressValue(env.getFilter("json").call(context, "sa"), env.opts.autoescape);
output += "\n";
if(parentTemplate) {
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
} else {
cb(null, output);
}
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};
}()),
} };

export { EleventyEdge, precompiledAppData }