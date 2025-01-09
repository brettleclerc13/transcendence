import Link from "next/link";
import GameCanvas from "./gameCanvas";

export default function Game() {
    return (
        <div className="w-full h-screen flex bg-teal-600">
            <div className="flex justify-center items-center h-full w-full">
                <GameCanvas />
            </div>
            <Link href={"/"} className="absolute top-4 left-4 p-2 bg-red-500 text-white">
                Go Home
            </Link>
        </div>
    );
}
