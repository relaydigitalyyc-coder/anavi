
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** anavi
- **Date:** 2026-02-25
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 TC001-Successful login redirects user to dashboard
- **Test Code:** [TC001_Successful_login_redirects_user_to_dashboard.py](./TC001_Successful_login_redirects_user_to_dashboard.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/c8d674d4-4f0e-4879-8ad8-e6dcebd587e1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 TC002-Invalid password shows an invalid-credentials error message
- **Test Code:** [TC002_Invalid_password_shows_an_invalid_credentials_error_message.py](./TC002_Invalid_password_shows_an_invalid_credentials_error_message.py)
- **Test Error:** Failed to re-run the test
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/73a6c238-0dc4-448d-8020-99335c9284ec
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 TC003-Non-existent user shows an invalid-credentials error message
- **Test Code:** [TC003_Non_existent_user_shows_an_invalid_credentials_error_message.py](./TC003_Non_existent_user_shows_an_invalid_credentials_error_message.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/50af34b2-4f79-4a2d-8d61-6ea0f5568304
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 TC008-Register a new user successfully and land on Dashboard
- **Test Code:** [TC008_Register_a_new_user_successfully_and_land_on_Dashboard.py](./TC008_Register_a_new_user_successfully_and_land_on_Dashboard.py)
- **Test Error:** The user was unable to successfully submit the registration form with valid details. Both attempts with different emails resulted in the error message 'Failed to create user'. The user was not redirected to the dashboard, indicating the registration process failed likely due to backend or user creation issues. Test failed as the ultimate goal was not achieved.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap:0:0)
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/api/auth/register:0:0)
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) (at http://localhost:3000/api/auth/register:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/dc271aac-ca77-4927-a6db-927570501a21
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 TC009-Registration fails when email is already registered
- **Test Code:** [TC009_Registration_fails_when_email_is_already_registered.py](./TC009_Registration_fails_when_email_is_already_registered.py)
- **Test Error:** Failed to re-run the test
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/eb7b85c2-fc35-4a87-8c73-7f9e3a563e62
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 TC010-Registration validation: missing name shows an error and blocks submission
- **Test Code:** [TC010_Registration_validation_missing_name_shows_an_error_and_blocks_submission.py](./TC010_Registration_validation_missing_name_shows_an_error_and_blocks_submission.py)
- **Test Error:** Failed to re-run the test
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/971b6dd1-38e7-4932-9ed8-f241f6136deb
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 TC011-Registration validation: missing email shows an error and blocks submission
- **Test Code:** [TC011_Registration_validation_missing_email_shows_an_error_and_blocks_submission.py](./TC011_Registration_validation_missing_email_shows_an_error_and_blocks_submission.py)
- **Test Error:** Failed to re-run the test
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/7d5a069e-aa2a-47a8-a3d3-3a485759c5e2
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 TC013-Registration validation: missing password shows an error and blocks submission
- **Test Code:** [TC013_Registration_validation_missing_password_shows_an_error_and_blocks_submission.py](./TC013_Registration_validation_missing_password_shows_an_error_and_blocks_submission.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/33f4100b-b1d9-4994-b7e0-2cf17ad0551e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 TC016-Request password reset with a valid email shows generic success message
- **Test Code:** [TC016_Request_password_reset_with_a_valid_email_shows_generic_success_message.py](./TC016_Request_password_reset_with_a_valid_email_shows_generic_success_message.py)
- **Test Error:** Failed to re-run the test
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/5f1b0e7d-7c04-4448-85f1-9157b64f06fa
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 TC017-Invalid email format shows validation error and does not show success message
- **Test Code:** [TC017_Invalid_email_format_shows_validation_error_and_does_not_show_success_message.py](./TC017_Invalid_email_format_shows_validation_error_and_does_not_show_success_message.py)
- **Test Error:** Failed to re-run the test
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/a074e74f-a250-4307-856b-5aaef88f43ae
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 TC018-Unknown email still shows generic success message (no account enumeration)
- **Test Code:** [TC018_Unknown_email_still_shows_generic_success_message_no_account_enumeration.py](./TC018_Unknown_email_still_shows_generic_success_message_no_account_enumeration.py)
- **Test Error:** Failed to re-run the test
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/2ec7b99b-a5de-49be-a421-5c6ad381ac8e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC022 TC022-Start guided tour from /demo and verify first step is shown
- **Test Code:** [TC022_Start_guided_tour_from_demo_and_verify_first_step_is_shown.py](./TC022_Start_guided_tour_from_demo_and_verify_first_step_is_shown.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/aa035d4d-a3d5-4915-8a9f-4ea8e93bf625
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC023 TC023-Guided tour progresses to a relationships step and tooltip appears on first relationship card
- **Test Code:** [TC023_Guided_tour_progresses_to_a_relationships_step_and_tooltip_appears_on_first_relationship_card.py](./TC023_Guided_tour_progresses_to_a_relationships_step_and_tooltip_appears_on_first_relationship_card.py)
- **Test Error:** The 'Start Tour' button on the /demo page is unresponsive and does not start the tour. The test cannot proceed further. Reporting this issue and stopping the test.
Browser Console Logs:
[ERROR] Failed to load resource: net::ERR_EMPTY_RESPONSE (at https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/43de67e4-e693-4cc3-8feb-8b3d61636e19
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC024 TC024-Guided tour progresses to Matches and shows blind matching tooltip
- **Test Code:** [TC024_Guided_tour_progresses_to_Matches_and_shows_blind_matching_tooltip.py](./TC024_Guided_tour_progresses_to_Matches_and_shows_blind_matching_tooltip.py)
- **Test Error:** Failed to re-run the test
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/91b0f152-02cc-4ca7-8af9-2ce772f9eecb
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC025 TC025-Guided tour reaches Deal Rooms, opens first deal room, and shows overview highlight
- **Test Code:** [TC025_Guided_tour_reaches_Deal_Rooms_opens_first_deal_room_and_shows_overview_highlight.py](./TC025_Guided_tour_reaches_Deal_Rooms_opens_first_deal_room_and_shows_overview_highlight.py)
- **Test Error:** The task to verify the tour can reach Deal Rooms, open a deal room from the list, and display a tour highlight/step in the Deal Room view is not fully completed. We successfully navigated to the /demo page, started the tour, attempted to navigate to Deal Rooms but encountered navigation issues. We manually navigated to /deal-rooms, found no active deal rooms, and proceeded to create a new deal intent. The deal intent creation process is currently at step 2 of 5, with deal parameters form visible. The deal room has not yet been created or opened, so the tour highlight in the Deal Room view could not be verified. Further steps to complete the deal intent creation and open a deal room are required to fully complete the task.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/trpc/dealRoom.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/trpc/dealRoom.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/trpc/dealRoom.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D:0:0)
[ERROR] [API Query Error] TRPCClientError: Please login (10001)
    at o1.from (http://localhost:3000/assets/index-CwezSQih.js:18:25791)
    at http://localhost:3000/assets/index-CwezSQih.js:18:30968 (at http://localhost:3000/deal-rooms:67:111)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/trpc/intent.list,match.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%2C%221%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/trpc/intent.list,match.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%2C%221%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/trpc/intent.list,match.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%2C%221%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/trpc/intent.list,match.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%2C%221%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D:0:0)
[ERROR] [API Query Error] TRPCClientError: Please login (10001)
    at o1.from (http://localhost:3000/assets/index-CwezSQih.js:18:25791)
    at http://localhost:3000/assets/index-CwezSQih.js:18:30968 (at http://localhost:3000/deal-rooms:67:111)
[ERROR] [API Query Error] TRPCClientError: Please login (10001)
    at o1.from (http://localhost:3000/assets/index-CwezSQih.js:18:25791)
    at http://localhost:3000/assets/index-CwezSQih.js:18:30968 (at http://localhost:3000/deal-rooms:67:111)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/467677f5-00ea-4937-9d82-ace0622fbb59/bc875cfb-912a-4afb-8848-0c8c8a9ce1c2
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **26.67** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---