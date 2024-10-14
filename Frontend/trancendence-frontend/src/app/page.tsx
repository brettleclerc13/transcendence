import Image from "next/image";
import { SpotlightPreview } from "@/components/spotlightPreview";

export default function Home() {
  return (
	<main className="h-screen w-full bg-black">
		<SpotlightPreview />
	</main>
  );
}
