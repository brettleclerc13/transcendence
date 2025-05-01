declare module "bootstrap/dist/js/bootstrap.bundle.min.js" {
	const bootstrap: any;
	export default bootstrap;
}

declare namespace JSX {
	interface IntrinsicElements {
		"lord-icon": React.DetailedHTMLProps<
			React.HTMLAttributes<HTMLElement>,
			HTMLElement
		> & {
			src?: string;
			trigger?: string;
		};
	}
}

declare module "bootstrap/dist/css/bootstrap.min.css";
