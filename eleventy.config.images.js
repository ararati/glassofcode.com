const path = require("path");
const eleventyImage = require("@11ty/eleventy-img");

const relativeToInputPath = (inputPath, relativeFilePath) => {
	let split = inputPath.split("/");
	split.pop();
	return path.resolve(split.join(path.sep), relativeFilePath);
}

module.exports = (eleventy) => {
	eleventy.addAsyncShortcode("image", async function imageShortcode(src, alt, widths, sizes) {
		// Full list of formats: https://www.11ty.dev/docs/plugins/image/#output-formats
		let file = relativeToInputPath(this.page.inputPath, src);
		let metadata = await eleventyImage(file, {
			widths: widths || ["auto"],
			formats: ["avif", "webp", "auto"],
			outputDir: path.join(eleventy.dir.output, "img"),
		});

		const imageAttributes = {
			alt,
			sizes,
			loading: "lazy",
			decoding: "async",
		};
		return eleventyImage.generateHTML(metadata, imageAttributes);
	});
};
