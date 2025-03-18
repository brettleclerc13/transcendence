import { Doughnut } from "react-chartjs-2";
import { useRef, useEffect, useState } from "react";
import { fetchSimpleMatchHistory } from "../utilities/matchActions";
import type { ChartData } from "chart.js";
import "./profile.css";

type SimpleMatchHistory = {
	created_at: string;
	result: string;
	match_type: string;
	score_player1: number;
	score_player2: number;
	type: string;
	score: string;
};

export default function MatchHistory({
	setAlert,
}: {
	setAlert: (alert: { message: string; type: string } | null) => void;
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

	useEffect(() => {
		const fetchMatchHistoryData = async () => {
			const matchResults = await fetchSimpleMatchHistory();

			if (!matchResults.ok) {
				setAlert({
					message: `Error fetching your match history: ${matchResults.error}`,
					type: "danger",
				});
				return;
			} else {
				setSimpleMatches(matchResults.data);
				// Calcul des statistiques Win/Lose
				const wins = simpleMatches.filter(
					(match) => match.result === "Won"
				).length;
				const losses = simpleMatches.filter(
					(match) => match.result === "Lost"
				).length;

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
			}
		};

		fetchMatchHistoryData();
	}, []);

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
							{simpleMatches.map((match) => (
								<tr key={match.created_at}>
									<th scope="row">{match.created_at}</th>
									<td>{match.type}</td>
									<td>{match.result}</td>
									<td>{match.score}</td>
								</tr>
							))}
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
