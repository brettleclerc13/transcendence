import { Doughnut } from "react-chartjs-2";
import { useEffect, useState, useCallback } from "react";
import { fetchSimpleMatchHistory } from "../utilities/matchActions";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { ChartData } from "chart.js";
import "./profile.css";

ChartJS.register(ArcElement, Tooltip, Legend);

type SimpleMatchHistory = {
	id: string;
	created_at: string;
	match_type: string;
	score_player1: number;
	score_player2: number;
	type: string;
	score: string;
	winner_username: string | undefined;
};

export default function MatchHistory({
	setAlert,
	username,
}: {
	setAlert: (
		alert: { message: string; type: "danger" | "success" } | null,
	) => void;
	username: string | undefined;
}) {
	//const modalRef = useRef<HTMLDivElement>(null);
	const [chartData, setChartData] = useState<
		ChartData<"doughnut", number[], unknown>
	>({
		labels: [],
		datasets: [],
	});
	const [simpleMatches, setSimpleMatches] = useState<SimpleMatchHistory[]>([]);
	const [chartOptions, setChartOptions] = useState({});

	const fetchMatchHistoryData = useCallback(async () => {
		const matchResults = await fetchSimpleMatchHistory();

		if (matchResults && matchResults.ok && "data" in matchResults) {
			const matchData = matchResults.data || [];
			setSimpleMatches(matchData);
			// Calcul des statistiques Win/Lose
			const wins = matchData.filter(
				(match: SimpleMatchHistory) => match.winner_username === username,
			).length;
			const totalMatches = matchData.length;
			const losses = totalMatches - wins;

			// Données pour la roue
			setChartData({
				labels: ["Wins", "Losses"],
				datasets: [
					{
						data: [wins, losses],
						backgroundColor: ["#4caf50", "#f44336"], // Couleurs pour Win et Lose
						borderWidth: 1,
					},
				],
			});

			setChartOptions({
				cutout: "70%", // Taille du "trou" au centre de l'anneau
				plugins: {
					legend: {
						display: true,
						position: "bottom",
					},
				},
			});
		} else {
			setAlert({
				message: `Match history error: ${matchResults.error}`,
				type: "danger",
			});
		}
	}, [username]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		fetchMatchHistoryData();
	}, [fetchMatchHistoryData]);

	return (
		<>
			<div className="match-history">
				<h3>Match History</h3>
				<div className="table-container">
					<table className="table">
						<thead>
							<tr>
								<th scope="col">Date</th>
								<th scope="col">Type</th>
								<th scope="col">W/L</th>
								<th scope="col">Score</th>
							</tr>
						</thead>
						<tbody>
							{simpleMatches?.length > 0 ? (
								simpleMatches.map((match) => (
									<tr key={match.id}>
										<th scope="row">
											{new Intl.DateTimeFormat("en-GB", {
												dateStyle: "long",
												timeStyle: "short",
											}).format(new Date(match.created_at))}
										</th>
										<td>{match.match_type}</td>
										<td>{match.winner_username === username ? "W" : "L"}</td>
										<td>{match.score}</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={4} style={{ textAlign: "center" }}>
										No match history available
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
			<div className="win-lose-chart">
				<h3>Win/Loss Ratio</h3>
				<Doughnut data={chartData} options={chartOptions} />
			</div>
		</>
	);
}
