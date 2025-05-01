import { useEffect, useState } from "react";
import './publicProfile.css';
import { fetchUserPublicProfile } from "../utilities/profileActions";

type UserPublicProfile = {
    nationality :string;
    bio :string;
    age :string;
    profile_picture: string;
    tournament_name: string;
    is_online: boolean;
}

export default function PublicProfile( { username }: { username: string | undefined } ) {
    const [publicProfile, setPublicProfile] = useState<UserPublicProfile | undefined>(undefined);

    useEffect(() => {
        const displayFriendProfile = async () => {
            if (username) {
                try {
                    const response = await fetchUserPublicProfile(username);
                    setPublicProfile(response);
                } catch {
                    console.warn("An error happened while trying to fetch user public profile");
                }
            }
        };

        displayFriendProfile();
    }, []);

    if (!publicProfile) {
        return <p>Loading profile...</p>;
    }

    return (
        <div className="public-profile-container">
            <div className="profile-header">
                <img src={publicProfile.profile_picture ? `/api/${publicProfile.profile_picture}` : "/img/default.png"} alt="Profile" className="profile-image" />
                <h2>{username}</h2>
                <p className={publicProfile.is_online ? "status-online" : "status-offline"}>
                    {publicProfile.is_online ? "Online" : "Offline"}
                </p>
            </div>
            <div className="profile-details">
                <p><strong>Age:</strong> {publicProfile.age}</p>
                <p><strong>Nationality:</strong> {publicProfile.nationality}</p>
                <p><strong>Tournament Name:</strong> {publicProfile.tournament_name}</p>
                <p><strong>Bio:</strong> {publicProfile.bio}</p>
            </div>
        </div>
    );
}
