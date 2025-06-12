# 📘 Backend API Documentation

### Base URL

`https://august.r-e.kr`

## 데이터베이스 테이블

### `user`

이 테이블은 등록된 사용자의 정보를 저장합니다.

| 컬럼 | 타입 | 설명 | **Primary Key** |
| --- | --- | --- | --- |
| `id` | 문자열 | 고유한 사용자 식별자 | ✅ |
| `password` | 문자열 | 사용자의 비밀번호 (해시됨) |  |
| `name` | 문자열 | 사용자의 표시 이름 |  |
| `wallet_address` | 문자열 | 사용자의 블록체인 지갑 주소 |  |
| `introduction` | 텍스트 | 사용자에 대한 간략한 소개 |  |
| `private_key` | 문자열 |  |  |

### `donationproposal`

이 테이블은 생성된 기부 제안 및 관련 데이터를 추적합니다.

| 컬럼 | 타입 | 설명 | **Primary Key** | Foreign Key |
| --- | --- | --- | --- | --- |
| `id` | 정수 | 고유한 제안 식별자 (자동 증가) | ✅ |  |
| `user_id` | 정수 | 제안을 생성한 user id |  | ✅ |
| `contract_address` | 문자열 | 배포된 DonationProposal 계약의 주소 |  |  |
| `start_time` | 타임스탬프 | 제안이 생성된 타임스탬프 |  |  |
| `vote_end_time` | 타임스탬프 | 제안에 대한 투표가 마감되는 타임스탬프 |  |  |
| `voted_users` | JSON/배열 | 이 제안에 투표한 사용자 ID 목록 |  |  |

### `vote`

기부 제안에 투표

| 컬럼 | 타입 | 설명 | **Primary Key** | Foreign Key |
| --- | --- | --- | --- | --- |
| `id` | 정수 | 고유한 제안 식별자 (자동 증가) | ✅ |  |
| `donation_id` | 정수 | 제안 |  | ✅ |
| user_id | 정수 | 투표한 유저 |  | ✅ |
| yes | bool | 찬 반 |  |  |

### Mongodb

`user`

```json
{
  "_id": "user123",                     // 사용자 ID (문자열, 고유)
  "password": "hashed_password",        // 해시된 비밀번호
  "name": "홍길동",
  "wallet_address": "0x123...abc",
  "introduction": "안녕하세요, 기부 활동가입니다.",
  "private_key": "0xabcdef..."          // 안전한 저장 방식 권장 (예: 암호화)
}
```

`donationProposals`

```json
{
  "_id": ObjectId("..."),                        // MongoDB 고유 ID
  "user_id": "user123",                          // 사용자 ID (참조)
  "contract_address": "0xProposalContract123",
  "start_time": "2025-06-08T15:30:00Z",
  "vote_end_time": "2025-06-08T16:30:00Z",
  "voted_users": [                               // 투표한 사용자 ID 목록
    {
      "user_id": "user456",
      "yes": true
    },
    {
      "user_id": "user789",
      "yes": false
    }
  ]
}
```

---

### 사용자 관리

### `POST /login`

사용자 로그인 및 인증 토큰 발급.

- **설명:** 사용자 ID와 비밀번호를 사용하여 로그인하고, 성공 시 해당 사용자의 인증 토큰을 발급합니다.
- **요청:**
    - **헤더:** `Content-Type: application/json`
    - **본문:** JSON
        
        ```json
        {
            "id": "user123",
            "password": "secure_password"
        }
        ```
        
- **응답:**
    - **상태:** `200 OK`
    - **본문:**JSON
        
        ```json
        {
            "message": "로그인 성공.",
            "token": "발급된_인증_토큰" // 이 토큰을 이후 모든 요청에 사용합니다.
        }
        ```
        
    - **오류 상태:** `401 Unauthorized` (잘못된 ID 또는 비밀번호)

### `GET /user`

현재 인증된 사용자 정보를 가져옵니다.

- **설명:** 현재 세션 또는 인증 토큰과 연결된 사용자의 세부 정보를 가져옵니다.
- **요청**
    - **헤더:** `Authorization: Bearer <토큰>`
- **응답:**
    - **상태:** `200 OK`
    - **본문:** JSON
        
        ```json
        {
            "id": "user123",
            "name": "홍길동",
            "wallet_address": "0xABC...DEF",
            "introduction": "홍길동에 대한 간략한 소개입니다."
        }
        ```
        
    - **오류 상태:** `401 Unauthorized` (유효하지 않은 토큰)
    - **오류 상태:** `404 Not Found` (사용자를 찾을 수 없음)

