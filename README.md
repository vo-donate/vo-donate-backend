## 🛠 개발 환경 설정
- docker-compose.yml 파일에 PRIVATE_KEY 환경변수를 추가해주세요
```
docker compose up
```

## 📁 프로젝트 구조
```
📦vo-donate-backend
 ┣ 📂abis
 ┃ ┣ 📜DonationProposal.json
 ┃ ┣ 📜DonationProposalFactory.json
 ┃ ┗ 📜MemberRegistry.json
 ┣ 📂controllers
 ┃ ┣ 📜donationController.js
 ┃ ┗ 📜userController.js
 ┣ 📂middleware
 ┃ ┗ 📜auth.js
 ┣ 📂models
 ┃ ┣ 📜DonationProposal.js
 ┃ ┗ 📜User.js
 ┣ 📜.env
 ┣ 📜.gitignore
 ┣ 📜Dockerfile
 ┣ 📜config.js
 ┣ 📜docker-compose.yml
 ┣ 📜package-lock.json
 ┣ 📜package.json
 ┗ 📜server.js
```
