"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';

interface Article {
  id: number;
  titre: string;
}

const HomePage = () => {
    const [articles, setArticles] = useState([]);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await axios.get('https://transcendence.fr:443/api/articles/');
                setArticles(response.data);
            } catch (error) {
                console.error("Erreur lors de la récupération des articles :", error);
            }
        };

        fetchArticles();
    }, []);

    return (
        <div>
            <h1>Liste des Articles</h1>
            <ul>
                {articles.map(article => (
                    <li key={(article as Article).id}>{(article as Article).titre}</li>
                ))}
            </ul>
        </div>
    );
};

export default HomePage;
