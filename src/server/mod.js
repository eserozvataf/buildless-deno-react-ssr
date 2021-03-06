import shared from "../shared/mod.js";
import { dejs, fs, oak, path, reactDomServer, StaticRouter } from "./deps.js";
import settings from "./settings.js";

function renderRootComponent(url) {
	const environmentContext = {
		platform: "server",
	};

	const context = {};

	const rootElement = shared.html`
	  <${StaticRouter} location=${url.pathname} context=${context}>
	    ${shared.getRootElement(environmentContext)}
	  <//>`;

	// const rootElement = shared.getRootElement(environmentContext);

	return reactDomServer.renderToString(rootElement);
}

function getCurrentDirectory() {
	return path.dirname(path.fromFileUrl(import.meta.url));
}

async function renderTemplate(template, variables) {
	const cwd = getCurrentDirectory();
	const output = await dejs.renderFile(
		`${cwd}/../shared/templates/${template}.html.ejs`,
		variables,
	);

	return output;
}

async function errorHandler(ctx, next) {
	try {
		await next();
	} catch (e) {
		console.error("Unhandled Error:", e.message);
		console.error(e.stack);

		const output = await renderTemplate("error", {
			title: settings.title,
		});

		ctx.response.status = 500;
		ctx.response.body = output;
	}
}

function locateStaticFile(requestedPath) {
	for (const [virtualPath, mapping] of Object.entries(settings.staticMapping)) {
		// if requested path is not a directory
		if (!virtualPath.endsWith("/")) {
			if (requestedPath === virtualPath) {
				return mapping.path;
			}

			continue;
		}

		if (requestedPath.startsWith(virtualPath)) {
			const relativePath = requestedPath.substring(virtualPath.length);
			return `${mapping.path}${relativePath}`;
		}
	}

	return null;
}

async function resolveStaticFile(fileRoot, requestedPath) {
	const locatedPath = locateStaticFile(requestedPath);

	if (locatedPath === null) {
		return { result: "mapping_not_found" };
	}

	const physicalPath = path.join(fileRoot, locatedPath);
	const fileCheck = await fs.exists(physicalPath);

	if (!fileCheck) {
		return { result: "file_not_found" };
	}

	return { result: "resolved", path: locatedPath };
}

async function staticFiles(ctx, next) {
	const fileRoot = path.join(getCurrentDirectory(), "../..");

	const resolvedFile = await resolveStaticFile(
		fileRoot,
		ctx.request.url.pathname,
	);

	if (resolvedFile.result === "file_not_found") {
		ctx.response.status = 404;
		return;
	}

	if (resolvedFile.result === "resolved") {
		return oak.send(ctx, resolvedFile.path, {
			root: fileRoot,
			index: "index.html",
		});
	}

	return next();
}

async function generateResponse(ctx) {
	const rootContent = renderRootComponent(ctx.request.url);

	const output = await renderTemplate("index", {
		title: settings.title,
		content: rootContent,
	});

	ctx.response.body = output;
}

async function main() {
	await shared.configureLogger();

	try {
		const server = new oak.Application();

		server.use(errorHandler);
		server.use(staticFiles);
		server.use(generateResponse);

		shared.log.info(`Starting server on http://localhost:${settings.port}`);

		await server.listen({ port: settings.port });
	} catch (ex) {
		shared.log.error(ex);
	}
}

export {
	getCurrentDirectory,
	main,
	renderTemplate,
	resolveStaticFile,
	settings,
};
