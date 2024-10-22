import Grid from "../components/grid"
import Title from "../components/title"

export default function Home() {
  return (
    <div className="relative h-screen flex justify-center items-center">
      <div className="absolute inset-0 z-0 w-full">
        <Grid />
      </div>

      <div className="absolute shadow-lg shadow-gray-900 bg-gray-800 text-white rounded-full px-8 py-4 pointer-events-none">
        <Title />
      </div>
    </div>
  );
}

//relative flex flex-col items-center justify-center h-full z-10 pointer-events-none