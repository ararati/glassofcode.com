import {
  EleventyEdge,
  precompiledAppData,
} from "./_generated/eleventy-edge-app.js";

export default async (request, context) => {
  try {
    let edge = new EleventyEdge("edge", {
      request,
      context,
      precompiled: precompiledAppData,

      // default is [], add more keys to opt-in e.g. ["appearance", "username"]
			cookies: ["appearance"],
    });

    // edge.config((eleventyConfig) => {
    //   // Add some custom Edge-specific configuration
    //   // e.g. Fancier json output
    //   // eleventyConfig.addFilter("json", obj => JSON.stringify(obj, null, 2));
    // });
		edge.config(eleventyConfig => {
			// Fancier json output
			eleventyConfig.addFilter("json", obj => JSON.stringify(obj, null, 2));
		});

    return await edge.handleResponse();
  } catch (e) {
		// Skip the favicon
		if(e.message.includes("favicon.ico")) {
			return context.next(e);
		}
		console.log( "ERROR", { e } );
		return context.next(e);
  }
};
