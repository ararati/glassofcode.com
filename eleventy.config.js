const markdownItAnchor = require("markdown-it-anchor");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginBundle = require("@11ty/eleventy-plugin-bundle");
const pluginNavigation = require("@11ty/eleventy-navigation");
const {EleventyHtmlBasePlugin, EleventyEdgePlugin} = require("@11ty/eleventy");
const pluginDrafts = require("./eleventy.config.drafts.js");
const pluginImages = require("./eleventy.config.images.js");
const htmlMinifier = require("html-minifier");
const cssMinifier = require("csso");

module.exports = (eleventy) => {
	eleventy.addPassthroughCopy({
		"static/": "/static/",
		"./node_modules/prismjs/themes/prism-okaidia.css": "/css/prism-okaidia.css",
		"static/favicon": "/"
	});

	eleventy.addWatchTarget("content/**/*.{svg,webp,png,jpeg}");

	eleventy.addPlugin(pluginDrafts);
	eleventy.addPlugin(pluginImages);
	eleventy.addPlugin(pluginRss);
	eleventy.addPlugin(pluginSyntaxHighlight, {
		preAttributes: {tabindex: 0}
	});
	eleventy.addPlugin(pluginNavigation);
	eleventy.addPlugin(EleventyHtmlBasePlugin);
	eleventy.addPlugin(pluginBundle, {
		transforms: [
			async function (content) {
				if (this.type === "css") {
					return cssMinifier.minify(content, {}).css;
				}
				return content;
			},
		],
	});
	eleventy.addPlugin(EleventyEdgePlugin);

	eleventy.addTransform("htmlmin", (content, outputPath) => {
		if (outputPath.endsWith(".html")) {
			return htmlMinifier.minify(content, {
				collapseWhitespace: true,
				removeComments: true,
				useShortDoctype: true,
				minifyJS: true
			});
		}
		return content;
	});

	eleventy.addFilter("readableDate", (dateObj, format, zone) => {
		const month = dateObj.toLocaleString('default', {month: 'short'});
		const day = dateObj.getDate();
		const year = dateObj.getUTCFullYear();
		return `${month} ${day}, ${year}`;
	});

	eleventy.addFilter('htmlDateString', (date) => {
		const month = date.toLocaleDateString('en-US', { month: '2-digit' });
		const day = date.toLocaleDateString('en-US', { day: '2-digit' });
		const year = date.getFullYear();
		return `${year}-${month}-${day}`;
	});

	// Get the first `n` elements of a collection.
	eleventy.addFilter("head", (array, n) => {
		if (!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if (n < 0) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	// Return the smallest number argument
	eleventy.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});

	const isUserTag = (tag) => ["all", "nav", "post", "posts"].indexOf(tag) === -1;
	eleventy.addFilter("getAllTagsWithNumberOfPosts", collection => {
		let tagsMap = new Map();
		for (let item of collection) {
			for (const tag of item.data.tags || []) {
				if (!isUserTag(tag)) continue;
				const numberPosts = tagsMap.has(tag) ? tagsMap.get(tag) + 1 : 1;
				tagsMap.set(tag, numberPosts)
			}
		}
		return Array.from(tagsMap);
	});

	eleventy.addFilter("getRelatedPosts", function (allPosts, baseTags) {
		if (!baseTags) return;
		const posts = allPosts.filter(post => post.inputPath !== this.page.inputPath);

		const getNumberMatchedTags = (post, targetTags) => {
			if (!post.data.tags) return 0;
			let matchedTags = 0;
			for (const postTag of post.data.tags) {
				if (targetTags.includes(postTag)) matchedTags++
			}
			return matchedTags;
		}

		const postsWithTags = new Map();
		for (const post of posts) {
			postsWithTags.set(post.inputPath, getNumberMatchedTags(post, baseTags));
		}

		const maxRelatedPosts = 2;
		let sortedPosts = [...postsWithTags.entries()].sort((a, b) => b[1] - a[1]);
		sortedPosts = sortedPosts.slice(0, maxRelatedPosts);
		const relatedPosts = [];
		for (const [postInputPath] of sortedPosts) {
			for (const post of posts) {
				if (post.inputPath === postInputPath) relatedPosts.push(post);
			}
		}
		return relatedPosts;
	});

	// Return all the tags used in a collection
	eleventy.addFilter("getAllTags", collection => {
		let tagSet = new Set();
		for (let item of collection) {
			(item.data.tags || []).forEach(tag => tagSet.add(tag));
		}
		return Array.from(tagSet);
	});

	eleventy.addFilter("stringify", (data) => {
		return JSON.stringify(data, null, "\t")
	});

	eleventy.addFilter("filterTagList", function filterTagList(tags) {
		return (tags || []).filter(tag => isUserTag(tag));
	});

	eleventy.amendLibrary("md", mdLib => {
		mdLib.use(markdownItAnchor, {
			permalink: markdownItAnchor.permalink.ariaHidden({
				placement: "after",
				class: "header-anchor",
				symbol: "#",
				ariaHidden: false,
			}),
			level: [1, 2, 3, 4],
			slugify: eleventy.getFilter("slugify")
		});
	});

	return {
		templateFormats: [
			"md",
			"njk",
			"html",
			"liquid",
			"jpg",
			"jpeg",
			"png"
		],
		markdownTemplateEngine: "njk",
		htmlTemplateEngine: "njk",
		dir: {
			input: "content",       // default: "."
			includes: "../includes",  	// default: "_includes"
			data: "../global",          // default: "_data"
			output: "build"
		},
		pathPrefix: "/",
	};
};
