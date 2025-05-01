# Transcendence

![Transcendence](https://img.shields.io/badge/42_School-Final_Project-00babc?style=for-the-badge)
![Score](https://img.shields.io/badge/Score-109%2F125-success?style=for-the-badge)

A modern web application featuring a real-time multiplayer Pong game with user management, chat functionality, and tournament systems. This project was developed as the final assignment for the 42 School Common Core curriculum.

## 🏆 Features

### Core Features

- **Framework Backend**: Django-based backend with REST API and WebSocket support
- **Framework Frontend**: A Next.js-based frontend styled with vanilla CSS and React Bootstrap
- **Database PostgreSQL**: Data storage with PostgreSQL
- **User Management**: Complete user authentication and profile management
- **Remote Player**: Ping pong game that can be played from multiple devices
- **Live Chat**: Real-time messaging between users
- **2FA / JWT**: Secure authentication with Two-Factor Authentication and JWT tokens
- **Expanding Browser Compatibility**: Cross-browser support
- **SSR**: Server-Side Rendering with Next.js
- **SSR Pong**: Server-side rendered Pong game

### Additional Features

- **Tournament System**: Create and participate in Pong tournaments
- **Friend System**: Add friends and manage relationships
- **User Blocking**: Block unwanted interactions
- **Game Invitations**: Invite friends to play Pong
- **User Profiles**: Customizable user profiles with avatars
- **Match History**: Track game results and statistics

## 🛠️ Technologies

### Frontend

- **Next.js**: React framework with SSR capabilities
- **React**: UI library for building interactive interfaces
- **Bootstrap**: CSS framework for responsive design
- **TypeScript**: Typed JavaScript for better development experience
- **WebSockets**: Real-time communication

### Backend

- **Django**: Python web framework
- **Django Channels**: WebSocket support for real-time features
- **Django REST Framework**: API development
- **PostgreSQL**: Relational database
- **Redis**: In-memory data store for real-time features
- **JWT**: JSON Web Tokens for authentication

### DevOps

- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Web server and reverse proxy

## 🚀 Installation

### Prerequisites

- Docker and Docker Compose
- Python 3.x (for local development and generating a secret key)
- Node.js (for local development)
- A computer with a network connection (for multiplayer functionality)

### Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd transcendence
   ```

2. Create a `.env` file in the root directory with the following variables:

   ```
   # Database Configuration
   POSTGRES_HOST=db
   POSTGRES_PORT=5432
   POSTGRES_DB=transcendence
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres

   # Django Configuration
   DEBUG=False
   ALLOWED_HOSTS=localhost,127.0.0.1,nginx,backend,your_local_ip_address
   DJANGO_SETTINGS_MODULE=backend.settings
   DATABASE_HOST=db
   DATABASE_NAME=transcendence
   DATABASE_USER=postgres
   DATABASE_PASSWORD=postgres

   # WebSocket Configuration
   NEXT_PUBLIC_WS_HOST=your_local_ip_address
   NEXT_PUBLIC_WS_PORT=8080
   NEXT_PUBLIC_API_URL=https://your_local_ip_address:8080/api
   ```

   Note: The Django required SECRET_KEY will be automatically generated when you run `make`.
   Replace the **3 instances** of `your_local_ip_address` with your computer's local IP address (see next step).

   Important: Make sure each environment variable is on its own line to avoid parsing issues.

3. Find your local IP address:

   **Windows:**

   ```bash
   ipconfig
   ```

   Look for the "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet).

   **macOS:**

   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

   The IP address will be shown after "inet".

   **Linux:**

   ```bash
   ip addr show | grep "inet " | grep -v 127.0.0.1
   ```

   The IP address will be shown after "inet".

4. Start the application:

   ```bash
   make
   ```

   This will:

   - Install required Python packages
   - Create necessary directories
   - Build and start Docker containers

5. Access the application:

   `https://your_local_ip_address:8080`

   Note: You may need to accept the security warning about the self-signed SSL certificate.

## 📂 Project Structure

```
transcendence/
├── Backend/                # Django backend
│   ├── backend/            # Main Django project
│   ├── user/               # User management app
│   ├── game/               # Game logic and WebSockets
│   ├── chat/               # Chat functionality
│   ├── match/              # Match history and stats
│   ├── tournament/         # Tournament system
│   └── utils/              # Utility functions
├── Frontend/               # Next.js frontend
│   ├── src/                # Source code
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # React components
│   │   └── utilities/      # Utility functions
│   └── public/             # Static assets
├── nginx/                  # Nginx configuration
├── Command-Line-Interface/ # CLI tools
└── docker-compose.yml      # Docker Compose configuration
```

## 🎮 Usage

### Network Play

To play with friends on the same network:

1. Make sure you've configured your `.env` file with your local IP address as described in the installation steps
2. Have your friends connect to `https://your_local_ip_address:8080` from their devices
3. They'll need to accept the security warning about the self-signed SSL certificate
4. Both players can now register accounts and play together

### User Registration and Authentication

1. Create an account on the registration page
2. Log in with your credentials
3. Optionally enable 2FA in profile settings for enhanced security

### Playing Pong

1. Navigate to the game section
2. Create a new game or join an existing one
3. Use keyboard controls to move your paddle
4. First player to reach the score limit wins

### Chat System

1. Access the chat section
2. Start conversations with other users
3. Send game invitations through chat
4. Block users if needed

### Tournament System

1. Create or join tournaments (4 players required to start a tournament)
2. Participate in matches as scheduled
3. Track your progress in the tournament bracket

## 🧹 Cleanup

To stop and remove all containers:

```bash
make down
```

For a complete cleanup (removes all containers, volumes, and images):

```bash
make fclean
```

## � Security Notes

- The project uses self-signed SSL certificates for development purposes
- In a production environment, you would want to use proper SSL certificates
- The Django secret key should be kept confidential and not shared
- For security reasons, consider changing the default database password

## �👥 Contributors

This project was developed by a team of 42 School students:

- Brett Leclerc
- Emilien Houot
- Levan Kukhaleishvili

## 📝 License

This project is part of the 42 School curriculum and is provided for educational purposes.
