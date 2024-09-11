# syntax=docker/dockerfile:1
# escape=\

FROM alpine:3.20

#Installing utils
RUN apk update
RUN apk upgrade
RUN apk add curl git nodejs npm vim python3 py3-pip

#Installing the Solidity compiler
RUN npm install -g solc

#Installing venv utils
RUN python3 -m venv myenv
RUN source myenv/bin/activate && pip install web3 django --upgrade pip

COPY ./tools/TournamentResults.sol /TournamentResults.sol

#Compiling smart contract
RUN source myenv/bin/activate && solcjs --bin --abi TournamentResults.sol -o build

CMD ["sleep","infinity"]