### `GET /user/balance`

지갑 

- **설명:** 현재 세션 또는 인증 토큰과 연결된 사용자의 세부 정보를 가져옵니다.
- **요청:**
    - **헤더:** `Authorization: Bearer <토큰>`
- **응답:**
    - **상태:** `200 OK`
    - **본문:**JSON
        
        ```json
        {
            "wallet_address": "0xABC...DEF",
            "balance": "1000000000000000000" // wei 단위
        }
        ```
        
    - **오류 상태:** `401 Unauthorized` (유효하지 않은 토큰)
    - **오류 상태:** `404 Not Found` (사용자를 찾을 수 없음)

### `POST /registry`

시스템에 새 사용자를 등록합니다. 이 작업은 내부적으로 `MemberRegistry` 스마트 계약에도 멤버로 등록하는 트랜잭션을 포함합니다.

- **설명:** 제공된 세부 정보로 새 사용자 계정을 생성합니다.
- **요청:**
    - **메서드:** `POST`
    - **URL:** `/registry`
    - **헤더:** `Content-Type: application/json`
    - **본문:**JSON
        
        ```json
        {
            "id": "test",
            "password": "test",
            "name": "홍길동",
            "introduction": "플랫폼에 가입하는 새로운 사용자입니다."
        }
        ```
        
- **응답:**
    - **상태:** `201 Created`
    - **본문:**JSON
        
        ```json
        {
            "message": "사용자가 성공적으로 등록되었습니다."
        }
        ```
        
    - **오류 상태:** `400 Bad Request` (입력 유효성 검사 실패 또는 ID/지갑 주소 중복)
    - **오류 상태:** `500 Internal Server Error` (스마트 계약 상호 작용 문제)

---

### 기부 제안 관리

### `POST /addProposal`

블록체인에 새로운 기부 제안을 생성하고 백엔드에 기록합니다.

- **설명:** `DonationProposalFactory`를 통해 새로운 `DonationProposal` 스마트 계약을 배포하고 제안 세부 정보를 백엔드 데이터베이스에 저장합니다.
- **요청:**
    - **Headers:** `Content-Type: application/json`, `Authorization: Bearer <토큰>`
    - **Body:**JSON
        
        ```json
        {
            "proposalText": "지역 커뮤니티 정원 조성을 위한 모금",
            "voteDurationInMinutes": 60 // 투표 가능한 시간(분)
            "donationDurationInMinutes": 60 // 투표 마감 후 기부가 가능한 시간(분)
        }
        ```
        
- **서버 측 로직:**
    - 토큰을 통해 요청한 사용자의 `wallet_address`를 가져옵니다. 이 주소가 `proposerAddress`로 사용됩니다.
    - `DonationProposalFactory.createProposal(string _text, uint256 donationDurationInMinutes)`를 호출합니다.
    - `ProposalCreated` 이벤트를 수신하여 새로운 `proposalAddress`를 얻습니다.
    - `id` (자동 생성), `proposalAddress`, `start_time` (현재 타임스탬프), 계산된 `vote_end_time` (시작 시간 + 1시간), `proposer_user_id` (토큰에서 가져온 사용자 ID), `donationDurationInMinutes`를 `donationproposal` 테이블에 저장합니다.
    - 서버의 예약된 작업은 `vote_end_time`에 도달하면 해당 제안 계약의 `DonationProposal.finalizeVote()`를 호출해야 합니다.
- **응답:**
    - **상태:** `201 Created`
    - **본문:**JSON
        
        ```json
        {
            "message": "기부 제안이 성공적으로 생성되었습니다.",
            "proposalId": "6845b803eb25db87c905f199", // 새로 생성된 제안의 ID
            "proposalContractAddress": "0xNewProposalAddress"
        }
        ```
        
    - **오류 상태:** `401 Unauthorized` (유효하지 않은 토큰)
    - **오류 상태:** `400 Bad Request` (입력 유효성 검사 실패)
    - **오류 상태:** `500 Internal Server Error` (계약 배포 또는 데이터베이스 저장 문제)

### `GET /proposal/:id`

특정 기부 제안에 대한 상세 정보를 가져옵니다.

- **설명:** 백엔드 **ID**를 사용하여 기부 제안의 스마트 계약에서 직접 요약 정보를 가져옵니다. URL의 **`:id`**는 제안의 실제 백엔드 ID로 대체되어야 합니다.
- **요청:**
    - **메서드:** `GET`
    - **URL:** `/proposal/123` (여기서 123은 제안 ID)
    - **헤더:** `Authorization: Bearer <토큰>`
