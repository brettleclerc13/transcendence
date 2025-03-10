import { Doughnut } from "react-chartjs-2";
import { useRef, useEffect, useState } from "react";
import { fetchSimpleMatchHistory } from "../utilities/matchActions";

type SimpleMatchHistory = {
	created_at?: string;
	result?: string;
	match_type?: string;
	score_player1?: number;
	score_player2?: number;
};

export default function MatchHistory({
	setAlert,
}: {
	setAlert: (alert: { message: string; type: string } | null) => void;
}) {
	const modalRef = useRef<HTMLDivElement>(null);
	const [chartData, setChartData] = useState({});
	const [simpleMatches, setSimpleMatches] = useState<SimpleMatchHistory[]>([]);

	useEffect(() => {
		const fetchMatchHistoryData = async () => {
			const matchResults = await fetchSimpleMatchHistory();

			if (!matchResults.ok) {
				setAlert({
					message: `Error fetching your match histor: ${matchResults.error}`,
					type: "danger",
				});
				return;
			} else {
				setSimpleMatches(matchResults.data);
				// Calcul des statistiques Win/Lose
				// const wins = simpleMatches.filter((match) => match.result === "Won").length;
				// const losses = simpleMatches.filter((match) => match.result === "W").length;

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

				const chartOptions = {
					cutout: "70%", // Taille du "trou" au centre de l'anneau
					plugins: {
						legend: {
							display: true,
							position: "bottom",
						},
					},
				};
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
								<th scope="col">Duel #</th>
								<th scope="col">Adversary</th>
								<th scope="col">Date</th>
								<th scope="col">W/L</th>
							</tr>
						</thead>
						<tbody>
							{matches.map((match) => (
								<tr key={match.created_at}>
									<th scope="row">{match.created_at}</th>
									<td>{match.result}</td>
									<td>{match.type}</td>
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
				<Doughnut data={chartData} />
			</div>
		</>
	);
}
