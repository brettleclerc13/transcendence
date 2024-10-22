import Grid from "../components/grid"

export default function Home() {
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0 z-0 w-full">
        <Grid />
      </div>

      <div className="relative flex flex-col items-center justify-center h-full z-10 pointer-events-none">
        <h1 className="text-5xl text-white">ft_trancendence</h1>
      </div>
    </div>
  );
}