- **서버 측 로직:**
    - `donationproposal` 테이블에서 제공된 **`id`**를 사용하여 **`contract_address`**를 조회합니다.
    - 조회된 **`contract_address`**를 사용하여 `DonationProposal.getSummary()`를 호출합니다.
- **응답:**
    - **상태:** `200 OK`
    - **본문:**JSON
        
        ```json
        {
            "id": "6845b803eb25db87c905f199",
            "proposer": "0xProposerAddress",
            "proposalText": "지역 커뮤니티 정원 조성을 위한 모금",
            "totalDonation": "1000000000000000000", // wei 단위
            "finalized": true,
            "voteCount": "10",
            "voterCount": "15",
            "balance": "500000000000000000", // 계약 잔액
            "votePassed": true,
            "donationEndTime": 1678886400 // 유닉스 타임스탬프
        }
        ```
        
    - **오류 상태:** `401 Unauthorized` (유효하지 않은 토큰)
    - **오류 상태:** `404 Not Found` (제안 ID가 유효하지 않거나 찾을 수 없음)
    - **오류 상태:** `500 Internal Server Error` (스마트 계약 상호 작용 문제)

### `GET /proposals`

배포된 모든 기부 제안의 ID와 계약 주소 목록을 가져옵니다.

- **설명:** `DonationProposalFactory`를 통해 생성된 모든 기부 제안의 백엔드 ID와 계약 주소 배열을 가져옵니다.
- **요청:**
    - **메서드:** `GET`
    - **URL:** `/proposals`
    - **헤더:** `Authorization: Bearer <토큰>`
- **서버 측 로직:**
    - `DonationProposalFactory.getProposals()`를 호출하고, 각 계약 주소에 해당하는 백엔드 **`id`**를 `donationproposal` 테이블에서 조회하여 매핑합니다.
- **응답:**
    - **상태:** `200 OK`
    - **본문:**JSON
        
        ```json
        [
           {
        			"id": "6845b803eb25db87c905f199",
        			"user_id": "test",
        			"contract_address": "0x58B930Aa29f20b04f8af3aB67B6fc709d99cA6d4",
        			"vote_end_time": "2025-06-08T17:19:15.763Z",
        			"donationDurationInMinutes": 60,
        			"donation_end_time": "2025-06-08T18:19:15.763Z"
        	},
           {
        		"id": "2212897984623847832974918",
        		"user_id": "hong",
        		"contract_address": "0x123412341234123412341234124",
        		"vote_end_time": "2025-06-08T17:19:15.763Z",
        		"donationDurationInMinutes": 60,
        		"donation_end_time": "2025-06-08T18:19:15.763Z"
        	},
        ]
        ```
        
    - **오류 상태:** `401 Unauthorized` (유효하지 않은 토큰)
    - **오류 상태:** `500 Internal Server Error` (스마트 계약 상호 작용 문제)

### `POST /proposal/:id/vote`

특정 기부 제안에 투표합니다.

- **설명:** 인증된 사용자가 지정된 제안에 **찬성** 또는 **반대** 투표를 할 수 있도록 합니다. `1000 wei`의 **`STAKE_AMOUNT`**가 필요합니다.
- **요청:**
    - **메서드:** `POST`
    - **URL:** `/proposal/123/vote` (여기서 123은 제안 ID)
    - **헤더:** `Content-Type: application/json`, `Authorization: Bearer <토큰>`
    - **본문:**JSON
        
        ```json
        {
            "approve": true // 찬성(true), 반대(false)
        }
        ```
        
- **서버 측 로직:**
    - `donationproposal` 테이블에서 URL의 **`:id`**를 사용하여 **`contract_address`**를 조회합니다.
    - 토큰을 통해 요청한 사용자의 `wallet_address`를 가져옵니다.
    - 요청한 사용자가 `MemberRegistry`의 멤버인지 확인합니다.
    - 투표가 투표 기간(`vote_end_time` 이전) 내에 있는지 확인합니다.
    - 조회된 **`contract_address`**를 사용하여 `msg.value`를 **`STAKE_AMOUNT`**(`1000 wei`)로 설정하여 `DonationProposal.vote(bool approve)`를 호출합니다.
    - `donationproposal` 테이블의 `voted_users` 컬럼에 사용자가 투표했음을 기록합니다.
- **응답:**
    - **상태:** `200 OK`
    - **본문:**JSON
        
        ```json
        {
            "message": "투표가 성공적으로 완료되었습니다."
        }
        ```
        
    - **오류 상태:** `401 Unauthorized` (유효하지 않은 토큰)
    - **오류 상태:** `400 Bad Request` (입력 유효성 검사 실패 또는 사용자가 이미 투표함)
    - **오류 상태:** `403 Forbidden` (사용자가 멤버가 아니거나 투표 기간이 종료됨)
    - **오류 상태:** `404 Not Found` (제안 ID를 찾을 수 없음)
    - **오류 상태:** `500 Internal Server Error` (스마트 계약 트랜잭션 문제)

### `POST /proposal/:id/donation`

통과된 제안에 사용자가 기부할 수 있도록 합니다.

- **설명:** 인증된 사용자가 제안의 투표가 통과되었고 기부 기간이 활성 상태인 경우 지정된 제안에 이더를 기부할 수 있도록 합니다.
- **요청:**
    - **메서드:** `POST`
    - **URL:** `/proposal/123/donation` (여기서 123은 제안 ID)
    - **헤더:** `Content-Type: application/json`, `Authorization: Bearer <토큰>`
    - **본문:**JSON
        
        ```json
        {
            "amount": "10000" // 기부할 금액(wei 단위), 예: 1 이더
        }
        ```
        
- **서버 측 로직:**
    - `donationproposal` 테이블에서 URL의 **`:id`**를 사용하여 **`contract_address`**를 조회합니다.
    - 조회된 **`contract_address`**를 사용하여 `DonationProposal.votePassed()`가 `true`이고 현재 시간이 `DonationProposal.donationEndTime()` 이전인지 확인합니다.
    - `msg.value`를 제공된 `amount`와 동일하게 설정하여 `DonationProposal.donate()`를 호출합니다.
    - *참고: 스마트 계약은 중복 `donors` 저장을 방지합니다.*
- **응답:**
    - **상태:** `200 OK`
    - **본문:**JSON
        
        ```json
        {
            "message": "기부가 성공적으로 완료되었습니다."
        }
        ```
        
    - **오류 상태:** `401 Unauthorized` (유효하지 않은 토큰)
    - **오류 상태:** `400 Bad Request` (입력 유효성 검사 실패)
    - **오류 상태:** `403 Forbidden` (투표가 통과되지 않았거나 기부 기간이 종료됨)
    - **오류 상태:** `404 Not Found` (제안 ID를 찾을 수 없음)
    - **오류 상태:** `500 Internal Server Error` (스마트 계약 트랜잭션 문제)

### `GET /proposal/:id/withdraw`

제안 생성자가 기부금을 인출할 수 있도록 합니다.

- **설명:** 인증된 사용자가 특정 기부 제안의 제안자인 경우 기부 기간이 종료된 후 모금된 기부금을 인출할 수 있도록 합니다. URL의 **`:id`**는 제안의 실제 백엔드 ID로 대체되어야 합니다.
- **요청:**
    - **메서드:** `GET`
    - **URL:** `/proposal/123/withdraw` (여기서 123은 제안 ID)
    - **헤더:** `Authorization: Bearer <토큰>`
- **서버 측 로직:**
    - `donationproposal` 테이블에서 URL의 **`:id`**를 사용하여 **`contract_address`**를 조회합니다.
    - 토큰을 통해 요청하는 사용자의 `wallet_address`를 가져옵니다.
    - 요청하는 사용자의 `wallet_address`가 조회된 **`contract_address`**의 `DonationProposal.proposer()`와 일치하는지 확인합니다.
    - 현재 시간이 조회된 **`contract_address`**의 `DonationProposal.donationEndTime()`을 지났는지 확인합니다.
    - `DonationProposal.withdraw()`를 호출합니다.
- **응답:**
    - **상태:** `200 OK`
    - **본문:**JSON
        
        ```json
        {
            "message": "기부금이 성공적으로 인출되었습니다."
        }
        ```
        
    - **오류 상태:** `401 Unauthorized` (유효하지 않은 토큰)
    - **오류 상태:** `403 Forbidden` (요청하는 사용자가 제안자가 아니거나 기부 기간이 끝나지 않음)
    - **오류 상태:** `404 Not Found` (제안 ID를 찾을 수 없음)
    - **오류 상태:** `500 Internal Server Error` (스마트 계약 트랜잭션 문제)
